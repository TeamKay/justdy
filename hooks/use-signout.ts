"use client";

import { authClient } from "@/lib/auth-client";
import { clearCommunityPresence } from "@/lib/clear-community-presence";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useSignOut() {
  const router = useRouter();

  const handleSignout = async function signOut() {
    await clearCommunityPresence();

    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
          toast.success("Signed out successfully");
        },
        onError: () => {
          toast.error("Failed to sign out");
        },
      },
    });
  };

  return handleSignout;
}