"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

// ── Icons (inline, stroke-based) ───────────────────────────────────────
const PATHS: Record<string, ReactNode> = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
  box: <><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" /><path d="M3.5 8L12 13l8.5-5M12 13v8" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" /></>,
  doc: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 13h6M9 17h4" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  sparkles: <><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3zM19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z" /></>,
  send: <><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></>,
  check: <><path d="M20 6L9 17l-5-5" /></>,
  arrowRight: <><path d="M5 12h14M12 5l7 7-7 7" /></>,
  external: <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" /></>,
  trash: <><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></>,
  globe: <><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>,
  building: <><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01" /></>,
  back: <><path d="M19 12H5M12 19l-7-7 7-7" /></>,
};

export function Icon({ name, size = 16, className }: { name: keyof typeof PATHS | string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {PATHS[name] ?? null}
    </svg>
  );
}

// Brand logo mark — a stylized "P" with a pitch/target dot.
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect width="32" height="32" rx="8" fill="url(#pplogo)" />
      <path d="M11 22.5V10.2c0-.28.22-.5.5-.5h5.7c2.7 0 4.55 1.65 4.55 4.15S20.4 18 17.7 18H14v4.5c0 .28-.22.5-.5.5h-2c-.28 0-.5-.22-.5-.5Zm3-7.15h3.35c1.1 0 1.8-.62 1.8-1.5s-.7-1.5-1.8-1.5H14v3Z" fill="white" />
      <circle cx="21.3" cy="21" r="2.5" fill="#A7F3D0" />
      <defs>
        <linearGradient id="pplogo" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4ADE80" />
          <stop offset="1" stopColor="#16A34A" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── Buttons ────────────────────────────────────────────────────────────
type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  target?: string;
  variant?: "primary" | "outline" | "ghost" | "subtle" | "danger";
  size?: "sm" | "md";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
};
export function Button({ children, onClick, href, target, variant = "primary", size = "md", disabled, type = "button", className }: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";
  const sizes = { sm: "px-3 py-1.5 text-[13px]", md: "px-4 py-2.5 text-sm" }[size];
  const variants = {
    primary: "bg-brand text-white hover:bg-brand-600 shadow-glow",
    outline: "border border-line bg-card text-fg hover:bg-cardhi",
    ghost: "text-muted hover:text-fg hover:bg-cardhi",
    subtle: "bg-cardhi text-fg hover:brightness-125",
    danger: "border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20",
  }[variant];
  const cls = cn(base, sizes, variants, className);
  if (href) return <Link href={href} target={target} className={cls}>{children}</Link>;
  return <button type={type} onClick={onClick} disabled={disabled} className={cls}>{children}</button>;
}

// ── Card ───────────────────────────────────────────────────────────────
export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={cn("rounded-xl border border-line bg-card shadow-card", className)}>
      {children}
    </div>
  );
}

// ── Badge / status ─────────────────────────────────────────────────────
export function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "brand" | "accent" | "ok" | "warn" | "danger" }) {
  const tones = {
    muted: "border-line bg-cardhi text-muted",
    brand: "border-brand/30 bg-brand/10 text-brand-soft",
    accent: "border-accent/30 bg-accent/10 text-accent",
    ok: "border-ok/30 bg-ok/10 text-ok",
    warn: "border-warn/30 bg-warn/10 text-warn",
    danger: "border-danger/30 bg-danger/10 text-danger",
  }[tone];
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium", tones)}>{children}</span>;
}
export function StatusPill({ status }: { status: string }) {
  const map: Record<string, "muted" | "brand" | "accent" | "ok" | "warn"> = { draft: "muted", running: "accent", in_review: "warn", approved: "ok", sent: "brand", submitted: "ok" };
  const label: Record<string, string> = { in_review: "In review", draft: "Draft", running: "Running", approved: "Approved", sent: "Sent", submitted: "Submitted" };
  return <Badge tone={map[status] ?? "muted"}>{label[status] ?? status}</Badge>;
}
export function Chip({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "brand" | "accent" }) {
  const tones = { muted: "border-line bg-surface text-muted", brand: "border-brand/25 bg-brand/10 text-brand-soft", accent: "border-accent/25 bg-accent/10 text-accent" }[tone];
  return <span className={cn("inline-block rounded-md border px-2 py-1 text-[12px]", tones)}>{children}</span>;
}

// ── Form fields ────────────────────────────────────────────────────────
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-[12px] font-medium text-[#b4b4bd]">{label}</span>
      {children}
      {hint ? <span className="block text-[11px] text-subtle">{hint}</span> : null}
    </label>
  );
}
const inputCls = "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-fg placeholder:text-subtle outline-none transition focus:border-brand/60 focus:ring-2 focus:ring-brand/20";
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputCls, props.className)} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputCls, "min-h-[90px] resize-y", props.className)} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputCls, "appearance-none", props.className)} />;
}

// ── Misc ───────────────────────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return <span className={cn("inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white", className)} />;
}
export function Empty({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-card/40 p-10 text-center">
      <p className="text-sm font-medium text-fg">{title}</p>
      {hint ? <p className="mx-auto mt-1 max-w-md text-[13px] text-muted">{hint}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
export function Avatar({ name, color, size = 36 }: { name: string; color?: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span className="grid shrink-0 place-items-center rounded-lg font-semibold text-white" style={{ width: size, height: size, fontSize: size * 0.36, background: color ?? "linear-gradient(135deg,#22C55E,#14B8A6)" }}>
      {initials}
    </span>
  );
}
export function Stat({ label, value, icon }: { label: string; value: ReactNode; icon?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium uppercase tracking-wide text-subtle">{label}</span>
        {icon ? <span className="text-subtle"><Icon name={icon} size={16} /></span> : null}
      </div>
      <div className="mt-2 text-3xl font-semibold text-fg">{value}</div>
    </Card>
  );
}
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-8" onClick={onClose}>
      <div className={cn("mt-6 w-full animate-in rounded-2xl border border-line bg-card shadow-pop", wide ? "max-w-2xl" : "max-w-lg")} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-base font-semibold text-fg">{title}</h2>
          <button onClick={onClose} className="text-subtle hover:text-fg" aria-label="Close">✕</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
