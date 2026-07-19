"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Avatar, Button, Card, Empty, Field, Icon, Input, PageHeader, Spinner } from "@/components/ui";
import type { Seller } from "@/lib/types";

interface CompanyForm {
  company: string;
  website: string;
  tagline: string;
  brand_color: string;
}

const DEFAULT_COLOR = "#22C55E";

export default function SettingsPage() {
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CompanyForm>({ company: "", website: "", tagline: "", brand_color: DEFAULT_COLOR });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { seller } = await api.me();
      setSeller(seller);
      if (seller) {
        setForm({
          company: seller.company ?? "",
          website: seller.website ?? "",
          tagline: seller.tagline ?? "",
          brand_color: seller.brand_color || DEFAULT_COLOR,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function setField<K extends keyof CompanyForm>(key: K, value: CompanyForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const { seller } = await api.updateSeller({
        company: form.company.trim(),
        website: form.website.trim(),
        tagline: form.tagline.trim(),
        brand_color: form.brand_color,
      });
      setSeller(seller);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Settings" subtitle="Your workspace & brand" />
        <div className="flex items-center gap-2 text-muted">
          <Spinner /> Loading settings…
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div>
        <PageHeader title="Settings" subtitle="Your workspace & brand" />
        <Empty
          title="Couldn't load your workspace"
          hint={error ?? "Please try again."}
          action={
            <Button variant="outline" onClick={load}>
              Try again
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Your workspace & brand" />

      <div className="max-w-2xl">
        <Card className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <Avatar name={form.company || seller.name} color={form.brand_color} size={44} />
            <div className="min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-wide text-subtle">Company</div>
              <div className="truncate text-sm font-semibold text-fg">{form.company || "Your company"}</div>
            </div>
          </div>

          <div className="space-y-4">
            <Field label="Company name">
              <Input value={form.company} onChange={(e) => setField("company", e.target.value)} placeholder="SurrealDB" />
            </Field>

            <Field label="Website">
              <Input value={form.website} onChange={(e) => setField("website", e.target.value)} placeholder="https://surrealdb.com" />
            </Field>

            <Field label="Tagline" hint="A short line describing what you sell.">
              <Input
                value={form.tagline}
                onChange={(e) => setField("tagline", e.target.value)}
                placeholder="The ultimate multi-model database."
              />
            </Field>

            <Field label="Brand accent" hint="Used for your avatar and brand moments.">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.brand_color}
                  onChange={(e) => setField("brand_color", e.target.value)}
                  className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-line bg-surface p-1"
                  aria-label="Brand accent color"
                />
                <Input
                  value={form.brand_color}
                  onChange={(e) => setField("brand_color", e.target.value)}
                  placeholder="#22C55E"
                  className="font-mono"
                />
              </div>
            </Field>

            <div className="space-y-1.5">
              <span className="block text-[12px] font-medium text-[#b4b4bd]">Email</span>
              <div className="flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-2.5">
                <span className="truncate text-sm text-muted">{seller.email}</span>
                <span className="shrink-0 text-[11px] uppercase tracking-wide text-subtle">Read only</span>
              </div>
            </div>
          </div>

          {error ? <p className="mt-4 text-[13px] text-danger">{error}</p> : null}

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-line pt-5">
            {saved ? (
              <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ok">
                <Icon name="check" size={15} /> Saved
              </span>
            ) : null}
            <Button disabled={saving} onClick={save}>
              {saving ? <Spinner /> : null}
              Save changes
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
