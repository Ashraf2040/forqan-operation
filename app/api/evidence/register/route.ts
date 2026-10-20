import { del, get } from "@vercel/blob";
import { NextResponse } from "next/server";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteEvidence, hostingerStorageConfigured, putEvidence } from "@/lib/hostinger-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

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
const MAX_SIZE = 100 * 1024 * 1024;

function safeSegment(value: string) {
  return value.normalize("NFKC").replace(/[^\p{L}\p{N}_-]/gu, "_").slice(0, 80) || "unknown";
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return jsonError("يجب تسجيل الدخول أولًا.", 401);
  if (session.user.role !== "admin") return jsonError("لا تملك صلاحية رفع الشواهد.", 403);

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
      return jsonError("بيانات الشاهد غير مكتملة.", 400);
    }
    if (!ALLOWED_TYPES.has(mimeType) || !ALLOWED_EXTENSIONS.has(path.extname(fileName).toLowerCase())) {
      return jsonError("نوع الملف غير مدعوم.", 415);
    }
    if (!Number.isSafeInteger(size) || size < 1 || size > MAX_SIZE) {
      return jsonError("حجم الملف يجب ألا يتجاوز 100 ميجابايت.", 413);
    }

    if (!hostingerStorageConfigured()) {
      const evidence = await prisma.evidence.create({
        data: { stage, programId, programTitle, level, assessment, notes, fileName, filePath: `blob:${pathname}`, mimeType, size },
      });
      return NextResponse.json({ evidence: { ...evidence, filePath: `/api/evidence/file/${encodeURIComponent(evidence.id)}` } }, { status: 201 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const send = (payload: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
        };

        void (async () => {
          let hostingerPath = "";
          try {
            const stagedBlob = await get(pathname, { access: "private" });
            if (!stagedBlob || stagedBlob.statusCode !== 200) {
              send({ type: "error", error: "تعذر العثور على الملف المرفوع مؤقتًا." });
              return;
            }

            const relativePath = [
              safeSegment(stage),
              safeSegment(programId),
              safeSegment(level),
              `${randomUUID()}${path.extname(fileName).toLowerCase()}`,
            ].join("/");
            hostingerPath = relativePath;

            send({ type: "phase", phase: "connecting" });
            await putEvidence(
              relativePath,
              Readable.fromWeb(stagedBlob.stream as unknown as NodeReadableStream<Uint8Array>),
              size,
              (percentage) => send({ type: "progress", percentage: Math.min(99, percentage) }),
              () => send({ type: "phase", phase: "transferring" })
            );

            send({ type: "phase", phase: "saving" });
            const evidence = await prisma.evidence.create({
              data: { stage, programId, programTitle, level, assessment, notes, fileName, filePath: `sftp:${relativePath}`, mimeType, size },
            });

            try { await del(pathname); }
            catch (cleanupError) { console.error("Temporary Blob cleanup failed:", cleanupError); }

            send({
              type: "complete",
              evidence: { ...evidence, filePath: `/api/evidence/file/${encodeURIComponent(evidence.id)}` },
            });
          } catch (error) {
            console.error("Evidence registration failed:", error);
            if (hostingerPath) {
              try { await deleteEvidence(hostingerPath); }
              catch (cleanupError) { console.error("Hostinger evidence cleanup failed:", cleanupError); }
            }
            try { await del(pathname); }
            catch (cleanupError) { console.error("Evidence Blob cleanup failed:", cleanupError); }
            send({ type: "error", error: "تعذر نقل الشاهد إلى خادم التخزين. تحقق من إعدادات SFTP وقاعدة البيانات ثم حاول مجددًا." });
          } finally {
            controller.close();
          }
        })();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Evidence registration request failed:", error);
    return jsonError("تعذر حفظ بيانات الشاهد. تحقق من اتصال قاعدة البيانات ثم حاول مجددًا.", 500);
  }
}
