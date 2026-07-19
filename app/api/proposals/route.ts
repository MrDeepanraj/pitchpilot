import { NextRequest, NextResponse } from "next/server";
import { createProposal, getCustomer, getProduct, listProposals } from "@/lib/db";
import { currentSeller } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const seller = await currentSeller();
  if (!seller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const customer_id = req.nextUrl.searchParams.get("customer_id") ?? undefined;
  return NextResponse.json({ proposals: listProposals(seller.id, customer_id) });
}

export async function POST(req: NextRequest) {
  const seller = await currentSeller();
  if (!seller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { customer_id, product_id } = (await req.json()) ?? {};
  const customer = customer_id ? getCustomer(customer_id) : null;
  const product = product_id ? getProduct(product_id) : null;
  if (!customer || customer.seller_id !== seller.id || !product || product.seller_id !== seller.id) {
    return NextResponse.json({ error: "valid customer_id and product_id are required" }, { status: 400 });
  }
  const proposal = createProposal({
    seller_id: seller.id,
    customer_id: customer.id,
    product_id: product.id,
    title: `${product.name} for ${customer.name}`,
  });
  return NextResponse.json({ proposal_id: proposal.id });
}
