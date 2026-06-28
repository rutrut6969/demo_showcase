import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAdminSession("clients:manage");
  if (auth.response) return auth.response;
  const clients = await prisma.client.findMany({ take: 100, orderBy: { createdAt: "desc" } }).catch(() => []);
  return NextResponse.json({ clients });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession("clients:manage");
  if (auth.response) return auth.response;
  const data = await request.json();
  const client = await prisma.client.create({ data });
  return NextResponse.json({ client });
}
