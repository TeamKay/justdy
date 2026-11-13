"use client";

import { usePathname } from "next/navigation";
import FooterPage from "@/app/_components/navigation/FooterPage";

export default function FooterController() {
  const pathname = usePathname();

  const showFooter = pathname === "/" || pathname === "/public";

  if (!showFooter) {
    return null;
  }

  return <FooterPage />;
}
