import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "لا تملك صلاحية إدارة المستخدمين." }, { status: 403 });
  return null;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const users = await prisma.user.findMany({
    select: { id: true, username: true, name: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ users }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: { username?: unknown; name?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "بيانات الطلب غير صالحة." }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!/^[A-Za-z0-9._-]{3,40}$/.test(username)) return NextResponse.json({ error: "اسم الدخول يجب أن يكون من 3 إلى 40 حرفًا إنجليزيًا أو رقمًا أو . _ -." }, { status: 400 });
  if (!name || name.length > 100) return NextResponse.json({ error: "أدخل اسمًا صحيحًا لا يتجاوز 100 حرف." }, { status: 400 });
  if (password.length < 12 || password.length > 200) return NextResponse.json({ error: "يجب أن تتكون كلمة المرور من 12 إلى 200 حرف." }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (existing) return NextResponse.json({ error: "اسم الدخول مستخدم بالفعل." }, { status: 409 });

  const user = await prisma.user.create({
    data: { username, name, passwordHash: await hash(password, 12), role: "viewer" },
    select: { id: true, username: true, name: true, role: true, isActive: true, createdAt: true },
  });
  return NextResponse.json({ user }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}
