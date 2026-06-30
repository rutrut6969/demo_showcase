import { ClientLoginForm } from "@/components/ClientLoginForm";

export default function ClientLoginPage({ searchParams }: { searchParams?: { token?: string } }) {
  return <ClientLoginForm claimToken={searchParams?.token} />;
}
