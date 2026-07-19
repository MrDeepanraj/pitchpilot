"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button, Card, Field, Icon, Input, Logo, Spinner, Textarea, cn } from "@/components/ui";
import type { PricingTier } from "@/lib/types";

const ACCEPT = ".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.odt,.odp,.ods,.txt,.md,.markdown,.csv,.tsv,.json,.log,.html,.htm,.rtf,.xml";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Company
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [tagline, setTagline] = useState("");
  const [brandColor, setBrandColor] = useState("#22C55E");

  // Product
  const [pName, setPName] = useState("");
  const [pCategory, setPCategory] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pFeatures, setPFeatures] = useState("");
  const [pPositioning, setPPositioning] = useState("");
  const [tiers, setTiers] = useState<PricingTier[]>([{ name: "", price: "", description: "" }]);

  // Upload → auto-fill product
  const docRef = useRef<HTMLInputElement>(null);
  const [docBusy, setDocBusy] = useState(false);
  const [docErr, setDocErr] = useState<string | null>(null);

  async function onDoc(file: File) {
    setDocErr(null);
    setDocBusy(true);
    try {
      const { product } = await api.extractProduct(file);
      setPName(product.name || "");
      setPCategory(product.category || "");
      setPDesc(product.description || "");
      setPFeatures((product.features || []).join("\n"));
      setPPositioning(product.positioning || "");
      if (product.pricing?.length) setTiers(product.pricing);
    } catch (e) {
      setDocErr((e as Error).message);
    } finally {
      setDocBusy(false);
      if (docRef.current) docRef.current.value = "";
    }
  }

  useEffect(() => {
    api.me().then(({ seller }) => {
      if (seller) {
        setCompany(seller.company ?? "");
        setWebsite(seller.website ?? "");
        setTagline(seller.tagline ?? "");
        if (seller.brand_color) setBrandColor(seller.brand_color);
      }
    });
  }, []);

  const setTier = (i: number, k: keyof PricingTier, v: string) =>
    setTiers((t) => t.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)));

  async function finish() {
    setErr(null);
    setLoading(true);
    try {
      await api.onboard({
        company,
        website,
        tagline,
        brand_color: brandColor,
        product: {
          name: pName,
          category: pCategory,
          description: pDesc,
          features: pFeatures.split("\n").map((s) => s.trim()).filter(Boolean),
          pricing: tiers.filter((t) => t.name.trim()),
          positioning: pPositioning,
        },
      });
      router.push("/");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-12">
      <div className="mb-8 flex items-center gap-2.5">
        <Logo size={30} />
        <span className="font-semibold">Pitch<span className="grad">Pilot</span></span>
      </div>

      {/* Progress */}
      <div className="mb-6 flex items-center gap-3">
        {[1, 2].map((s) => (
          <div key={s} className="flex flex-1 items-center gap-3">
            <span className={cn("grid h-7 w-7 place-items-center rounded-full text-[12px] font-semibold", step >= s ? "bg-brand text-white" : "bg-cardhi text-subtle")}>{s}</span>
            <span className={cn("text-[13px]", step >= s ? "text-fg" : "text-subtle")}>{s === 1 ? "Your company" : "Your first product"}</span>
            {s === 1 && <span className="h-px flex-1 bg-line" />}
          </div>
        ))}
      </div>

      <Card className="p-6">
        {step === 1 ? (
          <div className="space-y-4">
            <h1 className="text-xl font-semibold text-fg">Tell us about your company</h1>
            <p className="text-sm text-muted">This shapes the branding and tone of every proposal you generate.</p>
            <Field label="Company name">
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Inc." />
            </Field>
            <Field label="Website">
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="acme.com" />
            </Field>
            <Field label="One-line pitch">
              <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="What you do, in a sentence" />
            </Field>
            <Field label="Brand accent color">
              <div className="flex items-center gap-3">
                <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="h-10 w-14 cursor-pointer rounded-lg border border-line bg-surface" />
                <Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="w-32" />
              </div>
            </Field>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setStep(2)} disabled={!company.trim()}>Continue →</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h1 className="text-xl font-semibold text-fg">Add your first product</h1>
            <p className="text-sm text-muted">The engine matches these details to each customer. You can add more later.</p>

            <div className="flex items-center justify-between rounded-lg border border-dashed border-line bg-surface p-3">
              <div>
                <div className="text-[13px] font-medium text-fg">Have a product doc or existing proposal?</div>
                <div className="text-[11px] text-subtle">Upload any format (PDF, Word, PPT, Excel, text…) to auto-fill.</div>
              </div>
              <input ref={docRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => e.target.files?.[0] && onDoc(e.target.files[0])} />
              <Button variant="subtle" size="sm" onClick={() => docRef.current?.click()} disabled={docBusy}>
                {docBusy ? <Spinner /> : <Icon name="sparkles" size={14} />} Upload doc
              </Button>
            </div>
            {docErr && <p className="text-[13px] text-danger">{docErr}</p>}

            <Field label="Product name">
              <Input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="e.g. Acme Cloud" />
            </Field>
            <Field label="Category">
              <Input value={pCategory} onChange={(e) => setPCategory(e.target.value)} placeholder="e.g. Managed database" />
            </Field>
            <Field label="Description">
              <Textarea value={pDesc} onChange={(e) => setPDesc(e.target.value)} placeholder="What it is and who it's for…" />
            </Field>
            <Field label="Key features" hint="One per line">
              <Textarea value={pFeatures} onChange={(e) => setPFeatures(e.target.value)} placeholder={"Realtime queries\nMulti-model storage\nBuilt-in auth"} />
            </Field>
            <Field label="Positioning">
              <Input value={pPositioning} onChange={(e) => setPPositioning(e.target.value)} placeholder="The one-liner that wins the deal" />
            </Field>
            <div>
              <span className="mb-1.5 block text-[12px] font-medium text-[#b4b4bd]">Pricing tiers</span>
              <div className="space-y-2">
                {tiers.map((t, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_1.4fr] gap-2">
                    <Input placeholder="Tier" value={t.name} onChange={(e) => setTier(i, "name", e.target.value)} />
                    <Input placeholder="Price" value={t.price} onChange={(e) => setTier(i, "price", e.target.value)} />
                    <Input placeholder="What's included" value={t.description} onChange={(e) => setTier(i, "description", e.target.value)} />
                  </div>
                ))}
              </div>
              <button onClick={() => setTiers((t) => [...t, { name: "", price: "", description: "" }])} className="mt-2 text-[12px] text-brand-soft hover:underline">
                + Add tier
              </button>
            </div>
            {err && <p className="text-[13px] text-danger">{err}</p>}
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(1)}>← Back</Button>
              <Button onClick={finish} disabled={loading || !pName.trim()}>
                {loading ? <Spinner /> : null} Finish setup
              </Button>
            </div>
          </div>
        )}
      </Card>
    </main>
  );
}
