"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader, UserPlus } from "lucide-react";
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

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";

import LogoImg from "@/public/images/logo.png";

interface SignupModalProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SignupModal({
  children,
  open,
  onOpenChange,
}: SignupModalProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [internalOpen, setInternalOpen] = useState(false);

  const [showSignin, setShowSignin] = useState(false);

  const isControlled = open !== undefined;

  const isOpen = isControlled ? open : internalOpen;

  const handleOpenChange = isControlled ? onOpenChange : setInternalOpen;

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
      try {
        const res = await signupUser(values);

        if (res.type === "exists_verified") {
          toast.error("Account already exists. Please log in.");

          handleOpenChange?.(false);

          setShowSignin(true);

          return;
        }

        if (res.type === "exists_unverified") {
          toast.error("An unverified account already exists with this email.");

          handleOpenChange?.(false);

          router.push(
            `/verify-request?email=${encodeURIComponent(
              values.email.trim().toLowerCase(),
            )}`,
          );

          return;
        }

        if (res.type === "created") {
          toast.success("Verification email sent! Please check your inbox.");

          handleOpenChange?.(false);

          router.push(
            `/verify-request?email=${encodeURIComponent(
              values.email.trim().toLowerCase(),
            )}`,
          );

          return;
        }

        toast.error("Something went wrong. Please try again.");
      } catch (error) {
        console.error("SIGNUP MODAL ERROR:", error);

        toast.error("Unable to create your account. Please try again.");
      }
    });
  }

  const getStrength = (pass: string) => {
    let score = 0;

    if (!pass) {
      return score;
    }

    if (pass.length >= 8) {
      score++;
    }

    if (/[A-Z]/.test(pass)) {
      score++;
    }

    if (/[0-9]/.test(pass)) {
      score++;
    }

    if (/[^A-Za-z0-9]/.test(pass)) {
      score++;
    }

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

  const handleSignInClick = () => {
    handleOpenChange?.(false);

    setShowSignin(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        {children && <DialogTrigger asChild>{children}</DialogTrigger>}

        <DialogContent
          className="
            p-0
            border-none
            bg-transparent
            max-w-md
            w-full
            shadow-2xl
            overflow-hidden
            sm:rounded-xl
            max-h-[95vh]
            overflow-y-auto
          "
        >
          <div
            className="
              w-full
              p-1
              rounded-xl
              bg-white
              border
              border-gray-200
              relative
              z-10
              shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]
            "
          >
            <div
              className="
                bg-white
                rounded-lg
                border
                border-gray-100
                py-6
                px-5
                sm:px-8
              "
            >
              {/* Header */}
              <DialogHeader
                className="
                  flex
                  flex-col
                  items-center
                  text-center
                  space-y-1
                  mb-6
                "
              >
                <div className="mb-2">
                  <Image
                    src={LogoImg}
                    alt="Justdy"
                    width={44}
                    height={44}
                    priority
                  />
                </div>

                <DialogTitle
                  className="
                    text-2xl
                    font-bold
                    tracking-tight
                    text-[#857938]
                  "
                >
                  Create your account
                </DialogTitle>

                <p className="text-gray-500 text-xs">
                  Create your Justdy learner account.
                </p>
              </DialogHeader>

              {/* Form */}
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-3"
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
                            {...field}
                            className="
                              h-10
                              bg-white
                              border-gray-200
                              text-gray-900
                              text-xs
                              placeholder:text-gray-400
                              focus:border-[#857938]
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
                              focus:border-[#857938]
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
                            <div className="relative">
<Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Password"
                              autoComplete="new-password"
                              {...field}
                              onChange={(event) => {
                                field.onChange(event);

                                setPassword(event.target.value);
                              }}
                              className="pr-11 
                                h-10
                                bg-white
                                border-gray-200
                                text-gray-900
                                text-xs
                                placeholder:text-gray-400
                                focus:border-[#857938]
                                focus:ring-[#857938]/20
                              "
                            />

    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      aria-label={showPassword ? "Hide password" : "Show password"}
      aria-pressed={showPassword}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#857938]/40 rounded"
    >
      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
    </div>

                            <div
                              className="
                                flex
                                gap-1
                                h-1
                                w-full
                                px-0.5
                                pt-0.5
                              "
                            >
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
                          <div className="relative">
<Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm Password"
                            autoComplete="new-password"
                            {...field}
                            className="pr-11 
                              h-10
                              bg-white
                              border-gray-200
                              text-gray-900
                              text-xs
                              placeholder:text-gray-400
                              focus:border-[#857938]
                              focus:ring-[#857938]/20
                            "
                          />

    <button
      type="button"
      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
      aria-pressed={showConfirmPassword}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#857938]/40 rounded"
    >
      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
    </div>
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
                      bg-[#857938]
                      hover:bg-[#756a30]
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
                        Create Account
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              {/* Sign in */}
              <div className="text-center pt-4">
                <p className="text-xs text-gray-500">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={handleSignInClick}
                    className="
                      text-[#857938]
                      font-semibold
                      hover:text-[#756a30]
                      transition-colors
                      cursor-pointer
                    "
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>

            {/* Security */}
            <div
              className="
                p-2.5
                bg-gray-50
                border-t
                border-gray-100
                text-center
              "
            >
              <p
                className="
                  text-[10px]
                  text-gray-400
                  uppercase
                  tracking-[0.2em]
                "
              >
                Protected by SSL Encryption
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface SignupPageProps {
  onSwitchToSignin?: () => void;
}

/**
 * Full-page signup form used by /auth.
 * SignupModal remains available for landing-page/dialog use.
 */
export function SignupPage({ onSwitchToSignin }: SignupPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [showPagePassword, setShowPagePassword] = useState(false);
  const [showPageConfirmPassword, setShowPageConfirmPassword] = useState(false);

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
      try {
        const res = await signupUser(values);

        if (res.type === "exists_verified") {
          toast.error("Account already exists. Please log in.");
          onSwitchToSignin?.();
          return;
        }

        if (res.type === "exists_unverified") {
          toast.error("An unverified account already exists with this email.");
          router.push(
            `/verify-request?email=${encodeURIComponent(
              values.email.trim().toLowerCase(),
            )}`,
          );
          return;
        }

        if (res.type === "created") {
          toast.success("Verification email sent! Please check your inbox.");
          router.push(
            `/verify-request?email=${encodeURIComponent(
              values.email.trim().toLowerCase(),
            )}`,
          );
          return;
        }

        toast.error("Something went wrong. Please try again.");
      } catch (error) {
        console.error("SIGNUP PAGE ERROR:", error);
        toast.error("Unable to create your account. Please try again.");
      }
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
  const strengthColors = [
    "bg-zinc-800",
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-emerald-500",
  ];

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
       
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-foreground">
          Create your Justdy learner account.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Full Name"
                    {...field}
                   className="h-11 rounded-lg border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
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
                    placeholder="Email Address"
                    autoComplete="email"
                    {...field}
                    className="h-11 rounded-lg border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
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
                      type={showPagePassword ? "text" : "password"}
                      placeholder="Password"
                      autoComplete="new-password"
                      {...field}
                      onChange={(event) => {
                        field.onChange(event);
                        setPassword(event.target.value);
                      }}
                      className="pr-11 h-11 rounded-lg border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                   />

    <button
      type="button"
      onClick={() => setShowPagePassword(!showPagePassword)}
      aria-label={showPagePassword ? "Hide password" : "Show password"}
      aria-pressed={showPagePassword}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#857938]/40 rounded"
    >
      {showPagePassword ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
    </div>
                    <div className="flex h-1 gap-1 px-0.5">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-full flex-1 rounded-full transition-all duration-300 ${
                            strength >= step
                              ? strengthColors[strength]
                              : "bg-white/10"
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
                  <div className="relative">
<Input
                    type={showPageConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    autoComplete="new-password"
                    {...field}
                     className="pr-11 h-11 rounded-lg border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                   />

    <button
      type="button"
      onClick={() => setShowPageConfirmPassword(!showPageConfirmPassword)}
      aria-label={showPageConfirmPassword ? "Hide password" : "Show password"}
      aria-pressed={showPageConfirmPassword}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#857938]/40 rounded"
    >
      {showPageConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
            className="mt-2 h-11 w-full flex items-center justify-center gap-2 bg-[#312c65] hover:bg-[#423d75] text-white font-semibold transition-all shadow-md shadow-[#857938]/20"
          >
            {isPending ? (
              <>
                <Loader className="animate-spin" size={16} />
                Creating Account...
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Create Account
              </>
            )}
          </Button>
        </form>
      </Form>

      <div className="pt-6 text-center">
        <p className="text-sm text-foreground">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToSignin}
            className="font-semibold text-[#A78BFA] hover:text-[#C4B5FD] transition-colors"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
