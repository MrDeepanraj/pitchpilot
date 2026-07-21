# PitchPilot

An AI **sales-proposal copilot**. A salesperson onboards their products once, saves every prospect as a
reusable customer profile, and generates a tailored, on-brand proposal for any **customer × product** — via a
multi-agent engine, with a human review checkpoint before anything ships.

## How it works

- **Onboard** your company + products (or upload an existing doc in any format to auto-fill a product).
- **Customers** — add a company by name + website; AI drafts a reusable profile ("recipe") you can edit and save.
- **Proposals** — pick a customer and a product; a 4-agent pipeline runs live:
  - **Orchestrator** assembles context
  - **Research** synthesizes the customer's needs
  - **Matchmaker** maps your product's capabilities + pricing to their pains
  - **Writer** drafts the proposal
- **Human checkpoint** — review, edit, regenerate, then **approve** → export the final proposal to PDF.
- Generate a **different product's proposal** for the same company anytime — profiles are reusable.

## Tech stack

| Layer | Tech |
|------|------|
| App | Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS |
| Database | SQLite via Node's built-in `node:sqlite` (local file) |
| LLM | Google Gemini · Groq · or OpenAI (provider-agnostic) |
| Streaming | Server-Sent Events (live agent trace) |
| Document parsing | `unpdf`, `mammoth`, `officeparser` (PDF, DOCX, PPTX, XLSX, ODT, …) |

## Getting started

```bash
pnpm install
```

Create `.env.local` with **one** LLM provider key:

```bash
# Google Gemini — use a 2.5 model (2.0-flash has no free tier on many accounts)
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-2.5-flash

# — or — Groq (free, no billing)
# GROQ_API_KEY=your_key

# — or — OpenAI
# OPENAI_API_KEY=your_key
```

The client auto-selects a provider in the order **Groq → OpenAI → Gemini**.

```bash
pnpm dev        # http://localhost:3000
```

Sign in with any email (dummy auth for local dev) → onboarding → start generating proposals.

## Project structure

```
app/
  (app)/            authenticated shell — dashboard, products, customers, proposals, settings
  login, signup, onboarding
  form/[token]      public customer discovery form
  proposal/[id]     print-ready final proposal
  api/              route handlers (auth, products, customers, proposals + SSE, forms, uploads)
components/          UI kit + app shell
lib/
  types.ts          domain model
  db.ts             node:sqlite data layer
  agents.ts         multi-agent pipeline + AI generators
  gemini.ts         provider-agnostic LLM client
  extract.ts        multi-format document text extraction
  markdown.ts       dependency-free markdown → HTML
  api.ts            typed client fetchers
```

## Scripts

```bash
pnpm dev      # start dev server
pnpm build    # production build
pnpm start    # run production build
```
## PitchPilot
