import { NextRequest, NextResponse } from "next/server";
import { requireAdminBasicAuth } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  const res = requireAdminBasicAuth(request);
  if (res) return res;
  return NextResponse.json({ ok: true });
}

