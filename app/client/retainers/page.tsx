import { redirect } from "next/navigation";
import { ClientRetainers } from "@/components/ClientRetainers";
import { getClientSession } from "@/lib/client-auth";

export default async function ClientRetainersPage() {
  const session = await getClientSession();
  if (!session) redirect("/client/login");
  return <ClientRetainers />;
}
