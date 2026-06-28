import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const auth = await requireAdminSession("content:manage");
  if (auth.response) return auth.response;
  const announcements = await prisma.announcement
    .findMany({
      orderBy: { createdAt: "desc" },
    })
    .catch(() => []);

  return NextResponse.json({ announcements });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession("content:manage");
  if (auth.response) return auth.response;
  const announcement = await prisma.announcement.create({
    data: await request.json(),
  });

  return NextResponse.json({ announcement });
}
