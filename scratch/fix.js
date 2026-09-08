require("ts-node/register");
const { prisma } = require("./src/lib/db.ts");

async function main() {
  await prisma.funcionario.updateMany({
    data: { empresa: "ECO STONE" }
  });
  console.log("Updated");
}
main();
