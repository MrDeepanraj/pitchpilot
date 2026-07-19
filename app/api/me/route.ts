import { NextRequest, NextResponse } from "next/server";
import { updateSeller } from "@/lib/db";
import { currentSeller } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const seller = await currentSeller();
  return NextResponse.json({ seller });
}

export async function PATCH(req: NextRequest) {
  const seller = await currentSeller();
  if (!seller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const patch = (await req.json()) ?? {};
  const updated = updateSeller(seller.id, patch);
  return NextResponse.json({ seller: updated });
}
