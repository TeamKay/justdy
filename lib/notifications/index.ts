import prisma from "@/lib/prisma";

export type NotificationInput = {
  eventKey: string;
  type: string;
  title: string;
  message: string;
  href?: string | null;
  hrefByUserId?: Record<string, string>;
  /** Kept for compatibility; notification email is disabled. */
  emailSubject?: string;
};

export async function notifyUsers(userIds: string[], item: NotificationInput) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  const recipients = uniqueIds.length
    ? await prisma.user.findMany({
        where: { id: { in: uniqueIds }, status: "Active" },
        select: { id: true },
      })
    : [];

  const outcomes = await Promise.allSettled(
    recipients.map(async (recipient) => {
      try {
        await prisma.notification.create({
          data: {
            userId: recipient.id,
            eventKey: `${item.eventKey}:${recipient.id}`,
            type: item.type,
            title: item.title,
            message: item.message,
            href: item.hrefByUserId?.[recipient.id] || item.href || null,
            emailStatus: "SKIPPED_DISABLED",
          },
        });
      } catch (error) {
        if ((error as { code?: string })?.code === "P2002") return;
        throw error;
      }
    }),
  );

  const failures = outcomes.filter((outcome) => outcome.status === "rejected");
  for (const outcome of failures) {
    if (outcome.status === "rejected") {
      console.error("Justdy notification delivery failed", outcome.reason);
    }
  }
  if (failures.length) {
    throw new Error(`${failures.length} notification record(s) could not be created or updated`);
  }
}

export async function getAdminIds() {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", status: "Active" },
    select: { id: true },
  });
  return admins.map((admin) => admin.id);
}



export async function notifyBookingScheduled(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      studentId: true,
      educatorId: true,
      subject: true,
      startTime: true,
      student: { select: { name: true } },
      educator: { select: { name: true } },
      service: { select: { title: true } },
    },
  });
  if (!booking) return;

  const admins = await getAdminIds();
  const when =
    booking.startTime.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }) + " UTC";
  const lesson = booking.service?.title || booking.subject || "a tutoring session";

  await notifyUsers([...admins, booking.educatorId, booking.studentId], {
    eventKey: `booking-scheduled:${booking.id}`,
    type: "BOOKING_SCHEDULED",
    title: "Tutoring booking confirmed",
    message: `${booking.student.name || "A learner"} booked ${lesson} for ${when}.`,
    href: "/tutoring/sessions",
    hrefByUserId: Object.fromEntries([
      ...admins.map((id) => [id, "/admin"] as const),
      [booking.educatorId, "/educator"] as const,
      [booking.studentId, "/tutoring/sessions"] as const,
    ]),
    emailSubject: "Your Justdy Tutoring Booking Is Confirmed",
  });
}


export async function notifyEducatorApplicationSubmitted(userId: string) {
  const [admins, applicant] = await Promise.all([
    getAdminIds(),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
  ]);
  await notifyUsers(admins, {
    eventKey: `educator-application:${userId}`,
    type: "EDUCATOR_APPLICATION",
    title: "New educator application",
    message: `${applicant?.name || "A user"} submitted an educator application for review.`,
    href: "/admin",
    emailSubject: "New Justdy Educator Application",
  });
}

export async function notifyAdminsAndAssignedTutor(
  eventKey: string,
  type: string,
  title: string,
  message: string,
  tutorId: string,
  href = "/tutor/sessions",
) {
  await notifyUsers([...(await getAdminIds()), tutorId], {
    eventKey,
    type,
    title,
    message,
    href,
  });
}
