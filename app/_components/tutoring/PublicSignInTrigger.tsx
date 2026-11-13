
"use client";

import type { ReactNode } from "react";

interface PublicSignInTriggerProps {
  children: ReactNode;
  className?: string;
}

export default function PublicSignInTrigger({
  children,
  className,
}: PublicSignInTriggerProps) {
  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(
          new Event("justdy:open-public-signin")
        );
      }}
      className={className}
    >
      {children}
    </button>
  );
}
