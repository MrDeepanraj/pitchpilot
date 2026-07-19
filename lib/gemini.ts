// Provider-agnostic LLM client. Picks a provider from env (in priority order):
//   GROQ_API_KEY   → Groq (free, no billing) — OpenAI-compatible
//   OPENAI_API_KEY → OpenAI — OpenAI-compatible
//   GEMINI_API_KEY → Google Gemini REST
// No mock fallback: throws a clear error when no key is configured or on API error.

const GROQ = process.env.GROQ_API_KEY?.trim();
const OPENAI = process.env.OPENAI_API_KEY?.trim();
const GEMINI = process.env.GEMINI_API_KEY?.trim();

const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
const GROQ_MODEL = process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";
const OPENAI_MODEL = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

export const provider: "groq" | "openai" | "gemini" | null = GROQ ? "groq" : OPENAI ? "openai" : GEMINI ? "gemini" : null;
export const isMock = !provider;

const NO_KEY =
  "No LLM key configured. Add GROQ_API_KEY (free, no billing — console.groq.com), OPENAI_API_KEY, or GEMINI_API_KEY (billing enabled) to .env.local and restart.";

function withTimeout(ms: number) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return { signal: c.signal, done: () => clearTimeout(t) };
}

// OpenAI-compatible chat completions (Groq + OpenAI).
async function callOpenAICompatible(base: string, key: string, model: string, system: string, prompt: string, json: boolean, temperature: number): Promise<string> {
  const { signal, done } = withTimeout(45_000);
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      signal,
      body: JSON.stringify({
        model,
        temperature,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        ...(json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!res.ok) throw new Error(`LLM ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error("LLM returned no text");
    return text;
  } finally {
    done();
  }
}

// Google Gemini REST.
async function callGemini(system: string, prompt: string, json: boolean, temperature: number): Promise<string> {
  const { signal, done } = withTimeout(45_000);
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: 8192,
          // gemini-2.5-* are "thinking" models — disable thinking so output tokens
          // aren't consumed by internal reasoning (which truncates structured JSON).
          ...(GEMINI_MODEL.includes("2.5") ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
          ...(json ? { responseMimeType: "application/json" } : {}),
        },
      }),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("");
    if (!text) throw new Error("Gemini returned no text");
    return text;
  } finally {
    done();
  }
}

async function callLLM(system: string, prompt: string, json: boolean, temperature: number): Promise<string> {
  if (provider === "groq") return callOpenAICompatible("https://api.groq.com/openai/v1", GROQ!, GROQ_MODEL, system, prompt, json, temperature);
  if (provider === "openai") return callOpenAICompatible("https://api.openai.com/v1", OPENAI!, OPENAI_MODEL, system, prompt, json, temperature);
  if (provider === "gemini") return callGemini(system, prompt, json, temperature);
  throw new Error(NO_KEY);
}

function extractJSON<T>(text: string): T {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let raw = (fence ? fence[1] : text).trim();
  const firstObj = raw.indexOf("{");
  const firstArr = raw.indexOf("[");
  const starts = [firstObj, firstArr].filter((i) => i >= 0);
  if (starts.length) {
    const start = Math.min(...starts);
    const closeChar = raw[start] === "{" ? "}" : "]";
    const end = raw.lastIndexOf(closeChar);
    if (end > start) raw = raw.slice(start, end + 1);
  }
  return JSON.parse(raw) as T;
}

/** Generate structured JSON. Throws if no key or on API error — no mock fallback. */
export async function generateJSON<T>(args: { system: string; prompt: string; mock?: () => T; temperature?: number }): Promise<T> {
  if (isMock) throw new Error(NO_KEY);
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const text = await callLLM(args.system, args.prompt, true, args.temperature ?? 0.6);
    try {
      return extractJSON<T>(text);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

/** Generate free-form text (markdown). Throws if no key or on API error — no mock fallback. */
export async function generateText(args: { system: string; prompt: string; mock?: () => string; temperature?: number }): Promise<string> {
  if (isMock) throw new Error(NO_KEY);
  return callLLM(args.system, args.prompt, false, args.temperature ?? 0.6);
}
