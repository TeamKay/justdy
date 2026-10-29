import prisma from "@/lib/prisma";

async function main() {
  console.log("Cleaning up legacy 24/7 availability...");

  const now = new Date();

  // Remove future concrete 24/7 OCCURRENCE rows.
  // These were created by the old recurring/materialization implementation.
  const deletedOccurrences = await prisma.availability.deleteMany({
    where: {
      type: "OCCURRENCE",
      isAlwaysAvailable: true,
      status: "Available",
      startTime: {
        gte: now,
      },
    },
  });

  // Remove old 24/7 RECURRING rows.
  // 24/7 should no longer use RECURRING at all.
  const deletedRecurring = await prisma.availability.deleteMany({
    where: {
      type: "RECURRING",
      isAlwaysAvailable: true,
    },
  });

  // Remove future concrete 24/7 ONE_OFF rows so we can recreate
  // the correct seven-day representation cleanly.
  const deletedOneOff = await prisma.availability.deleteMany({
    where: {
      type: "ONE_OFF",
      isAlwaysAvailable: true,
      status: "Available",
      startTime: {
        gte: now,
      },
    },
  });

  console.log(`Deleted old 24/7 occurrence rows: ${deletedOccurrences.count}`);

  console.log(`Deleted old 24/7 recurring rows: ${deletedRecurring.count}`);

  console.log(`Deleted old 24/7 one-off rows: ${deletedOneOff.count}`);

  console.log("Legacy 24/7 cleanup complete.");
}

main()
  .catch((error) => {
    console.error("24/7 cleanup failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
