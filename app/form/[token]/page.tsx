"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Badge, Button, Card, Field, Input, Select, Spinner, Textarea } from "@/components/ui";
import type { Customer, DiscoveryForm } from "@/lib/types";

export default function CustomerFormPage() {
  const { token } = useParams<{ token: string }>();
  const [form, setForm] = useState<DiscoveryForm | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .getForm(token)
      .then(({ form, customer }) => {
        if (!alive) return;
        setForm(form);
        setCustomer(customer);
        if (form.status === "submitted") setDone(true);
      })
      .catch(() => alive && setNotFound(true))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [token]);

  const set = (label: string, v: string) => setAnswers((a) => ({ ...a, [label]: v }));

  async function submit() {
    if (!form) return;
    if (Object.values(answers).filter((v) => v.trim()).length === 0) {
      setErr("Please answer at least one question.");
      return;
    }
    setErr(null);
    setSubmitting(true);
    try {
      await api.submitForm(token, answers);
      setDone(true);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-5 py-12">
      {loading ? (
        <div className="flex items-center justify-center gap-2 text-muted"><Spinner /> Loading…</div>
      ) : notFound ? (
        <Card className="p-8 text-center">
          <p className="text-lg font-semibold text-fg">This link isn&apos;t valid</p>
          <p className="mt-1 text-sm text-muted">The form may have been removed.</p>
        </Card>
      ) : done ? (
        <Card className="p-10 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ok/15 text-2xl">✓</div>
          <h1 className="mt-4 text-xl font-semibold text-fg">Thank you!</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Your answers were sent back to the team and will shape a proposal tailored to {customer?.name ?? "your company"}.
          </p>
        </Card>
      ) : (
        form && (
          <div>
            <div className="mb-5 text-[12px] text-muted">A few quick questions from the sales team</div>
            <Card className="p-7 sm:p-9">
              <h1 className="text-2xl font-semibold tracking-tight text-fg">{form.title}</h1>
              <p className="mt-2 text-sm text-muted">
                Help us tailor your proposal — {form.questions.length} quick questions, about a minute.
              </p>
              <div className="mt-7 space-y-5">
                {form.questions.map((q) => (
                  <Field key={q.id} label={q.label}>
                    {q.type === "textarea" ? (
                      <Textarea placeholder={q.placeholder} value={answers[q.label] ?? ""} onChange={(e) => set(q.label, e.target.value)} />
                    ) : q.type === "select" ? (
                      <Select value={answers[q.label] ?? ""} onChange={(e) => set(q.label, e.target.value)}>
                        <option value="" disabled>Select…</option>
                        {(q.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                      </Select>
                    ) : (
                      <Input placeholder={q.placeholder} value={answers[q.label] ?? ""} onChange={(e) => set(q.label, e.target.value)} />
                    )}
                  </Field>
                ))}
              </div>
              {err && <p className="mt-4 text-[13px] text-danger">{err}</p>}
              <div className="mt-7 flex items-center justify-between">
                <Badge tone="muted">🔒 Only shared with the sales team</Badge>
                <Button onClick={submit} disabled={submitting}>{submitting ? <Spinner /> : null} Send answers</Button>
              </div>
            </Card>
          </div>
        )
      )}
    </main>
  );
}
