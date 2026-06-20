"use client";

import { usePathname } from "next/navigation";
import FooterPage from "./FooterPage";

export default function FooterController() {
  const pathname = usePathname();

  // show only on main page
  const showFooter = pathname === "/public" || pathname === "/";

  if (!showFooter) return null;

  return <FooterPage />;
}
