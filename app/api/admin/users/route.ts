import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const createUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(10),
  roleId: z.string()
});

export async function GET() {
  const auth = await requireAdminSession("*");
  if (auth.response) return auth.response;
  const users = await prisma.user.findMany({ include: { role: true }, orderBy: { createdAt: "desc" } }).catch(() => []);
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession("*");
  if (auth.response) return auth.response;
  const body = createUserSchema.parse(await request.json());
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      passwordHash: await bcrypt.hash(body.password, 12),
      roleId: body.roleId
    }
  });
  return NextResponse.json({ user });
}
