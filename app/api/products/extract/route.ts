import { NextRequest, NextResponse } from "next/server";
import { currentSeller } from "@/lib/session";
import { extractText } from "@/lib/extract";
import { generateProductFromDoc } from "@/lib/agents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Upload a document (any format) → extract text → AI structures it into a product draft.
export async function POST(req: NextRequest) {
  const seller = await currentSeller();
  if (!seller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const text = await extractText(buf, file.name, file.type || "");
    if (!text || text.length < 20) {
      return NextResponse.json({ error: "Couldn't extract readable text from that file." }, { status: 422 });
    }
    const product = await generateProductFromDoc(text, seller);
    return NextResponse.json({ product, chars: text.length });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 422 });
  }
}
