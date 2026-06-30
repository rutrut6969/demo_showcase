import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const clientCookieName = "obsidian_client_session";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "development-only-change-me");

export type ClientSession = {
  clientUserId: string;
  clientId: string;
  email: string;
};

export async function signInClient(email: string, password: string) {
  const user = await prisma.clientUser.findUnique({
    where: { email: email.toLowerCase() },
    include: { client: true }
  });
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  const session: ClientSession = {
    clientUserId: user.id,
    clientId: user.clientId,
    email: user.email
  };
  await setClientSession(session);
  await prisma.clientUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => undefined);
  return session;
}

export async function createClientUser(clientId: string, email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.clientUser.upsert({
    where: { email: email.toLowerCase() },
    update: { clientId, passwordHash, emailVerifiedAt: new Date() },
    create: { clientId, email: email.toLowerCase(), passwordHash, emailVerifiedAt: new Date() }
  });
  const session: ClientSession = { clientUserId: user.id, clientId: user.clientId, email: user.email };
  await setClientSession(session);
  return session;
}

export async function getClientSession(): Promise<ClientSession | null> {
  const token = cookies().get(clientCookieName)?.value;
  if (!token) return null;
  try {
    const verified = await jwtVerify(token, secret);
    const payload = verified.payload as Partial<ClientSession>;
    if (!payload.clientUserId || !payload.clientId || !payload.email) return null;
    return { clientUserId: payload.clientUserId, clientId: payload.clientId, email: payload.email };
  } catch {
    return null;
  }
}

export async function requireClientSession() {
  const session = await getClientSession();
  if (!session) return { session: null, response: Response.json({ error: "Client authentication required" }, { status: 401 }) };
  return { session, response: null };
}

export function signOutClient() {
  cookies().delete(clientCookieName);
}

async function setClientSession(session: ClientSession) {
  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  cookies().set(clientCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}
