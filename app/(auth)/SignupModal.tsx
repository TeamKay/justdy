"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Loader,
  UserPlus,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";

import { toast } from "sonner";

import { signupSchema } from "@/lib/zodSchemas";
import { signupUser } from "@/app/actions/signup-user";

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

import LogoImg from "@/public/images/logo.png";

type RoleOption = "Learner" | "Educator";

interface SignupModalProps {
  onSwitchToSignin?: () => void;
  onSuccess?: () => void;
}

export function SignupModal({ onSwitchToSignin, onSuccess }: SignupModalProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [selectedRole, setSelectedRole] = useState<RoleOption>("Learner");

  const [password, setPassword] = useState("");

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),

    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof signupSchema>) {
    startTransition(async () => {
      const res = await signupUser({
        ...values,
        role: selectedRole,
      });

      if (res.type === "awaiting_admin_approval") {
        toast.info("Your account is awaiting admin approval.");

        router.push("/login");

        return;
      }

      if (res.type === "exists_verified") {
        toast.error("Account already exists. Please log in.");

        router.push("/login");

        return;
      }

      if (res.type === "exists_unverified") {
        toast.error("An unverified account already exists with this email.");

        router.push(
          `/verify-request?email=${encodeURIComponent(values.email)}`,
        );

        return;
      }
      if (res.type === "created") {
        toast.success("Verification email sent! Please check your inbox.");

        onSuccess?.();

        router.push(
          `/verify-request?email=${encodeURIComponent(values.email)}`,
        );

        return;
      }

      toast.error("Something went wrong. Please try again.");
    });
  }

  // Password strength calculation
  const getStrength = (pass: string) => {
    let score = 0;

    if (!pass) return score;

    if (pass.length >= 8) score++;

    if (/[A-Z]/.test(pass)) score++;

    if (/[0-9]/.test(pass)) score++;

    if (/[^A-Za-z0-9]/.test(pass)) score++;

    return score;
  };

  const strength = getStrength(password);

  const strengthColors = [
    "bg-zinc-800",
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-emerald-500",
  ];

  return (
    <div className="w-full p-1 rounded-xl bg-white border border-gray-200 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]">
      <div className="bg-white rounded-lg border border-gray-100 py-6 px-5 sm:px-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3">
            <Image src={LogoImg} alt="Logo" width={44} height={44} priority />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-blue-600">
            Create your account
          </h2>

          <p className="text-gray-500 text-xs mt-1">
            Select your account type to get started
          </p>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            {/* Role Selection */}
            <div className="space-y-1 mb-4">
              <FormLabel className="text-[11px] text-gray-600 font-medium">
                I am joining as a
              </FormLabel>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {/* Learner */}
                <button
                  type="button"
                  onClick={() => setSelectedRole("Learner")}
                  className={`
                    relative
                    flex
                    flex-col
                    items-start
                    p-3
                    rounded-md
                    border
                    text-left
                    transition-all
                    duration-200
                    cursor-pointer

                    ${
                      selectedRole === "Learner"
                        ? "bg-[#857938]/5 border-blue-500 ring-1 ring-[#857938]/20 shadow-sm"
                        : "bg-white border-gray-200 hover:border-[#857938]/50 hover:bg-[#857938]/3"
                    }
                  `}
                >
                  {selectedRole === "Learner" && (
                    <CheckCircle2
                      className="
                        absolute
                        top-2
                        right-2
                        w-3.5
                        h-3.5
                        text-blue-500
                      "
                    />
                  )}

                  <div
                    className={`
                      p-1.5
                      rounded-md
                      mb-1.5

                      ${
                        selectedRole === "Learner"
                          ? "bg-[#857938]/10 text-blue-500"
                          : "bg-gray-100 text-gray-500"
                      }
                    `}
                  >
                    <BookOpen size={15} />
                  </div>

                  <span className="text-xs font-semibold text-blue-500">
                    Learner
                  </span>

                  <span className="text-[9px] text-gray-500 mt-0.5">
                    Explore courses
                  </span>
                </button>

                {/* Educator */}
                <button
                  type="button"
                  onClick={() => setSelectedRole("Educator")}
                  className={`
                    relative
                    flex
                    flex-col
                    items-start
                    p-3
                    rounded-md
                    border
                    text-left
                    transition-all
                    duration-200
                    cursor-pointer

                    ${
                      selectedRole === "Educator"
                        ? "bg-[#857938]/5 border-blue-500 ring-1 ring-[#857938]/20 shadow-sm"
                        : "bg-white border-gray-200 hover:border-[#857938]/50 hover:bg-[#857938]/3"
                    }
                  `}
                >
                  {selectedRole === "Educator" && (
                    <CheckCircle2
                      className="
                        absolute
                        top-2
                        right-2
                        w-3.5
                        h-3.5
                        text-blue-600
                      "
                    />
                  )}

                  <div
                    className={`
                      p-1.5
                      rounded-md
                      mb-1.5

                      ${
                        selectedRole === "Educator"
                          ? "bg-[#857938]/10 text-[#857938]"
                          : "bg-gray-100 text-gray-500"
                      }
                    `}
                  >
                    <GraduationCap size={15} />
                  </div>

                  <span className="text-xs font-semibold text-blue-600">
                    Educator
                  </span>

                  <span className="text-[9px] text-gray-500 mt-0.5">
                    Teach & offer bookings
                  </span>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Full Name"
                      autoComplete="name"
                      {...field}
                      className="
                        h-10
                        bg-white
                        border-gray-200
                        text-gray-900
                        text-xs
                        placeholder:text-gray-400
                        focus:border-blue-500
                        focus:ring-[#857938]/20
                      "
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Email Address"
                      autoComplete="email"
                      {...field}
                      className="
                        h-10
                        bg-white
                        border-gray-200
                        text-gray-900
                        text-xs
                        placeholder:text-gray-400
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
                <FormItem>
                  <FormControl>
                    <div className="space-y-1">
                      <Input
                        type="password"
                        placeholder="Password"
                        autoComplete="new-password"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setPassword(e.target.value);
                        }}
                        className="
                          h-10
                          bg-white
                          border-gray-200
                          text-gray-900
                          text-xs
                          placeholder:text-gray-400
                          focus:border-blue-500
                          focus:ring-[#857938]/20
                        "
                      />

                      {/* Password Strength */}
                      <div className="flex gap-1 h-1 w-full px-0.5 pt-0.5">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`
                              h-full
                              flex-1
                              rounded-full
                              transition-all
                              duration-300

                              ${
                                strength >= step
                                  ? strengthColors[strength]
                                  : "bg-gray-200"
                              }
                            `}
                          />
                        ))}
                      </div>
                    </div>
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm Password */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm Password"
                      autoComplete="new-password"
                      {...field}
                      className="
                        h-10
                        bg-white
                        border-gray-200
                        text-gray-900
                        text-xs
                        placeholder:text-gray-400
                        focus:border-blue-500
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
              disabled={isPending}
              className="
                h-10
                w-full
                mt-2
                flex
                items-center
                justify-center
                gap-2
                bg-blue-500
                hover:bg-blue-600
                text-white
                font-semibold
                text-xs
                transition-all
                shadow-md
                shadow-[#857938]/20
                cursor-pointer
              "
            >
              {isPending ? (
                <>
                  <Loader className="animate-spin" size={15} />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus size={15} />
                  Continue as{" "}
                  {selectedRole === "Educator" ? "Educator" : "Learner"}
                </>
              )}
            </Button>
          </form>
        </Form>

        {/* Switch to Sign In */}
        <div className="text-center pt-5 mt-5 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToSignin}
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
              <ArrowLeft size={13} />
              Sign in
            </button>
          </p>
        </div>
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
