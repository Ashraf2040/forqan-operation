import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GOALS_PER_STAGE = { primary: 13, middle: 12, high: 12, all: 14 } as const;

export async function GET() {
  const customGoals = await prisma.operationalGoal.findMany({ select: { id: true } });
  const rows = await prisma.evidence.groupBy({
    by: ["stage", "programId", "level"],
    where: { stage: { in: [...Object.keys(GOALS_PER_STAGE), "development"] }, level: { in: ["level-1", "level-2", "level-3", "level-4", "level-5"] } },
    _count: { _all: true },
  });
  const levelsByGoal = new Map<string, Set<string>>();
  for (const row of rows) {
    const key = `${row.stage}:${row.programId}`;
    const levels = levelsByGoal.get(key) ?? new Set<string>();
    levels.add(row.level);
    levelsByGoal.set(key, levels);
  }
  const stageProgress: Record<string, { percentage: number; completedLevels: number; totalLevels: number; completedGoals: number; totalGoals: number }> = {};
  let completed = 0;
  for (const [stage, count] of Object.entries(GOALS_PER_STAGE)) {
    let stageCompletedLevels = 0;
    let stageCompletedGoals = 0;
    for (let id = 1; id <= count; id += 1) {
      const levels = levelsByGoal.get(`${stage}:${id}`)?.size ?? 0;
      stageCompletedLevels += levels;
      if (levels === 5) stageCompletedGoals += 1;
    }
    const totalLevels = count * 5;
    stageProgress[stage] = { percentage: Math.round((stageCompletedLevels / totalLevels) * 100), completedLevels: stageCompletedLevels, totalLevels, completedGoals: stageCompletedGoals, totalGoals: count };
    if (stage !== "all") completed += stageCompletedGoals;
  }
  const developmentLevels = [...levelsByGoal.entries()]
    .filter(([key]) => key.startsWith("development:"))
    .reduce((total, [, levels]) => total + levels.size, 0);
  const completedDevelopmentGoals = [...levelsByGoal.entries()]
    .filter(([key, levels]) => key.startsWith("development:") && levels.size === 5).length;
  stageProgress.development = {
    percentage: customGoals.length ? Math.round((developmentLevels / (customGoals.length * 5)) * 100) : 0,
    completedLevels: developmentLevels,
    totalLevels: customGoals.length * 5,
    completedGoals: completedDevelopmentGoals,
    totalGoals: customGoals.length,
  };
  const summaryTotal = GOALS_PER_STAGE.primary + GOALS_PER_STAGE.middle + GOALS_PER_STAGE.high;
  return NextResponse.json(
    { total: summaryTotal, completed, incomplete: summaryTotal - completed, stageProgress },
    { headers: { "Cache-Control": "no-store" } },
  );
}
