import { NextRequest, NextResponse } from "next/server";
import { createCustomer, listCustomers } from "@/lib/db";
import { currentSeller } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const seller = await currentSeller();
  if (!seller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ customers: listCustomers(seller.id) });
}

export async function POST(req: NextRequest) {
  const seller = await currentSeller();
  if (!seller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = (await req.json()) ?? {};
  if (!b.name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  const customer = createCustomer(seller.id, {
    name: b.name,
    website: b.website ?? "",
    business_type: b.business_type ?? "",
    industry: b.industry ?? "",
    size: b.size ?? "",
    summary: b.summary ?? "",
    fields: Array.isArray(b.fields) ? b.fields : [],
    pains: Array.isArray(b.pains) ? b.pains : [],
    notes: b.notes ?? "",
  });
  return NextResponse.json({ customer });
}
