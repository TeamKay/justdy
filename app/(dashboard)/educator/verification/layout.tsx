import React from "react";

export const metadata = {
  title: "Educator Dashboard",
  description:
    "Manage your tutoring sessions, view student requests, and update your profile.",
};

const EducatorDashboardLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <div className="container mx-auto px-4 py-8">{children}</div>;
};

export default EducatorDashboardLayout;
