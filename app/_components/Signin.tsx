"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import Cookies from "js-cookie";

import { authClient } from "@/lib/auth-client";
import { loginSchema } from "@/lib/zodSchemas";
import { User } from "@/lib/auth";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import { Button } from "@/app/_components/ui/button";

interface SigninPageProps {
  onSwitchToSignup?: () => void;
}

export function SigninPage({
  onSwitchToSignup,
}: SigninPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isPending] = useTransition();
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const rawCallbackUrl = searchParams.get("callbackUrl");

  const callbackUrl =
    rawCallbackUrl &&
    rawCallbackUrl.startsWith("/") &&
    !rawCallbackUrl.startsWith("//")
      ? rawCallbackUrl
      : null;

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function signInWithEmail(
    values: z.infer<typeof loginSchema>,
  ) {
    setLoading(true);
    setLoginError(null);

    try {
      const { data, error } = await authClient.signIn.email(
        {
          email: values.email.trim(),
          password: values.password,
          rememberMe: true,
        },
        {
          onError: (ctx) => {
            console.error(
              "BETTER AUTH SIGN IN ERROR:",
              ctx.error,
            );

            console.error(
              "BETTER AUTH ERROR MESSAGE:",
              ctx.error?.message,
            );

            console.error(
              "BETTER AUTH ERROR CODE:",
              ctx.error?.code,
            );

            console.error(
              "BETTER AUTH ERROR STATUS:",
              ctx.error?.status,
            );

            console.error(
              "BETTER AUTH ERROR STATUS TEXT:",
              ctx.error?.statusText,
            );

            const status = ctx.error?.status;
            const code = ctx.error?.code;
            const message = ctx.error?.message;

            // Email verification required
            if (status === 403) {
              setLoginError(
                "Please verify your email address before signing in.",
              );
              return;
            }

            // Invalid credentials
            if (
              code === "INVALID_EMAIL_OR_PASSWORD" ||
              code === "INVALID_PASSWORD"
            ) {
              setLoginError(
                "Invalid email or password.",
              );
              return;
            }

            // Other Better Auth error
            if (message) {
              setLoginError(message);
              return;
            }

            setLoginError(
              "Invalid email or password.",
            );
          },
        },
      );

      /*
       * Better Auth can return an error object even when
       * the serialized object appears as {} in the console.
       *
       * Handle the returned error as well as the onError callback.
       */
      if (error) {
        console.error(
          "SIGN IN ERROR:",
          JSON.stringify(
            error,
            Object.getOwnPropertyNames(error),
          ),
        );

        const errorMessage =
          error.message ||
          (error as { code?: string }).code ||
          (error as { statusText?: string }).statusText ||
          "Invalid email or password.";

        setLoginError(
          errorMessage === "INVALID_EMAIL_OR_PASSWORD"
            ? "Invalid email or password."
            : errorMessage,
        );

        return;
      }

      // Authentication succeeded but no user was returned
      if (!data?.user) {
        console.error(
          "SIGN IN FAILED: Better Auth returned no user.",
        );

        setLoginError(
          "Login could not be completed. Please try again.",
        );

        return;
      }

      // Verify that the session was actually created
      const {
        data: session,
        error: sessionError,
      } = await authClient.getSession({
        query: {
          disableCookieCache: true,
        },
      });

      if (sessionError) {
        console.error(
          "SESSION VERIFICATION ERROR:",
          JSON.stringify(
            sessionError,
            Object.getOwnPropertyNames(sessionError),
          ),
        );

        setLoginError(
          sessionError.message ||
            "Login succeeded, but your session could not be verified. Please try again.",
        );

        return;
      }

      // Session was not created
      if (!session?.user) {
        console.error(
          "SESSION VERIFICATION FAILED: Better Auth returned no session user.",
        );

        setLoginError(
          "Login succeeded, but your session was not saved. Please try again.",
        );

        return;
      }

      /*
       * Justdy has exactly two primary account types:
       *
       *   ADMIN
       *   USER
       *
       * The verified Better Auth session is the primary UI source.
       * The sign-in response is the fallback available during login.
       *
       * The role cookie is UI convenience only. Never use it for
       * authorization or protected server operations.
       */
      const normalizedRole = String(
        (session.user as User).role ??
          (data.user as User).role ??
          "USER",
      )
        .trim()
        .toUpperCase();

      const role =
        normalizedRole === "ADMIN" ? "ADMIN" : "USER";

      Cookies.set("role", role, {
        expires: 7,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });

      window.dispatchEvent(
        new Event("justdy:auth-state-changed"),
      );

      toast.success("Successfully logged in!");

      /*
       * Keep callback URLs inside the authenticated user's workspace.
       *
       * ADMIN → /admin/*
       * USER  → /dashboard/* or the authenticated tutoring booking flow.
       *
       * The tutoring booking flow also stores its callback temporarily in
       * sessionStorage. That fallback protects the booking handoff if an
       * auth container or browser navigation drops the callback query string.
       */
      let redirectCallbackUrl = callbackUrl;

      if (!redirectCallbackUrl) {
        try {
          const storedDraft = window.sessionStorage.getItem(
            "justdy:pending-tutoring-booking",
          );

          if (storedDraft) {
            const parsed = JSON.parse(storedDraft) as unknown;
            const candidate =
              parsed &&
              typeof parsed === "object" &&
              typeof (parsed as { callback?: unknown }).callback === "string"
                ? (parsed as { callback: string }).callback
                : null;

            if (
              candidate &&
              candidate.startsWith("/") &&
              !candidate.startsWith("//")
            ) {
              redirectCallbackUrl = candidate;
            }
          }
        } catch (storageError) {
          console.error(
            "Failed to restore pending tutoring callback:",
            storageError,
          );
        }
      }

const workspaceCallback =
  role === "ADMIN"
    ? redirectCallbackUrl?.startsWith("/admin")
      ? redirectCallbackUrl
      : null
    : redirectCallbackUrl &&
        (
          redirectCallbackUrl.startsWith("/dashboard") ||
          redirectCallbackUrl === "/tutors" ||
          redirectCallbackUrl.startsWith("/tutors?")
        )
      ? redirectCallbackUrl
      : null;

const dashboardUrl =
  workspaceCallback ??
  (role === "ADMIN" ? "/admin" : "/dashboard");

router.replace(dashboardUrl);
router.refresh();
    } catch (err) {
      console.error("LOGIN ERROR:", err);

      let message =
        "Something went wrong during login. Please try again.";

      if (err instanceof Error) {
        message = err.message || message;
      } else if (typeof err === "string") {
        message = err;
      } else if (err && typeof err === "object") {
        const errorObject = err as {
          message?: string;
          code?: string;
          statusText?: string;
        };

        message =
          errorObject.message ||
          errorObject.statusText ||
          errorObject.code ||
          message;
      }

      setLoginError(message);
    } finally {
      setLoading(false);
    }
  }

  const isSubmitting = loading || isPending;

  return (
    <div className="w-full text-foreground">
      <div className="p-6 sm:p-8">
        <div className="mb-7">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Welcome back
          </h2>

          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Log in to continue your learning journey.
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(
              signInWithEmail,
            )}
            className="space-y-4"
          >
            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="Enter your email"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        setLoginError(null);
                      }}
                      className="h-11 rounded-md border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        setLoginError(null);
                      }}
                      className="h-11 rounded-md border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Authentication error */}
            {loginError && (
              <div
                role="alert"
                aria-live="polite"
                className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-500"
              >
                {loginError}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 h-11 w-full rounded-md bg-emerald-900 font-semibold text-white shadow-sm transition-all hover:bg-emerald-950"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader className="h-4 w-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </Form>

        {/* Sign up */}
        <div className="mt-6 border-t border-border pt-5">
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => {
                setLoginError(null);

                if (onSwitchToSignup) {
                  onSwitchToSignup();
                }
              }}
              className="font-semibold text-primary underline-offset-4 transition-colors hover:underline"
            >
              Sign up instead
            </button>
          </p>

          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            This site is protected by reCAPTCHA Enterprise and
            the Google{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-2"
            >
              Privacy Policy
            </a>{" "}
            and{" "}
            <a
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-2"
            >
              Terms of Service
            </a>{" "}
            apply.
          </p>
        </div>
      </div>
    </div>
  );
}