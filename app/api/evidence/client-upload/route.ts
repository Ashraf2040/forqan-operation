import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = [
  "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/webm", "video/quicktime",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv", "application/csv",
];

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "لا تملك صلاحية رفع الشواهد." }, { status: 403 });

  try {
    const body = (await request.json()) as HandleUploadBody;
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("evidence/")) throw new Error("Invalid evidence path.");
        return { access: "private", allowedContentTypes: ALLOWED_TYPES, maximumSizeInBytes: 100 * 1024 * 1024 };
      },
    });
    return NextResponse.json(response);
  } catch (error) {
    console.error("Evidence client upload authorization failed:", error);
    return NextResponse.json({ error: "تعذر بدء رفع الشاهد. تحقق من إعداد مخزن الملفات وحاول مجددًا." }, { status: 400 });
  }
}
