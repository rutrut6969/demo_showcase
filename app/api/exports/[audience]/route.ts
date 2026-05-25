import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: { audience: string } }) {
  const clients = await prisma.client.findMany({
    take: 500,
    orderBy: { createdAt: "desc" }
  }).catch(() => []);

  const rows = [
    ["name", "businessName", "email", "phone", "marketingConsent", "linkedDemoInterest"],
    ...clients.map((client) => [
      client.name,
      client.businessName || "",
      client.email,
      client.phone || "",
      String(client.marketingConsent),
      client.linkedDemoInterest || ""
    ])
  ];

  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${params.audience}-export.csv"`
    }
  });
}
