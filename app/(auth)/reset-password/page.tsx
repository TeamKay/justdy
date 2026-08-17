"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");

  // ------------------------------------------------------------
  // SAFE CALLBACK URL
  // ------------------------------------------------------------

  const callbackUrl = useMemo(() => {
    const requestedCallback = searchParams.get("callbackUrl");

    if (
      requestedCallback &&
      requestedCallback.startsWith("/") &&
      !requestedCallback.startsWith("//")
    ) {
      return requestedCallback;
    }

    return "/learner/products";
  }, [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  // ------------------------------------------------------------
  // PASSWORD REQUIREMENTS
  // ------------------------------------------------------------

  const passwordRequirements = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
  };

  const requirementCount =
    Object.values(passwordRequirements).filter(Boolean).length;

  const passwordStrength =
    password.length === 0
      ? 0
      : requirementCount <= 1
        ? 1
        : requirementCount === 2
          ? 2
          : requirementCount === 3
            ? 3
            : 4;

  const strengthLabel =
    passwordStrength === 0
      ? ""
      : passwordStrength === 1
        ? "Weak"
        : passwordStrength === 2
          ? "Fair"
          : passwordStrength === 3
            ? "Good"
            : "Strong";

  // ------------------------------------------------------------
  // SUBMIT
  // ------------------------------------------------------------

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      toast.error("This password setup link is invalid or has expired.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // --------------------------------------------------------
      // SET PASSWORD
      // --------------------------------------------------------

      const { error } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (error) {
        toast.error(error.message || "Unable to set your password.");
        return;
      }

      // --------------------------------------------------------
      // IMPORTANT
      //
      // resetPassword() does NOT automatically log the customer
      // in because your Better Auth configuration has
      // autoSignInAfterVerification disabled.
      //
      // Therefore:
      //
      // 1. Send customer to homepage
      // 2. Tell homepage to open SigninModal
      // 3. Preserve learner/products as the destination
      //    after successful login.
      // --------------------------------------------------------

      const loginUrl = `/?login=true&callbackUrl=${encodeURIComponent(callbackUrl)}`;

      toast.success(
        "Password created successfully. Please sign in to continue.",
      );

      router.push(loginUrl);
      router.refresh();
    } catch (error) {
      console.error("PASSWORD SETUP ERROR:", error);

      toast.error("Something went wrong while setting your password.");
    } finally {
      setLoading(false);
    }
  }

  // ------------------------------------------------------------
  // INVALID TOKEN
  // ------------------------------------------------------------

  if (!token) {
    return (
      <main className="min-h-screen bg-[#f8fafc] px-4 py-10">
        <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
          <div className="w-full max-w-md">
            <div className="mb-8 flex justify-center">
              <div className="flex items-center gap-2">
                <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
                  <span className="text-lg font-bold text-white">J</span>
                </div>

                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Justdy
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50 sm:p-10">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-red-50">
                <LockKeyhole className="size-7 text-red-500" />
              </div>

              <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
                Link unavailable
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                This password setup link is missing, invalid, or has expired.
                Please request a new password setup link and try again.
              </p>

              <button
                type="button"
                onClick={() => router.push("/")}
                className="mt-7 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Return to Justdy
                <ArrowRight className="size-4" />
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} Justdy. All rights reserved.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ------------------------------------------------------------
  // MAIN PAGE
  // ------------------------------------------------------------

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-12">
        <section className="w-full max-w-md">
          {/* LOGO */}

          {/* CARD */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-9">
            {/* ICON */}
            <div className="flex size-12 items-center justify-center rounded-xl bg-blue-50">
              <LockKeyhole className="size-6 text-blue-600" />
            </div>

            {/* HEADER */}
            <div className="mt-6">
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Finish account setup
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Create a secure password to finish setting up your Justdy
                account and access your purchases.
              </p>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {/* PASSWORD */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-700"
                >
                  New password
                </label>

                <div className="relative mt-2">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    autoFocus
                    placeholder="Create a password"
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>

                {/* PASSWORD STRENGTH */}
                {password.length > 0 && (
                  <div className="mt-3">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition ${
                            level <= passwordStrength
                              ? passwordStrength <= 1
                                ? "bg-red-500"
                                : passwordStrength === 2
                                  ? "bg-amber-500"
                                  : passwordStrength === 3
                                    ? "bg-blue-500"
                                    : "bg-emerald-500"
                              : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>

                    <p className="mt-1.5 text-xs text-slate-500">
                      Password strength:{" "}
                      <span className="font-semibold text-slate-700">
                        {strengthLabel}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Confirm password
                </label>

                <div className="relative mt-2">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                    className={`h-12 w-full rounded-xl border bg-white px-4 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:ring-4 ${
                      confirmPassword && password !== confirmPassword
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                        : confirmPassword && password === confirmPassword
                          ? "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/10"
                          : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/10"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>

                {confirmPassword && password === confirmPassword && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                    <Check className="size-3.5" />
                    Passwords match
                  </div>
                )}
              </div>

              {/* REQUIREMENTS */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-700">
                  Your password should contain:
                </p>

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <PasswordRequirement
                    valid={passwordRequirements.length}
                    text="At least 8 characters"
                  />

                  <PasswordRequirement
                    valid={passwordRequirements.lowercase}
                    text="A lowercase letter"
                  />

                  <PasswordRequirement
                    valid={passwordRequirements.uppercase}
                    text="An uppercase letter"
                  />

                  <PasswordRequirement
                    valid={passwordRequirements.number}
                    text="A number"
                  />
                </div>
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-blue-600/30 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Setting up your account...
                  </>
                ) : (
                  <>
                    Finish Account Setup
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {/* SECURITY */}
            <div className="mt-6 flex gap-3 rounded-xl bg-slate-50 p-4">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />

              <p className="text-xs leading-5 text-slate-500">
                Your password is securely encrypted. Never share your password
                or account credentials with anyone.
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-slate-400">
            By continuing, you agree to use your Justdy account responsibly and
            keep your login credentials secure.
          </p>
        </section>
      </div>
    </main>
  );
}

// ============================================================
// PASSWORD REQUIREMENT
// ============================================================

function PasswordRequirement({
  valid,
  text,
}: {
  valid: boolean;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex size-4 shrink-0 items-center justify-center rounded-full ${
          valid
            ? "bg-emerald-100 text-emerald-600"
            : "bg-slate-200 text-slate-400"
        }`}
      >
        <Check className="size-2.5" strokeWidth={3} />
      </span>

      <span
        className={`text-xs ${valid ? "text-slate-700" : "text-slate-500"}`}
      >
        {text}
      </span>
    </div>
  );
}

// "use client";

// import { useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { authClient } from "@/lib/auth-client";
// import { toast } from "sonner";

// export default function ResetPasswordPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();

//   const token = searchParams.get("token");
//   const callbackUrl = searchParams.get("callbackUrl") || "/learner/products";

//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [loading, setLoading] = useState(false);

//   async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
//     event.preventDefault();

//     if (!token) {
//       toast.error("This password setup link is invalid or has expired.");
//       return;
//     }

//     if (password.length < 8) {
//       toast.error("Password must be at least 8 characters.");
//       return;
//     }

//     if (password !== confirmPassword) {
//       toast.error("Passwords do not match.");
//       return;
//     }

//     setLoading(true);

//     try {
//       const { error } = await authClient.resetPassword({
//         newPassword: password,
//         token,
//       });

//       if (error) {
//         toast.error(error.message || "Unable to set your password.");
//         return;
//       }

//       toast.success("Your password has been set successfully.");

//       router.push(callbackUrl);
//       router.refresh();
//     } catch (error) {
//       console.error("PASSWORD SETUP ERROR:", error);

//       toast.error("Something went wrong while setting your password.");
//     } finally {
//       setLoading(false);
//     }
//   }

//   if (!token) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
//         <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
//           <h1 className="text-2xl font-bold text-slate-900">Invalid Link</h1>

//           <p className="mt-3 text-slate-500">
//             This account setup link is missing or has expired. Please request a
//             new password setup link.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
//       <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
//         <div className="text-center">
//           <h1 className="text-2xl font-bold text-slate-900">
//             Finish Setting Up Your Account
//           </h1>

//           <p className="mt-2 text-sm text-slate-500">
//             Create a password to finish setting up your Justdy account and
//             access your purchases.
//           </p>
//         </div>

//         <form onSubmit={handleSubmit} className="mt-8 space-y-5">
//           <div>
//             <label
//               htmlFor="password"
//               className="block text-sm font-medium text-slate-700"
//             >
//               New Password
//             </label>

//             <input
//               id="password"
//               type="password"
//               value={password}
//               onChange={(event) => setPassword(event.target.value)}
//               required
//               minLength={8}
//               autoComplete="new-password"
//               className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
//               placeholder="Enter your new password"
//             />
//           </div>

//           <div>
//             <label
//               htmlFor="confirmPassword"
//               className="block text-sm font-medium text-slate-700"
//             >
//               Confirm Password
//             </label>

//             <input
//               id="confirmPassword"
//               type="password"
//               value={confirmPassword}
//               onChange={(event) => setConfirmPassword(event.target.value)}
//               required
//               minLength={8}
//               autoComplete="new-password"
//               className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
//               placeholder="Confirm your password"
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className="h-11 w-full rounded-lg bg-blue-600 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
//           >
//             {loading ? "Setting Up Account..." : "Finish Account Setup"}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

// "use client";

// import { Loader, CheckCircle2, ArrowLeft } from "lucide-react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { useState, useTransition, Suspense } from "react";
// import { toast } from "sonner";
// import { z } from "zod";
// import Link from "next/link";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { authClient } from "@/lib/auth-client";

// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormMessage,
//   FormLabel,
// } from "@/app/_components/ui/form";

// import { Input } from "@/app/_components/ui/input";
// import { Button } from "@/app/_components/ui/button";
// import MyLogo from "@/app/_components/Logo";

// const resetPasswordSchema = z
//   .object({
//     password: z.string().min(8, {
//       message: "Password must be at least 8 characters",
//     }),

//     confirmPassword: z.string(),
//   })
//   .refine((data) => data.password === data.confirmPassword, {
//     message: "Passwords do not match",
//     path: ["confirmPassword"],
//   });

// const ResetBackgroundGlow = () => (
//   <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
//     <div
//       className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-25"
//       style={{
//         width: "800px",
//         height: "800px",
//         filter: "blur(120px)",
//         background: "radial-gradient(circle, #6366f1 0%, rgba(0,0,0,0) 70%)",
//       }}
//     />
//   </div>
// );

// function ResetPasswordForm() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const token = searchParams.get("token");
//   const [isPending] = useTransition();
//   const [loading, setLoading] = useState(false);
//   const form = useForm<z.infer<typeof resetPasswordSchema>>({
//     resolver: zodResolver(resetPasswordSchema),
//     defaultValues: {
//       password: "",
//       confirmPassword: "",
//     },
//   });

//   async function onSubmit(values: z.infer<typeof resetPasswordSchema>) {
//     setLoading(true);

//     try {
//       if (!token) {
//         toast.error("Reset token is missing.");
//         return;
//       }

//       const { error } = await authClient.resetPassword({
//         newPassword: values.password,
//         token,
//       });

//       if (error) {
//         toast.error(error.message || "Failed to reset password");
//         return;
//       }

//       toast.success("Password updated successfully!");
//       router.push("/login");
//     } catch {
//       toast.error("Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="w-full max-w-md p-2 rounded-2xl bg-[#111111]/80 border border-white/10 backdrop-blur-md relative z-10 shadow-[0_0_50px_-12px_rgba(99,102,241,0.2)]">
//       <div className="bg-[#0a0a0a] rounded-xl border border-white/5 py-12 px-8 min-h-130 flex flex-col justify-between">
//         <div className="flex flex-col items-center">
//           <div className="mb-6 scale-90">
//             <MyLogo />
//           </div>

//           <h2 className="text-3xl font-bold tracking-tight text-center">
//             Create New Password
//           </h2>

//           <p className="text-zinc-500 text-sm mt-2 text-center">
//             Enter your new password below.
//           </p>
//         </div>

//         <Form {...form}>
//           <form
//             onSubmit={form.handleSubmit(onSubmit)}
//             className="space-y-6 mt-6"
//           >
//             <FormField
//               control={form.control}
//               name="password"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel className="text-xs text-zinc-400">
//                     New Password
//                   </FormLabel>

//                   <FormControl>
//                     <Input
//                       type="password"
//                       placeholder="Minimum 8 characters"
//                       {...field}
//                       className="h-12 bg-zinc-900/50 border-white/10 focus:ring-indigo-500/20 text-white"
//                     />
//                   </FormControl>

//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             <FormField
//               control={form.control}
//               name="confirmPassword"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel className="text-xs text-zinc-400">
//                     Confirm Password
//                   </FormLabel>

//                   <FormControl>
//                     <Input
//                       type="password"
//                       placeholder="Re-enter your password"
//                       {...field}
//                       className="h-12 bg-zinc-900/50 border-white/10 focus:ring-indigo-500/20 text-white"
//                     />
//                   </FormControl>

//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             <Button
//               type="submit"
//               disabled={loading || isPending}
//               className="h-12 w-full flex items-center justify-center gap-2 bg-[#857938] hover:bg-[#857948] text-white font-bold"
//             >
//               {loading ? (
//                 <Loader className="animate-spin" size={18} />
//               ) : (
//                 <CheckCircle2 size={18} />
//               )}
//               RESET PASSWORD
//             </Button>
//           </form>
//         </Form>

//         <div className="text-center mt-6">
//           <Link
//             href="/login"
//             className="inline-flex items-center gap-2 text-xs text-zinc-500 font-medium hover:text-indigo-400 transition-colors"
//           >
//             <ArrowLeft size={14} />
//             Back to login
//           </Link>
//         </div>
//       </div>

//       <div className="p-4 bg-black/20">
//         <p className="text-[10px] text-zinc-500 text-center uppercase tracking-[0.2em]">
//           Secure encryption • Justdy.com
//         </p>
//       </div>
//     </div>
//   );
// }

// export default function ResetPasswordPage() {
//   return (
//     <div className="min-h-screen w-full bg-background text-white flex items-center justify-center p-6 font-sans relative overflow-hidden">
//       <div
//         className="absolute inset-0 opacity-10 z-0"
//         style={{
//           backgroundImage: `linear-gradient(#1a1a1a 1px, transparent 1px),
// linear-gradient(90deg,#1a1a1a 1px,transparent 1px)`,

//           backgroundSize: "20px 20px",
//         }}
//       />

//       <ResetBackgroundGlow />

//       <Suspense fallback={<Loader className="animate-spin" size={32} />}>
//         <ResetPasswordForm />
//       </Suspense>
//     </div>
//   );
// }
