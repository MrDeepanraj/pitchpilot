import { NextRequest, NextResponse } from "next/server";
import { deleteCustomer, getCustomer, listProposals, updateCustomer } from "@/lib/db";
import { currentSeller } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const seller = await currentSeller();
  const { id } = await params;
  const customer = getCustomer(id);
  if (!seller || !customer || customer.seller_id !== seller.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ customer, proposals: listProposals(seller.id, id) });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const seller = await currentSeller();
  const { id } = await params;
  const customer = getCustomer(id);
  if (!seller || !customer || customer.seller_id !== seller.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ customer: updateCustomer(id, (await req.json()) ?? {}) });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const seller = await currentSeller();
  const { id } = await params;
  const customer = getCustomer(id);
  if (!seller || !customer || customer.seller_id !== seller.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  deleteCustomer(id);
  return NextResponse.json({ ok: true });
}
