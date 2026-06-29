"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui";

type LoginResponse = {
  success?: boolean;
  mustChangePassword?: boolean;
  redirectTo?: string;
  session?: {
    userId?: string;
    role?: string;
    mustChangePassword?: boolean;
  };
  error?: string;
};

export function AdminLoginForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError || "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });
      const data = (await response.json().catch(() => ({}))) as LoginResponse;

      if (!response.ok) {
        setError(data.error || "Sign in failed. Check your credentials and try again.");
        return;
      }

      if (!data.success || !data.session?.userId) {
        console.error("Admin login returned an invalid success payload", { hasSuccess: data.success, hasSession: Boolean(data.session) });
        setError("Sign in succeeded, but the session response was incomplete. Please refresh and try again.");
        return;
      }

      const target = data.mustChangePassword ? "/admin/password" : data.redirectTo || "/admin";
      router.push(target);
      window.location.href = target;
    } catch (loginError) {
      console.error("Admin login request failed", loginError);
      setError("Sign in could not be completed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass w-full max-w-md rounded-lg border-white/15 bg-slate-950/90 p-6 shadow-2xl">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <LockKeyhole className="h-4 w-4" />
        Secure access
      </Link>
      <div className="mt-6 grid h-12 w-12 place-items-center rounded-lg border border-obsidian-green/30 bg-obsidian-green/10">
        <ShieldCheck className="h-6 w-6 text-obsidian-green" />
      </div>
      <h1 className="mt-5 text-3xl font-semibold text-white">Staff sign in</h1>
      <p className="mt-2 text-sm leading-6 text-slate-300">Authorized personnel only. Access is logged and role restricted.</p>
      {error ? <p className="mt-5 rounded-lg border border-rose-400/30 bg-rose-500/12 p-3 text-sm text-rose-100">{error}</p> : null}
      <label className="mt-6 block text-sm font-medium text-slate-200" htmlFor="email">Email</label>
      <input id="email" name="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="mt-2 w-full rounded-lg border border-white/12 bg-slate-900 px-3 py-3 text-white outline-none focus:border-obsidian-green/70" />
      <label className="mt-4 block text-sm font-medium text-slate-200" htmlFor="password">Password</label>
      <input id="password" name="password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="mt-2 w-full rounded-lg border border-white/12 bg-slate-900 px-3 py-3 text-white outline-none focus:border-obsidian-green/70" />
      <Button className="mt-6 w-full" type="submit" loading={loading}>Sign in</Button>
    </form>
  );
}
