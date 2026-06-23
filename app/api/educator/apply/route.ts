import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth"; // Your better-auth instance
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      specialty,
      experience,
      credentialUrl,
      description,
      contactNumber,
    } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required." },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 400 },
      );
    }

    // 1. Create the user manually
    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        role: "Educator",
        emailVerified: false,
        specialty,
        experience,
        credentialUrl,
        description,
        contactNumber,
        verificationStatus: "Pending",
      },
    });

    // 2. Programmatically generate Better-Auth verification token & send email
    // This invokes your 'sendVerificationEmail' configuration seamlessly
    await auth.api.sendVerificationEmail({
      body: {
        email: newUser.email,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
