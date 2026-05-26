import { AdminPortal } from "@/components/AdminPortal";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSessionUser().catch(() => null);
  if (!session) redirect("/admin/login");
  if (session.mustChangePassword) redirect("/admin/password");

  return <AdminPortal user={session} />;
}
