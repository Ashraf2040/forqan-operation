import { NextResponse } from "next/server";
import { del, put } from "@vercel/blob";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE = 100 * 1024 * 1024;
const STORAGE_DIR = path.resolve(process.env.EVIDENCE_STORAGE_DIR || path.join(process.cwd(), "uploads", "evidence"));

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/csv",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".webp", ".gif",
  ".mp4", ".webm", ".mov", ".xls", ".xlsx", ".csv",
]);

function storagePath(objectKey: string) {
  const filePath = path.resolve(STORAGE_DIR, objectKey);
  if (!filePath.startsWith(`${STORAGE_DIR}${path.sep}`)) {
    throw new Error("Invalid evidence storage path.");
  }
  return filePath;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function safeSegment(value: string) {
  return (
    value
      .normalize("NFKC")
      .replace(/[^\p{L}\p{N}_-]/gu, "_")
      .slice(0, 100) || "unknown"
  );
}

// Load evidence and return authenticated file endpoint URLs.
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return jsonError("يجب تسجيل الدخول أولًا.", 401);

    const params = new URL(request.url).searchParams;
    const stage = params.get("stage");
    const programId = params.get("programId");
    const level = params.get("level");

    if (!stage || !programId || !level) {
      return jsonError("بيانات البحث غير مكتملة.", 400);
    }

    const evidence = await prisma.evidence.findMany({
      where: { stage, programId, level },
      orderBy: { createdAt: "desc" },
    });

    const results = evidence.map((item) => ({
      ...item,
      filePath: `/api/evidence/file/${encodeURIComponent(item.id)}`,
    }));

    return NextResponse.json(
      { evidence: results },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("Evidence listing failed:", error);

    return jsonError("تعذر تحميل الشواهد. حاول مرة أخرى.", 500);
  }
}

// Save evidence in durable Blob storage on Vercel, with local storage for development.
export async function POST(request: Request) {
  let uploadedObjectPath: string | null = null;
  let uploadedBlobPath: string | null = null;

  try {
    const session = await auth();
    if (!session?.user) return jsonError("يجب تسجيل الدخول أولًا.", 401);
    if (session.user.role !== "admin") return jsonError("لا تملك صلاحية رفع الشواهد.", 403);

    const form = await request.formData();
    const file = form.get("file");

    const stage = String(form.get("stage") ?? "").trim();
    const programId = String(form.get("programId") ?? "").trim();
    const programTitle = String(form.get("programTitle") ?? "").trim();
    const level = String(form.get("level") ?? "").trim();

    const assessment = String(
      form.get("assessment") ?? "قيد التنفيذ"
    ).trim();

    const notes = String(form.get("notes") ?? "").slice(0, 4000);

    if (
      !(file instanceof File) ||
      !stage ||
      !programId ||
      !programTitle ||
      !level
    ) {
      return jsonError("أكمل بيانات الشاهد وحاول مرة أخرى.", 400);
    }

    const extension = path.extname(file.name).toLowerCase();
    if (!ALLOWED_TYPES.has(file.type) || !ALLOWED_EXTENSIONS.has(extension)) {
      return jsonError(
        "نوع الملف غير مدعوم. ارفع مستندًا أو صورة أو فيديو MP4/MOV/WebM أو ملف Excel/CSV.",
        415
      );
    }

    if (file.size === 0 || file.size > MAX_SIZE) {
      return jsonError("حجم الملف يجب ألا يتجاوز 100 ميجابايت.", 413);
    }

    const original =
      path
        .basename(file.name)
        .replace(/[^\p{L}\p{N}._ -]/gu, "_")
        .slice(0, 120) || "evidence";

    const objectKey = [
      safeSegment(stage),
      safeSegment(programId),
      safeSegment(level),
      `${randomUUID()}-${original}`,
    ].join("/");

    const useBlobStorage = process.env.VERCEL === "1" || Boolean(process.env.BLOB_READ_WRITE_TOKEN);
    if (useBlobStorage) {
      const blob = await put(objectKey, file, { access: "private", addRandomSuffix: false });
      uploadedBlobPath = blob.pathname;
    } else {
      const buffer = Buffer.from(await file.arrayBuffer());
      uploadedObjectPath = storagePath(objectKey);
      await mkdir(path.dirname(uploadedObjectPath), { recursive: true });
      await writeFile(uploadedObjectPath, buffer, { flag: "wx" });
    }

    const evidence = await prisma.evidence.create({
      data: {
        stage,
        programId,
        programTitle,
        level,
        assessment,
        notes,
        fileName: original,

        // Save the storage path in PostgreSQL, not the signed URL.
        filePath: uploadedBlobPath ? `blob:${uploadedBlobPath}` : objectKey,

        mimeType: file.type,
        size: file.size,
      },
    });

    return NextResponse.json(
      {
        evidence: {
          ...evidence,
          filePath: `/api/evidence/file/${encodeURIComponent(evidence.id)}`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Evidence upload failed:", error);

    // Clean up the uploaded file if saving the database record failed.
    if (uploadedObjectPath) {
      try {
        await unlink(uploadedObjectPath);
      } catch (cleanupError) {
        console.error("Evidence file cleanup failed:", cleanupError);
      }
    }
    if (uploadedBlobPath) {
      try {
        await del(uploadedBlobPath, { access: "private" });
      } catch (cleanupError) {
        console.error("Evidence Blob cleanup failed:", cleanupError);
      }
    }

    return jsonError(
      "تعذر حفظ الشاهد. تحقق من إعدادات التخزين واتصال قاعدة البيانات ثم حاول مجددًا.",
      500
    );
  }
}

// Delete both the database record and its private storage object.
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return jsonError("يجب تسجيل الدخول أولًا.", 401);
    if (session.user.role !== "admin") return jsonError("لا تملك صلاحية حذف الشواهد.", 403);

    const id = new URL(request.url).searchParams.get("id");
    if (!id) return jsonError("معرّف الشاهد غير موجود.", 400);

    const evidence = await prisma.evidence.findUnique({ where: { id } });
    if (!evidence) return jsonError("الشاهد غير موجود أو سبق حذفه.", 404);

    if (evidence.filePath.startsWith("blob:")) {
      await del(evidence.filePath.slice("blob:".length), { access: "private" });
    } else {
      try {
        await unlink(storagePath(evidence.filePath));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }

    await prisma.evidence.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Evidence deletion failed:", error);
    return jsonError("تعذر حذف الشاهد. حاول مرة أخرى.", 500);
  }
}
