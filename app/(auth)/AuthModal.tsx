"use client";

import { useState } from "react";

import { Dialog, DialogContent } from "@/app/_components/ui/dialog";

import { SigninModal } from "./SigninModal";
import { SignupModal } from "./SignupModal";

type AuthMode = "signin" | "signup";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: AuthMode;
}

export function AuthModal({
  open,
  onOpenChange,
  defaultMode = "signin",
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(defaultMode);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      setMode(defaultMode);
    }
  };

  const handleSigninSuccess = () => {
    // Close the modal after successful authentication
    onOpenChange(false);

    // Reset back to the default mode for the next time it opens
    setMode(defaultMode);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="
          w-[calc(100%-2rem)]
          max-w-120
          max-h-[calc(100vh-2rem)]
          overflow-y-auto
          overflow-x-hidden
          rounded-xl
          border-0
          bg-transparent
          p-0
          shadow-2xl
          sm:max-h-[calc(100vh-3rem)]
        "
      >
        {mode === "signin" ? (
          <SigninModal
            onSwitchToSignup={() => setMode("signup")}
            onSuccess={handleSigninSuccess}
          />
        ) : (
          <SignupModal
            onSwitchToSignin={() => setMode("signin")}
            onSuccess={handleSigninSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
