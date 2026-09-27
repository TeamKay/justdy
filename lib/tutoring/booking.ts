// lib/tutoring/booking.ts

import prisma from "@/lib/prisma";
import {
  CAPABILITIES,
  hasCapability,
} from "@/lib/auth/capabilities";
import {
  getVerifiedTutor,
  requireVerifiedTutor,
} from "@/lib/tutoring/authorization";

/**
 * Canonical tutoring availability/booking helpers.
 *
 * IMPORTANT:
 *
 * Justdy now uses:
 *
 *   TeachingProfile
 *        ↓
 *     Service
 *        ↓
 *   Availability
 *        ↓
 *     Booking
 *
 * The legacy TutoringSlot model is intentionally NOT used here.
 *
 * User identity is also independent from teaching status:
 *
 *   User
 *     ├── learner capability
 *     ├── teaching capability
 *     └── tutor capability
 *
 * A person can therefore be a learner and tutor using the same
 * User account.
 */

/* ============================================================
   TYPES
   ============================================================ */

export type TutoringAvailabilityStatus =
  | "Available"
  | "Booked"
  | "Blocked";

export type TutoringServiceInput = {
  teachingProfileId: string;
  title: string;
  description?: string | null;
  durationMinutes: number;
  price: number;
  currency?: string;
  subject?: string | null;
  gradeLevels?: string[];
  courses?: string[];
};

/* ============================================================
   TUTOR AUTHORIZATION
   ============================================================ */

/**
 * Check whether a user can create/manage tutoring availability.
 *
 * CAN_TEACH is intentionally separate from CAN_TUTOR.
 *
 * A teaching profile can be created/managed through CAN_TEACH,
 * while paid tutoring requires the stronger verified-tutor
 * authorization provided by getVerifiedTutor().
 */
export async function canManageTutoringAvailability(
  tutorId: string,
): Promise<boolean> {
  if (!tutorId) {
    return false;
  }

  return hasCapability(
    tutorId,
    CAPABILITIES.TEACH,
  );
}

/**
 * Require a user to be authorized to provide paid tutoring.
 *
 * This is the canonical tutor authorization for tutoring
 * operations that require an approved tutor.
 */
export async function requireTutoringTutor(tutorId: string) {
  return requireVerifiedTutor(tutorId);
}

/**
 * Get a verified tutor using the canonical authorization layer.
 *
 * This is kept as a compatibility helper because older parts
 * of the application may import getVerifiedTutor from this
 * module.
 *
 * The actual authorization is delegated to:
 *
 *   lib/tutoring/authorization.ts
 */
export async function getTutoringTutor(tutorId: string) {
  return getVerifiedTutor(tutorId);
}

/* ============================================================
   AVAILABILITY
   ============================================================ */

/**
 * Get available tutoring availability windows for a tutor.
 *
 * Uses the canonical Availability model.
 */
export async function getAvailableTutoringSlots({
  tutorId,
  from,
  to,
}: {
  tutorId: string;
  from: Date;
  to: Date;
}) {
  if (!tutorId) {
    throw new Error("Tutor ID is required.");
  }

  if (!(from instanceof Date) || Number.isNaN(from.getTime())) {
    throw new Error("A valid start date is required.");
  }

  if (!(to instanceof Date) || Number.isNaN(to.getTime())) {
    throw new Error("A valid end date is required.");
  }

  if (from >= to) {
    throw new Error("Availability range is invalid.");
  }

  return prisma.availability.findMany({
    where: {
      educatorId: tutorId,
      status: "Available",
      startTime: {
        gte: from,
        lt: to,
      },
    },
    orderBy: {
      startTime: "asc",
    },
  });
}

/**
 * Get one available tutoring availability window.
 *
 * This replaces the old TutoringSlot lookup.
 *
 * The tutor must also have an active, verified TeachingProfile.
 */
export async function getTutoringSlotForBooking(
  availabilityId: string,
) {
  if (!availabilityId) {
    return null;
  }

  const availability = await prisma.availability.findFirst({
    where: {
      id: availabilityId,
      status: "Available",
      educator: {
        status: "Active",
        teachingProfile: {
          verificationStatus: "Verified",
        },
      },
    },
    include: {
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
              specialty: true,
              experience: true,
              description: true,
              verificationStatus: true,
            },
          },
        },
      },
    },
  });

  if (!availability?.educator?.teachingProfile) {
    return null;
  }

  const canTutor = await hasCapability(
    availability.educator.id,
    CAPABILITIES.TUTOR,
  );

  if (!canTutor) {
    return null;
  }

  return availability;
}

/**
 * Create a new tutoring availability window.
 *
 * IMPORTANT:
 *
 * This function creates availability only.
 * It does not create a Booking.
 * It does not create a Stripe Checkout session.
 *
 * Booking/payment belongs to the canonical booking route.
 */
export async function createTutoringSlot({
  tutorId,
  startTime,
  endTime,
}: {
  tutorId: string;
  startTime: Date;
  endTime: Date;
}) {
  if (!tutorId) {
    throw new Error("Tutor ID is required.");
  }

  if (!(startTime instanceof Date) || Number.isNaN(startTime.getTime())) {
    throw new Error("A valid slot start time is required.");
  }

  if (!(endTime instanceof Date) || Number.isNaN(endTime.getTime())) {
    throw new Error("A valid slot end time is required.");
  }

  if (startTime >= endTime) {
    throw new Error(
      "Slot start time must be before the end time.",
    );
  }

  const tutor = await requireVerifiedTutor(tutorId);

  if (!tutor) {
    throw new Error(
      "Tutor is not verified or does not exist.",
    );
  }

  if (startTime <= new Date()) {
    throw new Error(
      "Tutoring slots must be scheduled in the future.",
    );
  }

  /*
   * Prevent overlapping availability windows for the same tutor.
   *
   * Overlap condition:
   *
   * existing.start < requested.end
   * AND
   * existing.end > requested.start
   *
   * Blocked availability is excluded because a blocked window
   * does not represent active tutor availability.
   */
  const overlappingAvailability =
    await prisma.availability.findFirst({
      where: {
        educatorId: tutorId,

        status: {
          not: "Blocked",
        },

        startTime: {
          lt: endTime,
        },

        endTime: {
          gt: startTime,
        },
      },

      select: {
        id: true,
      },
    });

  if (overlappingAvailability) {
    throw new Error(
      "This tutoring slot overlaps an existing availability window.",
    );
  }

  return prisma.availability.create({
    data: {
      educatorId: tutorId,
      startTime,
      endTime,
      status: "Available",
    },
  });
}

/**
 * Block a tutor's availability window.
 *
 * A booked availability window cannot be blocked.
 */
export async function blockTutoringSlot({
  tutorId,
  slotId,
}: {
  tutorId: string;
  slotId: string;
}) {
  if (!tutorId) {
    throw new Error("Tutor ID is required.");
  }

  if (!slotId) {
    throw new Error("Availability ID is required.");
  }

  /*
   * Verify that the tutor owns the availability window.
   */
  const availability =
    await prisma.availability.findFirst({
      where: {
        id: slotId,
        educatorId: tutorId,
      },

      select: {
        id: true,
        educatorId: true,
        status: true,
        startTime: true,
        endTime: true,
      },
    });

  if (!availability) {
    throw new Error(
      "Tutoring availability not found.",
    );
  }

  if (availability.status === "Booked") {
    throw new Error(
      "A booked tutoring slot cannot be blocked.",
    );
  }

  if (availability.status === "Blocked") {
    return availability;
  }

  return prisma.availability.update({
    where: {
      id: availability.id,
    },

    data: {
      status: "Blocked",
    },
  });
}

/**
 * Restore a previously blocked availability window.
 *
 * This is useful when a tutor reopens time that was previously
 * blocked.
 *
 * A booked window can never be restored this way.
 */
export async function unblockTutoringSlot({
  tutorId,
  slotId,
}: {
  tutorId: string;
  slotId: string;
}) {
  if (!tutorId) {
    throw new Error("Tutor ID is required.");
  }

  if (!slotId) {
    throw new Error("Availability ID is required.");
  }

  const availability =
    await prisma.availability.findFirst({
      where: {
        id: slotId,
        educatorId: tutorId,
      },

      select: {
        id: true,
        educatorId: true,
        status: true,
      },
    });

  if (!availability) {
    throw new Error(
      "Tutoring availability not found.",
    );
  }

  if (availability.status === "Booked") {
    throw new Error(
      "A booked tutoring slot cannot be reopened.",
    );
  }

  if (availability.status === "Available") {
    return availability;
  }

  return prisma.availability.update({
    where: {
      id: availability.id,
    },

    data: {
      status: "Available",
    },
  });
}

/* ============================================================
   SERVICE HELPERS
   ============================================================ */

/**
 * Get published tutoring services offered by a tutor.
 *
 * Services are tied to TeachingProfile rather than User.role.
 */
export async function getTutorTutoringServices(
  tutorId: string,
) {
  if (!tutorId) {
    return [];
  }

  const tutor = await getVerifiedTutor(tutorId);

  if (!tutor?.teachingProfile) {
    return [];
  }

  return prisma.service.findMany({
    where: {
      providerId: tutorId,
      teachingProfileId: tutor.teachingProfile.id,
      type: "TUTORING",
      status: "Published",
    },

    orderBy: {
      createdAt: "asc",
    },
  });
}

/**
 * Get a single published tutoring service belonging to a
 * verified tutor.
 */
export async function getTutoringServiceForBooking({
  tutorId,
  serviceId,
}: {
  tutorId: string;
  serviceId: string;
}) {
  if (!tutorId || !serviceId) {
    return null;
  }

  const tutor = await getVerifiedTutor(tutorId);

  if (!tutor?.teachingProfile) {
    return null;
  }

  return prisma.service.findFirst({
    where: {
      id: serviceId,
      providerId: tutorId,
      teachingProfileId: tutor.teachingProfile.id,
      type: "TUTORING",
      status: "Published",
    },
  });
}

/* ============================================================
   AVAILABILITY + SERVICE VALIDATION
   ============================================================ */

/**
 * Verify that an availability window can accommodate a
 * particular tutoring service.
 *
 * The canonical booking route performs this validation again
 * inside its transactional reservation workflow.
 *
 * This helper is intended for UI/server-side validation before
 * entering the payment flow.
 */
export async function validateTutoringAvailabilityForService({
  availabilityId,
  tutorId,
  serviceId,
}: {
  availabilityId: string;
  tutorId: string;
  serviceId: string;
}) {
  if (!availabilityId || !tutorId || !serviceId) {
    return false;
  }

  const [availability, service] = await Promise.all([
    prisma.availability.findFirst({
      where: {
        id: availabilityId,
        educatorId: tutorId,
        status: "Available",
      },

      select: {
        id: true,
        startTime: true,
        endTime: true,
      },
    }),

    prisma.service.findFirst({
      where: {
        id: serviceId,
        providerId: tutorId,
        type: "TUTORING",
        status: "Published",
      },

      select: {
        id: true,
        durationMinutes: true,
      },
    }),
  ]);

  if (!availability || !service) {
    return false;
  }

 if (
  service.durationMinutes === null ||
  service.durationMinutes <= 0
) {
  return false;
}

const availabilityDurationMinutes =
  (availability.endTime.getTime() -
    availability.startTime.getTime()) /
  (1000 * 60);

return (
  availabilityDurationMinutes >=
  service.durationMinutes
);
}

/* ============================================================
   BOOKING QUERIES
   ============================================================ */

/**
 * Get upcoming bookings for a tutor.
 *
 * This uses the canonical Booking model.
 */
export async function getUpcomingTutorBookings(
  tutorId: string,
) {
  if (!tutorId) {
    return [];
  }

  return prisma.booking.findMany({
    where: {
      educatorId: tutorId,

      startTime: {
        gte: new Date(),
      },

      status: {
        in: [
          "PendingPayment",
          "Scheduled",
        ],
      },
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

      service: {
        select: {
          id: true,
          title: true,
          durationMinutes: true,
          price: true,
          currency: true,
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
    },

    orderBy: {
      startTime: "asc",
    },
  });
}

/**
 * Get upcoming tutoring bookings for a learner.
 */
export async function getUpcomingLearnerBookings(
  learnerId: string,
) {
  if (!learnerId) {
    return [];
  }

  return prisma.booking.findMany({
    where: {
      studentId: learnerId,

      startTime: {
        gte: new Date(),
      },

      status: {
        in: [
          "PendingPayment",
          "Scheduled",
        ],
      },
    },

    include: {
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
              specialty: true,
            },
          },
        },
      },

      service: {
        select: {
          id: true,
          title: true,
          durationMinutes: true,
          price: true,
          currency: true,
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
    },

    orderBy: {
      startTime: "asc",
    },
  });
}