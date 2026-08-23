"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/app/_components/ui/dialog";

import { SigninModal } from "./SigninModal";
import { SignupModal } from "./SignupModal";

type AuthMode = "signin" | "signup";

interface AuthModalProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultMode?: AuthMode;
}

export function AuthModal({
  children,
  open,
  onOpenChange,
  defaultMode = "signin",
}: AuthModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>(defaultMode);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const handleOpenChange = (value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value);
    } else {
      setInternalOpen(value);
    }

    if (!value) {
      setMode(defaultMode);
    }
  };

  const switchToSignin = () => {
    setMode("signin");
  };

  const switchToSignup = () => {
    setMode("signup");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}

      <DialogContent
        className="
          w-[calc(100%-2rem)]
          max-w-120
          max-h-[calc(100vh-2rem)]
          overflow-y-auto
          overflow-x-hidden
          p-0
          border-0
          bg-transparent
          shadow-2xl
          rounded-xl
          sm:max-h-[calc(100vh-3rem)]
        "
      >
        {mode === "signin" ? (
          <SigninModal onSwitchToSignup={switchToSignup} />
        ) : (
          <SignupModal onSwitchToSignin={switchToSignin} />
        )}
      </DialogContent>
    </Dialog>
  );
}
