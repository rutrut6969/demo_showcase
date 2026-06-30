import { redirect } from "next/navigation";
import { getClientSession } from "@/lib/client-auth";
import { ClientPaymentMethods } from "@/components/ClientPaymentMethods";

export default async function PaymentMethodsPage() {
  const session = await getClientSession();
  if (!session) redirect("/client/login");
  return <ClientPaymentMethods />;
}
