import { NextRequest, NextResponse } from "next/server";
import { createSeller, getSellerByEmail } from "@/lib/db";
import { SID } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Dummy auth: password is ignored. Any email signs in — a fresh empty workspace
// is auto-provisioned the first time an email is used.
export async function POST(req: NextRequest) {
  const { email } = (await req.json()) ?? {};
  const clean = (email ?? "").trim().toLowerCase();
  if (!clean || !clean.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  let seller = getSellerByEmail(clean);
  if (!seller) {
    seller = createSeller({ name: clean.split("@")[0], email: clean, company: "" });
  }
  const res = NextResponse.json({ seller: { id: seller.id, onboarded: seller.onboarded } });
  res.cookies.set(SID, seller.id, { httpOnly: true, path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
  return res;
}
