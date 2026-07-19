"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button, Card, Empty, Icon, PageHeader, Spinner, Stat, StatusPill } from "@/components/ui";
import type { Customer, Product, ProposalListItem, Seller } from "@/lib/types";

function fmtDate(iso: string): string {
  const t = new Date(iso);
  return isNaN(t.getTime()) ? "—" : t.toLocaleDateString();
}

const QUICK_LINKS = [
  { href: "/products", icon: "box", label: "Add a product", hint: "Describe what you sell — features, pricing, proof points." },
  { href: "/customers", icon: "users", label: "Add a customer", hint: "Save a reusable customer profile to pitch to." },
  { href: "/proposals", icon: "doc", label: "Browse proposals", hint: "Review everything your team has generated." },
];

export default function DashboardPage() {
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [proposals, setProposals] = useState<ProposalListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([api.me(), api.listProducts(), api.listCustomers(), api.listProposals()])
      .then(([me, prod, cust, prop]) => {
        if (!alive) return;
        setSeller(me.seller);
        setProducts(prod.products);
        setCustomers(cust.customers);
        setProposals(prop.proposals);
      })
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : "Failed to load dashboard"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted">
        <Spinner /> Loading dashboard…
      </div>
    );
  }

  const firstName = seller?.name?.split(" ")[0] ?? "";
  const approved = proposals.filter((p) => p.status === "approved").length;
  const recent = [...proposals]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 6);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${firstName}`}
        actions={
          <Button href="/customers">
            <Icon name="plus" /> New customer
          </Button>
        }
      />

      {error ? (
        <Empty title="Couldn't load your dashboard" hint={error} />
      ) : (
        <div className="space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Products" value={products.length} icon="box" />
            <Stat label="Customers" value={customers.length} icon="users" />
            <Stat label="Proposals" value={proposals.length} icon="doc" />
            <Stat label="Approved" value={approved} icon="check" />
          </div>

          {/* Recent proposals */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[12px] font-medium uppercase tracking-wide text-subtle">Recent proposals</h2>
              {recent.length > 0 && (
                <Link href="/proposals" className="inline-flex items-center gap-1 text-[13px] text-muted transition hover:text-fg">
                  View all <Icon name="arrowRight" size={14} />
                </Link>
              )}
            </div>

            {recent.length === 0 ? (
              <Empty
                title="No proposals yet"
                hint="Open a customer and generate a tailored proposal with the multi-agent engine."
                action={
                  <Button href="/customers">
                    <Icon name="plus" /> Go to customers
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
                {recent.map((p) => (
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
          </section>

          {/* Quick start */}
          <section>
            <h2 className="mb-3 text-[12px] font-medium uppercase tracking-wide text-subtle">Quick start</h2>
            <Card className="divide-y divide-line">
              {QUICK_LINKS.map((q) => (
                <Link
                  key={q.href}
                  href={q.href}
                  className="flex items-center gap-4 px-5 py-4 transition hover:bg-cardhi/50"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-surface text-brand-soft">
                    <Icon name={q.icon} size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-fg">{q.label}</div>
                    <div className="truncate text-[13px] text-muted">{q.hint}</div>
                  </div>
                  <span className="shrink-0 text-subtle">
                    <Icon name="arrowRight" size={16} />
                  </span>
                </Link>
              ))}
            </Card>
          </section>
        </div>
      )}
    </div>
  );
}
