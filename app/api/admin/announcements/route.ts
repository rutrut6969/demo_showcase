import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const announcements = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" } }).catch(() => []);
  return NextResponse.json({ announcements });
}

export async function POST(request: Request) {
  const announcement = await prisma.announcement.create({ data: await request.json() });
  return NextResponse.json({ announcement });
}
