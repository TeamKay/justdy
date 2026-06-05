import LearnerDashboard from "@/app/_components/LearnerDashboard";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export default async function Page() {
  // TODO: replace with real auth session (NextAuth/Clerk/etc.)
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userId = session?.user?.id;

  if (!userId) {
    return <div>Please log in</div>;
  }

  // =========================
  // 1. GLOBAL STATS (DB ONLY)
  // =========================
  const [
    enrolledCoursesCount,
    upcomingBookingsCount,
    communitiesCount,
    unreadMessagesCount,
    currentSubscriptionsCount,
  ] = await Promise.all([
    prisma.enrollment.count({
      where: { userId, status: "Active" },
    }),
    prisma.appointment.count({
      where: {
        learnerId: userId,
        status: "Scheduled",
        startTime: { gte: new Date() },
      },
    }),
    prisma.communityMember.count({
      where: { userId, status: "Active" },
    }),
    prisma.message.count({
      where: {
        sender: {
          role: "Educator",
        },
      },
    }),
    prisma.subscription.count({
      where: { userId, status: "active" },
    }),
  ]);

  const globalStats = [
    {
      title: "Courses Enrolled",
      value: enrolledCoursesCount,
      label: "Active learning",
    },
    {
      title: "Upcoming Bookings",
      value: upcomingBookingsCount,
      label: "Scheduled sessions",
    },
    {
      title: "Communities Joined",
      value: communitiesCount,
      label: "Active spaces",
    },
    {
      title: "Unread Messages",
      value: unreadMessagesCount,
      label: "New alerts",
    },
    {
      title: "Subscriptions",
      value: currentSubscriptionsCount,
      label: "Premium plan",
    },
  ];

  // ==========================================
  // 2. USER COMMUNITIES (DRIVES DROPDOWN + UI)
  // ==========================================
  const enrolledCommunities = await prisma.communityMember.findMany({
    where: {
      userId,
      status: "Active",
    },
    include: {
      community: {
        include: {
          onboardingTasks: {
            where: { isActive: true },
            orderBy: { order: "asc" },
          },
          posts: {
            where: { isPublished: true },
            orderBy: { createdAt: "desc" },
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  // =========================
  // 3. COURSES & BOOKINGS
  // =========================
  const activeEnrollments = await prisma.enrollment.findMany({
    where: { userId, status: "Active" },
    include: { Course: true },
  });

  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      learnerId: userId,
      status: "Scheduled",
      startTime: { gte: new Date() },
    },
    orderBy: { startTime: "asc" },
    take: 5,
  });

  // =========================
  // 4. BUILD COMMUNITIES (NO MOCKS)
  // =========================
  const communities = enrolledCommunities.map((membership) => {
    const comm = membership.community;

    const communityCourses = activeEnrollments
      .filter(
        (e) => e.Course.category.toLowerCase() === comm.category.toLowerCase(),
      )
      .map((e) => ({
        title: e.Course.title,
        progress: 50,
        lesson: e.Course.smallDescription || "Click resume to continue",
      }));

    return {
      id: comm.id,
      name: comm.name,
      slug: comm.slug,
      smallDescription: comm.smallDescription,
      description: comm.description,
      category: comm.category,
      fileKey: comm.fileKey,
      price: comm.price,
      memberCount: comm.memberCount,
      onlineCount: comm.onlineCount,
      adminCount: comm.adminCount,

      continueLearning:
        communityCourses.length > 0
          ? communityCourses
          : [
              {
                title: `${comm.name} Starter Path`,
                progress: 10,
                lesson: "Begin your journey here",
              },
            ],

      upcomingTimeline: upcomingAppointments.map((app) => ({
        title: app.notes || "One-on-One Session",
        date:
          app.startTime.toLocaleDateString() +
          " • " +
          app.startTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        type: app.sessionType,
      })),

      activities: [
        {
          text: `Joined ${comm.name}`,
          time: "Recently",
        },
      ],

      categories: Array.from(
        new Set(comm.posts.map((p) => p.category).filter(Boolean)),
      ).map((cat) => ({
        name: cat as string,
        icon: "💬",
      })),

      onboardingTasks: comm.onboardingTasks.map((t) => ({
        title: t.title,
      })),

      pinnedPosts: comm.posts
        .filter((p) => p.isPinned)
        .map((p) => ({
          id: p.id,
          title: p.title || "Community Update",
          content: p.content,
          user: { id: p.user.id, name: p.user.name },
        })),

      leaderboard: [],
    };
  });

  // =========================
  // 5. RENDER DASHBOARD
  // =========================
  return (
    <LearnerDashboard
      globalStats={globalStats}
      communities={communities}
      currentUserId={userId}
    />
  );
}
