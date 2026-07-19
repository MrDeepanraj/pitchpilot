import { NextRequest, NextResponse } from "next/server";
import { deleteProduct, getProduct, updateProduct } from "@/lib/db";
import { currentSeller } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const seller = await currentSeller();
  const { id } = await params;
  const product = getProduct(id);
  if (!seller || !product || product.seller_id !== seller.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const patch = (await req.json()) ?? {};
  return NextResponse.json({ product: updateProduct(id, patch) });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const seller = await currentSeller();
  const { id } = await params;
  const product = getProduct(id);
  if (!seller || !product || product.seller_id !== seller.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  deleteProduct(id);
  return NextResponse.json({ ok: true });
}
