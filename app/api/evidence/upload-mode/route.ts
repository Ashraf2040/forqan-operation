import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  return NextResponse.json({ clientUploads: process.env.VERCEL === "1" || Boolean(process.env.BLOB_READ_WRITE_TOKEN) });
}
