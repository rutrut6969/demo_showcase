import { NextResponse } from "next/server";
import { getSessionUser, requirePermission } from "@/lib/auth";

export async function requireAdminSession(permission?: string) {
  const session = await getSessionUser().catch(() => null);
  if (!session) {
    return { session: null, response: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  }
  if (permission && !requirePermission(session, permission)) {
    return { session, response: NextResponse.json({ error: "Insufficient permission" }, { status: 403 }) };
  }
  return { session, response: null };
}
