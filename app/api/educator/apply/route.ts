import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { name, email } = body;

    // ============================================================
    // 1. VALIDATE REQUIRED FIELDS
    // ============================================================

    if (!name || !email) {
      return NextResponse.json(
        {
          error: "Name and email are required.",
        },
        {
          status: 400,
        },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ============================================================
    // 2. CHECK FOR EXISTING USER
    // ============================================================

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "An account with this email already exists.",
        },
        {
          status: 400,
        },
      );
    }

    // ============================================================
    // 3. CREATE EDUCATOR USER
    // ============================================================
    //
    // Only fields that exist on the current User Prisma model
    // should be written here.
    //
    // description and contactNumber are intentionally NOT
    // included because they are not fields on User in your
    // current Prisma schema.
    //
    // ============================================================

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        role: "Educator",
        emailVerified: false,
        verificationStatus: "Pending",
      },
    });

    // ============================================================
    // 4. SEND EMAIL VERIFICATION
    // ============================================================

    await auth.api.sendVerificationEmail({
      body: {
        email: newUser.email,
      },
    });

    // ============================================================
    // 5. RETURN CREATED USER
    // ============================================================

    return NextResponse.json(newUser, {
      status: 201,
    });
  } catch (error) {
    console.error("Educator application error:", error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
      },
      {
        status: 500,
      },
    );
  }
}
