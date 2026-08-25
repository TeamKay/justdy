import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const VISITOR_COOKIE = "justdy_visitor_id";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    const path =
      typeof body?.path === "string" && body.path.length <= 500
        ? body.path
        : "/";

    const cookieHeader = request.headers.get("cookie") ?? "";

    const cookieEntry = cookieHeader
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${VISITOR_COOKIE}=`));

    let visitorId = "";

    if (cookieEntry) {
      visitorId = decodeURIComponent(
        cookieEntry.substring(`${VISITOR_COOKIE}=`.length),
      );
    }

    const isNewVisitor = !visitorId;

    if (!visitorId) {
      visitorId = crypto.randomUUID();
    }

    const now = new Date();

    const visitor = await prisma.siteVisitor.upsert({
      where: {
        visitorId,
      },
      create: {
        visitorId,
        firstSeen: now,
        lastSeen: now,
        pageViews: 1,
      },
      update: {
        lastSeen: now,
        pageViews: {
          increment: 1,
        },
      },
    });

    await prisma.sitePageView.create({
      data: {
        visitorId: visitor.visitorId,
        path,
        createdAt: now,
      },
    });

    const response = NextResponse.json({
      success: true,
      visitorId: visitor.visitorId,
      isNewVisitor,
    });

    if (isNewVisitor) {
      response.cookies.set({
        name: VISITOR_COOKIE,
        value: visitor.visitorId,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365 * 2,
      });
    }

    return response;
  } catch (error) {
    console.error("ANALYTICS TRACKING ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Analytics tracking failed",
      },
      {
        status: 500,
      },
    );
  }
}
