import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const username = process.env.INITIAL_ADMIN_USERNAME?.trim();
const password = process.env.INITIAL_ADMIN_PASSWORD;
const name = process.env.INITIAL_ADMIN_NAME?.trim() || "مشرف المنصة";

if (!username || !password) {
  console.error("أضف INITIAL_ADMIN_USERNAME و INITIAL_ADMIN_PASSWORD إلى ملف .env أولًا.");
  process.exit(1);
}
if (password.length < 12) {
  console.error("يجب أن تتكون كلمة مرور المشرف من 12 حرفًا على الأقل.");
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
    await prisma.user.create({ data: { username, name, passwordHash, role: "admin" } });
    console.log(`تم إنشاء مستخدم المشرف: ${username}`);
  }
} finally {
  await prisma.$disconnect();
}
