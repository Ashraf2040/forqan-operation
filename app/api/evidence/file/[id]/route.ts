import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getEvidence } from "@/lib/hostinger-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STORAGE_DIR = path.resolve(process.env.EVIDENCE_STORAGE_DIR || path.join(process.cwd(), "uploads", "evidence"));

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const evidence = await prisma.evidence.findUnique({ where: { id } });
    if (!evidence) {
      return NextResponse.json({ error: "الشاهد غير موجود." }, { status: 404 });
    }

    if (evidence.filePath.startsWith("blob:")) {
      const blobPath = evidence.filePath.slice("blob:".length);
      const result = await get(blobPath, { access: "private" });
      if (!result || result.statusCode !== 200) {
        return NextResponse.json({ error: "ملف الشاهد غير موجود في التخزين." }, { status: 404 });
      }
      return new NextResponse(result.stream, {
        headers: {
          "Content-Type": evidence.mimeType || result.blob.contentType || "application/octet-stream",
          "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(evidence.fileName)}`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    if (evidence.filePath.startsWith("sftp:")) {
      const file = await getEvidence(evidence.filePath.slice("sftp:".length));
      return new NextResponse(new Uint8Array(file), {
        headers: {
          "Content-Type": evidence.mimeType || "application/octet-stream",
          "Content-Length": String(file.byteLength),
          "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(evidence.fileName)}`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const filePath = path.resolve(STORAGE_DIR, evidence.filePath);
    if (!filePath.startsWith(`${STORAGE_DIR}${path.sep}`)) {
      return NextResponse.json({ error: "مسار الملف غير صالح." }, { status: 400 });
    }

    const file = await readFile(filePath);
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": evidence.mimeType || "application/octet-stream",
        "Content-Length": String(file.byteLength),
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(evidence.fileName)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ error: "ملف الشاهد غير موجود في التخزين المحلي." }, { status: 404 });
    }
    console.error("Evidence file retrieval failed:", error);
    return NextResponse.json({ error: "تعذر فتح ملف الشاهد." }, { status: 500 });
  }
}
