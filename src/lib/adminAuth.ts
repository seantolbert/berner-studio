import { NextRequest, NextResponse } from "next/server";

export function requireAdminBasicAuth(req: NextRequest): NextResponse | null {
  const user = process.env.ADMIN_USER || "";
  const pass = process.env.ADMIN_PASS || "";
  if (!user || !pass) {
    return new NextResponse("Admin auth not configured", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="admin", charset="UTF-8"' } });
  }
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) {
    return new NextResponse("Authentication required", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="admin", charset="UTF-8"' } });
  }
  try {
    const base64 = auth.split(" ")[1] || "";
    const decoded = Buffer.from(base64, "base64").toString("utf8");
    const [u, p] = decoded.split(":");
    if (u === user && p === pass) return null;
  } catch {}
  return new NextResponse("Unauthorized", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="admin", charset="UTF-8"' } });
}

