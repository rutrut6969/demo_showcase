import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui";
import { getSessionUser, updatePassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PasswordChangePage() {
  const session = await getSessionUser().catch(() => null);
  if (!session) redirect("/admin/login");
  if (!session.mustChangePassword) redirect("/admin");

  async function changePassword(formData: FormData) {
    "use server";
    const currentSession = await getSessionUser().catch(() => null);
    if (!currentSession) redirect("/admin/login");

    const password = String(formData.get("password") || "");
    const confirm = String(formData.get("confirm") || "");
    if (password.length < 12 || password !== confirm) redirect("/admin/password?error=invalid");

    await updatePassword(currentSession.id, password);
    redirect("/admin");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-obsidian-950 px-4">
      <form action={changePassword} className="glass w-full max-w-md rounded-lg border-white/15 bg-slate-950/90 p-6 shadow-2xl">
        <Link href="/" className="text-sm text-slate-400 hover:text-white">Secure access</Link>
        <div className="mt-6 grid h-12 w-12 place-items-center rounded-lg border border-obsidian-green/30 bg-obsidian-green/10">
          <KeyRound className="h-6 w-6 text-obsidian-green" />
        </div>
        <h1 className="mt-5 text-3xl font-semibold text-white">Create a new password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          This account requires a password change before the operations dashboard can be opened.
        </p>
        <label className="mt-6 block text-sm font-medium text-slate-200" htmlFor="password">New password</label>
        <input id="password" name="password" type="password" minLength={12} required className="mt-2 w-full rounded-lg border border-white/12 bg-slate-900 px-3 py-3 text-white outline-none focus:border-obsidian-green/70" />
        <label className="mt-4 block text-sm font-medium text-slate-200" htmlFor="confirm">Confirm password</label>
        <input id="confirm" name="confirm" type="password" minLength={12} required className="mt-2 w-full rounded-lg border border-white/12 bg-slate-900 px-3 py-3 text-white outline-none focus:border-obsidian-green/70" />
        <p className="mt-3 text-xs leading-5 text-slate-400">Use at least 12 characters. Access changes are logged for security auditing.</p>
        <Button className="mt-6 w-full" type="submit">Update password</Button>
      </form>
    </main>
  );
}
