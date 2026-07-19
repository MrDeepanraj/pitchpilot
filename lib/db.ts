import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  emptyState,
  type AgentTraceEntry,
  type Customer,
  type DiscoveryForm,
  type FormQuestion,
  type PricingTier,
  type ProfileField,
  type Product,
  type Proposal,
  type ProposalListItem,
  type ProposalState,
  type ProposalStatus,
  type Seller,
  type Submission,
} from "./types";

const g = globalThis as unknown as { __pitchdb?: DatabaseSync };

function nowISO(): string {
  return new Date().toISOString();
}
const uuid = () => randomUUID();

function open(): DatabaseSync {
  const dir = join(process.cwd(), "data");
  mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(join(dir, "app.db"));
  db.exec(`
    CREATE TABLE IF NOT EXISTS seller (
      id TEXT PRIMARY KEY, name TEXT, email TEXT UNIQUE, company TEXT, website TEXT,
      tagline TEXT, brand_color TEXT, onboarded INTEGER, created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS product (
      id TEXT PRIMARY KEY, seller_id TEXT, name TEXT, category TEXT, description TEXT,
      features TEXT, pricing TEXT, proof_points TEXT, positioning TEXT, created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS customer (
      id TEXT PRIMARY KEY, seller_id TEXT, name TEXT, website TEXT, business_type TEXT,
      industry TEXT, size TEXT, summary TEXT, fields TEXT, pains TEXT, notes TEXT, created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS form (
      id TEXT PRIMARY KEY, token TEXT UNIQUE, customer_id TEXT, seller_id TEXT, title TEXT,
      questions TEXT, status TEXT, created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS submission (
      id TEXT PRIMARY KEY, form_id TEXT, customer_id TEXT, answers TEXT, created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS proposal (
      id TEXT PRIMARY KEY, seller_id TEXT, customer_id TEXT, product_id TEXT, title TEXT,
      status TEXT, state TEXT, trace TEXT, used_form INTEGER, created_at TEXT, updated_at TEXT
    );
  `);
  return db;
}

export function getDb(): DatabaseSync {
  if (!g.__pitchdb) g.__pitchdb = open();
  return g.__pitchdb;
}

// ── Seller ─────────────────────────────────────────────────────────────
function rowToSeller(r: any): Seller {
  return { ...r, onboarded: !!r.onboarded };
}
export function getSeller(id: string): Seller | null {
  const r = getDb().prepare("SELECT * FROM seller WHERE id = ?").get(id);
  return r ? rowToSeller(r) : null;
}
export function getSellerByEmail(email: string): Seller | null {
  const r = getDb().prepare("SELECT * FROM seller WHERE email = ?").get(email.toLowerCase());
  return r ? rowToSeller(r) : null;
}
export function createSeller(input: {
  name: string;
  email: string;
  company: string;
  website?: string;
  tagline?: string;
  brand_color?: string;
}): Seller {
  const s: Seller = {
    id: uuid(),
    name: input.name,
    email: input.email.toLowerCase(),
    company: input.company,
    website: input.website ?? "",
    tagline: input.tagline ?? "",
    brand_color: input.brand_color ?? "#22C55E",
    onboarded: false,
    created_at: nowISO(),
  };
  getDb()
    .prepare(
      "INSERT INTO seller (id, name, email, company, website, tagline, brand_color, onboarded, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)",
    )
    .run(s.id, s.name, s.email, s.company, s.website, s.tagline, s.brand_color, s.created_at);
  return s;
}
export function updateSeller(id: string, patch: Partial<Seller>): Seller | null {
  const s = getSeller(id);
  if (!s) return null;
  const next = { ...s, ...patch };
  getDb()
    .prepare(
      "UPDATE seller SET name=?, company=?, website=?, tagline=?, brand_color=?, onboarded=? WHERE id=?",
    )
    .run(next.name, next.company, next.website, next.tagline, next.brand_color, next.onboarded ? 1 : 0, id);
  return next;
}

// ── Product ────────────────────────────────────────────────────────────
function rowToProduct(r: any): Product {
  return {
    id: r.id,
    seller_id: r.seller_id,
    name: r.name,
    category: r.category,
    description: r.description,
    features: JSON.parse(r.features) as string[],
    pricing: JSON.parse(r.pricing) as PricingTier[],
    proof_points: JSON.parse(r.proof_points) as string[],
    positioning: r.positioning,
    created_at: r.created_at,
  };
}
export function listProducts(seller_id: string): Product[] {
  return (
    getDb().prepare("SELECT * FROM product WHERE seller_id = ? ORDER BY created_at ASC").all(seller_id) as any[]
  ).map(rowToProduct);
}
export function getProduct(id: string): Product | null {
  const r = getDb().prepare("SELECT * FROM product WHERE id = ?").get(id);
  return r ? rowToProduct(r) : null;
}
export function createProduct(
  seller_id: string,
  input: Omit<Product, "id" | "seller_id" | "created_at">,
): Product {
  const p: Product = { id: uuid(), seller_id, created_at: nowISO(), ...input };
  getDb()
    .prepare(
      "INSERT INTO product (id, seller_id, name, category, description, features, pricing, proof_points, positioning, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .run(
      p.id,
      p.seller_id,
      p.name,
      p.category,
      p.description,
      JSON.stringify(p.features),
      JSON.stringify(p.pricing),
      JSON.stringify(p.proof_points),
      p.positioning,
      p.created_at,
    );
  return p;
}
export function updateProduct(id: string, patch: Partial<Product>): Product | null {
  const p = getProduct(id);
  if (!p) return null;
  const n = { ...p, ...patch };
  getDb()
    .prepare(
      "UPDATE product SET name=?, category=?, description=?, features=?, pricing=?, proof_points=?, positioning=? WHERE id=?",
    )
    .run(
      n.name,
      n.category,
      n.description,
      JSON.stringify(n.features),
      JSON.stringify(n.pricing),
      JSON.stringify(n.proof_points),
      n.positioning,
      id,
    );
  return n;
}
export function deleteProduct(id: string): void {
  getDb().prepare("DELETE FROM product WHERE id = ?").run(id);
}

// ── Customer ───────────────────────────────────────────────────────────
function rowToCustomer(r: any): Customer {
  return {
    id: r.id,
    seller_id: r.seller_id,
    name: r.name,
    website: r.website,
    business_type: r.business_type,
    industry: r.industry,
    size: r.size,
    summary: r.summary,
    fields: JSON.parse(r.fields) as ProfileField[],
    pains: JSON.parse(r.pains) as string[],
    notes: r.notes,
    created_at: r.created_at,
  };
}
export function listCustomers(seller_id: string): Customer[] {
  return (
    getDb().prepare("SELECT * FROM customer WHERE seller_id = ? ORDER BY created_at DESC").all(seller_id) as any[]
  ).map(rowToCustomer);
}
export function getCustomer(id: string): Customer | null {
  const r = getDb().prepare("SELECT * FROM customer WHERE id = ?").get(id);
  return r ? rowToCustomer(r) : null;
}
export function createCustomer(
  seller_id: string,
  input: Omit<Customer, "id" | "seller_id" | "created_at">,
): Customer {
  const c: Customer = { id: uuid(), seller_id, created_at: nowISO(), ...input };
  getDb()
    .prepare(
      "INSERT INTO customer (id, seller_id, name, website, business_type, industry, size, summary, fields, pains, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .run(
      c.id,
      c.seller_id,
      c.name,
      c.website,
      c.business_type,
      c.industry,
      c.size,
      c.summary,
      JSON.stringify(c.fields),
      JSON.stringify(c.pains),
      c.notes,
      c.created_at,
    );
  return c;
}
export function updateCustomer(id: string, patch: Partial<Customer>): Customer | null {
  const c = getCustomer(id);
  if (!c) return null;
  const n = { ...c, ...patch };
  getDb()
    .prepare(
      "UPDATE customer SET name=?, website=?, business_type=?, industry=?, size=?, summary=?, fields=?, pains=?, notes=? WHERE id=?",
    )
    .run(
      n.name,
      n.website,
      n.business_type,
      n.industry,
      n.size,
      n.summary,
      JSON.stringify(n.fields),
      JSON.stringify(n.pains),
      n.notes,
      id,
    );
  return n;
}
export function deleteCustomer(id: string): void {
  getDb().prepare("DELETE FROM customer WHERE id = ?").run(id);
}

// ── Proposal ───────────────────────────────────────────────────────────
function rowToProposal(r: any): Proposal {
  return {
    id: r.id,
    seller_id: r.seller_id,
    customer_id: r.customer_id,
    product_id: r.product_id,
    title: r.title,
    status: r.status as ProposalStatus,
    state: JSON.parse(r.state) as ProposalState,
    trace: JSON.parse(r.trace) as AgentTraceEntry[],
    used_form: !!r.used_form,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}
export function createProposal(input: {
  seller_id: string;
  customer_id: string;
  product_id: string;
  title: string;
}): Proposal {
  const p: Proposal = {
    id: uuid(),
    ...input,
    status: "draft",
    state: emptyState(),
    trace: [],
    used_form: false,
    created_at: nowISO(),
    updated_at: nowISO(),
  };
  getDb()
    .prepare(
      "INSERT INTO proposal (id, seller_id, customer_id, product_id, title, status, state, trace, used_form, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)",
    )
    .run(p.id, p.seller_id, p.customer_id, p.product_id, p.title, p.status, JSON.stringify(p.state), "[]", p.created_at, p.updated_at);
  return p;
}
export function getProposal(id: string): Proposal | null {
  const r = getDb().prepare("SELECT * FROM proposal WHERE id = ?").get(id);
  return r ? rowToProposal(r) : null;
}
export function saveProposal(p: Proposal): Proposal {
  p.updated_at = nowISO();
  getDb()
    .prepare("UPDATE proposal SET title=?, status=?, state=?, trace=?, used_form=?, updated_at=? WHERE id=?")
    .run(p.title, p.status, JSON.stringify(p.state), JSON.stringify(p.trace), p.used_form ? 1 : 0, p.updated_at, p.id);
  return p;
}
export function listProposals(seller_id: string, customer_id?: string): ProposalListItem[] {
  const sql =
    `SELECT p.*, c.name AS customer_name, pr.name AS product_name
     FROM proposal p
     LEFT JOIN customer c ON c.id = p.customer_id
     LEFT JOIN product pr ON pr.id = p.product_id
     WHERE p.seller_id = ?` + (customer_id ? " AND p.customer_id = ?" : "") + " ORDER BY p.updated_at DESC";
  const rows = (customer_id
    ? getDb().prepare(sql).all(seller_id, customer_id)
    : getDb().prepare(sql).all(seller_id)) as any[];
  return rows.map((r) => ({ ...rowToProposal(r), customer_name: r.customer_name ?? "—", product_name: r.product_name ?? "—" }));
}

export function dashboardStats(seller_id: string): {
  products: number;
  customers: number;
  proposals: number;
  approved: number;
} {
  const one = (sql: string) => (getDb().prepare(sql).get(seller_id) as { n: number }).n;
  return {
    products: one("SELECT COUNT(*) as n FROM product WHERE seller_id = ?"),
    customers: one("SELECT COUNT(*) as n FROM customer WHERE seller_id = ?"),
    proposals: one("SELECT COUNT(*) as n FROM proposal WHERE seller_id = ?"),
    approved: (getDb().prepare("SELECT COUNT(*) as n FROM proposal WHERE seller_id = ? AND status='approved'").get(seller_id) as { n: number }).n,
  };
}

// ── Forms & submissions (optional discovery enrichment) ────────────────
function rowToForm(r: any): DiscoveryForm {
  return {
    id: r.id,
    token: r.token,
    customer_id: r.customer_id,
    seller_id: r.seller_id,
    title: r.title,
    questions: JSON.parse(r.questions) as FormQuestion[],
    status: r.status,
    created_at: r.created_at,
  };
}
export function createForm(seller_id: string, customer_id: string, title: string, questions: FormQuestion[]): DiscoveryForm {
  const f: DiscoveryForm = {
    id: uuid(),
    token: uuid().replace(/-/g, "").slice(0, 10),
    customer_id,
    seller_id,
    title,
    questions,
    status: "sent",
    created_at: nowISO(),
  };
  getDb()
    .prepare("INSERT INTO form (id, token, customer_id, seller_id, title, questions, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(f.id, f.token, f.customer_id, f.seller_id, f.title, JSON.stringify(f.questions), f.status, f.created_at);
  return f;
}
export function getFormByToken(token: string): DiscoveryForm | null {
  const r = getDb().prepare("SELECT * FROM form WHERE token = ?").get(token);
  return r ? rowToForm(r) : null;
}
export function markFormSubmitted(id: string): void {
  getDb().prepare("UPDATE form SET status='submitted' WHERE id = ?").run(id);
}
function rowToSubmission(r: any): Submission {
  return { id: r.id, form_id: r.form_id, customer_id: r.customer_id, answers: JSON.parse(r.answers), created_at: r.created_at };
}
export function createSubmission(form_id: string, customer_id: string, answers: Record<string, string>): Submission {
  const s: Submission = { id: uuid(), form_id, customer_id, answers, created_at: nowISO() };
  getDb()
    .prepare("INSERT INTO submission (id, form_id, customer_id, answers, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(s.id, s.form_id, s.customer_id, JSON.stringify(s.answers), s.created_at);
  return s;
}
export function latestSubmissionForCustomer(customer_id: string): Submission | null {
  const r = getDb().prepare("SELECT * FROM submission WHERE customer_id = ? ORDER BY created_at DESC LIMIT 1").get(customer_id);
  return r ? rowToSubmission(r) : null;
}
