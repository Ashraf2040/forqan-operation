import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const username = process.env.VIEWER_USERNAME?.trim();
const password = process.env.VIEWER_PASSWORD;
const name = process.env.VIEWER_NAME?.trim() || "مستخدم المنصة";

if (!username || !password) {
  console.error("أضف VIEWER_USERNAME و VIEWER_PASSWORD إلى ملف .env أولًا.");
  process.exit(1);
}
if (password.length < 12) {
  console.error("يجب أن تتكون كلمة المرور من 12 حرفًا على الأقل.");
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.error("اسم المستخدم موجود بالفعل؛ لم يتم تغيير بياناته.");
    process.exitCode = 1;
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({ data: { username, name, passwordHash, role: "viewer" } });
    console.log(`تم إنشاء مستخدم للعرض فقط: ${username}`);
  }
} finally {
  await prisma.$disconnect();
}
