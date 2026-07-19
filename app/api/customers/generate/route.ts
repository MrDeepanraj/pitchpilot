import { NextRequest, NextResponse } from "next/server";
import { currentSeller } from "@/lib/session";
import { generateCustomerProfile } from "@/lib/agents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Auto form-generator: infer a reusable customer profile from name + website.
// Returns a DRAFT (not saved) that the rep can review/edit before saving.
export async function POST(req: NextRequest) {
  const seller = await currentSeller();
  if (!seller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { name, website, notes } = (await req.json()) ?? {};
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  try {
    const profile = await generateCustomerProfile({ name, website: website ?? "", notes: notes ?? "", seller });
    return NextResponse.json({ profile });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 422 });
  }
}
