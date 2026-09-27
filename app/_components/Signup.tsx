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
  FormMessage,
} from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import { Button } from "@/app/_components/ui/button";

import LogoImg from "@/public/images/logo.png";

interface SignupPageProps {
  onSwitchToSignin?: () => void;
  onSuccess?: () => void;
}

export function SignupPage({
  onSwitchToSignin,
  onSuccess,
}: SignupPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
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

  async function onSubmit(
    values: z.infer<typeof signupSchema>,
  ) {
    startTransition(async () => {
      const res = await signupUser({
        ...values,

        // This signup page is ONLY for learners.
      });

      if (res.type === "awaiting_admin_approval") {
        toast.info(
          "Your account is awaiting admin approval.",
        );

        onSuccess?.();
        return;
      }

      if (res.type === "exists_verified") {
        toast.error(
          "Account already exists. Please log in.",
        );

        if (onSwitchToSignin) {
          onSwitchToSignin();
        } else {
          router.push("/signin");
        }

        return;
      }

      if (res.type === "exists_unverified") {
        toast.error(
          "An unverified account already exists with this email.",
        );

        onSuccess?.();

        router.push(
          `/verify-request?email=${encodeURIComponent(
            values.email,
          )}`,
        );

        return;
      }

      if (res.type === "created") {
        toast.success(
          "Verification email sent! Please check your inbox.",
        );

        onSuccess?.();

        router.push(
          `/verify-request?email=${encodeURIComponent(
            values.email,
          )}`,
        );

        return;
      }

      toast.error(
        "Something went wrong. Please try again.",
      );
    });
  }

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

  const strengthClasses = [
    "bg-muted",
    "bg-destructive",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-emerald-500",
  ];

  return (
    <div className="w-full text-foreground">
      <div className="p-0">
        {/* Header */}
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Image
              src={LogoImg}
              alt="Justdy"
              width={40}
              height={40}
              priority
            />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Create your account
          </h2>

          <p className="mt-1.5 text-xs text-muted-foreground">
            Create your Justdy learner account and start learning.
          </p>
        </div>

        {/* Form */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
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
                      className="h-11 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
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
                      className="h-11 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
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
                    <div className="space-y-1.5">
                      <Input
                        type="password"
                        placeholder="Password"
                        autoComplete="new-password"
                        {...field}
                        onChange={(event) => {
                          field.onChange(event);
                          setPassword(event.target.value);
                        }}
                        className="h-11 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                      />

                      {/* Password strength */}
                      <div
                        className="flex h-1 gap-1 px-0.5"
                        aria-label={`Password strength ${strength} of 4`}
                      >
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-full flex-1 rounded-full transition-colors ${
                              strength >= step
                                ? strengthClasses[strength]
                                : "bg-muted"
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
                      className="h-11 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
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
              className="mt-2 h-11 w-full rounded-md bg-emerald-900 font-semibold text-white shadow-sm transition-all hover:bg-primary/90"
            >
              {isPending ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create Learner Account
                </>
              )}
            </Button>
          </form>
        </Form>

        {/* Sign in */}
        <div className="mt-6 border-t border-border pt-5 text-center">
          <p className="text-xs text-muted-foreground">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => {
                if (onSwitchToSignin) {
                  onSwitchToSignin();
                } else {
                  router.push("/signin");
                }
              }}
              className="inline-flex items-center gap-1 font-semibold text-primary transition-colors hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Sign in
            </button>
          </p>
        </div>

        {/* Tutor application */}
        <div className="mt-5 text-center">
          <p className="text-xs text-muted-foreground">
            Want to teach on Justdy?{" "}
            <button
              type="button"
              onClick={() => router.push("/become-a-tutor")}
              className="font-semibold text-primary transition-colors hover:underline"
            >
              Become a tutor
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}