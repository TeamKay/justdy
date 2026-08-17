import prisma from "@/lib/prisma";
import LandingPageClient from "../_components/LandingPage";
import FeaturedProducts from "../_components/FeaturedProducts";

export default async function LandingPage() {
  // Query product images from your Prisma database schema
  const productImages = await prisma.productImage.findMany({
    take: 8,
    select: {
      imageKey: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Extract the keys array
  const imageKeys = productImages.map((img) => img.imageKey);

  return (
    <>
      {" "}
      <LandingPageClient uploadthingImages={imageKeys} />
      <FeaturedProducts />
    </>
  );
}
