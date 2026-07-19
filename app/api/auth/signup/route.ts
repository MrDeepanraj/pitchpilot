import { NextRequest, NextResponse } from "next/server";
import { createSeller, getSellerByEmail } from "@/lib/db";
import { SID } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { name, email, company } = (await req.json()) ?? {};
  if (!name || !email || !company) {
    return NextResponse.json({ error: "name, email and company are required" }, { status: 400 });
  }
  if (getSellerByEmail(email)) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }
  const seller = createSeller({ name, email, company });
  const res = NextResponse.json({ seller: { id: seller.id, onboarded: false } });
  res.cookies.set(SID, seller.id, { httpOnly: true, path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
  return res;
}
