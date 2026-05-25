import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const clients = await prisma.client.findMany({ take: 100, orderBy: { createdAt: "desc" } }).catch(() => []);
  return NextResponse.json({ clients });
}

export async function POST(request: Request) {
  const data = await request.json();
  const client = await prisma.client.create({ data });
  return NextResponse.json({ client });
}
