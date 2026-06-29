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
  mustChangePassword: boolean;
};

type AdminActionTokenPayload = SessionUser & {
  adminAction: true;
};

export async function signIn(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true }
  }).catch(async (error) => {
    await prisma.siteLog.create({
      data: {
        source: "auth",
        message: "Sign in failed because database tables are not ready",
        metadata: { error: error instanceof Error ? error.message : String(error) }
      }
    }).catch(() => undefined);
    return null;
  });

  if (!user || user.suspended) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role.name,
    permissions: user.role.permissions,
    mustChangePassword: user.mustChangePassword
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

export async function updatePassword(userId: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      mustChangePassword: false,
      lastPasswordChangeAt: new Date()
    },
    include: { role: true }
  });

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role.name,
    permissions: user.role.permissions,
    mustChangePassword: false
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

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "password_changed",
      entityType: "User",
      entityId: user.id,
      metadata: { forcedChangeCompleted: true },
      ipAddress: headers().get("x-forwarded-for")
    }
  }).catch(() => undefined);
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

export async function createAdminActionToken(user: SessionUser) {
  return new SignJWT({ ...user, adminAction: true } satisfies AdminActionTokenPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret);
}

export async function verifyAdminActionToken(token: string): Promise<SessionUser | null> {
  try {
    const verified = await jwtVerify(token, secret);
    const payload = verified.payload as Partial<AdminActionTokenPayload>;
    if (!payload.adminAction || !payload.id || !payload.email || !payload.name || !payload.role || !Array.isArray(payload.permissions)) return null;
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      permissions: payload.permissions,
      mustChangePassword: Boolean(payload.mustChangePassword)
    };
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
