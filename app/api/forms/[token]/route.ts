import { NextRequest, NextResponse } from "next/server";
import { createSubmission, getCustomer, getFormByToken, markFormSubmitted } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public (customer-facing) — no auth.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const form = getFormByToken(token);
  if (!form) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ form, customer: getCustomer(form.customer_id) });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const form = getFormByToken(token);
  if (!form) return NextResponse.json({ error: "not found" }, { status: 404 });
  const { answers } = (await req.json()) ?? {};
  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ error: "answers object required" }, { status: 400 });
  }
  createSubmission(form.id, form.customer_id, answers);
  markFormSubmitted(form.id);
  return NextResponse.json({ ok: true });
}
