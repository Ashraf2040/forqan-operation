import { NextResponse } from "next/server";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE = 20 * 1024 * 1024;
const BUCKET = "program-evidence";
const SIGNED_URL_SECONDS = 60 * 10;

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SECRET_KEY environment variables."
    );
  }

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
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

// Load evidence and generate temporary download links.
export async function GET(request: Request) {
  try {
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

    const supabase = getSupabase();

    const results = await Promise.all(
      evidence.map(async (item) => {
        const { data, error } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(item.filePath, SIGNED_URL_SECONDS);

        if (error) {
          console.error(
            "Could not create evidence download URL:",
            error.message
          );

          return { ...item, filePath: null };
        }

        return {
          ...item,
          filePath: data.signedUrl,
        };
      })
    );

    return NextResponse.json(
      { evidence: results },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("Evidence listing failed:", error);

    return jsonError("تعذر تحميل الشواهد. حاول مرة أخرى.", 500);
  }
}

// Upload to Supabase Storage, save metadata in PostgreSQL,
// and return a temporary URL to the frontend.
export async function POST(request: Request) {
  let uploadedObjectKey: string | null = null;

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

    if (!ALLOWED_TYPES.has(file.type)) {
      return jsonError(
        "نوع الملف غير مدعوم. ارفع PDF أو Word أو صورة JPG أو PNG أو WebP.",
        415
      );
    }

    if (file.size === 0 || file.size > MAX_SIZE) {
      return jsonError("حجم الملف يجب ألا يتجاوز 20 ميجابايت.", 413);
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

    const supabase = getSupabase();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(objectKey, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload failed:", uploadError.message);

      return jsonError("تعذر رفع الملف إلى التخزين السحابي.", 502);
    }

    uploadedObjectKey = objectKey;

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
        filePath: objectKey,

        mimeType: file.type,
        size: file.size,
      },
    });

    // IMPORTANT:
    // The frontend needs a signed URL immediately after uploading.
    const { data: signedData, error: signedError } =
      await supabase.storage
        .from(BUCKET)
        .createSignedUrl(objectKey, SIGNED_URL_SECONDS);

    if (signedError) {
      console.error(
        "Could not create signed URL after upload:",
        signedError.message
      );

      // The file and database record have already been saved.
      // Do not delete them just because link generation failed.
      return NextResponse.json(
        {
          evidence: { ...evidence, filePath: null },
          warning: "تم حفظ الشاهد، لكن تعذر إنشاء رابط فتح الملف.",
        },
        { status: 201 }
      );
    }

    // Return the signed URL to the frontend, but never save it in the DB.
    return NextResponse.json(
      {
        evidence: {
          ...evidence,
          filePath: signedData.signedUrl,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Evidence upload failed:", error);

    // Clean up the uploaded file if saving the database record failed.
    if (uploadedObjectKey) {
      try {
        const supabase = getSupabase();

        const { error: cleanupError } = await supabase.storage
          .from(BUCKET)
          .remove([uploadedObjectKey]);

        if (cleanupError) {
          console.error(
            "Supabase cleanup failed:",
            cleanupError.message
          );
        }
      } catch (cleanupError) {
        console.error("Supabase cleanup failed:", cleanupError);
      }
    }

    return jsonError(
      "تعذر حفظ الشاهد. تحقق من إعدادات Supabase وقاعدة البيانات ثم حاول مجددًا.",
      500
    );
  }
}
