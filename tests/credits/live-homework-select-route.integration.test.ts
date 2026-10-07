import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  hasCapability: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("@/lib/auth/capabilities", () => ({
  CAPABILITIES: {
    TEACH: "TEACH",
  },
  hasCapability: mocks.hasCapability,
}));

import { POST } from "@/app/api/live-homework-help/select/route";
import prisma from "@/lib/prisma";

/**
 * HTTP-level Phase 2 selection regression tests.
 *
 * These tests deliberately exercise the production selection route against
 * the real Prisma database. The auth/capability boundary is mocked so the
 * test does not depend on a browser session or the capability tables.
 */

describe("POST /api/live-homework-help/select — credit reservation", () => {
  const createdUserIds: string[] = [];
  const createdRequestIds: string[] = [];
  const createdSessionIds: string[] = [];
  const createdTeacherIds: string[] = [];

  async function createScenario(balance: number) {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const learnerId = `live-help-select-learner-${suffix}`;
    const teacherId = `live-help-select-teacher-${suffix}`;

    await prisma.user.createMany({
      data: [
        {
          id: learnerId,
          name: "Live Help Learner Test",
          email: `${learnerId}@example.test`,
        },
        {
          id: teacherId,
          name: "Live Help Teacher Test",
          email: `${teacherId}@example.test`,
         role: "USER",
          canTeach: true,
        },
      ],
    });

    createdUserIds.push(learnerId, teacherId);
    createdTeacherIds.push(teacherId);

    await prisma.userCredit.create({
      data: {
        userId: learnerId,
        balance,
        reservedBalance: 0,
      },
    });

    await prisma.teachingProfile.create({
      data: {
        userId: teacherId,
        hourlyRate: 3000,
        currency: "USD",
      },
    });

    await prisma.liveHomeworkTeacherAvailability.create({
      data: {
        teacherId,
        isAvailable: true,
        activatedAt: new Date(),
      },
    });

    const liveRequest = await prisma.liveHomeworkRequest.create({
      data: {
        id: `live-help-select-request-${suffix}`,
        learnerId,
        status: "WAITING",
        subject: "Mathematics",
        gradeLevel: "Grade 8",
        topic: "Algebra",
        description: "Solve an algebra homework problem.",
        waitingAt: new Date(),
      },
    });

    createdRequestIds.push(liveRequest.id);

    return { learnerId, teacherId, requestId: liveRequest.id };
  }

  beforeEach(() => {
    mocks.getSession.mockReset();
    mocks.hasCapability.mockReset();

    mocks.hasCapability.mockResolvedValue(true);
  });

  afterAll(async () => {
    if (createdSessionIds.length > 0) {
      await prisma.liveHomeworkSession.deleteMany({
        where: { id: { in: createdSessionIds } },
      });
    }

    if (createdTeacherIds.length > 0) {
      await prisma.liveHomeworkTeacherAvailability.deleteMany({
        where: { teacherId: { in: createdTeacherIds } },
      });
    }

    if (createdRequestIds.length > 0) {
      await prisma.liveHomeworkRequest.deleteMany({
        where: { id: { in: createdRequestIds } },
      });
    }

    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } },
      });
    }
  });

  function requestFor(requestId: string) {
    return new NextRequest("http://localhost/api/live-homework-help/select", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ requestId }),
    });
  }

  it("returns 402 and keeps the request WAITING when 3,000 credits are required but only 2,999 are available", async () => {
    const { teacherId, requestId, learnerId } = await createScenario(2999);

    mocks.getSession.mockResolvedValue({
      user: {
        id: teacherId,
        role: "Educator",
      },
    });

    const response = await POST(requestFor(requestId));

    expect(response.status).toBe(402);
    expect((await response.json()).error).toContain("not have enough credits");

    const liveRequest = await prisma.liveHomeworkRequest.findUnique({
      where: { id: requestId },
    });
    const session = await prisma.liveHomeworkSession.findUnique({
      where: { requestId },
    });
    const wallet = await prisma.userCredit.findUnique({
      where: { userId: learnerId },
    });

    expect(liveRequest?.status).toBe("WAITING");
    expect(liveRequest?.teacherId).toBeNull();
    expect(liveRequest?.sessionId).toBeNull();
    expect(session).toBeNull();
    expect(wallet?.balance).toBe(2999);
    expect(wallet?.reservedBalance).toBe(0);
  });

  it("selects the learner and reserves one full hour at 3,000 credits when the balance is sufficient", async () => {
    const { teacherId, requestId, learnerId } = await createScenario(3000);

    mocks.getSession.mockResolvedValue({
      user: {
        id: teacherId,
        role: "Educator",
      },
    });

    const response = await POST(requestFor(requestId));

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.session.teacherRate).toBe(3000);
    expect(body.session.currency).toBe("USD");

    createdSessionIds.push(body.session.id);

    const liveRequest = await prisma.liveHomeworkRequest.findUnique({
      where: { id: requestId },
    });
    const wallet = await prisma.userCredit.findUnique({
      where: { userId: learnerId },
    });
    const reservation = await prisma.creditReservation.findFirst({
      where: {
        userId: learnerId,
        referenceType: "LIVE_HOMEWORK_SESSION",
        referenceId: body.session.id,
      },
    });

    expect(liveRequest?.status).toBe("CONNECTING");
    expect(liveRequest?.teacherId).toBe(teacherId);
    expect(liveRequest?.sessionId).toBe(body.session.id);
    expect(wallet?.balance).toBe(0);
    expect(wallet?.reservedBalance).toBe(3000);
    expect(reservation?.amount).toBe(3000);
    expect(reservation?.status).toBe("ACTIVE");
  });
});
