"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { loginSchema } from "@/lib/zodSchemas";
import { User } from "@/lib/auth";
import Cookies from "js-cookie";
import LogoImg from "@/public/images/logo.png";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/_components/ui/form";

import { Input } from "@/app/_components/ui/input";
import { Button } from "@/app/_components/ui/button";

interface SigninModalProps {
  onSwitchToSignup?: () => void;
  onSuccess?: () => void;
}

export function SigninModal({ onSwitchToSignup, onSuccess }: SigninModalProps) {
  const router = useRouter();

  const [isPending] = useTransition();
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();

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

  async function signInWithEmail(values: z.infer<typeof loginSchema>) {
    setLoading(true);

    try {
      const { data, error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
      });

      if (error) {
        toast.error(error.message || "Invalid credentials");
        return;
      }

      if (data?.user) {
        const role = (data.user as User).role?.toLowerCase() || "student";

        Cookies.set("role", role, {
          expires: 7,
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });

        toast.success("Successfully logged in!");

        // Close authentication modal
        onSuccess?.();

        if (callbackUrl) {
          const url = new URL(window.location.href);

          url.searchParams.delete("callbackUrl");

          window.history.replaceState(
            {},
            "",
            `${url.pathname}${url.search}${url.hash}`,
          );

          router.push(callbackUrl);
        }

        router.refresh();
      }
    } catch (err) {
      console.error("LOGIN ERROR:", err);

      toast.error("Something went wrong during login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white p-1 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]">
      <div className="rounded-lg border border-gray-100 bg-white px-5 py-7 sm:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3">
            <Image src={LogoImg} alt="Logo" width={44} height={44} priority />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-blue-600">
            Welcome Back
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Login to continue your learning
          </p>
        </div>

        {/* Form */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(signInWithEmail)}
            className="space-y-4"
          >
            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold text-gray-600">
                    Email
                    <span className="ml-1 text-blue-500">*</span>
                  </FormLabel>

                  <FormControl>
                    <Input
                      type="email"
                      placeholder="name@email.com"
                      autoComplete="email"
                      {...field}
                      className="
                        h-11
                        rounded-lg
                        border-gray-200
                        bg-white
                        px-4
                        text-sm
                        text-gray-900
                        placeholder:text-gray-400
                        transition-all
                        focus:border-blue-500
                        focus:ring-[#857938]/20
                      "
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
                  <FormLabel className="text-xs font-semibold text-gray-600">
                    Password
                    <span className="ml-1 text-blue-500">*</span>
                  </FormLabel>

                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      {...field}
                      className="
                        h-11
                        rounded-lg
                        border-gray-200
                        bg-white
                        px-4
                        text-sm
                        text-gray-900
                        placeholder:text-gray-400
                        transition-all
                        focus:border-blue-600
                        focus:ring-[#857938]/20
                      "
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading || isPending}
              className="
                mt-2
                h-11
                w-full
                cursor-pointer
                rounded-lg
                bg-blue-500
                text-sm
                font-semibold
                text-white
                shadow-md
                shadow-[#857938]/20
                transition-all
                hover:bg-blue-600
              "
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <span>Continue</span>
              )}
            </Button>
          </form>
        </Form>

        {/* Switch to Signup */}
        <div className="mt-6 border-t border-gray-100 pt-5 text-center">
          <p className="text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="
                inline-flex
                cursor-pointer
                items-center
                gap-1
                font-semibold
                text-blue-500
                transition-colors
                hover:text-blue-600
              "
            >
              Sign up instead
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </p>
        </div>

        {/* reCAPTCHA */}
        <p className="mt-5 text-center text-[10px] leading-relaxed text-gray-400">
          This site is protected by reCAPTCHA Enterprise and the Google{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noreferrer"
            className="text-[#0056D2] underline underline-offset-2"
          >
            Privacy Policy
          </a>{" "}
          and{" "}
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noreferrer"
            className="text-[#0056D2] underline underline-offset-2"
          >
            Terms of Service
          </a>{" "}
          apply.
        </p>
      </div>

      {/* Bottom Banner */}
      <div className="rounded-b-xl border-t border-gray-100 bg-gray-50 p-2.5 text-center">
        <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400">
          Protected by SSL Encryption
        </p>
      </div>
    </div>
  );
}
