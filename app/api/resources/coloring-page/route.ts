import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

interface ColoringPageImage {
  index: number;
  url: string;
  generationId?: string;
  assetId?: string;
  mimeType?: string;
}

interface ColoringPageRequest {
  title?: unknown;
  description?: unknown;
  prompt?: unknown;
  ageGroup?: unknown;
  style?: unknown;
  pages?: unknown;
  projectId?: unknown;
  images?: unknown;
  imageUrl?: unknown;
  generationId?: unknown;
}

/*
 * ============================================================
 * SLUG HELPERS
 * ============================================================
 */

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function createUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.resource.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return slug;
    }

    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
}

/*
 * ============================================================
 * VALIDATION HELPERS
 * ============================================================
 */

function isValidImageUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    /^https?:\/\//i.test(value.trim())
  );
}

function isValidImage(value: unknown): value is ColoringPageImage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const image = value as Record<string, unknown>;

  return (
    typeof image.index === "number" &&
    Number.isInteger(image.index) &&
    image.index > 0 &&
    isValidImageUrl(image.url)
  );
}

/*
 * ============================================================
 * POST /api/resources/coloring-page
 * ============================================================
 */

export async function POST(request: Request) {
  try {
    /*
     * ----------------------------------------------------------
     * AUTHENTICATION
     * ----------------------------------------------------------
     */

    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required.",
        },
        {
          status: 401,
        },
      );
    }

    /*
     * ----------------------------------------------------------
     * PARSE REQUEST
     * ----------------------------------------------------------
     */

    const body = (await request.json()) as ColoringPageRequest;

    /*
     * ----------------------------------------------------------
     * BASIC RESOURCE INFORMATION
     * ----------------------------------------------------------
     */

    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : "Coloring Pages";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : null;

    const prompt =
      typeof body.prompt === "string"
        ? body.prompt.trim()
        : "";

    const ageGroup =
      typeof body.ageGroup === "string" && body.ageGroup.trim()
        ? body.ageGroup.trim()
        : "Kindergarten";

    const style =
      typeof body.style === "string" && body.style.trim()
        ? body.style.trim()
        : "Simple & Bold";

    /*
     * ----------------------------------------------------------
     * NORMALIZE GENERATED IMAGES
     * ----------------------------------------------------------
     *
     * The new coloring-page creator sends:
     *
     * images: [
     *   {
     *     index,
     *     url,
     *     generationId,
     *     assetId,
     *     mimeType
     *   }
     * ]
     *
     * imageUrl remains supported for compatibility with the
     * original single-page implementation.
     */

    let images: ColoringPageImage[] = [];

    if (Array.isArray(body.images)) {
      images = body.images.filter(isValidImage);
    }

    /*
     * Backward compatibility with the original one-page request.
     */

    if (images.length === 0 && isValidImageUrl(body.imageUrl)) {
      images = [
        {
          index: 1,
          url: body.imageUrl.trim(),
          generationId:
            typeof body.generationId === "string"
              ? body.generationId
              : undefined,
        },
      ];
    }

    /*
     * At least one image must exist.
     */

    if (images.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one generated coloring page is required.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ----------------------------------------------------------
     * REMOVE DUPLICATE PAGE INDEXES
     * ----------------------------------------------------------
     *
     * If the client accidentally submits the same page index
     * more than once, keep the last submitted version.
     */

    const uniqueImages = Array.from(
      new Map(
        images.map((image) => [image.index, image]),
      ).values(),
    ).sort((a, b) => a.index - b.index);

    /*
     * ----------------------------------------------------------
     * PROJECT OWNERSHIP
     * ----------------------------------------------------------
     */

    let projectId: string | undefined;

    if (
      typeof body.projectId === "string" &&
      body.projectId.trim()
    ) {
      const project = await prisma.aIProject.findFirst({
        where: {
          id: body.projectId.trim(),
          userId: user.id,
        },
        select: {
          id: true,
        },
      });

      if (!project) {
        return NextResponse.json(
          {
            success: false,
            error: "Project not found.",
          },
          {
            status: 404,
          },
        );
      }

      projectId = project.id;
    }

    /*
     * ----------------------------------------------------------
     * GENERATION OWNERSHIP
     * ----------------------------------------------------------
     *
     * Every generated image should belong to the authenticated
     * user before it is attached to a Resource.
     */

    const generationIds = uniqueImages
      .map((image) => image.generationId)
      .filter(
        (id): id is string =>
          typeof id === "string" && id.length > 0,
      );

    if (generationIds.length > 0) {
      const ownedGenerations =
        await prisma.aIGeneration.findMany({
          where: {
            id: {
              in: generationIds,
            },
            userId: user.id,
          },
          select: {
            id: true,
          },
        });

      const ownedIds = new Set(
        ownedGenerations.map(
          (generation) => generation.id,
        ),
      );

      const unauthorizedGeneration = generationIds.find(
        (id) => !ownedIds.has(id),
      );

      if (unauthorizedGeneration) {
        return NextResponse.json(
          {
            success: false,
            error:
              "One or more generated images are not owned by this user.",
          },
          {
            status: 403,
          },
        );
      }
    }

    /*
     * ----------------------------------------------------------
     * RESOURCE CONTENT
     * ----------------------------------------------------------
     *
     * We keep the first image in imageUrl for compatibility
     * with existing Resource consumers.
     *
     * The complete coloring-page set is stored in pages[].
     */

    const pageContent = {
      kind: "COLORING_PAGE",

      /*
       * Backward-compatible single image field.
       */
      imageUrl: uniqueImages[0].url,

      /*
       * Complete coloring-page set.
       */
      pages: uniqueImages.map((image) => ({
        index: image.index,
        url: image.url,
        generationId: image.generationId ?? null,
        assetId: image.assetId ?? null,
        mimeType: image.mimeType ?? "image/png",
      })),

      prompt,
    };

    /*
     * ----------------------------------------------------------
     * RESOURCE METADATA
     * ----------------------------------------------------------
     */

    const requestedPages =
      typeof body.pages === "number" &&
      Number.isInteger(body.pages) &&
      body.pages > 0
        ? body.pages
        : uniqueImages.length;

    const metadata = {
      subtype: "COLORING_PAGE",
      ageGroup,
      style,

      /*
       * Number actually saved.
       */
      pages: uniqueImages.length,

      /*
       * Number requested by the creator.
       */
      requestedPages,

      printable: true,

      generationIds,
    };

    /*
     * ----------------------------------------------------------
     * CREATE UNIQUE SLUG
     * ----------------------------------------------------------
     */

    const baseSlug =
      slugify(title) ||
      `coloring-pages-${Date.now()}`;

    const slug = await createUniqueSlug(baseSlug);

    /*
     * ----------------------------------------------------------
     * CREATE RESOURCE
     * ----------------------------------------------------------
     *
     * One Resource represents the complete coloring-page set.
     *
     * Example:
     *
     * Resource
     *   ├── Page 1
     *   ├── Page 2
     *   ├── Page 3
     *   └── ResourceVersion 1
     */

    const resource = await prisma.resource.create({
      data: {
        userId: user.id,

        projectId,

        title,

        description,

        slug,

        /*
         * Coloring pages are represented as IMAGE resources
         * with metadata identifying the subtype.
         */
        type: "IMAGE",

        status: "DRAFT",

        visibility: "PRIVATE",

        accessType: "FREE",

        /*
         * First image becomes the resource thumbnail.
         */
        thumbnailUrl: uniqueImages[0].url,

        /*
         * Complete content.
         */
        content: pageContent,

        /*
         * Resource metadata.
         */
        metadata,

        /*
         * Initial version.
         */
        versions: {
          create: {
            versionNumber: 1,

            content: pageContent,

            metadata,

            /*
             * For a single-page resource we can directly associate
             * the generation with the version.
             *
             * For a multi-page resource, generationId is left null
             * because there are multiple generation records.
             */
            generationId:
              uniqueImages.length === 1
                ? uniqueImages[0].generationId ?? null
                : null,
          },
        },
      },
    });

    /*
     * ----------------------------------------------------------
     * SUCCESS
     * ----------------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,

        resource,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    /*
     * ----------------------------------------------------------
     * ERROR HANDLING
     * ----------------------------------------------------------
     */

    console.error(
      "POST /api/resources/coloring-page failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to save coloring pages.",
      },
      {
        status: 500,
      },
    );
  }
}