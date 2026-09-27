import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

interface RouteContext {
  params: Promise<{ resourceId: string }>;
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const { resourceId } = await params;
  const id = resourceId.trim();

  if (!id) {
    return NextResponse.json(
      { error: "Resource ID is required." },
      { status: 400 },
    );
  }

  const resource = await prisma.resource.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });

  if (!resource) {
    return NextResponse.json(
      { error: "Resource not found." },
      { status: 404 },
    );
  }

  await prisma.resource.delete({
    where: { id: resource.id },
  });

  return NextResponse.json({ success: true });
}
