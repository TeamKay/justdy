import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

function jsonValueToArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const subject = searchParams.get("subject")?.trim() ?? "";
    const gradeLevel = searchParams.get("gradeLevel")?.trim() ?? "";

    const educators = await prisma.user.findMany({
      where: {
        status: "Active",
        teachingProfile: {
          is: {
            verificationStatus: "Verified",
            ...(subject ? { subjects: { array_contains: [subject] } } : {}),
            ...(gradeLevel ? { gradeLevels: { array_contains: [gradeLevel] } } : {}),
          },
        },
        capabilities: {
          some: {
            capability: { key: "CAN_TUTOR" },
          },
        },
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                {
                  teachingProfile: {
                    is: {
                      headline: { contains: search, mode: "insensitive" },
                    },
                  },
                },
                {
                  teachingProfile: {
                    is: {
                      specialty: { contains: search, mode: "insensitive" },
                    },
                  },
                },
                {
                  teachingProfile: {
                    is: {
                      description: { contains: search, mode: "insensitive" },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        teachingProfile: {
          select: {
            id: true,
            headline: true,
            specialty: true,
            experience: true,
            description: true,
            hourlyRate: true,
            currency: true,
            subjects: true,
            gradeLevels: true,
            verificationStatus: true,
            services: {
              where: { status: "Published", type: "TUTORING" },
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                title: true,
                description: true,
                type: true,
                durationMinutes: true,
                price: true,
                currency: true,
                subject: true,
                gradeLevels: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = educators.map((educator) => ({
      id: educator.id,
      name: educator.name,
      imageUrl: educator.imageUrl,
      profile: educator.teachingProfile
        ? {
            id: educator.teachingProfile.id,
            headline: educator.teachingProfile.headline,
            specialty: educator.teachingProfile.specialty,
            experience: educator.teachingProfile.experience,
            description: educator.teachingProfile.description,
            hourlyRate: educator.teachingProfile.hourlyRate,
            currency: educator.teachingProfile.currency,
            subjects: jsonValueToArray(educator.teachingProfile.subjects),
            gradeLevels: jsonValueToArray(educator.teachingProfile.gradeLevels),
            verificationStatus: educator.teachingProfile.verificationStatus,
            services: educator.teachingProfile.services.map((service) => ({
              id: service.id,
              title: service.title,
              description: service.description,
              type: service.type,
              durationMinutes: service.durationMinutes,
              price: service.price,
              currency: service.currency,
              subject: service.subject,
              gradeLevels: jsonValueToArray(service.gradeLevels),
            })),
          }
        : null,
    }));

    return NextResponse.json({ success: true, educators: result, count: result.length });
  } catch (error) {
    console.error("Failed to load tutoring educators:", error);
    return NextResponse.json({ error: "Failed to load educators." }, { status: 500 });
  }
}
