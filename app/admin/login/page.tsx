import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AdminLoginForm } from "@/components/AdminLoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }: { searchParams?: { error?: string } }) {
  const session = await getSessionUser();
  if (session?.mustChangePassword) redirect("/admin/password");
  if (session) redirect("/admin");

  return (
    <main className="grid min-h-screen place-items-center bg-obsidian-950 px-4">
      <AdminLoginForm initialError={searchParams?.error === "invalid" ? "Invalid email or password." : searchParams?.error === "session" ? "Your admin session was not available to that action. Please sign in again." : undefined} />
    </main>
  );
}
