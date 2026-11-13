
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";


export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const onlineSince = new Date(Date.now() - 5 * 60 * 1000);

    const [members, online, tutors] = await Promise.all([
      // Active users who have an active social profile.
      prisma.user.count({
        where: {
          status: "Active",
          socialProfile: {
            is: {
              status: "ACTIVE",
            },
          },
        },
      }),

      // Community members active within the last five minutes.
      prisma.user.count({
        where: {
          status: "Active",
          lastSeenAt: {
            gte: onlineSince,
          },
          socialProfile: {
            is: {
              status: "ACTIVE",
            },
          },
        },
      }),

      // Active accounts with the TUTOR platform role.
      prisma.user.count({
        where: {
          status: "Active",
          role: "TUTOR",
        },
      }),
    ]);

    return NextResponse.json(
      { members, online, tutors },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Community statistics error:", error);

    return NextResponse.json(
      { error: "Unable to load community statistics." },
      { status: 500 }
    );
  }
}
