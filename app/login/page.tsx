"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button, Field, Input, Logo, Spinner } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const { seller } = await api.login(email);
      router.push(seller.onboarded ? "/" : "/onboarding");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-surface p-12 lg:flex">
        <div className="absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-brand/20 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <Logo />
          <span className="text-lg font-semibold">Pitch<span className="grad">Pilot</span></span>
        </div>
        <div className="relative">
          <h1 className="max-w-md text-3xl font-semibold leading-tight tracking-tight text-fg">
            Your AI sales engine for <span className="grad">winning proposals</span>.
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
            Onboard your products once. Save every customer as a reusable profile. Generate tailored,
            on-brand proposals in minutes — with a human review checkpoint before anything ships.
          </p>
          <div className="mt-8 flex gap-6 text-[13px] text-subtle">
            <span>◆ Multi-agent engine</span>
            <span>◆ Reusable customer profiles</span>
          </div>
        </div>
        <div className="relative text-[12px] text-subtle">© PitchPilot — sales proposal copilot</div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Logo />
            <span className="text-lg font-semibold">Pitch<span className="grad">Pilot</span></span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-fg">Welcome back</h2>
          <p className="mt-1 text-sm text-muted">Sign in to your sales workspace.</p>

          <form className="mt-7 space-y-4" onSubmit={submit}>
            <Field label="Work email">
              <Input type="email" required autoComplete="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Password">
              <Input type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            {err && <p className="text-[13px] text-danger">{err}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Spinner /> : null} Sign in
            </Button>
          </form>

          <p className="mt-8 text-center text-[13px] text-muted">
            New here?{" "}
            <Link href="/signup" className="font-medium text-brand-soft hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
