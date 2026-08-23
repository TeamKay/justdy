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
}

export function SigninModal({ onSwitchToSignup }: SigninModalProps) {
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

        if (callbackUrl) {
          const url = new URL(window.location.href);

          url.searchParams.delete("callbackUrl");

          window.history.replaceState(
            {},
            "",
            `${url.pathname}${url.search}${url.hash}`,
          );

          router.push(callbackUrl);
          router.refresh();
        } else {
          router.refresh();
        }
      }
    } catch (err) {
      console.error("LOGIN ERROR:", err);

      toast.error("Something went wrong during login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full p-1 rounded-xl bg-white border border-gray-200 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]">
      <div className="bg-white rounded-lg border border-gray-100 py-7 px-5 sm:px-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3">
            <Image src={LogoImg} alt="Logo" width={44} height={44} priority />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-blue-600">
            Welcome Back
          </h2>

          <p className="text-gray-500 text-xs mt-1">
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
                    <span className="text-blue-500 ml-1">*</span>
                  </FormLabel>

                  <FormControl>
                    <Input
                      type="email"
                      placeholder="name@email.com"
                      autoComplete="email"
                      {...field}
                      className="
                        h-11
                        px-4
                        bg-white
                        border-gray-200
                        text-gray-900
                        text-sm
                        placeholder:text-gray-400
                        rounded-lg
                        focus:border-blue-500
                        focus:ring-[#857938]/20
                        transition-all
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
                    <span className="text-blue-500 ml-1">*</span>
                  </FormLabel>

                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      {...field}
                      className="
                        h-11
                        px-4
                        bg-white
                        border-gray-200
                        text-gray-900
                        text-sm
                        placeholder:text-gray-400
                        rounded-lg
                        focus:border-blue-600
                        focus:ring-[#857938]/20
                        transition-all
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
                h-11
                w-full
                mt-2
                bg-blue-500
                hover:bg-blue-600
                text-white
                font-semibold
                text-sm
                rounded-lg
                transition-all
                shadow-md
                shadow-[#857938]/20
                cursor-pointer
              "
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader className="animate-spin h-4 w-4" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <span>Continue</span>
              )}
            </Button>
          </form>
        </Form>

        {/* Switch to Signup */}
        <div className="text-center mt-6 pt-5 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="
                inline-flex
                items-center
                gap-1
                text-blue-500
                font-semibold
                hover:text-blue-600
                transition-colors
                cursor-pointer
              "
            >
              Sign up instead
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </p>
        </div>

        {/* reCAPTCHA */}
        <p className="text-gray-400 text-[10px] leading-relaxed text-center mt-5">
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
      <div className="p-2.5 bg-gray-50 border-t border-gray-100 text-center rounded-b-xl">
        <p className="text-[9px] text-gray-400 uppercase tracking-[0.2em]">
          Protected by SSL Encryption
        </p>
      </div>
    </div>
  );
}
