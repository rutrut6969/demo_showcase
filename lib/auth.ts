import { cookies, headers } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import bcrypt from "bcryptjs";
import type { ComplexityLevel, RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const cookieName = "obsidian_session";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "development-only-change-me");

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: RoleName;
  permissions: string[];
};

export async function signIn(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true }
  });

  if (!user || user.suspended) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role.name,
    permissions: user.role.permissions
  };

  const token = await new SignJWT(sessionUser)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);

  cookies().set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });

  await prisma.siteLog.create({
    data: {
      source: "auth",
      message: "User signed in",
      userId: user.id,
      metadata: { ip: headers().get("x-forwarded-for") }
    }
  }).catch(() => undefined);

  return sessionUser;
}

export function signOut() {
  cookies().delete(cookieName);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(cookieName)?.value;
  if (!token) return null;

  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload as SessionUser;
  } catch {
    return null;
  }
}

export function canApproveComplexity(role: RoleName, complexity: ComplexityLevel) {
  if (role === "SUPER_ADMIN") return true;
  if (role === "ADMIN") return complexity === "LOW" || complexity === "MODERATE";
  if (role === "SITE_OVERSEER") return complexity === "LOW";
  return false;
}

export function requirePermission(user: SessionUser | null, permission: string) {
  if (!user) return false;
  return user.permissions.includes("*") || user.permissions.includes(permission);
}
