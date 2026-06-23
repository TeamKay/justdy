"use client";

import { Loader, KeyRound, ArrowLeft } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { z } from "zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@/lib/auth-client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import { Button } from "@/app/_components/ui/button";
import Image from "next/image";
import LogoImg from "@/public/images/logo.png";

// Matching zod schema for the email field
const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

const ForgotBackgroundGlow = () => (
  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-25"
      style={{
        width: "800px",
        height: "800px",
        filter: "blur(120px)",
        background: "radial-gradient(circle, #6366f1 0%, rgba(0,0,0,0) 70%)",
      }}
    />
  </div>
);

export default function ForgotPasswordPage() {
  const [isPending] = useTransition();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function handleResetPassword(
    values: z.infer<typeof forgotPasswordSchema>,
  ) {
    setLoading(true);

    try {
      const { error } = await authClient.requestPasswordReset({
        email: values.email,
        redirectTo: "/reset-password",
      });

      // Better-Auth will catch the server-side error thrown above and display it here
      if (error) {
        toast.error(
          error.message || "Failed to process password reset request.",
        );
        return;
      }

      toast.success("Password reset link sent! Check your email.");
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-background text-white flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Grid Pattern overlay */}
      <div
        className="absolute inset-0 opacity-10 z-0"
        style={{
          backgroundImage: `linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      ></div>

      <ForgotBackgroundGlow />

      <div className="w-full max-w-md p-2 rounded-2xl bg-[#111111]/80 border border-white/10 backdrop-blur-md relative z-10 shadow-[0_0_50px_-12px_rgba(99,102,241,0.2)]">
        <div className="bg-[#0a0a0a] rounded-xl border border-white/5 py-12 px-8 min-h-130 flex flex-col justify-between">
          {/* Header & Logo */}
          <div className="flex flex-col items-center">
            <div className="mb-6 scale-90">
              <Image src={LogoImg} alt="Logo" width={50} height={50} priority />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-center">
              Forgot Password
            </h2>
            <p className="text-zinc-500 text-sm mt-2 text-center max-w-70">
              Enter your email address and we&apos;ll send you a link to reset
              your password.
            </p>
          </div>

          {/* Form implementation */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleResetPassword)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Email Address"
                        {...field}
                        className="h-12 bg-zinc-900/50 border-white/10 focus:ring-indigo-500/20 text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="h-12 w-full flex items-center justify-center gap-2 bg-[#857938] hover:bg-[#857948] text-white font-bold transition-all shadow-lg shadow-black/40"
                disabled={loading || isPending}
              >
                {loading ? (
                  <Loader className="animate-spin" size={18} />
                ) : (
                  <KeyRound size={18} />
                )}
                SEND RESET LINK
              </Button>
            </form>
          </Form>

          {/* Navigation Back */}
          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs text-zinc-500 font-medium hover:text-indigo-400 transition-colors group"
            >
              <ArrowLeft
                size={14}
                className="group-hover:-translate-x-1 transition-transform"
              />
              Back to login
            </Link>
          </div>
        </div>

        {/* Footer info text */}
        <div className="p-4 bg-black/20">
          <p className="text-[10px] text-zinc-500 text-center uppercase tracking-[0.2em]">
            Secure encryption • Justdy.com
          </p>
        </div>
      </div>
    </div>
  );
}
