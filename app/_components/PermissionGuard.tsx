// app/dashboard/_components/PermissionGuard.tsx
"use client";

import { ReactNode } from "react";

interface PermissionGuardProps {
  userPermissions: string[];
  requiredPermission: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export default function PermissionGuard({
  userPermissions,
  requiredPermission,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const hasAccess = userPermissions.includes(requiredPermission);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
