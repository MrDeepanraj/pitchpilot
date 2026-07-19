import { NextRequest, NextResponse } from "next/server";
import { createProduct, listProducts } from "@/lib/db";
import { currentSeller } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const seller = await currentSeller();
  if (!seller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ products: listProducts(seller.id) });
}

export async function POST(req: NextRequest) {
  const seller = await currentSeller();
  if (!seller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = (await req.json()) ?? {};
  if (!b.name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  const product = createProduct(seller.id, {
    name: b.name,
    category: b.category ?? "",
    description: b.description ?? "",
    features: Array.isArray(b.features) ? b.features : [],
    pricing: Array.isArray(b.pricing) ? b.pricing : [],
    proof_points: Array.isArray(b.proof_points) ? b.proof_points : [],
    positioning: b.positioning ?? "",
  });
  return NextResponse.json({ product });
}
