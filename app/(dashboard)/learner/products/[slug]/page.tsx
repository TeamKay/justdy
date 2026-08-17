import { redirect, notFound } from "next/navigation";

import prisma from "@/lib/prisma";
import { requireUser } from "@/app/actions/require-student";

import { CourseProductView } from "@/app/_components/CourseProductView";
import { DigitalProductView } from "@/app/_components/DigitalProductView";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductAccessPage({ params }: PageProps) {
  const { slug } = await params;

  const session = await requireUser();

  // ============================================================
  // FIND PRODUCT
  // ============================================================

  const product = await prisma.product.findUnique({
    where: {
      slug,
    },

    include: {
      images: {
        orderBy: {
          position: "asc",
        },
      },

      chapters: {
        orderBy: {
          position: "asc",
        },

        include: {
          lessons: {
            orderBy: {
              position: "asc",
            },
          },
        },
      },
    },
  });

  if (!product) {
    notFound();
  }

  // ============================================================
  // COURSE
  // ============================================================

  if (product.type === "Course") {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_productId: {
          userId: session.id,
          productId: product.id,
        },
      },
    });

    if (!enrollment || enrollment.status !== "Active") {
      redirect(`/products/${product.slug}`);
    }

    return <CourseProductView product={product} />;
  }

  // ============================================================
  // DIGITAL PRODUCT
  // ============================================================

  const purchase = await prisma.purchase.findFirst({
    where: {
      userId: session.id,
      productId: product.id,
      status: "Paid",
    },
  });

  if (!purchase) {
    redirect(`/products/${product.slug}`);
  }

  return <DigitalProductView product={product} purchase={purchase} />;
}
