import prisma from "@/lib/prisma";

export async function getWebsiteAnalytics() {
  const now = new Date();

  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    totalVisitors,
    visitorsToday,
    activeVisitors,
    totalPageViews,
    pageViewsToday,
    recentPageViews,
    recentVisitors,
  ] = await Promise.all([
    // All unique visitors ever recorded.
    prisma.siteVisitor.count(),

    // Unique visitors who have been active today.
    prisma.siteVisitor.count({
      where: {
        lastSeen: {
          gte: startOfToday,
        },
      },
    }),

    // Visitors active within the last 5 minutes.
    prisma.siteVisitor.count({
      where: {
        lastSeen: {
          gte: fiveMinutesAgo,
        },
      },
    }),

    // All page views ever recorded.
    prisma.sitePageView.count(),

    // All page views today.
    prisma.sitePageView.count({
      where: {
        createdAt: {
          gte: startOfToday,
        },
      },
    }),

    // Page views for the last 7 days.
    prisma.sitePageView.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        createdAt: true,
      },
    }),

    // Visitors active during the last 7 days.
    prisma.siteVisitor.findMany({
      where: {
        lastSeen: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        visitorId: true,
        lastSeen: true,
      },
    }),
  ]);

  const visitorsByDay = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sevenDaysAgo);

    date.setDate(sevenDaysAgo.getDate() + index);

    const key = date.toISOString().slice(0, 10);

    return {
      date: key,
      visitors: 0,
      pageViews: 0,
    };
  });

  const dayMap = new Map(visitorsByDay.map((item) => [item.date, item]));

  // Count page views by day.
  recentPageViews.forEach((view) => {
    const key = view.createdAt.toISOString().slice(0, 10);

    const day = dayMap.get(key);

    if (day) {
      day.pageViews += 1;
    }
  });

  // Count unique visitors by day.
  //
  // A visitor can only have one "lastSeen" value, so this represents
  // visitors whose latest activity occurred on each day.
  recentVisitors.forEach((visitor) => {
    const key = visitor.lastSeen.toISOString().slice(0, 10);

    const day = dayMap.get(key);

    if (day) {
      day.visitors += 1;
    }
  });

  return {
    totalVisitors,
    visitorsToday,
    activeVisitors,
    totalPageViews,
    pageViewsToday,
    visitorsByDay,
  };
}
