"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Avatar, Badge, Button, Card, Chip, Empty, Icon, Modal, Select, Spinner, StatusPill, cn } from "@/components/ui";
import type { Customer, Product, ProposalListItem } from "@/lib/types";

function fmt(iso: string) {
  try { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); } catch { return iso; }
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [proposals, setProposals] = useState<ProposalListItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [pickOpen, setPickOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [creating, setCreating] = useState(false);

  const [formLink, setFormLink] = useState<string | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([api.getCustomer(id), api.listProducts()])
      .then(([c, p]) => {
        if (!alive) return;
        setCustomer(c.customer);
        setProposals(c.proposals);
        setProducts(p.products);
        setProductId(p.products[0]?.id ?? "");
      })
      .catch(() => alive && setNotFound(true))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [id]);

  async function createProposal() {
    if (!productId) return;
    setCreating(true);
    try {
      const { proposal_id } = await api.createProposal(id, productId);
      router.push(`/proposals/${proposal_id}`);
    } finally { setCreating(false); }
  }

  async function sendForm() {
    setFormBusy(true);
    try {
      const { form } = await api.createForm(id);
      setFormLink(`${location.origin}/form/${form.token}`);
    } finally { setFormBusy(false); }
  }

  if (loading) return <div className="flex items-center gap-2 text-muted"><Spinner /> Loading…</div>;
  if (notFound || !customer) return <Empty title="Customer not found" action={<Button href="/customers">Back to customers</Button>} />;

  return (
    <div>
      <div className="mb-6">
        <Button href="/customers" variant="ghost" size="sm"><Icon name="back" size={15} /> Customers</Button>
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={customer.name} size={52} />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-fg">{customer.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {customer.website && (
                <a href={`https://${customer.website.replace(/^https?:\/\//, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[13px] text-brand-soft hover:underline">
                  <Icon name="globe" size={13} /> {customer.website}
                </a>
              )}
              {customer.business_type && <Badge tone="brand">{customer.business_type}</Badge>}
              {customer.industry && <Badge tone="muted">{customer.industry}</Badge>}
              {customer.size && <Badge tone="muted">{customer.size}</Badge>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={sendForm} disabled={formBusy}>{formBusy ? <Spinner /> : <Icon name="send" size={15} />} Send discovery form</Button>
          <Button onClick={() => setPickOpen(true)}><Icon name="plus" size={15} /> New proposal</Button>
        </div>
      </div>

      {formLink && (
        <Card className="mb-5 flex flex-wrap items-center gap-3 p-4">
          <span className="text-[13px] text-muted">Share this link with {customer.name}:</span>
          <code className="flex-1 truncate rounded-md border border-line bg-surface px-2 py-1 text-[12px] text-fg">{formLink}</code>
          <Button size="sm" variant="subtle" onClick={() => { navigator.clipboard.writeText(formLink); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? "Copied ✓" : "Copy"}</Button>
          <Button size="sm" variant="outline" onClick={() => window.open(formLink, "_blank")}><Icon name="external" size={14} /> Open</Button>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* Profile */}
        <Card className="p-5">
          <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wide text-subtle">Profile</h2>
          {customer.summary && <p className="text-[13px] leading-relaxed text-muted">{customer.summary}</p>}
          {customer.fields.length > 0 && (
            <dl className="mt-4 space-y-2">
              {customer.fields.map((f, i) => (
                <div key={i} className="grid grid-cols-[130px_1fr] gap-3 border-t border-line pt-2 text-[13px]">
                  <dt className="text-subtle">{f.label}</dt>
                  <dd className="text-fg">{f.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {customer.pains.length > 0 && (
            <div className="mt-4">
              <div className="mb-1.5 text-[11px] uppercase tracking-wide text-subtle">Pains</div>
              <div className="flex flex-wrap gap-1.5">{customer.pains.filter(Boolean).map((p, i) => <Chip key={i}>{p}</Chip>)}</div>
            </div>
          )}
          {customer.notes && <p className="mt-4 border-t border-line pt-3 text-[12px] italic text-subtle">{customer.notes}</p>}
        </Card>

        {/* Proposals */}
        <Card className="p-5">
          <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wide text-subtle">Proposals ({proposals.length})</h2>
          {proposals.length === 0 ? (
            <Empty title="No proposals yet" hint="Generate a tailored proposal for a product." action={<Button onClick={() => setPickOpen(true)}><Icon name="plus" size={15} /> New proposal</Button>} />
          ) : (
            <div className="divide-y divide-line">
              {proposals.map((p) => (
                <div key={p.id} className="flex cursor-pointer items-center justify-between gap-3 py-3 transition hover:opacity-80" onClick={() => router.push(`/proposals/${p.id}`)}>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-fg">{p.product_name}</div>
                    <div className="text-[12px] text-subtle">{fmt(p.updated_at)}</div>
                  </div>
                  <StatusPill status={p.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal open={pickOpen} onClose={() => setPickOpen(false)} title="New proposal">
        {products.length === 0 ? (
          <div>
            <p className="text-sm text-muted">You have no products yet. Add one first.</p>
            <div className="mt-4 flex justify-end"><Button href="/products">Go to products</Button></div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted">Which product are you pitching to {customer.name}?</p>
            <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setPickOpen(false)}>Cancel</Button>
              <Button onClick={createProposal} disabled={creating}>{creating ? <Spinner /> : <Icon name="arrowRight" size={15} />} Generate proposal</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
