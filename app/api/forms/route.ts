import { NextRequest, NextResponse } from "next/server";
import { createForm, getCustomer } from "@/lib/db";
import { currentSeller } from "@/lib/session";
import { generateDiscoveryQuestions } from "@/lib/agents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Create a discovery form for a customer — questions are AI-generated.
export async function POST(req: NextRequest) {
  const seller = await currentSeller();
  if (!seller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { customer_id } = (await req.json()) ?? {};
  const customer = customer_id ? getCustomer(customer_id) : null;
  if (!customer || customer.seller_id !== seller.id) {
    return NextResponse.json({ error: "valid customer_id is required" }, { status: 400 });
  }
  try {
    const questions = await generateDiscoveryQuestions(customer);
    const form = createForm(seller.id, customer.id, `Discovery — ${customer.name}`, questions);
    return NextResponse.json({ form });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 422 });
  }
}
