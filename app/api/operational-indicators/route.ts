import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import source from "@/app/data/plan-indicators.json";

export const dynamic = "force-dynamic";

const stages = ["primary", "middle", "high"] as const;
const validKeys = new Set(
  stages.flatMap((stage) =>
    source[stage].flatMap((objective) => objective.kpis.map((kpi) => `${stage}:${kpi.code}`)),
  ),
);

function logDatabaseFailure(operation: string, error: unknown) {
  const details = error instanceof Error ? error : new Error("Unknown database error");
  const code = typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: unknown }).code)
    : undefined;
  const message = details.message
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, "[database URL]")
    .replace(/(password|pwd)=([^\s;]+)/gi, "$1=[redacted]")
    .slice(0, 400);
  console.error(`Operational indicators ${operation} failed`, { name: details.name, code, message });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });

  try {
    const records = await prisma.operationalIndicator.findMany();
    const entries = Object.fromEntries(records.map((record) => [
      `${record.stage}:${record.code}`,
      { value: record.value, updated: record.updatedAt.getTime() },
    ]));
    return NextResponse.json({ entries }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    logDatabaseFailure("load", error);
    return NextResponse.json({ error: "تعذر تحميل مؤشرات الخطة." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });

  try {
    const body = await request.json();
    if (!body || typeof body.entries !== "object" || Array.isArray(body.entries)) {
      return NextResponse.json({ error: "بيانات المؤشرات غير صالحة." }, { status: 400 });
    }

    const updates: { stage: string; code: string; value: string }[] = [];
    for (const [key, entry] of Object.entries(body.entries as Record<string, unknown>)) {
      if (!validKeys.has(key) || !entry || typeof entry !== "object" || typeof (entry as { value?: unknown }).value !== "string") {
        return NextResponse.json({ error: "تتضمن البيانات مؤشراً غير صالح." }, { status: 400 });
      }
      const [stage, code] = key.split(":");
      updates.push({ stage, code, value: (entry as { value: string }).value.slice(0, 80) });
    }

    await prisma.$transaction(updates.map(({ stage, code, value }) => prisma.operationalIndicator.upsert({
      where: { stage_code: { stage, code } },
      create: { stage, code, value },
      update: { value },
    })));
    return NextResponse.json({ success: true, saved: updates.length });
  } catch (error) {
    logDatabaseFailure("save", error);
    return NextResponse.json({ error: "تعذر حفظ المؤشرات. حاول مرة أخرى." }, { status: 503 });
  }
}
