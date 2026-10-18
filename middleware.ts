import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  if (request.auth) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.nextUrl);
  loginUrl.searchParams.set("callbackUrl", request.nextUrl.href);
  return NextResponse.redirect(loginUrl);
});

export const config = {
  // Evidence handlers enforce authentication themselves. Excluding uploads
  // prevents middleware from buffering large multipart bodies in memory.
  matcher: ["/stage/:path*"],
};
