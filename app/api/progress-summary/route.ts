import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GOALS_PER_STAGE = { primary: 13, middle: 12, high: 12, all: 14 } as const;
const EVIDENCE_PER_GOAL = 10;

export async function GET() {
  const customGoals = await prisma.operationalGoal.findMany({ select: { id: true } });
  const rows = await prisma.evidence.groupBy({
    by: ["stage", "programId"],
    where: { stage: { in: [...Object.keys(GOALS_PER_STAGE), "development"] }, level: { in: ["level-1", "level-2", "level-3", "level-4", "level-5"] } },
    _count: { _all: true },
  });
  const evidenceByGoal = new Map<string, number>();
  for (const row of rows) {
    const key = `${row.stage}:${row.programId}`;
    evidenceByGoal.set(key, row._count._all);
  }
  const stageProgress: Record<string, { percentage: number; completedLevels: number; totalLevels: number; completedGoals: number; totalGoals: number }> = {};
  let completed = 0;
  for (const [stage, count] of Object.entries(GOALS_PER_STAGE)) {
    let stageEvidenceProgress = 0;
    let stageCompletedGoals = 0;
    for (let id = 1; id <= count; id += 1) {
      const evidenceCount = evidenceByGoal.get(`${stage}:${id}`) ?? 0;
      stageEvidenceProgress += Math.min(evidenceCount, EVIDENCE_PER_GOAL);
      if (evidenceCount >= EVIDENCE_PER_GOAL) stageCompletedGoals += 1;
    }
    const totalEvidence = count * EVIDENCE_PER_GOAL;
    stageProgress[stage] = { percentage: Math.round((stageEvidenceProgress / totalEvidence) * 100), completedLevels: stageEvidenceProgress, totalLevels: totalEvidence, completedGoals: stageCompletedGoals, totalGoals: count };
    if (stage !== "all") completed += stageCompletedGoals;
  }
  const developmentEvidenceProgress = [...evidenceByGoal.entries()]
    .filter(([key]) => key.startsWith("development:"))
    .reduce((total, [, count]) => total + Math.min(count, EVIDENCE_PER_GOAL), 0);
  const completedDevelopmentGoals = [...evidenceByGoal.entries()]
    .filter(([key, count]) => key.startsWith("development:") && count >= EVIDENCE_PER_GOAL).length;
  stageProgress.development = {
    percentage: customGoals.length ? Math.round((developmentEvidenceProgress / (customGoals.length * EVIDENCE_PER_GOAL)) * 100) : 0,
    completedLevels: developmentEvidenceProgress,
    totalLevels: customGoals.length * EVIDENCE_PER_GOAL,
    completedGoals: completedDevelopmentGoals,
    totalGoals: customGoals.length,
  };
  const summaryTotal = GOALS_PER_STAGE.primary + GOALS_PER_STAGE.middle + GOALS_PER_STAGE.high;
  return NextResponse.json(
    { total: summaryTotal, completed, incomplete: summaryTotal - completed, stageProgress },
    { headers: { "Cache-Control": "no-store" } },
  );
}
