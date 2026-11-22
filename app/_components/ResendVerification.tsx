"use client";

import { useState } from "react";
import { Mail, LoaderCircle, CheckCircle2 } from "lucide-react";

interface ResendVerificationProps {
  email: string;
}

export default function ResendVerification({ email }: ResendVerificationProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleResend() {
    if (!email || loading) return;

    setLoading(true);
    setMessage("");
    setSuccess(false);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to request another verification email. Please try again.",
        );
      }

      setSuccess(true);
      setMessage(
        data?.message ||
          "If your account needs verification, a new email will be sent shortly.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleResend}
        disabled={loading || !email}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-5 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : success ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        {loading
          ? "Requesting verification email..."
          : success
            ? "Resend another email"
            : "Resend Verification Email"}
      </button>

      {message && (
        <p
          role={success ? "status" : "alert"}
          aria-live="polite"
          className={`mt-3 text-sm leading-5 ${
            success ? "text-emerald-600" : "text-destructive"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
