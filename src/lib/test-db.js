import { prisma } from "./prisma";

async function testDatabase() {
  try {
    const employee = await prisma.employee.create({
      data: {
        id: "TEST-001",
        name: "Database Test Employee",
      },
    });

    console.log("INSERT SUCCESS:", employee);

    const found = await prisma.employee.findUnique({
      where: {
        id: "TEST-001",
      },
    });

    console.log("READ SUCCESS:", found);

    await prisma.employee.delete({
      where: {
        id: "TEST-001",
      },
    });

    console.log("DELETE SUCCESS");
  } catch (error) {
    console.error("DATABASE TEST FAILED:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();