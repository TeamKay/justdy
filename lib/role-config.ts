import React from "react";

export const ROLE_NAV_CONFIG: Record<
  string,
  { label: string; href: string; icon?: React.ReactNode }
> = {
  admin: {
    label: "Admin Dashboard",
    href: "/admin",
  },

  educator: {
    label: "Educator Dashboard",
    href: "/educator",
  },

  learner: {
    label: "Learner Dashboard",
    href: "/learner",
  },

  unassigned: {
    label: "Complete Profile",
    href: "/onboarding",
  },
};
