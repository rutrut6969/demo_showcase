import { NextResponse } from "next/server";
import { getSessionUser, requirePermission, verifyAdminActionToken } from "@/lib/auth";

export async function requireAdminSession(permission?: string, request?: Request) {
  const session = await getSessionUser().catch(() => null) || await getBearerSession(request);
  if (!session) {
    return { session: null, response: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  }
  if (permission && !requirePermission(session, permission)) {
    return { session, response: NextResponse.json({ error: "Insufficient permission" }, { status: 403 }) };
  }
  return { session, response: null };
}

async function getBearerSession(request?: Request) {
  const authorization = request?.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  return verifyAdminActionToken(authorization.slice("Bearer ".length));
}
