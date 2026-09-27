import { NextResponse } from "next/server";
import { headers } from "next/headers";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // ============================================================
    // 1. AUTHENTICATION
    // ============================================================

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        {
          error: "You must be signed in to view your tutoring sessions.",
        },
        { status: 401 },
      );
    }

    // ============================================================
    // 2. LOAD CANONICAL BOOKINGS
    //
    // A user can participate as a learner, educator, or as a
    // parent/guardian managing a child. Parent/guardian access is
    // limited to CHILD members of families they manage.
    // ============================================================

    const managedChildIds = new Set<string>();
    const familyMemberships = await prisma.familyMember.findMany({
      where: {
        userId,
        role: { in: ["PARENT", "GUARDIAN"] },
      },
      select: { familyId: true },
    });

    if (familyMemberships.length) {
      const children = await prisma.familyMember.findMany({
        where: {
          familyId: { in: familyMemberships.map((item) => item.familyId) },
          role: "CHILD",
        },
        select: { userId: true },
      });

      for (const child of children) managedChildIds.add(child.userId);
    }

    const bookings = await prisma.booking.findMany({
      where: {
        OR: [
          { studentId: userId },
          { educatorId: userId },
          ...(managedChildIds.size
            ? [{ studentId: { in: [...managedChildIds] } }]
            : []),
        ],
      },

      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
          },
        },

        educator: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,

            teachingProfile: {
              select: {
                id: true,
                headline: true,
                description: true,
                verificationStatus: true,
                hourlyRate: true,
                currency: true,
                subjects: true,
                gradeLevels: true,
              },
            },
          },
        },

        service: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            durationMinutes: true,
            price: true,
            currency: true,
            status: true,
            subject: true,
            gradeLevels: true,
          },
        },

        availability: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
          },
        },

        tutoringSession: {
          select: {
            id: true,
            bookingId: true,

            learnerId: true,
            educatorId: true,
            serviceId: true,

            scheduledStart: true,
            scheduledEnd: true,

            startedAt: true,
            endedAt: true,

            status: true,

            learnerAttendance: true,
            educatorAttendance: true,

            topic: true,
            topicsCovered: true,

            strengths: true,
            needsPractice: true,
            nextStep: true,

            tutorNotes: true,
            learnerOutcome: true,

            createdAt: true,
            updatedAt: true,
          },
        },
      },

      orderBy: {
        startTime: "desc",
      },
    });

    // ============================================================
    // 3. CURRENT TIME
    // ============================================================

    const now = new Date();

    // ============================================================
    // 4. SERIALIZE BOOKINGS
    //
    // Keep private tutor notes out of the learner's response.
    // A tutor can see their own notes.
    // ============================================================

    const serializedBookings = bookings.map((booking) => {
      const isEducator = booking.educatorId === userId;
      const isStudent = booking.studentId === userId;
      const isParentManager = !isEducator && !isStudent && managedChildIds.has(booking.studentId);

      const tutoringSession = booking.tutoringSession
        ? {
            id: booking.tutoringSession.id,
            bookingId: booking.tutoringSession.bookingId,

            learnerId: booking.tutoringSession.learnerId,
            educatorId: booking.tutoringSession.educatorId,
            serviceId: booking.tutoringSession.serviceId,

            scheduledStart: booking.tutoringSession.scheduledStart,
            scheduledEnd: booking.tutoringSession.scheduledEnd,

            startedAt: booking.tutoringSession.startedAt,
            endedAt: booking.tutoringSession.endedAt,

            status: booking.tutoringSession.status,

            learnerAttendance:
              booking.tutoringSession.learnerAttendance,

            educatorAttendance:
              booking.tutoringSession.educatorAttendance,

            topic: booking.tutoringSession.topic,
            topicsCovered: booking.tutoringSession.topicsCovered,

            strengths: booking.tutoringSession.strengths,
            needsPractice: booking.tutoringSession.needsPractice,
            nextStep: booking.tutoringSession.nextStep,

            // Tutor notes are private to the educator.
            tutorNotes: isEducator
              ? booking.tutoringSession.tutorNotes
              : null,

            learnerOutcome: booking.tutoringSession.learnerOutcome,

            createdAt: booking.tutoringSession.createdAt,
            updatedAt: booking.tutoringSession.updatedAt,
          }
        : null;

      return {
        id: booking.id,

        studentId: booking.studentId,
        educatorId: booking.educatorId,
        serviceId: booking.serviceId,

        role:
          isEducator && isStudent
            ? "both"
            : isEducator
              ? "educator"
              : isParentManager
                ? "parent"
                : "learner",
        managedChild: isParentManager
          ? { id: booking.student.id, name: booking.student.name }
          : null,

        startTime: booking.startTime,
        endTime: booking.endTime,

        subject: booking.subject,
        gradeLevel: booking.gradeLevel,
        description: booking.description,

        status: booking.status,
        payoutStatus: booking.payoutStatus,

        service: booking.service,

        availability: booking.availability,

        student: booking.student,

        educator: booking.educator,

        tutoringSession,

        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      };
    });

    // ============================================================
    // 5. CATEGORIZE BOOKINGS
    // ============================================================

    const processing = serializedBookings.filter(
      (booking) => booking.status === "PendingPayment",
    );

    const upcoming = serializedBookings.filter((booking) => {
      if (
        booking.status !== "Scheduled" &&
        booking.status !== "PendingPayment"
      ) {
        return false;
      }

      return booking.endTime >= now;
    });

    const past = serializedBookings.filter((booking) => {
      if (
        booking.status === "Completed" ||
        booking.status === "Cancelled" ||
        booking.status === "NoShow"
      ) {
        return true;
      }

      return (
        booking.status === "Scheduled" &&
        booking.endTime < now
      );
    });

    // ============================================================
    // 6. SESSION COUNTS
    // ============================================================

    const counts = {
      total: serializedBookings.length,

      processing: processing.length,

      upcoming: upcoming.length,

      past: past.length,

      completed: serializedBookings.filter(
        (booking) => booking.status === "Completed",
      ).length,

      cancelled: serializedBookings.filter(
        (booking) => booking.status === "Cancelled",
      ).length,

      noShow: serializedBookings.filter(
        (booking) => booking.status === "NoShow",
      ).length,
    };

    // ============================================================
    // 7. RESPONSE
    //
    // `bookings` is intentionally included as the primary
    // compatibility collection because the existing
    // /tutoring/sessions page currently expects data.bookings.
    //
    // The categorized collections give the new UI cleaner
    // access to the different session states.
    // ============================================================

    return NextResponse.json({
      success: true,

      bookings: serializedBookings,

      processing,
      upcoming,
      past,

      counts,
    });
  } catch (error) {
    console.error(
      "[GET /api/tutoring/sessions] Failed to load tutoring sessions:",
      error,
    );

    return NextResponse.json(
      {
        error: "Unable to load tutoring sessions.",
      },
      { status: 500 },
    );
  }
}