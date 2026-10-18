import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
