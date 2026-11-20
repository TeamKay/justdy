"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight,
  Eye,
  EyeOff,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import LogoImg from "@/public/images/logo.png";
import { signupSchema } from "@/lib/zodSchemas";
import { registerTutor } from "@/app/actions/register-tutor";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/app/_components/ui/form";

import { Input } from "@/app/_components/ui/input";
import { Button } from "@/app/_components/ui/button";

type TutorRegistrationValues = z.infer<typeof signupSchema>;

export default function TutorRegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<TutorRegistrationValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  function getPasswordStrength(value: string) {
    if (!value) return 0;

    let score = 0;

    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;

    return score;
  }

  const strength = getPasswordStrength(password);

  const strengthColors = [
    "bg-zinc-200",
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-emerald-500",
  ];

  async function onSubmit(values: TutorRegistrationValues) {
    startTransition(async () => {
      try {
        const result = await registerTutor(values);

        if (result.type === "exists_other") {
          toast.error(
            "This email already belongs to an existing learner or administrator account. Please sign in or use a different email to register separately as a tutor.",
          );
          router.push("/auth?mode=signin");
          return;
        }

        if (result.type === "exists_verified") {
          toast.error(
            "An account already exists with this email. Please sign in or use another email.",
          );
          router.push("/auth?mode=signin");
          return;
        }

        if (result.type === "exists_unverified") {
          toast.info(
            "An unverified account already exists with this email. Check your inbox or request another verification email.",
          );

          router.push(
            `/verify-request?email=${encodeURIComponent(
              values.email.trim().toLowerCase(),
            )}`,
          );
          return;
        }

        if (result.type === "created") {
          toast.success(
            "Your tutor account has been created. Please check your email for verification instructions.",
          );

          router.push(
            `/verify-request?email=${encodeURIComponent(
              values.email.trim().toLowerCase(),
            )}&account=tutor`,
          );
        }
      } catch (error) {
        console.error("TUTOR REGISTRATION ERROR:", error);

        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to create your tutor account. Please try again.",
        );
      }
    });
  }

  return (
    <main className="min-h-screen bg-[#F8FAF8] text-[#173B2F]">
      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
        {/* Brand panel */}
        <section className="relative hidden overflow-hidden bg-[#173B2F] lg:flex">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle, #D9E9DE 1px, transparent 1.2px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="absolute -bottom-40 -right-32 h-[500px] w-[500px] rounded-full bg-[#B97832]/15 blur-3xl" />

          <div className="relative z-10 flex min-h-screen w-full flex-col justify-between p-12 xl:p-16">
            <Link href="/" className="flex w-fit items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white">
                <Image
                  src={LogoImg}
                  alt="Justdy"
                  width={44}
                  height={44}
                  priority
                />
              </div>
              <span className="text-xl font-semibold tracking-tight text-white">
                Justdy
              </span>
            </Link>

            <div className="max-w-xl pb-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-emerald-50">
                <GraduationCap className="h-4 w-4" />
                Teach with Justdy
              </div>

              <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight text-white xl:text-6xl">
                Share what you know.
                <span className="mt-2 block text-[#E6BD8B]">
                  Shape what comes next.
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-8 text-emerald-50/75">
                Join a learning community where great educators help learners
                build confidence, understand difficult ideas, and reach their
                goals.
              </p>

              <div className="mt-12 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#E6BD8B]">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      Share your expertise
                    </p>
                    <p className="mt-1 text-sm text-emerald-50/65">
                      Help learners understand and grow.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#E6BD8B]">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      Connect with learners
                    </p>
                    <p className="mt-1 text-sm text-emerald-50/65">
                      Become part of an educational community.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#E6BD8B]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      A reviewed teaching profile
                    </p>
                    <p className="mt-1 text-sm text-emerald-50/65">
                      Teaching access follows administrator approval.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-emerald-50/50">
              <span>© {new Date().getFullYear()} Justdy</span>
              <span>Learn. Share. Grow.</span>
            </div>
          </div>
        </section>

        {/* Registration panel */}
        <section className="flex min-h-screen flex-col bg-white">
          <div className="flex items-center justify-between px-6 py-6 sm:px-10">
            <Link
              href="/"
              className="text-sm font-medium text-[#52645A] transition hover:text-[#173B2F]"
            >
              ← Back to Justdy
            </Link>

            <Link
              href="/auth?mode=signin"
              className="text-sm font-medium text-[#52645A] transition hover:text-[#173B2F]"
            >
              Sign in
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center px-5 pb-12 sm:px-10">
            <div className="w-full max-w-md">
              <div className="mb-8 text-center">
                <div className="mb-5 flex justify-center lg:hidden">
                  <Image
                    src={LogoImg}
                    alt="Justdy"
                    width={58}
                    height={58}
                    priority
                  />
                </div>

                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#EAF3ED] px-3 py-1.5 text-xs font-semibold text-[#246044]">
                  <GraduationCap className="h-4 w-4" />
                  TUTOR REGISTRATION
                </div>

                <h2 className="text-3xl font-semibold tracking-tight text-[#173B2F]">
                  Become a Justdy tutor
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#68786F]">
                  Create your tutor account to begin your teaching journey.
                </p>
              </div>

              <div className="mb-7 rounded-xl border border-[#DCE9DF] bg-[#F5F9F6] p-4">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#28734C]" />
                  <div>
                    <p className="text-sm font-semibold text-[#173B2F]">
                      Your teaching access is reviewed
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#617168]">
                      Your account will be registered as a tutor. You must
                      verify your email and receive administrator approval
                      before accessing teaching features.
                    </p>
                  </div>
                </div>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Full name"
                            autoComplete="name"
                            {...field}
                            className="h-12 rounded-xl border-[#DCE4DE] bg-white px-4 text-[#173B2F] placeholder:text-[#9AA79F] focus-visible:ring-[#28734C]"
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
                            type="email"
                            placeholder="Email address"
                            autoComplete="email"
                            {...field}
                            className="h-12 rounded-xl border-[#DCE4DE] bg-white px-4 text-[#173B2F] placeholder:text-[#9AA79F] focus-visible:ring-[#28734C]"
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
                          <div className="space-y-2">
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Create a password"
                                autoComplete="new-password"
                                {...field}
                                onChange={(event) => {
                                  field.onChange(event);
                                  setPassword(event.target.value);
                                }}
                                className="h-12 rounded-xl border-[#DCE4DE] bg-white px-4 pr-12 text-[#173B2F] placeholder:text-[#9AA79F] focus-visible:ring-[#28734C]"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword((value) => !value)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                aria-pressed={showPassword}
                                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#89958D] transition hover:text-[#246044]"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-5 w-5" />
                                ) : (
                                  <Eye className="h-5 w-5" />
                                )}
                              </button>
                            </div>

                            <div className="flex h-1 gap-1 px-1">
                              {[1, 2, 3, 4].map((step) => (
                                <div
                                  key={step}
                                  className={`flex-1 rounded-full transition-colors ${
                                    strength >= step
                                      ? strengthColors[strength]
                                      : "bg-[#E8EDE9]"
                                  }`}
                                />
                              ))}
                            </div>

                            <p className="text-xs text-[#89958D]">
                              Use at least 8 characters. A mix of uppercase
                              letters, numbers, and symbols makes your password
                              stronger.
                            </p>
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
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm password"
                              autoComplete="new-password"
                              {...field}
                              className="h-12 rounded-xl border-[#DCE4DE] bg-white px-4 pr-12 text-[#173B2F] placeholder:text-[#9AA79F] focus-visible:ring-[#28734C]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword((value) => !value)}
                              aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}
                              aria-pressed={showConfirmPassword}
                              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#89958D] transition hover:text-[#246044]"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isPending}
                    className="mt-3 h-12 w-full rounded-xl bg-[#246044] text-sm font-semibold text-white shadow-sm transition hover:bg-[#194C35] disabled:opacity-60"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating tutor account…
                      </>
                    ) : (
                      <>
                        Create tutor account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              <div className="mt-7 border-t border-[#EDF0ED] pt-6 text-center">
                <p className="text-sm text-[#68786F]">
                  Want to join as a learner instead?{" "}
                  <Link
                    href="/auth?mode=signup"
                    className="font-semibold text-[#246044] hover:text-[#173B2F]"
                  >
                    Create a learner account
                  </Link>
                </p>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#9AA79F]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Your account information is protected by Justdy.
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
