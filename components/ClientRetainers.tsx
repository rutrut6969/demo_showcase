"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ClientRetainer = {
  id: string;
  tier: string;
  monthlyAmount: number;
  billingCycle: string;
  paymentStatus: string;
  subscriptionStatus: string;
  nextBillingDate?: string | null;
  failedPaymentCount: number;
  lastFailureReason?: string | null;
  canceledAt?: string | null;
  hasSavedCard: boolean;
};

export function ClientRetainers() {
  const [retainers, setRetainers] = useState<ClientRetainer[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    loadRetainers();
  }, []);

  async function loadRetainers() {
    const response = await fetch("/api/client/retainers", { credentials: "include" });
    const data = await response.json().catch(() => null);
    if (response.ok && data?.retainers) setRetainers(data.retainers);
  }

  async function cancelRetainer(id: string) {
    setBusyId(id);
    setError("");
    setMessage("");
    const response = await fetch(`/api/client/retainers/${id}/cancel`, { method: "POST", credentials: "include" });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) {
      setError(data?.error || "Retainer could not be canceled.");
    } else {
      setMessage("Retainer canceled. Obsidian Systems has been notified.");
      await loadRetainers();
    }
    setBusyId("");
  }

  return (
    <main className="min-h-screen bg-slate-100 px-3 py-5 text-slate-950 sm:px-6">
      <section className="mx-auto grid max-w-4xl gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">Client portal</p>
          <h1 className="mt-3 text-2xl font-semibold">Retainer billing</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">View recurring billing status, payment warnings, and cancellation options.</p>
          <Link className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold" href="/client/payment-methods">Payment methods</Link>
        </div>
        {message ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p> : null}
        {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
        {retainers.map((retainer) => (
          <article key={retainer.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{retainer.billingCycle}</p>
                <h2 className="mt-2 text-xl font-semibold">{retainer.tier}</h2>
                <p className="mt-1 text-2xl font-semibold">${Math.round(retainer.monthlyAmount / 100).toLocaleString()}/mo</p>
              </div>
              <span className="inline-flex w-fit rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white">{retainer.subscriptionStatus.replaceAll("_", " ")}</span>
            </div>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-3"><dt className="text-slate-500">Payment status</dt><dd className="font-semibold">{retainer.paymentStatus}</dd></div>
              <div className="rounded-lg bg-slate-50 p-3"><dt className="text-slate-500">Next billing</dt><dd className="font-semibold">{retainer.nextBillingDate ? new Date(retainer.nextBillingDate).toLocaleDateString() : "Pending setup"}</dd></div>
              <div className="rounded-lg bg-slate-50 p-3"><dt className="text-slate-500">Saved card</dt><dd className="font-semibold">{retainer.hasSavedCard ? "On file" : "Needed"}</dd></div>
              <div className="rounded-lg bg-slate-50 p-3"><dt className="text-slate-500">Failed payments</dt><dd className="font-semibold">{retainer.failedPaymentCount}</dd></div>
            </dl>
            {retainer.subscriptionStatus === "PAST_DUE" ? <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{retainer.lastFailureReason || "Payment is past due. Please update your payment method."}</p> : null}
            {retainer.subscriptionStatus !== "CANCELED" ? (
              <button className="mt-4 min-h-11 w-full rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 sm:w-auto" disabled={busyId === retainer.id} onClick={() => cancelRetainer(retainer.id)}>
                {busyId === retainer.id ? "Canceling..." : "Cancel retainer"}
              </button>
            ) : null}
          </article>
        ))}
        {!retainers.length ? <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">No retainers are attached to this account yet.</p> : null}
      </section>
    </main>
  );
}
