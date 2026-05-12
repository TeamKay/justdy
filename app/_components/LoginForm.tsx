"use client";

import { Loader, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { z } from "zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@/lib/auth-client";
import { loginSchema } from "@/lib/zodSchemas";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import { Button } from "@/app/_components/ui/button";
import Cookies from "js-cookie";
import { User } from "@/lib/auth";
import MyLogo from "@/app/_components/Logo";

const LoginBackgroundGlow = () => (
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

export default function LoginPage() {
  const router = useRouter();
  const [isPending] = useTransition();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function signInWithEmail(values: z.infer<typeof loginSchema>) {
    setLoading(true);
    const { data, error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });

    if (data && data.user) {
      const role = (data.user as User).role?.toLowerCase() || "student";
      Cookies.set("role", role, {
        expires: 7,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
      router.push("/");
      toast.success("Successfully Logged In!");
    }

    if (error) {
      setLoading(false);
      toast.error(error.message || "Invalid credentials");
      return;
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen w-full bg-background text-white flex items-center justify-center p-6 font-sans relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-10 z-0"
        style={{
          backgroundImage: `linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      ></div>

      <LoginBackgroundGlow />

      <div className="w-full max-w-md p-2 rounded-2xl bg-[#111111]/80 border border-white/10 backdrop-blur-md relative z-10 shadow-[0_0_50px_-12px_rgba(99,102,241,0.2)]">
        {/* Added min-h-[600px] and flex-col justify-between to stretch the card */}
        <div className="bg-[#0a0a0a] rounded-xl border border-white/5 py-12 px-8 min-h-130 flex flex-col justify-between">
          <div className="flex flex-col items-center">
            <div className="mb-6 scale-90">
              <MyLogo />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Login</h2>
            <p className="text-zinc-500 text-sm mt-2">
              Sign in to your account
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(signInWithEmail)}
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

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Password"
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
                  <LogIn size={18} />
                )}
                SIGN IN
              </Button>
            </form>
          </Form>

          <div className="text-center">
            <p className="text-xs text-zinc-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-indigo-400 font-medium hover:text-white transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <div className="p-4 bg-black/20">
          <p className="text-[10px] text-zinc-500 text-center uppercase tracking-[0.2em]">
            Secure encryption • Justdy.com
          </p>
        </div>
      </div>
    </div>
  );
}
