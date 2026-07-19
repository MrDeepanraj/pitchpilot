// Typed client-side fetch helpers.
import type {
  Customer,
  DiscoveryForm,
  PricingTier,
  ProfileField,
  Product,
  Proposal,
  ProposalListItem,
  Seller,
} from "./types";

export interface ProductDraft {
  name: string;
  category: string;
  description: string;
  features: string[];
  pricing: PricingTier[];
  proof_points: string[];
  positioning: string;
}

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}
const send = (url: string, method: string, body?: unknown) =>
  fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

export interface CustomerProfileDraft {
  business_type: string;
  industry: string;
  size: string;
  summary: string;
  fields: ProfileField[];
  pains: string[];
}

export const api = {
  // ── Auth / session ──
  me: () => fetch("/api/me").then(j<{ seller: Seller | null }>),
  login: (email: string) => send("/api/auth/login", "POST", { email }).then(j<{ seller: { id: string; onboarded: boolean } }>),
  signup: (input: { name: string; email: string; company: string }) =>
    send("/api/auth/signup", "POST", input).then(j<{ seller: { id: string; onboarded: boolean } }>),
  logout: () => send("/api/auth/logout", "POST").then(j<{ ok: boolean }>),
  updateSeller: (patch: Partial<Seller>) => send("/api/me", "PATCH", patch).then(j<{ seller: Seller }>),
  onboard: (body: Record<string, unknown>) => send("/api/onboarding", "POST", body).then(j<{ ok: boolean }>),

  // ── Products ──
  listProducts: () => fetch("/api/products").then(j<{ products: Product[] }>),
  createProduct: (input: Partial<Product>) => send("/api/products", "POST", input).then(j<{ product: Product }>),
  extractProduct: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return fetch("/api/products/extract", { method: "POST", body: fd }).then(j<{ product: ProductDraft; chars: number }>);
  },
  updateProduct: (id: string, patch: Partial<Product>) => send(`/api/products/${id}`, "PATCH", patch).then(j<{ product: Product }>),
  deleteProduct: (id: string) => send(`/api/products/${id}`, "DELETE").then(j<{ ok: boolean }>),

  // ── Customers ──
  listCustomers: () => fetch("/api/customers").then(j<{ customers: Customer[] }>),
  generateCustomerProfile: (name: string, website: string, notes: string) =>
    send("/api/customers/generate", "POST", { name, website, notes }).then(j<{ profile: CustomerProfileDraft }>),
  createCustomer: (input: Partial<Customer>) => send("/api/customers", "POST", input).then(j<{ customer: Customer }>),
  getCustomer: (id: string) => fetch(`/api/customers/${id}`).then(j<{ customer: Customer; proposals: ProposalListItem[] }>),
  updateCustomer: (id: string, patch: Partial<Customer>) => send(`/api/customers/${id}`, "PATCH", patch).then(j<{ customer: Customer }>),
  deleteCustomer: (id: string) => send(`/api/customers/${id}`, "DELETE").then(j<{ ok: boolean }>),

  // ── Proposals ──
  listProposals: (customer_id?: string) =>
    fetch(`/api/proposals${customer_id ? `?customer_id=${customer_id}` : ""}`).then(j<{ proposals: ProposalListItem[] }>),
  createProposal: (customer_id: string, product_id: string) =>
    send("/api/proposals", "POST", { customer_id, product_id }).then(j<{ proposal_id: string }>),
  getProposal: (id: string) =>
    fetch(`/api/proposals/${id}`).then(j<{ proposal: Proposal; customer: Customer | null; product: Product | null }>),
  patchProposal: (id: string, body: Record<string, unknown>) => send(`/api/proposals/${id}`, "PATCH", body).then(j<{ proposal: Proposal }>),

  // ── Discovery forms ──
  createForm: (customer_id: string) => send("/api/forms", "POST", { customer_id }).then(j<{ form: DiscoveryForm }>),
  getForm: (token: string) => fetch(`/api/forms/${token}`).then(j<{ form: DiscoveryForm; customer: Customer | null }>),
  submitForm: (token: string, answers: Record<string, string>) => send(`/api/forms/${token}`, "POST", { answers }).then(j<{ ok: boolean }>),
};
