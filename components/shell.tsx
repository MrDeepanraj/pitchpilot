"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Avatar, Icon, Logo, cn } from "@/components/ui";
import type { Seller } from "@/lib/types";

const NAV = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/products", label: "Products", icon: "box" },
  { href: "/customers", label: "Customers", icon: "users" },
  { href: "/proposals", label: "Proposals", icon: "doc" },
  { href: "/settings", label: "Settings", icon: "gear" },
];

export function Shell({ seller, children }: { seller: Seller; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  async function logout() {
    await api.logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface px-3 py-4 md:flex">
        <Link href="/" className="mb-6 flex items-center gap-2.5 px-2">
          <Logo size={30} />
          <span className="text-[15px] font-semibold tracking-tight text-fg">Pitch<span className="grad">Pilot</span></span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                isActive(n.href) ? "bg-cardhi text-fg" : "text-muted hover:bg-cardhi/60 hover:text-fg",
              )}
            >
              <span className={isActive(n.href) ? "text-brand-soft" : ""}><Icon name={n.icon} size={17} /></span>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="mt-2 rounded-xl border border-line bg-card p-3">
          <div className="flex items-center gap-2.5">
            <Avatar name={seller.company || seller.name} color={seller.brand_color} size={34} />
            <div className="min-w-0">
              <div className="truncate text-[13px] font-medium text-fg">{seller.company}</div>
              <div className="truncate text-[11px] text-subtle">{seller.name}</div>
            </div>
          </div>
          <button onClick={logout} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-surface py-2 text-[12px] text-muted transition hover:text-fg">
            <Icon name="logout" size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 md:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={26} />
            <span className="font-semibold">Pitch<span className="grad">Pilot</span></span>
          </Link>
          <button onClick={logout} className="text-muted"><Icon name="logout" size={18} /></button>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
