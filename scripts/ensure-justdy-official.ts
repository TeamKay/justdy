
import "dotenv/config";
import prisma from "@/lib/prisma";

const OFFICIAL_USERNAME = "justdy_official";
const OFFICIAL_NAME = "Justdy Official";

async function main() {
  const email = process.env.JUSTDY_OFFICIAL_EMAIL?.trim().toLowerCase();

  if (!email) {
    throw new Error("Set JUSTDY_OFFICIAL_EMAIL before running this script.");
  }

  // Check whether this email already exists.
  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { socialProfile: true },
  });

  if (existingUser) {
    // Allow safe reruns only if this is already the official account.
    if (existingUser.socialProfile?.username === OFFICIAL_USERNAME) {
      console.log("===== JUSTDY OFFICIAL ALREADY EXISTS =====");
      console.log("User ID:", existingUser.id);
      console.log("Name:", existingUser.name);
      console.log("Username:", existingUser.socialProfile.username);
      console.log("Public profile:", !existingUser.socialProfile.isPrivate);
      return;
    }

    throw new Error(
      "This email already belongs to another account. " +
      "No changes were made. Choose a dedicated unused official email."
    );
  }

  // Never take over an existing username.
  const conflictingProfile = await prisma.socialProfile.findUnique({
    where: { username: OFFICIAL_USERNAME },
  });

  if (conflictingProfile) {
    throw new Error(
      "The username justdy_official is already owned by another account."
    );
  }

  // Create the user and social profile atomically.
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: OFFICIAL_NAME,
        email,
        role: "LEARNER",
        status: "Active",
        emailVerified: false,
      },
    });

    const profile = await tx.socialProfile.create({
      data: {
        userId: user.id,
        username: OFFICIAL_USERNAME,
        displayName: OFFICIAL_NAME,
        isPrivate: false,
        ageBand: "UNKNOWN",
        ageAssuranceStatus: "UNVERIFIED",
      },
    });

    return { user, profile };
  });

  console.log("===== JUSTDY OFFICIAL CREATED =====");
  console.log("User ID:", result.user.id);
  console.log("Name:", result.user.name);
  console.log("Username:", result.profile.username);
  console.log("Public profile:", !result.profile.isPrivate);
}

main()
  .catch((error) => {
    console.error("Official account initialization failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
