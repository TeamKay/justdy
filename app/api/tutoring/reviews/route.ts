import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidRating(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  );
}

/**
 * GET /api/tutoring/reviews?tutorId=...
 *
 * Public tutor reviews. Only published/completed tutoring history is exposed
 * through this endpoint; private learner data is never returned.
 */
export async function GET(request: Request) {
  try {
    const tutorId = cleanString(
      new URL(request.url).searchParams.get("tutorId"),
    );

    if (!tutorId) {
      return NextResponse.json(
        { error: "Tutor ID is required." },
        { status: 400 },
      );
    }

    const reviews = await prisma.tutorReview.findMany({
      where: {
        educatorId: tutorId,
        booking: {
          status: "Completed",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        learner: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    });

    const ratingCount = reviews.length;
    const ratingTotal = reviews.reduce(
      (total, review) => total + review.rating,
      0,
    );

    return NextResponse.json({
      reviews,
      summary: {
        averageRating:
          ratingCount > 0
            ? Number((ratingTotal / ratingCount).toFixed(1))
            : null,
        ratingCount,
      },
    });
  } catch (error) {
    console.error("GET /api/tutoring/reviews:", error);

    return NextResponse.json(
      { error: "Unable to load tutor reviews." },
      { status: 500 },
    );
  }
}

/**
 * POST /api/tutoring/reviews
 *
 * A learner may review only their own completed tutoring booking, and each
 * completed booking can receive at most one review.
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to leave a review." },
        { status: 401 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const payload = body as {
      bookingId?: unknown;
      rating?: unknown;
      comment?: unknown;
    };

    const bookingId = cleanString(payload.bookingId);
    const comment = cleanString(payload.comment);

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required." },
        { status: 400 },
      );
    }

    if (!isValidRating(payload.rating)) {
      return NextResponse.json(
        { error: "Rating must be an integer from 1 to 5." },
        { status: 400 },
      );
    }

    if (comment.length > 2000) {
      return NextResponse.json(
        { error: "Review comment must be 2000 characters or fewer." },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        studentId: true,
        educatorId: true,
        status: true,
        tutoringSession: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Tutoring booking not found." },
        { status: 404 },
      );
    }

    if (booking.studentId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only review your own tutoring sessions." },
        { status: 403 },
      );
    }

    if (booking.status !== "Completed") {
      return NextResponse.json(
        {
          error:
            "A review can only be submitted after the booking is completed.",
        },
        { status: 409 },
      );
    }

    if (booking.tutoringSession?.status !== "COMPLETED") {
      return NextResponse.json(
        {
          error:
            "The tutoring session must be completed before it can be reviewed.",
        },
        { status: 409 },
      );
    }

    const existing = await prisma.tutorReview.findUnique({
      where: { bookingId },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This tutoring session has already been reviewed." },
        { status: 409 },
      );
    }

    const review = await prisma.tutorReview.create({
      data: {
        bookingId,
        learnerId: session.user.id,
        educatorId: booking.educatorId,
        rating: payload.rating,
        comment: comment || null,
      },
      select: {
        id: true,
        bookingId: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tutoring/reviews:", error);

    return NextResponse.json(
      { error: "Unable to submit tutor review." },
      { status: 500 },
    );
  }
}
