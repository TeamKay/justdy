import "server-only";

import { NextResponse } from "next/server";
import { headers } from "next/headers";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

interface RouteContext {
  params: Promise<{
    productId: string;
  }>;
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    // ========================================================
    // AUTHENTICATE USER
    // ========================================================

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "You must be logged in to download this product.",
        },
        {
          status: 401,
        },
      );
    }

    // ========================================================
    // GET PRODUCT ID
    // ========================================================

    const { productId } = await params;

    if (!productId) {
      return NextResponse.json(
        {
          error: "Product ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    // ========================================================
    // FIND PRODUCT
    // ========================================================

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },

      select: {
        id: true,
        title: true,
        fileKey: true,
        fileType: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          error: "Product not found.",
        },
        {
          status: 404,
        },
      );
    }

    // ========================================================
    // MAKE SURE IT HAS A FILE
    // ========================================================

    if (!product.fileKey) {
      return NextResponse.json(
        {
          error: "This product does not have a downloadable file.",
        },
        {
          status: 404,
        },
      );
    }

    // ========================================================
    // VERIFY DIGITAL PRODUCT PURCHASE
    // ========================================================
    //
    // IMPORTANT:
    //
    // Courses use Enrollment.
    //
    // Digital products use Purchase.
    //
    // The Stripe webhook creates:
    //
    // Purchase {
    //   userId
    //   productId
    //   status: "Paid"
    // }
    //
    // ========================================================

    const purchase = await prisma.purchase.findFirst({
      where: {
        userId: session.user.id,
        productId: product.id,
        status: "Paid",
      },

      select: {
        id: true,
        userId: true,
        productId: true,
        status: true,
        quantity: true,
      },
    });

    // ========================================================
    // NO PURCHASE
    // ========================================================

    if (!purchase) {
      console.error("DIGITAL PRODUCT ACCESS DENIED:", {
        userId: session.user.id,
        productId: product.id,
        productTitle: product.title,
      });

      return NextResponse.json(
        {
          error: "You do not have access to this product.",
        },
        {
          status: 403,
        },
      );
    }

    // ========================================================
    // BUILD UPLOADTHING URL
    // ========================================================

    const fileUrl =
      product.fileKey.startsWith("http://") ||
      product.fileKey.startsWith("https://")
        ? product.fileKey
        : `https://utfs.io/f/${product.fileKey}`;

    // ========================================================
    // LOG SUCCESS
    // ========================================================

    console.log("DIGITAL PRODUCT DOWNLOAD AUTHORIZED:", {
      userId: session.user.id,
      productId: product.id,
      productTitle: product.title,
      purchaseId: purchase.id,
      quantity: purchase.quantity,
    });

    // ========================================================
    // REDIRECT TO UPLOADTHING
    // ========================================================

    return NextResponse.redirect(fileUrl);
  } catch (error) {
    console.error("DIGITAL PRODUCT DOWNLOAD ERROR:", error);

    return NextResponse.json(
      {
        error: "Unable to download this product.",
      },
      {
        status: 500,
      },
    );
  }
}
