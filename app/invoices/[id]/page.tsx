import { InvoiceView } from "@/components/InvoiceView";

export default function InvoicePage({ params }: { params: { id: string } }) {
  return <InvoiceView invoiceId={params.id} />;
}
