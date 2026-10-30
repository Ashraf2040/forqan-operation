const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

(async () => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: "admin2" },
      select: { passwordHash: true }
    });

    if (!user) {
      console.log("USER_NOT_FOUND");
      return;
    }

    const password = await new Promise(resolve => {
      const rl = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout
      });
      rl.question("Enter the admin2 password you are trying: ", answer => {
        rl.close();
        resolve(answer);
      });
    });

    console.log(
      "PASSWORD_MATCHES_HASH:",
      await bcrypt.compare(password, user.passwordHash)
    );
  } catch (e) {
    console.error(e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
