"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Badge, Button, Card, Chip, Icon, Spinner, StatusPill, cn } from "@/components/ui";
import { mdToHtml } from "@/lib/markdown";
import type { AgentTraceEntry, Customer, Product, Proposal } from "@/lib/types";

const AGENTS: { key: AgentTraceEntry["agent"]; label: string; icon: string }[] = [
  { key: "orchestrator", label: "Orchestrator", icon: "dashboard" },
  { key: "research", label: "Research Agent", icon: "users" },
  { key: "matchmaker", label: "Matchmaker Agent", icon: "box" },
  { key: "writer", label: "Writer Agent", icon: "doc" },
];

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [trace, setTrace] = useState<AgentTraceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draftEdit, setDraftEdit] = useState("");
  const [busy, setBusy] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const doneRef = useRef(false);

  function startStream() {
    if (esRef.current) return;
    doneRef.current = false;
    const es = new EventSource(`/api/proposals/${id}/run`);
    esRef.current = es;
    es.addEventListener("trace", (e) => {
      const t = JSON.parse((e as MessageEvent).data) as AgentTraceEntry;
      setTrace((prev) => [...prev, t]);
    });
    es.addEventListener("done", (e) => {
      const p = JSON.parse((e as MessageEvent).data) as Proposal;
      doneRef.current = true;
      setProposal(p);
      setTrace(p.trace);
      es.close();
      esRef.current = null;
    });
    es.addEventListener("error", () => {
      if (!doneRef.current) es.close();
      esRef.current = null;
    });
  }

  useEffect(() => {
    let alive = true;
    api
      .getProposal(id)
      .then(({ proposal, customer, product }) => {
        if (!alive) return;
        setProposal(proposal);
        setCustomer(customer);
        setProduct(product);
        setTrace(proposal.trace);
        if (proposal.status === "draft") startStream();
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
      esRef.current?.close();
      esRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const latest = (agent: string) => [...trace].reverse().find((t) => t.agent === agent);
  const state = proposal?.state;
  const draft = state?.proposal_draft ?? "";
  const running = proposal?.status === "running" || proposal?.status === "draft";

  async function approve() {
    setBusy(true);
    const { proposal } = await api.patchProposal(id, { action: "approve" });
    setProposal(proposal);
    setBusy(false);
  }
  async function saveEdit() {
    setBusy(true);
    const { proposal } = await api.patchProposal(id, { action: "edit", proposal_draft: draftEdit });
    setProposal(proposal);
    setEditing(false);
    setBusy(false);
  }
  async function regenerate() {
    setBusy(true);
    await api.patchProposal(id, { action: "regenerate" });
    const { proposal } = await api.getProposal(id);
    setProposal(proposal);
    setTrace([]);
    setBusy(false);
    startStream();
  }

  if (loading) return <div className="flex items-center gap-2 text-muted"><Spinner /> Loading workspace…</div>;
  if (!proposal) return <div className="text-muted">Proposal not found.</div>;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button href={customer ? `/customers/${customer.id}` : "/proposals"} variant="ghost" size="sm">
            <Icon name="back" size={15} /> Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-fg">{proposal.title}</h1>
            <p className="text-[13px] text-muted">
              {customer?.name} · {product?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {proposal.used_form && <Badge tone="accent">Informed by customer answers</Badge>}
          <StatusPill status={proposal.status} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* Left: pipeline + shared state */}
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="mb-4 text-[13px] font-medium uppercase tracking-wide text-subtle">Agent Pipeline</h2>
            <div className="space-y-4">
              {AGENTS.map((a, i) => {
                const l = latest(a.key);
                const status = l?.status ?? "idle";
                return (
                  <div key={a.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={cn("grid h-8 w-8 place-items-center rounded-lg border", status === "done" ? "border-ok/40 bg-ok/10 text-ok" : status === "running" ? "border-accent/40 bg-accent/10 text-accent" : "border-line bg-surface text-subtle")}>
                        {status === "running" ? <Spinner className="h-3.5 w-3.5" /> : status === "done" ? <Icon name="check" size={15} /> : <Icon name={a.icon} size={15} />}
                      </span>
                      {i < AGENTS.length - 1 && <span className="my-1 w-px flex-1 bg-line" />}
                    </div>
                    <div className="pb-1 pt-1">
                      <div className="text-sm font-medium text-fg">{a.label}</div>
                      <div className="text-[12px] text-muted">{l?.message ?? "Waiting…"}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[13px] font-medium uppercase tracking-wide text-subtle">Shared State</h2>
              <Badge tone="brand">ProposalState</Badge>
            </div>

            {state?.customer_info ? (
              <div className="space-y-4">
                <div>
                  <div className="mb-1 text-[11px] uppercase tracking-wide text-subtle">Customer info</div>
                  <p className="text-[13px] text-muted">{state.customer_info.summary}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {state.customer_info.pains.map((p, i) => <Chip key={i}>{p}</Chip>)}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {state.customer_info.goals.map((gg, i) => <Chip key={i} tone="accent">{gg}</Chip>)}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-subtle">Research agent will fill this in…</p>
            )}

            {state && state.company_offerings.length > 0 && (
              <div className="mt-4">
                <div className="mb-1.5 text-[11px] uppercase tracking-wide text-subtle">Capability matches</div>
                <div className="space-y-2">
                  {state.company_offerings.map((o, i) => (
                    <div key={i} className="rounded-lg border border-line bg-surface p-3">
                      <div className="text-[13px] font-medium text-brand-soft">{o.feature}</div>
                      <div className="text-[12px] text-muted">addresses: {o.addresses}</div>
                      <div className="mt-0.5 text-[12px] italic text-subtle">{o.evidence}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {state?.pricing && (
              <div className="mt-4">
                <div className="mb-1.5 text-[11px] uppercase tracking-wide text-subtle">Recommended pricing</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-fg">{state.pricing.tier}</span>
                  <Badge tone="ok">{state.pricing.price}</Badge>
                </div>
                <p className="mt-1 text-[12px] text-muted">{state.pricing.rationale}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {state.pricing.addons.map((a, i) => <Chip key={i}>{a}</Chip>)}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right: draft + checkpoint */}
        <Card className="flex flex-col p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-fg">Proposal draft</h2>
              {proposal.status === "in_review" && <Badge tone="warn">Awaiting your review</Badge>}
              {proposal.status === "approved" && <Badge tone="ok">Approved</Badge>}
            </div>
            {draft && !editing && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => { setDraftEdit(draft); setEditing(true); }}>Edit</Button>
                <Button variant="subtle" size="sm" disabled={busy} onClick={regenerate}>Regenerate</Button>
                {proposal.status === "approved" ? (
                  <Button size="sm" href={`/proposal/${id}`}>View final →</Button>
                ) : (
                  <Button size="sm" disabled={busy} onClick={approve}>{busy ? <Spinner /> : <Icon name="check" size={14} />} Approve & finalize</Button>
                )}
              </div>
            )}
          </div>

          {editing ? (
            <div className="flex flex-1 flex-col gap-3">
              <textarea value={draftEdit} onChange={(e) => setDraftEdit(e.target.value)} className="min-h-[420px] flex-1 rounded-lg border border-line bg-surface p-4 font-mono text-[13px] text-fg outline-none focus:border-brand/60" />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                <Button size="sm" disabled={busy} onClick={saveEdit}>{busy ? <Spinner /> : null} Save</Button>
              </div>
            </div>
          ) : draft ? (
            <div className="md" dangerouslySetInnerHTML={{ __html: mdToHtml(draft) }} />
          ) : (
            <div className="flex flex-1 items-center justify-center py-16 text-center">
              <div>
                <Spinner className="mx-auto h-6 w-6" />
                <p className="mt-3 text-sm text-muted">{running ? "The agents are drafting your proposal…" : "No draft yet."}</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
