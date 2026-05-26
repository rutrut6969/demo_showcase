import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui";
import { LockKeyhole, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  async function login(formData: FormData) {
    "use server";
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const user = await signIn(email, password);
    if (user?.mustChangePassword) redirect("/admin/password");
    if (user) redirect("/admin");
    redirect("/admin/login?error=invalid");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-obsidian-950 px-4">
      <form action={login} className="glass w-full max-w-md rounded-lg border-white/15 bg-slate-950/90 p-6 shadow-2xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <LockKeyhole className="h-4 w-4" />
          Secure access
        </Link>
        <div className="mt-6 grid h-12 w-12 place-items-center rounded-lg border border-obsidian-green/30 bg-obsidian-green/10">
          <ShieldCheck className="h-6 w-6 text-obsidian-green" />
        </div>
        <h1 className="mt-5 text-3xl font-semibold text-white">Staff sign in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">Authorized personnel only. Access is logged and role restricted.</p>
        <label className="mt-6 block text-sm font-medium text-slate-200" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required className="mt-2 w-full rounded-lg border border-white/12 bg-slate-900 px-3 py-3 text-white outline-none focus:border-obsidian-green/70" />
        <label className="mt-4 block text-sm font-medium text-slate-200" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required className="mt-2 w-full rounded-lg border border-white/12 bg-slate-900 px-3 py-3 text-white outline-none focus:border-obsidian-green/70" />
        <Button className="mt-6 w-full" type="submit">Sign in</Button>
      </form>
    </main>
  );
}
