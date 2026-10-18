import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import path from "node:path";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set([
  "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/webm", "video/quicktime",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv", "application/csv",
]);
const ALLOWED_EXTENSIONS = new Set([".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".webm", ".mov", ".xls", ".xlsx", ".csv"]);

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "لا تملك صلاحية رفع الشواهد." }, { status: 403 });

  let pathname = "";
  try {
    const input = await request.json();
    pathname = String(input.pathname ?? "");
    const fileName = String(input.fileName ?? "").replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 120) || "evidence";
    const mimeType = String(input.mimeType ?? "");
    const size = Number(input.size);
    const stage = String(input.stage ?? "").trim();
    const programId = String(input.programId ?? "").trim();
    const programTitle = String(input.programTitle ?? "").trim();
    const level = String(input.level ?? "").trim();
    const assessment = String(input.assessment ?? "قيد التنفيذ").trim();
    const notes = String(input.notes ?? "").slice(0, 4000);

    if (!pathname.startsWith("evidence/") || pathname.includes("..") || !stage || !programId || !programTitle || !level) {
      return NextResponse.json({ error: "بيانات الشاهد غير مكتملة." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(mimeType) || !ALLOWED_EXTENSIONS.has(path.extname(fileName).toLowerCase())) {
      return NextResponse.json({ error: "نوع الملف غير مدعوم." }, { status: 415 });
    }
    if (!Number.isSafeInteger(size) || size < 1 || size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: "حجم الملف يجب ألا يتجاوز 100 ميجابايت." }, { status: 413 });
    }

    const evidence = await prisma.evidence.create({
      data: { stage, programId, programTitle, level, assessment, notes, fileName, filePath: `blob:${pathname}`, mimeType, size },
    });
    return NextResponse.json({ evidence: { ...evidence, filePath: `/api/evidence/file/${encodeURIComponent(evidence.id)}` } }, { status: 201 });
  } catch (error) {
    console.error("Evidence registration failed:", error);
    if (pathname.startsWith("evidence/")) {
      try { await del(pathname); }
      catch (cleanupError) { console.error("Evidence Blob cleanup failed:", cleanupError); }
    }
    return NextResponse.json({ error: "تعذر حفظ بيانات الشاهد. تحقق من اتصال قاعدة البيانات ثم حاول مجددًا." }, { status: 500 });
  }
}
