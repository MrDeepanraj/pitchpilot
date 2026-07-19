import {
  getCustomer,
  getProduct,
  getProposal,
  getSeller,
  latestSubmissionForCustomer,
  saveProposal,
} from "./db";
import { generateJSON, generateText, isMock } from "./gemini";
import type {
  AgentTraceEntry,
  Customer,
  CustomerInfo,
  FormQuestion,
  OfferingMatch,
  PricingRecommendation,
  Product,
  Proposal,
  ProfileField,
  Seller,
  Submission,
} from "./types";

export type Emit = (e: AgentTraceEntry) => void;

function trace(agent: AgentTraceEntry["agent"], status: AgentTraceEntry["status"], message: string, output?: unknown): AgentTraceEntry {
  return { agent, status, message, output, ts: Date.now() };
}

function submissionText(sub: Submission | null): string {
  if (!sub) return "(No customer discovery answers submitted.)";
  return Object.entries(sub.answers).map(([q, a]) => `- ${q}: ${a}`).join("\n");
}

function productContext(p: Product): string {
  return `Product: ${p.name} (${p.category})
Description: ${p.description}
Features:
${p.features.map((f) => `- ${f}`).join("\n")}
Pricing:
${p.pricing.map((t) => `- ${t.name}: ${t.price} — ${t.description}`).join("\n")}
Proof points:
${p.proof_points.map((f) => `- ${f}`).join("\n")}
Positioning: ${p.positioning}`;
}

// ── Auto customer-profile generator (the "auto form" / recipe) ─────────
export async function generateCustomerProfile(input: {
  name: string;
  website: string;
  notes: string;
  seller: Seller;
}): Promise<Pick<Customer, "business_type" | "industry" | "size" | "summary" | "fields" | "pains">> {
  return generateJSON({
    system:
      "You are a B2B sales research analyst. Given a customer company and the seller's context, infer a reusable customer profile. " +
      "Output STRICT JSON: { business_type, industry, size, summary (2 sentences), fields: [{label, value}] (4-6 useful profile attributes tailored to this business), pains: [3-5 short strings] }.",
    prompt: `Seller: ${input.seller.company} — ${input.seller.tagline}
Seller website: ${input.seller.website}

Customer company: ${input.name}
Customer website: ${input.website}
Rep notes: ${input.notes || "(none)"}

Infer the customer's business type, industry, approximate size, a short summary, a set of tailored profile fields the rep should keep on file, and the likely pains the seller could address. Return the JSON now.`,
    temperature: 0.6,
    mock: () => mockProfile(input.name, input.website, input.notes),
  });
}

// ── Product-from-document (upload → structured product) ────────────────
export async function generateProductFromDoc(
  text: string,
  seller: Seller,
): Promise<{
  name: string;
  category: string;
  description: string;
  features: string[];
  pricing: { name: string; price: string; description: string }[];
  proof_points: string[];
  positioning: string;
}> {
  return generateJSON({
    system:
      "You are a product marketer. From the provided document text (a product page, datasheet, pricing sheet, or sales proposal), " +
      "extract a structured product profile. Output STRICT JSON: { name, category, description, features: [string], " +
      "pricing: [{name, price, description}], proof_points: [string], positioning }. Infer sensibly; leave arrays empty if unknown.",
    prompt: `Seller company: ${seller.company || "(unknown)"}\n\nDocument text:\n${text.slice(0, 12000)}\n\nReturn the JSON now.`,
    temperature: 0.4,
  });
}

export async function generateDiscoveryQuestions(customer: Customer): Promise<FormQuestion[]> {
  const qs = await generateJSON<FormQuestion[]>({
    system:
      "You generate discovery questions a sales rep sends to a prospect before writing a proposal. " +
      "Return STRICT JSON: an array of 5 objects {id, label, type, placeholder, options}. type ∈ 'text'|'textarea'|'select'. " +
      "Use 'select' with options where a short list fits. Tailor to this specific company. Labels under 90 chars.",
    prompt: `Company: ${customer.name}
Business type: ${customer.business_type}
Industry: ${customer.industry}
Known pains: ${customer.pains.join("; ")}

Return the JSON array of 5 questions now.`,
    temperature: 0.7,
    mock: () => mockQuestions(customer),
  });
  return qs.map((q, i) => ({ ...q, id: q.id?.trim() || `q${i + 1}` }));
}

// ── Research Agent ─────────────────────────────────────────────────────
async function researchAgent(customer: Customer, sub: Submission | null): Promise<CustomerInfo> {
  return generateJSON<CustomerInfo>({
    system:
      "You are a B2B sales research analyst. Synthesize a concise customer needs profile. " +
      "Output STRICT JSON: { company, industry, size, current_stack, pains: [3-5], goals: [2-4], summary (2 sentences) }.",
    prompt: `Saved customer profile:
${JSON.stringify(
  { name: customer.name, business_type: customer.business_type, industry: customer.industry, size: customer.size, summary: customer.summary, fields: customer.fields, pains: customer.pains },
  null,
  2,
)}

Customer discovery answers:
${submissionText(sub)}

Return the JSON now.`,
    mock: () => mockCustomerInfo(customer, sub),
  });
}

// ── Matchmaker Agent (product ↔ customer) ──────────────────────────────
async function matchmakerAgent(info: CustomerInfo, product: Product): Promise<{ offerings: OfferingMatch[]; pricing: PricingRecommendation }> {
  return generateJSON({
    system:
      "You are a solutions engineer. Map the SELLER'S PRODUCT capabilities to the customer's pains, cite the most relevant proof point, " +
      "and recommend ONE pricing tier FROM THE PRODUCT'S pricing. Output STRICT JSON: { offerings: [{feature, addresses, evidence}] (3-5), pricing: {tier, price, rationale, addons: []} }.",
    prompt: `Customer needs:
${JSON.stringify(info, null, 2)}

${productContext(product)}

Return the JSON now.`,
    mock: () => mockMatch(info, product),
  });
}

// ── Writer Agent ───────────────────────────────────────────────────────
async function writerAgent(seller: Seller, customer: Customer, product: Product, info: CustomerInfo, offerings: OfferingMatch[], pricing: PricingRecommendation): Promise<string> {
  return generateText({
    system:
      `You are a senior sales proposal writer for ${seller.company}. Write a polished, customized proposal in clean GitHub-flavored Markdown. ` +
      "Sections (## headings): Executive Summary; Understanding Your Challenges; Why " +
      `${product.name}; Recommended Solution (map capabilities to their specific pains); Proof Points; Recommended Plan & Pricing; Next Steps. ` +
      "Be specific to the customer. 600-900 words. Do not invent pricing beyond what is provided.",
    prompt: `Seller: ${seller.company} — ${seller.tagline}
Product being proposed: ${product.name}
Customer: ${customer.name} (${customer.industry}, ${customer.size}).

Customer needs:
${JSON.stringify(info, null, 2)}

Matched offerings:
${JSON.stringify(offerings, null, 2)}

Recommended pricing:
${JSON.stringify(pricing, null, 2)}

Write the full proposal in Markdown now.`,
    mock: () => mockDraft(seller, customer, product, info, offerings, pricing),
  });
}

// ── Orchestrator pipeline ──────────────────────────────────────────────
export async function runProposalPipeline(proposalId: string, emit: Emit): Promise<Proposal> {
  const proposal = getProposal(proposalId);
  if (!proposal) throw new Error("Proposal not found");
  const customer = getCustomer(proposal.customer_id);
  const product = getProduct(proposal.product_id);
  const seller = getSeller(proposal.seller_id);
  if (!customer || !product || !seller) throw new Error("Missing customer, product, or seller");

  const sub = latestSubmissionForCustomer(customer.id);
  proposal.status = "running";
  proposal.used_form = !!sub;
  proposal.trace = [];
  const push = (e: AgentTraceEntry) => {
    proposal.trace.push(e);
    saveProposal(proposal);
    emit(e);
  };

  push(trace("orchestrator", "running", `Planning ${product.name} proposal for ${customer.name}…`));
  push(
    trace(
      "orchestrator",
      "done",
      `Context ready — ${seller.company}'s ${product.name} · ${customer.name} profile${sub ? " · discovery answers" : ""}.${isMock ? " · LLM: mock mode" : ""}`,
    ),
  );

  push(trace("research", "running", `Analyzing ${customer.name}'s needs…`));
  const info = await researchAgent(customer, sub);
  proposal.state.customer_info = info;
  push(trace("research", "done", `Identified ${info.pains.length} pains and ${info.goals.length} goals.`, info));

  push(trace("matchmaker", "running", `Matching ${product.name} capabilities & pricing…`));
  const match = await matchmakerAgent(info, product);
  proposal.state.company_offerings = match.offerings;
  proposal.state.pricing = match.pricing;
  push(trace("matchmaker", "done", `Matched ${match.offerings.length} capabilities · recommended the ${match.pricing.tier} plan.`, match));

  push(trace("writer", "running", "Drafting the customized proposal…"));
  const draft = await writerAgent(seller, customer, product, info, match.offerings, match.pricing);
  proposal.state.proposal_draft = draft;
  push(trace("writer", "done", `Draft ready — ${draft.split(/\s+/).length} words. Awaiting review.`));

  proposal.status = "in_review";
  saveProposal(proposal);
  return proposal;
}

// ── Mock generators ────────────────────────────────────────────────────
function mockProfile(name: string, website: string, notes: string): Pick<Customer, "business_type" | "industry" | "size" | "summary" | "fields" | "pains"> {
  const fields: ProfileField[] = [
    { label: "Primary use case", value: "Core application data platform" },
    { label: "Current data stack", value: "Relational + document + a separate search/cache layer" },
    { label: "Realtime needs", value: "Live updates / personalization" },
    { label: "Buying triggers", value: "Consolidation, cost, developer velocity" },
  ];
  return {
    business_type: "B2B software company",
    industry: "Software / SaaS",
    size: "Mid-market to enterprise",
    summary: `${name} (${website}) is modernizing its data platform and looking to consolidate systems while adding realtime capabilities.${notes ? " " + notes : ""}`,
    fields,
    pains: [
      "Fragmented datastores increase cost and operational burden",
      "Real-time features are hard on the current stack",
      "Complex relationships are awkward to model",
    ],
  };
}

function mockCustomerInfo(c: Customer, sub: Submission | null): CustomerInfo {
  const extra = sub ? Object.values(sub.answers).join(" ") : "";
  return {
    company: c.name,
    industry: c.industry,
    size: c.size,
    current_stack: c.fields.find((f) => /stack|databases?/i.test(f.label))?.value ?? "Multiple databases + a search layer",
    pains: c.pains.length ? c.pains : ["Fragmented datastores", "Hard to build realtime features"],
    goals: ["Consolidate the data layer and cut cost", "Ship realtime features faster", "Reduce backend/glue code"],
    summary: c.summary || `${c.name} is a ${c.business_type} looking to modernize its data platform.${extra ? " Discovery: " + extra.slice(0, 120) : ""}`,
  };
}

function mockMatch(info: CustomerInfo, product: Product): { offerings: OfferingMatch[]; pricing: PricingRecommendation } {
  const offerings: OfferingMatch[] = product.features.slice(0, 4).map((feat, i) => ({
    feature: feat,
    addresses: info.pains[i % info.pains.length] ?? "Modernizing the data platform",
    evidence: product.proof_points[i % Math.max(1, product.proof_points.length)] ?? "Proven with teams of similar scale",
  }));
  const big = /\d{3,}|enterprise/i.test(info.size);
  const tier = product.pricing.find((t) => (big ? /enterprise|scale/i.test(t.name) : /scale|start/i.test(t.name))) ?? product.pricing[product.pricing.length - 1];
  return {
    offerings,
    pricing: {
      tier: tier.name,
      price: tier.price,
      rationale: `${tier.description} — a fit for ${info.company}'s scale and needs.`,
      addons: ["Dedicated onboarding", "Priority support"],
    },
  };
}

function mockDraft(seller: Seller, c: Customer, product: Product, info: CustomerInfo, offerings: OfferingMatch[], pricing: PricingRecommendation): string {
  const caps = offerings.map((o) => `- **${o.feature}** — ${o.addresses}. _Proof:_ ${o.evidence}`).join("\n");
  const pains = info.pains.map((p) => `- ${p}`).join("\n");
  return `## Executive Summary

${c.name} can modernize its data platform with **${product.name}** from ${seller.company} — ${product.positioning}
This proposal maps ${product.name} to ${c.name}'s priorities and recommends the **${pricing.tier}** plan.

## Understanding Your Challenges

${pains}

## Why ${product.name}

${product.description}

## Recommended Solution

${caps}

## Proof Points

${product.proof_points.map((p) => `- ${p}`).join("\n")}

## Recommended Plan & Pricing

**${pricing.tier} — ${pricing.price}.** ${pricing.rationale}

Recommended add-ons: ${pricing.addons.join(", ")}.

## Next Steps

1. A 45-minute architecture review with a ${seller.company} Solutions Architect.
2. A scoped proof-of-concept on one workload.
3. A tailored rollout and success plan.

_We're excited to help ${c.name} move faster with ${product.name}._`;
}

function mockQuestions(c: Customer): FormQuestion[] {
  return [
    { id: "q1", label: `What are the biggest data/infrastructure pain points at ${c.name} right now?`, type: "textarea", placeholder: "Tell us what's slowing you down…" },
    { id: "q2", label: "Current databases / data stack", type: "text", placeholder: "e.g. PostgreSQL, MongoDB, Elasticsearch" },
    { id: "q3", label: "How important are real-time / live data features?", type: "select", options: ["Critical", "Nice to have", "Not needed"] },
    { id: "q4", label: "What's your timeline for a decision?", type: "select", options: ["This quarter", "Next quarter", "Just exploring"] },
    { id: "q5", label: "What would a successful outcome look like in 6 months?", type: "textarea", placeholder: "Describe the win you're aiming for…" },
  ];
}
