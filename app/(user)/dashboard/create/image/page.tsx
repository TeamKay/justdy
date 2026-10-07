import { Suspense } from "react";
import ImageCreateClient from "@/app/_components/create/ImageCreateClient";

export const dynamic = "force-dynamic";

export default function ImageCreatePage() {
  return (
    <Suspense fallback={null}>
      <ImageCreateClient />
    </Suspense>
  );
}
