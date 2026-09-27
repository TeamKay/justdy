import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
       imageUrl: true,
        canLearn: true,
        canTeach: true,
        canTutor: true,

        learningProfile: {
          select: {
            id: true,
          },
        },

        teachingProfile: {
          select: {
            id: true,
            headline: true,
            verificationStatus: true,
            hourlyRate: true,
            currency: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    const now = new Date();

    /*
     * ============================================================
     * LEARNER DATA
     * ============================================================
     */

    const upcomingLearningBookings = user.canLearn
      ? await prisma.booking.findMany({
          where: {
            studentId: userId,
            startTime: {
              gte: now,
            },
            status: "Scheduled",
          },

          orderBy: {
            startTime: "asc",
          },

          take: 5,

          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
            subject: true,
            description: true,

            educator: {
              select: {
                id: true,
                name: true,
               imageUrl: true,
              },
            },

            service: {
              select: {
                id: true,
                title: true,
                subject: true,
              },
            },
          },
        })
      : [];


    const learningBookingCount = user.canLearn
      ? await prisma.booking.count({
          where: {
            studentId: userId,
          },
        })
      : 0;


    /*
     * ============================================================
     * TEACHER DATA
     * ============================================================
     */

    const upcomingTeachingBookings = user.canTeach
      ? await prisma.booking.findMany({
          where: {
            educatorId: userId,
            startTime: {
              gte: now,
            },
            status: "Scheduled",
          },

          orderBy: {
            startTime: "asc",
          },

          take: 5,

          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
            subject: true,
            description: true,

            student: {
              select: {
                id: true,
                name: true,
               imageUrl: true,
              },
            },

            service: {
              select: {
                id: true,
                title: true,
                subject: true,
              },
            },
          },
        })
      : [];


    const teachingBookingCount = user.canTeach
      ? await prisma.booking.count({
          where: {
            educatorId: userId,
          },
        })
      : 0;


    /*
     * ============================================================
     * TEACHING SERVICES
     * ============================================================
     *
     * Services belong to the provider according to the current
     * tutoring schema.
     */

    const serviceCount = user.canTeach
      ? await prisma.service.count({
          where: {
            providerId: userId,
          },
        })
      : 0;


    /*
     * ============================================================
     * STUDENT COUNT
     * ============================================================
     *
     * Count unique learners from educator bookings.
     */

    const studentBookings = user.canTeach
      ? await prisma.booking.findMany({
          where: {
            educatorId: userId,
          },

          distinct: ["studentId"],

          select: {
            studentId: true,
          },
        })
      : [];


    /*
     * ============================================================
     * RESPONSE
     * ============================================================
     */

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
       image: user.imageUrl,

        canLearn: user.canLearn,
        canTeach: user.canTeach,
        canTutor: user.canTutor,

        learningProfileExists: Boolean(
          user.learningProfile,
        ),

        teachingProfile: user.teachingProfile,
      },

      learning: {
        bookingCount: learningBookingCount,

        upcomingBookings: upcomingLearningBookings,
      },

      teaching: {
        bookingCount: teachingBookingCount,

        studentCount: studentBookings.length,

        serviceCount,

        upcomingBookings: upcomingTeachingBookings,
      },
    });

  } catch (error) {
    console.error(
      "Dashboard API error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Unable to load dashboard data.",
      },
      {
        status: 500,
      },
    );
  }
}