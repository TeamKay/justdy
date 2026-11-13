"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function SiteAnalyticsTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    // Prevent React Strict Mode from recording the same
    // initial page twice during development.
    if (lastTrackedPath.current === pathname) return;

    lastTrackedPath.current = pathname;

    const trackVisit = async () => {
      try {
        const response = await fetch("/api/analytics/track", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: pathname,
          }),
        });

        if (!response.ok) {
          console.error(
            "Website analytics request failed:",
            response.status,
            response.statusText,
          );

          return;
        }

        const result = await response.json();

        if (!result?.success) {
          console.error(
            "Website analytics server returned an error:",
            result?.error,
          );
        }
      } catch (error) {
        console.error("Website analytics tracking failed:", error);
      }
    };

    trackVisit();
  }, [pathname]);

  return null;
}
