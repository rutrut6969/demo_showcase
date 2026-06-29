import { AdminPortal } from "@/components/AdminPortal";
import { getAdminPortalData } from "@/lib/admin-data";
import { createAdminActionToken, getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSessionUser().catch(() => null);
  if (!session) redirect("/admin/login");
  if (session.mustChangePassword) redirect("/admin/password");
  const data = await getAdminPortalData();
  const actionToken = await createAdminActionToken(session);

  return <AdminPortal user={session} data={data} actionToken={actionToken} />;
}
