import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const announcements = await prisma.announcement
    .findMany({
      orderBy: { createdAt: "desc" },
    })
    .catch(() => []);

  return NextResponse.json({ announcements });
}

export async function POST(request: Request) {
  const announcement = await prisma.announcement.create({
    data: await request.json(),
  });

  return NextResponse.json({ announcement });
}
