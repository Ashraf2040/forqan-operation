const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  try {
    const users = await prisma.user.findMany({
      select: { username: true, role: true, isActive: true }
    });
    console.table(users);
  } catch (e) {
    console.error(e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
