import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  async function login(formData: FormData) {
    "use server";
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const user = await signIn(email, password);
    if (user) redirect("/admin");
    redirect("/admin/login?error=invalid");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-obsidian-950 px-4">
      <form action={login} className="glass w-full max-w-md rounded-lg p-6">
        <Link href="/" className="text-sm text-slate-400 hover:text-white">Back to site</Link>
        <h1 className="mt-5 text-3xl font-semibold text-white">Admin sign in</h1>
        <p className="mt-2 text-sm text-slate-300">Seed credentials: owner@obsidiansystems.local / ChangeMeNow!2026</p>
        <label className="mt-6 block text-sm font-medium text-slate-200" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required className="mt-2 w-full rounded-lg border border-white/12 bg-white/8 px-3 py-3 text-white outline-none focus:border-obsidian-green/70" />
        <label className="mt-4 block text-sm font-medium text-slate-200" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required className="mt-2 w-full rounded-lg border border-white/12 bg-white/8 px-3 py-3 text-white outline-none focus:border-obsidian-green/70" />
        <Button className="mt-6 w-full" type="submit">Sign in</Button>
      </form>
    </main>
  );
}
