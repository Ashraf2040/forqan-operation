import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function authorized() {
  const session = await auth();
  return session?.user ? null : NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request) {
  const denied = await authorized();
  if (denied) return denied;

  const stage = new URL(request.url).searchParams.get("stage");
  if (!stage || !["primary", "middle", "high", "all"].includes(stage)) {
    return jsonError("المرحلة المحددة غير صالحة.", 400);
  }

  const rows = await prisma.evidence.groupBy({
    by: ["programId", "level"],
    where: { stage, level: { in: ["level-1", "level-2", "level-3", "level-4", "level-5"] } },
    _count: { _all: true },
  });
  const progress: Record<string, { completedLevels: number; percentage: number; completedLevelIds: string[] }> = {};
  for (const row of rows) {
    const current = progress[row.programId] ?? { completedLevels: 0, percentage: 0, completedLevelIds: [] };
    current.completedLevelIds.push(row.level);
    current.completedLevels = current.completedLevelIds.length;
    current.percentage = current.completedLevels * 20;
    progress[row.programId] = current;
  }
  return NextResponse.json({ progress }, { headers: { "Cache-Control": "private, no-store" } });
}
