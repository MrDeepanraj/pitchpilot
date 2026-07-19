"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button, Field, Input, Logo, Spinner } from "@/components/ui";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await api.signup({ name, email, company });
      router.push("/onboarding");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <Logo size={34} />
          <span className="text-lg font-semibold">Pitch<span className="grad">Pilot</span></span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Create your workspace</h1>
        <p className="mt-1 text-sm text-muted">Set up your sales engine in a minute.</p>

        <form className="mt-7 space-y-4" onSubmit={submit}>
          <Field label="Your name">
            <Input required placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Work email">
            <Input type="email" required placeholder="jane@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Company">
            <Input required placeholder="Your company" value={company} onChange={(e) => setCompany(e.target.value)} />
          </Field>
          {err && <p className="text-[13px] text-danger">{err}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Spinner /> : null} Create workspace →
          </Button>
        </form>

        <p className="mt-8 text-center text-[13px] text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-soft hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
