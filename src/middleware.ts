import { NextResponse } from "next/server";

// Basic auth for admin routes is now handled in the client so we only need to
// ensure the middleware does not trigger the browser prompt by default.
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
