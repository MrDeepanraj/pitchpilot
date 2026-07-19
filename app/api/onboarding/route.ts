import { NextRequest, NextResponse } from "next/server";
import { createProduct, updateSeller } from "@/lib/db";
import { currentSeller } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Finish onboarding: save the seller's company details + their first product.
export async function POST(req: NextRequest) {
  const seller = await currentSeller();
  if (!seller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = (await req.json()) ?? {};

  updateSeller(seller.id, {
    company: b.company ?? seller.company,
    website: b.website ?? seller.website,
    tagline: b.tagline ?? seller.tagline,
    brand_color: b.brand_color ?? seller.brand_color,
    onboarded: true,
  });

  if (b.product?.name) {
    createProduct(seller.id, {
      name: b.product.name,
      category: b.product.category ?? "",
      description: b.product.description ?? "",
      features: Array.isArray(b.product.features) ? b.product.features : [],
      pricing: Array.isArray(b.product.pricing) ? b.product.pricing : [],
      proof_points: Array.isArray(b.product.proof_points) ? b.product.proof_points : [],
      positioning: b.product.positioning ?? "",
    });
  }
  return NextResponse.json({ ok: true });
}
