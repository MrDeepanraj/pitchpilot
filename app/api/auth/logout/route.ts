import { NextResponse } from "next/server";
import { SID } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SID, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
