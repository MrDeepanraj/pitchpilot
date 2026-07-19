import { NextRequest, NextResponse } from "next/server";
import { getCustomer, getProduct, getProposal, saveProposal } from "@/lib/db";
import { currentSeller } from "@/lib/session";
import { emptyState } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const seller = await currentSeller();
  const { id } = await params;
  const proposal = getProposal(id);
  if (!seller || !proposal || proposal.seller_id !== seller.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({
    proposal,
    customer: getCustomer(proposal.customer_id),
    product: getProduct(proposal.product_id),
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const seller = await currentSeller();
  const { id } = await params;
  const proposal = getProposal(id);
  if (!seller || !proposal || proposal.seller_id !== seller.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const body = (await req.json()) ?? {};
  switch (body.action) {
    case "approve":
      proposal.state.human_approved = true;
      proposal.status = "approved";
      break;
    case "edit":
      if (typeof body.proposal_draft === "string") proposal.state.proposal_draft = body.proposal_draft;
      break;
    case "regenerate":
      proposal.status = "draft";
      proposal.state = emptyState();
      proposal.trace = [];
      break;
    default:
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
  saveProposal(proposal);
  return NextResponse.json({ proposal });
}
