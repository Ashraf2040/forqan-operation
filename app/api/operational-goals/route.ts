import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function asProgram(goal: { id: string; name: string; goal: string; audience: string; count: string; period: string; place: string; cost: string; requirements: string; owner: string; support: string; indicator: string }, index: number) {
  return {
    id: goal.id,
    no: index + 1,
    name: goal.name,
    goal: goal.goal,
    audience: goal.audience || "—", count: goal.count || "—", period: goal.period || "—",
    place: goal.place || "—", cost: goal.cost || "—", requirements: goal.requirements || "—",
    owner: goal.owner || "—", support: goal.support || "—", indicator: goal.indicator || "—",
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });

  try {
    const goals = await prisma.operationalGoal.findMany({ orderBy: { createdAt: "asc" } });
    return NextResponse.json({ goals: goals.map(asProgram) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "تعذر تحميل أهداف الخطة." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "لا تملك صلاحية إضافة أهداف." }, { status: 403 });

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 160) : "";
    const goalText = typeof body.goal === "string" ? body.goal.trim().slice(0, 4000) : "";
    if (!name || !goalText) return NextResponse.json({ error: "اكتب اسم الهدف وشرحه." }, { status: 400 });

    const fields = ["audience", "count", "period", "place", "cost", "requirements", "owner", "support", "indicator"] as const;
    const data = Object.fromEntries(fields.map((field) => [field, typeof body[field] === "string" ? body[field].trim().slice(0, 500) : ""])) as Record<typeof fields[number], string>;
    const created = await prisma.operationalGoal.create({ data: { name, goal: goalText, ...data } });
    const goals = await prisma.operationalGoal.findMany({ orderBy: { createdAt: "asc" } });
    return NextResponse.json({ goal: asProgram(created, goals.findIndex((item) => item.id === created.id)) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "تعذر حفظ الهدف. تحقق من اتصال قاعدة البيانات." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "لا تملك صلاحية حذف الأهداف." }, { status: 403 });

  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "الهدف المحدد غير صالح." }, { status: 400 });
    const result = await prisma.operationalGoal.deleteMany({ where: { id } });
    if (!result.count) return NextResponse.json({ error: "الهدف غير موجود أو سبق حذفه." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Operational goal deletion failed:", error);
    return NextResponse.json({ error: "تعذر حذف الهدف بسبب مشكلة في قاعدة البيانات." }, { status: 503 });
  }
}
