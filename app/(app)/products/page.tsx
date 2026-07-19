"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import {
  Badge,
  Button,
  Card,
  Chip,
  Empty,
  Field,
  Icon,
  Input,
  Modal,
  PageHeader,
  Spinner,
  Textarea,
} from "@/components/ui";
import type { PricingTier, Product } from "@/lib/types";

interface Draft {
  name: string;
  category: string;
  description: string;
  featuresText: string;
  positioning: string;
  pricing: PricingTier[];
}

const ACCEPT = ".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.odt,.odp,.ods,.txt,.md,.markdown,.csv,.tsv,.json,.log,.html,.htm,.rtf,.xml";

function blankDraft(): Draft {
  return {
    name: "",
    category: "",
    description: "",
    featuresText: "",
    positioning: "",
    pricing: [{ name: "", price: "", description: "" }],
  };
}

function draftFromProduct(p: Product): Draft {
  return {
    name: p.name,
    category: p.category,
    description: p.description,
    featuresText: p.features.join("\n"),
    positioning: p.positioning,
    pricing: p.pricing.length ? p.pricing.map((t) => ({ ...t })) : [{ name: "", price: "", description: "" }],
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(blankDraft());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const docRef = useRef<HTMLInputElement>(null);
  const [docBusy, setDocBusy] = useState(false);

  async function onDoc(file: File) {
    setError(null);
    setDocBusy(true);
    try {
      const { product } = await api.extractProduct(file);
      setDraft((d) => ({
        name: product.name || d.name,
        category: product.category || d.category,
        description: product.description || d.description,
        featuresText: product.features?.length ? product.features.join("\n") : d.featuresText,
        positioning: product.positioning || d.positioning,
        pricing: product.pricing?.length ? product.pricing : d.pricing,
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read document");
    } finally {
      setDocBusy(false);
      if (docRef.current) docRef.current.value = "";
    }
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { products } = await api.listProducts();
      setProducts(products);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setEditingId(null);
    setDraft(blankDraft());
    setOpen(true);
  }

  function openEdit(p: Product) {
    setEditingId(p.id);
    setDraft(draftFromProduct(p));
    setOpen(true);
  }

  function setField<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function updateTier(idx: number, key: keyof PricingTier, value: string) {
    setDraft((d) => ({
      ...d,
      pricing: d.pricing.map((t, i) => (i === idx ? { ...t, [key]: value } : t)),
    }));
  }

  function addTier() {
    setDraft((d) => ({ ...d, pricing: [...d.pricing, { name: "", price: "", description: "" }] }));
  }

  function removeTier(idx: number) {
    setDraft((d) => ({ ...d, pricing: d.pricing.filter((_, i) => i !== idx) }));
  }

  async function save() {
    if (!draft.name.trim()) return;
    setSaving(true);
    setError(null);
    const input = {
      name: draft.name.trim(),
      category: draft.category.trim(),
      description: draft.description.trim(),
      features: draft.featuresText
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
      positioning: draft.positioning.trim(),
      pricing: draft.pricing
        .filter((t) => t.name.trim() || t.price.trim() || t.description.trim())
        .map((t) => ({ name: t.name.trim(), price: t.price.trim(), description: t.description.trim() })),
    };
    try {
      if (editingId) await api.updateProduct(editingId, input);
      else await api.createProduct(input);
      setOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: Product) {
    if (!window.confirm(`Delete "${p.name}"? This can't be undone.`)) return;
    setDeletingId(p.id);
    try {
      await api.deleteProduct(p.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="The products your engine pitches"
        actions={
          <Button onClick={openAdd}>
            <Icon name="plus" /> Add product
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center gap-2 text-muted">
          <Spinner /> Loading products…
        </div>
      ) : error && products.length === 0 ? (
        <Empty
          title="Couldn't load products"
          hint={error}
          action={
            <Button variant="outline" onClick={load}>
              Try again
            </Button>
          }
        />
      ) : products.length === 0 ? (
        <Empty
          title="No products yet"
          hint="Add the products your sales engine will pitch to customers."
          action={
            <Button onClick={openAdd}>
              <Icon name="plus" /> Add product
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {products.map((p) => (
            <Card key={p.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-fg">{p.name}</h2>
                  {p.category ? (
                    <div className="mt-1.5">
                      <Badge tone="brand">{p.category}</Badge>
                    </div>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" disabled={deletingId === p.id} onClick={() => remove(p)}>
                    {deletingId === p.id ? <Spinner /> : <Icon name="trash" size={14} />}
                  </Button>
                </div>
              </div>

              {p.description ? <p className="mt-3 text-[13px] leading-relaxed text-muted">{p.description}</p> : null}

              {p.features.length > 0 && (
                <div className="mt-4">
                  <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-subtle">Features</div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.features.map((f, i) => (
                      <Chip key={i}>{f}</Chip>
                    ))}
                  </div>
                </div>
              )}

              {p.pricing.length > 0 && (
                <div className="mt-4">
                  <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-subtle">Pricing</div>
                  <div className="divide-y divide-line overflow-hidden rounded-lg border border-line">
                    {p.pricing.map((t, i) => (
                      <div key={i} className="flex items-baseline gap-3 bg-surface px-3 py-2">
                        <span className="text-[13px] font-medium text-fg">{t.name}</span>
                        {t.price ? <span className="text-[13px] font-semibold text-brand-soft">{t.price}</span> : null}
                        {t.description ? <span className="truncate text-[12px] text-muted">· {t.description}</span> : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {p.positioning ? <p className="mt-4 text-[12px] italic text-subtle">{p.positioning}</p> : null}
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? "Edit product" : "Add product"} wide>
        <div className="space-y-4">
          {error ? <p className="text-[13px] text-danger">{error}</p> : null}

          <div className="flex items-center justify-between rounded-lg border border-dashed border-line bg-surface p-3">
            <div>
              <div className="text-[13px] font-medium text-fg">Auto-fill from a document</div>
              <div className="text-[11px] text-subtle">Upload any format (PDF, Word, PPT, Excel, text…) and AI fills the fields.</div>
            </div>
            <input ref={docRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => e.target.files?.[0] && onDoc(e.target.files[0])} />
            <Button variant="subtle" size="sm" onClick={() => docRef.current?.click()} disabled={docBusy}>
              {docBusy ? <Spinner /> : <Icon name="sparkles" size={14} />} Upload doc
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <Input value={draft.name} onChange={(e) => setField("name", e.target.value)} placeholder="e.g. SurrealDB Cloud" />
            </Field>
            <Field label="Category">
              <Input
                value={draft.category}
                onChange={(e) => setField("category", e.target.value)}
                placeholder="e.g. Multi-model database"
              />
            </Field>
          </div>

          <Field label="Description">
            <Textarea
              value={draft.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="What the product is and who it's for."
            />
          </Field>

          <Field label="Features" hint="One per line.">
            <Textarea
              value={draft.featuresText}
              onChange={(e) => setField("featuresText", e.target.value)}
              placeholder={"Realtime queries\nGraph + document + relational\nBuilt-in auth"}
            />
          </Field>

          <Field label="Positioning">
            <Input
              value={draft.positioning}
              onChange={(e) => setField("positioning", e.target.value)}
              placeholder="How you want this product to be perceived vs. alternatives."
            />
          </Field>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-[#b4b4bd]">Pricing tiers</span>
              <Button variant="subtle" size="sm" onClick={addTier}>
                <Icon name="plus" size={14} /> Add tier
              </Button>
            </div>
            <div className="space-y-2">
              {draft.pricing.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={t.name}
                    onChange={(e) => updateTier(i, "name", e.target.value)}
                    placeholder="Tier"
                    className="flex-[2]"
                  />
                  <Input
                    value={t.price}
                    onChange={(e) => updateTier(i, "price", e.target.value)}
                    placeholder="Price"
                    className="flex-[2]"
                  />
                  <Input
                    value={t.description}
                    onChange={(e) => updateTier(i, "description", e.target.value)}
                    placeholder="Description"
                    className="flex-[3]"
                  />
                  <button
                    type="button"
                    onClick={() => removeTier(i)}
                    className="shrink-0 rounded-lg border border-line p-2.5 text-subtle transition hover:border-danger/30 hover:text-danger"
                    aria-label="Remove tier"
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={saving || !draft.name.trim()} onClick={save}>
              {saving ? <Spinner /> : <Icon name="check" size={15} />}
              {editingId ? "Save changes" : "Create product"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
