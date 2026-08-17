"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { loginSchema } from "@/lib/zodSchemas";
import { User } from "@/lib/auth";
import Cookies from "js-cookie";

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";

interface LoginModalProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SigninModal({ children, open, onOpenChange }: LoginModalProps) {
  const router = useRouter();
  const [isPending] = useTransition();
  const [loading, setLoading] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);

  // Read the optional destination directly from the URL.
  // This avoids setting React state from an effect.
  const searchParams = useSearchParams();

  const rawCallbackUrl = searchParams.get("callbackUrl");

  // Only allow safe internal application paths.
  const callbackUrl =
    rawCallbackUrl &&
    rawCallbackUrl.startsWith("/") &&
    !rawCallbackUrl.startsWith("//")
      ? rawCallbackUrl
      : null;

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const handleOpenChange = isControlled ? onOpenChange : setInternalOpen;

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
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

        if (handleOpenChange) {
          handleOpenChange(false);
        }

        // If the customer arrived through the purchase-access flow,
        // send them directly to their purchased products.
        if (callbackUrl) {
          // Remove callbackUrl so it is not reused accidentally.
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
          // Normal login behavior remains unchanged.
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
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="p-8 md:p-10 bg-background max-w-50 rounded-md shadow-2xl text-slate-400">
        {/* Header */}
        <DialogHeader className="text-left space-y-2 p-0">
          <DialogTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-blue-600">
            Log in or create account
          </DialogTitle>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Learn on your own time from top universities and businesses.
          </p>
        </DialogHeader>

        {/* Form */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(signInWithEmail)}
            className="space-y-4 mt-4"
          >
            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-sm font-bold text-slate-400">
                    Email <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="name@email.com"
                      {...field}
                      className="h-12 px-4 bg-white border border-slate-700 text-slate-900 placeholder:text-slate-500 text-base rounded-lg focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-sm font-bold text-slate-400">
                    Password <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      {...field}
                      className="h-12 px-4 bg-white border border-slate-700 text-slate-900 placeholder:text-slate-500 text-base rounded-lg focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit / Continue Button */}
            <Button
              type="submit"
              disabled={loading || isPending}
              className="h-12 w-full bg-[#857938] hover:bg-[#00419e] text-white font-bold text-base transition-colors rounded-lg shadow-none cursor-pointer mt-2"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader className="animate-spin h-5 w-5" />
                  <span>Processing...</span>
                </div>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </Form>

        {/* Footer Links & Terms */}
        <div className="mt-4 pt-2 text-xs space-y-3">
          <div>
            <Link
              href="/signup"
              onClick={() => handleOpenChange && handleOpenChange(false)}
              className="text-[#0056D2] underline underline-offset-2 font-normal hover:text-[#00419e]"
            >
              Sign up instead
            </Link>
          </div>

          <p className="text-slate-500 text-[11px] leading-relaxed pt-1">
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
      </DialogContent>
    </Dialog>
  );
}
