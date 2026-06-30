"use client";

import { FormEvent, useState } from "react";

export function ClientLoginForm({ claimToken }: { claimToken?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isClaim = Boolean(claimToken);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(isClaim ? "/api/client/claim" : "/api/client/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(isClaim ? { token: claimToken, password } : { email, password })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || "Client sign in failed.");
      window.location.href = data.redirectTo || "/client/payment-methods";
    } catch (error) {
      setError(error instanceof Error ? error.message : "Client sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950">
      <form onSubmit={submit} className="mx-auto grid max-w-md gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">Client portal</p>
        <h1 className="text-2xl font-semibold">{isClaim ? "Create portal access" : "Client sign in"}</h1>
        {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
        {!isClaim ? (
          <label className="grid gap-2 text-sm font-medium">
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="rounded-lg border border-slate-300 px-3 py-3" />
          </label>
        ) : null}
        <label className="grid gap-2 text-sm font-medium">
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required className="rounded-lg border border-slate-300 px-3 py-3" />
        </label>
        <button disabled={loading} className="min-h-12 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{loading ? "Working..." : isClaim ? "Create account" : "Sign in"}</button>
      </form>
    </main>
  );
}
