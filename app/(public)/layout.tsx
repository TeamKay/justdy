
import type { ReactNode } from "react";
import MarketingNavbar from "../_components/MarketingNavbar";
import MarketingFooter from "../_components/MarketingFooter";

export default function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNavbar />

      <main className="flex-1">
        {children}
      </main>

      <MarketingFooter />
    </div>
  );
}
