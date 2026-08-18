import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f8fafc] px-4 py-10">
          <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

              <p className="text-sm text-slate-500">
                Loading password setup...
              </p>
            </div>
          </div>
        </main>
      }
    >
      <ResetPasswordClient />
    </Suspense>
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
