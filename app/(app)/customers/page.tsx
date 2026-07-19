"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type CustomerProfileDraft } from "@/lib/api";
import { Avatar, Badge, Button, Card, Empty, Field, Icon, Input, Modal, PageHeader, Spinner, Textarea, cn } from "@/components/ui";
import type { Customer, ProfileField } from "@/lib/types";

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [open, setOpen] = useState(false);

  // add-form state
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [draft, setDraft] = useState<CustomerProfileDraft | null>(null);

  function load() {
    api.listCustomers().then((r) => setCustomers(r.customers));
  }
  useEffect(load, []);

  function reset() {
    setName(""); setWebsite(""); setNotes(""); setDraft(null); setErr(null);
  }

  async function generate() {
    if (!name.trim()) { setErr("Enter a company name first."); return; }
    setErr(null); setGenerating(true);
    try {
      const { profile } = await api.generateCustomerProfile(name, website, notes);
      setDraft(profile);
    } catch (e) { setErr((e as Error).message); }
    finally { setGenerating(false); }
  }

  const setField = (i: number, k: keyof ProfileField, v: string) =>
    setDraft((d) => (d ? { ...d, fields: d.fields.map((f, idx) => (idx === i ? { ...f, [k]: v } : f)) } : d));

  async function save() {
    if (!name.trim()) { setErr("Company name is required."); return; }
    setSaving(true); setErr(null);
    try {
      const payload = draft
        ? { name, website, notes, business_type: draft.business_type, industry: draft.industry, size: draft.size, summary: draft.summary, fields: draft.fields, pains: draft.pains }
        : { name, website, notes };
      const { customer } = await api.createCustomer(payload);
      setOpen(false); reset();
      router.push(`/customers/${customer.id}`);
    } catch (e) { setErr((e as Error).message); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Saved company profiles you can reuse across proposals"
        actions={<Button onClick={() => { reset(); setOpen(true); }}><Icon name="plus" size={15} /> Add customer</Button>}
      />

      {customers === null ? (
        <div className="flex items-center gap-2 text-muted"><Spinner /> Loading…</div>
      ) : customers.length === 0 ? (
        <Empty title="No customers yet" hint="Add a company and let the AI build a reusable profile you can pitch any product to." action={<Button onClick={() => { reset(); setOpen(true); }}><Icon name="plus" size={15} /> Add customer</Button>} />
      ) : (
        <div className="space-y-2">
          {customers.map((c) => (
            <Card key={c.id} className="flex cursor-pointer items-center justify-between gap-4 p-4 transition hover:bg-cardhi" onClick={() => router.push(`/customers/${c.id}`)}>
              <div className="flex items-center gap-3">
                <Avatar name={c.name} size={38} />
                <div>
                  <div className="text-sm font-medium text-fg">{c.name}</div>
                  <div className="text-[12px] text-subtle">{c.website || c.business_type}</div>
                </div>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                {c.business_type && <Badge tone="brand">{c.business_type}</Badge>}
                {c.size && <Badge tone="muted">{c.size}</Badge>}
                <Icon name="arrowRight" size={16} className="text-subtle" />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add customer" wide>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Inc." /></Field>
            <Field label="Website"><Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="acme.com" /></Field>
          </div>
          <Field label="Notes (optional)"><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything you already know…" /></Field>

          <div className="rounded-lg border border-line bg-surface p-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-muted">Let AI draft a reusable profile from the name + website.</span>
              <Button variant="subtle" size="sm" onClick={generate} disabled={generating}>
                {generating ? <Spinner /> : <Icon name="sparkles" size={14} />} {draft ? "Regenerate" : "Generate profile"}
              </Button>
            </div>
          </div>

          {draft && (
            <div className="space-y-4 border-t border-line pt-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Business type"><Input value={draft.business_type} onChange={(e) => setDraft({ ...draft, business_type: e.target.value })} /></Field>
                <Field label="Industry"><Input value={draft.industry} onChange={(e) => setDraft({ ...draft, industry: e.target.value })} /></Field>
                <Field label="Size"><Input value={draft.size} onChange={(e) => setDraft({ ...draft, size: e.target.value })} /></Field>
              </div>
              <Field label="Summary"><Textarea value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} /></Field>
              <div>
                <span className="mb-1.5 block text-[12px] font-medium text-[#b4b4bd]">Profile fields</span>
                <div className="space-y-2">
                  {draft.fields.map((f, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1.5fr] gap-2">
                      <Input value={f.label} onChange={(e) => setField(i, "label", e.target.value)} placeholder="Label" />
                      <Input value={f.value} onChange={(e) => setField(i, "value", e.target.value)} placeholder="Value" />
                    </div>
                  ))}
                </div>
                <button onClick={() => setDraft({ ...draft, fields: [...draft.fields, { label: "", value: "" }] })} className="mt-2 text-[12px] text-brand-soft hover:underline">+ Add field</button>
              </div>
              <Field label="Pains (one per line)">
                <Textarea value={draft.pains.join("\n")} onChange={(e) => setDraft({ ...draft, pains: e.target.value.split("\n") })} />
              </Field>
            </div>
          )}

          {err && <p className="text-[13px] text-danger">{err}</p>}
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !name.trim()}>{saving ? <Spinner /> : null} Save customer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
