// ── PitchPilot — SaaS domain model ─────────────────────────────────────
// A seller (salesperson's workspace) onboards their products, saves reusable
// customer profiles ("recipes"), and generates a proposal for a customer × product
// via the multi-agent engine, with a human review checkpoint.

export interface Seller {
  id: string;
  name: string; // salesperson name
  email: string;
  company: string; // the seller's own company
  website: string;
  tagline: string;
  brand_color: string;
  onboarded: boolean;
  created_at: string;
}

export interface PricingTier {
  name: string;
  price: string;
  description: string;
}

export interface Product {
  id: string;
  seller_id: string;
  name: string;
  category: string;
  description: string;
  features: string[];
  pricing: PricingTier[];
  proof_points: string[];
  positioning: string;
  created_at: string;
}

export interface ProfileField {
  label: string;
  value: string;
}

export interface Customer {
  id: string;
  seller_id: string;
  name: string; // customer company name
  website: string;
  business_type: string;
  industry: string;
  size: string;
  summary: string;
  fields: ProfileField[]; // auto-generated reusable "recipe"
  pains: string[];
  notes: string;
  created_at: string;
}

// ── Discovery form (optional customer-facing enrichment) ───────────────
export type QuestionType = "text" | "textarea" | "select";

export interface FormQuestion {
  id: string;
  label: string;
  type: QuestionType;
  placeholder?: string;
  options?: string[];
}

export type FormStatus = "sent" | "submitted";

export interface DiscoveryForm {
  id: string;
  token: string;
  customer_id: string;
  seller_id: string;
  title: string;
  questions: FormQuestion[];
  status: FormStatus;
  created_at: string;
}

export interface Submission {
  id: string;
  form_id: string;
  customer_id: string;
  answers: Record<string, string>;
  created_at: string;
}

// ── Proposal engine — shared state (per the multi-agent diagram) ───────
export interface CustomerInfo {
  company: string;
  industry: string;
  size: string;
  current_stack: string;
  pains: string[];
  goals: string[];
  summary: string;
}

export interface OfferingMatch {
  feature: string; // the product capability
  addresses: string; // the customer pain it solves
  evidence: string; // proof point
}

export interface PricingRecommendation {
  tier: string;
  price: string;
  rationale: string;
  addons: string[];
}

export interface ProposalState {
  customer_info: CustomerInfo | null; // Research Agent
  company_offerings: OfferingMatch[]; // Matchmaker Agent
  pricing: PricingRecommendation | null; // Matchmaker Agent
  proposal_draft: string; // Writer Agent (markdown)
  human_approved: boolean; // Human Checkpoint
}

export type AgentName = "orchestrator" | "research" | "matchmaker" | "writer";

export interface AgentTraceEntry {
  agent: AgentName;
  status: "running" | "done" | "error";
  message: string;
  output?: unknown;
  ts: number;
}

export type ProposalStatus = "draft" | "running" | "in_review" | "approved";

export interface Proposal {
  id: string;
  seller_id: string;
  customer_id: string;
  product_id: string;
  title: string;
  status: ProposalStatus;
  state: ProposalState;
  trace: AgentTraceEntry[];
  used_form: boolean;
  created_at: string;
  updated_at: string;
}

export function emptyState(): ProposalState {
  return {
    customer_info: null,
    company_offerings: [],
    pricing: null,
    proposal_draft: "",
    human_approved: false,
  };
}

// Convenience shapes for joined list views
export interface ProposalListItem extends Proposal {
  customer_name: string;
  product_name: string;
}
