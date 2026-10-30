
const fs = require("node:fs");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");
const { parse } = require("dotenv");

async function main() {
  const envPath = path.resolve(process.cwd(), ".env.contabo");

  if (!fs.existsSync(envPath)) {
    throw new Error("File .env.contabo was not found.");
  }

  const env = parse(fs.readFileSync(envPath));

  if (!env.DATABASE_URL || env.DATABASE_URL.includes("YOUR_PASSWORD")) {
    throw new Error("Check DATABASE_URL in .env.contabo.");
  }

  process.env.DATABASE_URL = env.DATABASE_URL;

  const prisma = new PrismaClient();

  try {
   const username = env.INITIAL_ADMIN_USERNAME?.trim();
   const name = env.INITIAL_ADMIN_NAME?.trim();
   const password = env.INITIAL_ADMIN_PASSWORD;

  if (!username || !name || !password) {
  console.error({
    usernamePresent: Boolean(username),
    namePresent: Boolean(name),
    passwordPresent: Boolean(password),
  });
  throw new Error("One or more admin settings are missing.");
}

    if (!/^[A-Za-z0-9._-]{3,40}$/.test(username)) {
      throw new Error("Username must be 3-40 characters: letters, numbers, dot, underscore or hyphen.");
    }

    if (password.length < 12) {
      throw new Error("Admin password must be at least 12 characters.");
    }

    const existing = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (existing) {
      throw new Error("This username already exists. No changes were made.");
    }

    const passwordHash = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        name,
        passwordHash,
        role: "admin",
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    console.log("Admin created successfully in the configured database:");
    console.log(user);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Admin creation failed:", error.message);
  process.exitCode = 1;
});
