const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");
const readline = require("readline");

const prisma = new PrismaClient();
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const ask = (q) => new Promise(resolve => rl.question(q, resolve));

(async () => {
  try {
    const username = (await ask("New username: ")).trim();
    const name = (await ask("Display name: ")).trim();
    const password = await ask("New password (input visible): ");

    if (!username || !name || password.length < 12) {
      throw new Error("Username and name are required; password must be at least 12 characters.");
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) throw new Error("Username already exists. Choose another.");

    await prisma.user.create({
      data: {
        username,
        name,
        passwordHash: await hash(password, 12),
        role: "admin",
        isActive: true
      }
    });

    console.log("New admin created successfully.");
  } catch (e) {
    console.error("Failed:", e.message);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
})();
