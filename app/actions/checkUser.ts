import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export const checkUser = async () => {
  const user = await auth.api.getSession({
    headers: await headers(),
  });

  if (!user) {
    return null;
  }

  try {
    const loggedInUser = await prisma.user.findUnique({
      where: {
        id: user.user.id,
      },
      include: {
        transactions: {
          where: {
            type: "Credit_Purchase",
            // Only get transactions from current month
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (loggedInUser) {
      return loggedInUser;
    }
  } catch (error) {
    console.log("Failed to check user" + error);
  }
};
