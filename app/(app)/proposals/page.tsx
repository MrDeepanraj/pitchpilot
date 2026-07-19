"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button, Card, Empty, Icon, PageHeader, Spinner, StatusPill } from "@/components/ui";
import type { ProposalListItem } from "@/lib/types";

function fmtDate(iso: string): string {
  const t = new Date(iso);
  return isNaN(t.getTime()) ? "—" : t.toLocaleDateString();
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<ProposalListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .listProposals()
      .then(({ proposals }) => alive && setProposals(proposals))
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : "Failed to load proposals"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const rows = [...proposals].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );

  return (
    <div>
      <PageHeader title="Proposals" subtitle="Every proposal your team has generated" />

      {loading ? (
        <div className="flex items-center gap-2 text-muted">
          <Spinner /> Loading proposals…
        </div>
      ) : error ? (
        <Empty title="Couldn't load proposals" hint={error} />
      ) : rows.length === 0 ? (
        <Empty
          title="No proposals yet"
          hint="Open a customer and generate one."
          action={
            <Button href="/customers">
              <Icon name="arrowRight" /> Go to customers
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto] gap-4 border-b border-line px-5 py-3 text-[11px] font-medium uppercase tracking-wide text-subtle sm:grid">
            <span>Proposal</span>
            <span>Customer</span>
            <span>Product</span>
            <span>Status</span>
            <span className="text-right">Updated</span>
          </div>
          {rows.map((p) => (
            <Link
              key={p.id}
              href={`/proposals/${p.id}`}
              className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5 transition last:border-0 hover:bg-cardhi/50 sm:grid sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto]"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-fg">{p.title}</div>
                <div className="mt-0.5 truncate text-[12px] text-subtle sm:hidden">
                  {p.customer_name} · {p.product_name}
                </div>
              </div>
              <div className="hidden min-w-0 truncate text-[13px] text-muted sm:block">{p.customer_name}</div>
              <div className="hidden min-w-0 truncate text-[13px] text-muted sm:block">{p.product_name}</div>
              <div className="shrink-0">
                <StatusPill status={p.status} />
              </div>
              <div className="hidden shrink-0 text-right text-[12px] text-subtle sm:block">{fmtDate(p.updated_at)}</div>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
