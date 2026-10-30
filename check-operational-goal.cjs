const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const id = "cmvtxugh00000hr3837u1vpdp";

  const goal = await prisma.operationalGoal.findUnique({
    where: { id },
  });

  console.log("Operational goal:", goal);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
