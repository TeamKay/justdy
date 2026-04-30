"use client";

import { Loader, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { signupSchema } from "@/lib/zodSchemas";
import { signupUser } from "@/app/actions/signup-user";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import { Button } from "@/app/_components/ui/button";
import MyLogo from "@/app/_components/Logo";

const SignupBackgroundGlow = () => (
  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20"
      style={{
        width: "800px",
        height: "800px",
        filter: "blur(120px)",
        background: "radial-gradient(circle, #6366f1 0%, rgba(0,0,0,0) 70%)",
      }}
    />
  </div>
);

export default function SignupPage() {
  const router = useRouter();
  const [isPending] = useTransition();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function signUpWithEmail(values: z.infer<typeof signupSchema>) {
    setLoading(true);
    try {
      const res = await signupUser(values);

      if (res.type === "exists_verified") {
        toast.error("Account already exists. Please log in.");
        router.push("/login");
        return;
      }

      if (res.type === "exists_unverified") {
        toast.success("Account exists but not verified. We sent a new OTP.");
        router.push(`/verify-request?email=${values.email}`);
        return;
      }

      if (res.type === "created") {
        toast.success("Verification OTP sent! Check your email.");
        router.push(`/verify-request?email=${values.email}`);
        return;
      }

      if (res.type === "invalid_data") {
        toast.error("Please check your form details.");
        return;
      }

      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const [password, setPassword] = useState("");

  const getStrength = (pass: string) => {
    let score = 0;
    if (!pass) return score;
    if (pass.length > 6) score++;
    if (pass.match(/[A-Z]/)) score++;
    if (pass.match(/[0-9]/)) score++;
    if (pass.match(/[^A-Za-z0-9]/)) score++;
    return score;
  };

  const strength = getStrength(password);
  const strengthColor = [
    "bg-zinc-800",
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-indigo-500",
  ][strength];

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4 sm:p-8 py-12 relative font-sans overflow-x-hidden">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-10 z-0"
        style={{
          backgroundImage: `linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <SignupBackgroundGlow />

      {/* --- THE FRAME --- */}
      <div className="relative z-10 w-full max-w-2xl">
        <div className="bg-[#111111]/60 border border-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]">
          <div className="w-full space-y-8">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-6 scale-90">
                <MyLogo />
              </div>
              <h2 className="text-3xl font-bold mb-2 tracking-tight">
                Create your account
              </h2>
              <p className="text-zinc-400">
                Join a community of modern developers
              </p>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(signUpWithEmail)}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Full Name"
                            {...field}
                            className="h-12 bg-zinc-900/50 border-white/10 focus:ring-indigo-500/20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Email Address"
                            {...field}
                            className="h-12 bg-zinc-900/50 border-white/10 focus:ring-indigo-500/20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-2">
                            <Input
                              type="password"
                              placeholder="Password"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                setPassword(e.target.value);
                              }}
                              className="h-12 bg-zinc-900/50 border-white/10 focus:ring-indigo-500/20"
                            />
                            <div className="flex gap-1 h-1 w-full px-1">
                              {[1, 2, 3, 4].map((step) => (
                                <div
                                  key={step}
                                  className={`h-full flex-1 rounded-full transition-all duration-500 ${
                                    strength >= step
                                      ? strengthColor
                                      : "bg-zinc-800"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Confirm Password"
                            {...field}
                            className="h-12 bg-zinc-900/50 border-white/10 focus:ring-indigo-500/20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full flex items-center justify-center gap-2 bg-[#857938] hover:bg-[#9a8d45] text-white font-bold transition-all hover:scale-[1.01] active:scale-[0.98] shadow-lg"
                  disabled={loading || isPending}
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin" size={18} /> CREATING...
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} /> GET STARTED
                    </>
                  )}
                </Button>

                <div className="pt-4 text-center">
                  <p className="text-zinc-500 text-sm">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="font-bold text-white underline underline-offset-4 hover:text-indigo-400 transition-colors"
                    >
                      Log in
                    </Link>
                  </p>
                </div>
              </form>
            </Form>

            <p className="text-[10px] text-zinc-600 text-center leading-relaxed max-w-[320px] mx-auto uppercase tracking-widest">
              Secure encryption • Justdy.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
