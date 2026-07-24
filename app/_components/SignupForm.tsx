"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

export default function SignupPage() {
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
      const res = await signupUser({ ...values, role: selectedRole });

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
        router.push(
          `/verify-request?email=${encodeURIComponent(values.email)}`,
        );
        return;
      }

      toast.error("Something went wrong. Please try again.");
    });
  }

  // Password strength calculation (0 - 4)
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
    <div className="min-h-screen w-full bg-background text-white flex items-center justify-center p-4 md:p-6 font-sans relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 opacity-10 z-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Radial Background Glow */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20"
          style={{
            width: "700px",
            height: "700px",
            filter: "blur(120px)",
            background:
              "radial-gradient(circle, #6366f1 0%, rgba(0,0,0,0) 70%)",
          }}
        />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md p-2 rounded-2xl bg-[#111111]/80 border border-white/10 backdrop-blur-md relative z-10 shadow-[0_0_50px_-12px_rgba(99,102,241,0.2)]">
        <div className="bg-[#0a0a0a] rounded-xl border border-white/5 py-8 px-6 md:px-8 flex flex-col justify-between">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="mb-4 scale-90">
              <Image src={LogoImg} alt="Logo" width={48} height={48} priority />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Create an account
            </h2>
            <p className="text-zinc-400 text-xs mt-1">
              Select your account type to get started
            </p>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Modern SaaS Role Cards */}
              <div className="space-y-1.5 mb-5">
                <FormLabel className="text-xs text-zinc-400 font-medium">
                  I am joining as a
                </FormLabel>
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {/* Learner Card */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole("Learner")}
                    className={`relative flex flex-col items-start p-3 rounded-lg border text-left transition-all duration-200 ${
                      selectedRole === "Learner"
                        ? "bg-indigo-950/30 border-indigo-500/80 ring-1 ring-indigo-500/50"
                        : "bg-zinc-900/40 border-white/10 hover:border-white/20 hover:bg-zinc-900/80"
                    }`}
                  >
                    {selectedRole === "Learner" && (
                      <CheckCircle2 className="absolute top-2.5 right-2.5 w-3.5 h-3.5 text-indigo-400" />
                    )}
                    <div
                      className={`p-1.5 rounded-md mb-2 ${selectedRole === "Learner" ? "bg-indigo-600/20 text-indigo-400" : "bg-zinc-800 text-zinc-400"}`}
                    >
                      <BookOpen size={16} />
                    </div>
                    <span className="text-xs font-semibold text-white">
                      Learner
                    </span>
                    <span className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
                      Explore courses & sessions
                    </span>
                  </button>

                  {/* Educator Card */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole("Educator")}
                    className={`relative flex flex-col items-start p-3 rounded-lg border text-left transition-all duration-200 ${
                      selectedRole === "Educator"
                        ? "bg-indigo-950/30 border-indigo-500/80 ring-1 ring-indigo-500/50"
                        : "bg-zinc-900/40 border-white/10 hover:border-white/20 hover:bg-zinc-900/80"
                    }`}
                  >
                    {selectedRole === "Educator" && (
                      <CheckCircle2 className="absolute top-2.5 right-2.5 w-3.5 h-3.5 text-indigo-400" />
                    )}
                    <div
                      className={`p-1.5 rounded-md mb-2 ${selectedRole === "Educator" ? "bg-indigo-600/20 text-indigo-400" : "bg-zinc-800 text-zinc-400"}`}
                    >
                      <GraduationCap size={16} />
                    </div>
                    <span className="text-xs font-semibold text-white">
                      Educator
                    </span>
                    <span className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
                      Teach & offer bookings
                    </span>
                  </button>
                </div>
              </div>

              {/* Input Fields */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Full Name"
                        {...field}
                        className="h-11 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus:ring-indigo-500/30"
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
                        {...field}
                        className="h-11 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus:ring-indigo-500/30"
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
                      <div className="space-y-1.5">
                        <Input
                          type="password"
                          placeholder="Password"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setPassword(e.target.value);
                          }}
                          className="h-11 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus:ring-indigo-500/30"
                        />
                        {/* Password Strength Indicator */}
                        <div className="flex gap-1 h-1 w-full px-0.5 pt-1">
                          {[1, 2, 3, 4].map((step) => (
                            <div
                              key={step}
                              className={`h-full flex-1 rounded-full transition-all duration-300 ${
                                strength >= step
                                  ? strengthColors[strength]
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
                        className="h-11 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus:ring-indigo-500/30"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isPending}
                className="h-11 w-full mt-3 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-md shadow-indigo-950/50"
              >
                {isPending ? (
                  <>
                    <Loader className="animate-spin" size={16} /> Creating
                    Account...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} /> Continue as{" "}
                    {selectedRole === "Educator" ? "Educator" : "Learner"}
                  </>
                )}
              </Button>
            </form>
          </Form>

          {/* Footer Link */}
          <div className="text-center pt-6">
            <p className="text-xs text-zinc-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="p-3 bg-black/30 rounded-b-xl border-t border-white/5">
          <p className="text-[10px] text-zinc-500 text-center uppercase tracking-[0.2em]">
            Protected by SSL Encryption
          </p>
        </div>
      </div>
    </div>
  );
}

// "use client";

// import { Loader, UserPlus } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { useState, useTransition } from "react";
// import { toast } from "sonner";
// import Link from "next/link";
// import { z } from "zod";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { signupSchema } from "@/lib/zodSchemas";
// import { signupUser } from "@/app/actions/signup-user";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormMessage,
// } from "@/app/_components/ui/form";
// import { Input } from "@/app/_components/ui/input";
// import { Button } from "@/app/_components/ui/button";
// import Image from "next/image";
// import LogoImg from "@/public/images/logo.png";

// const SignupBackgroundGlow = () => (
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

// export default function SignupPage() {
//   const router = useRouter();
//   const [isPending] = useTransition();
//   const [loading, setLoading] = useState(false);
//   const [password, setPassword] = useState("");

//   const form = useForm<z.infer<typeof signupSchema>>({
//     resolver: zodResolver(signupSchema),
//     defaultValues: {
//       name: "",
//       email: "",
//       password: "",
//       confirmPassword: "",
//     },
//   });

//   async function signUpWithEmail(values: z.infer<typeof signupSchema>) {
//     setLoading(true);
//     try {
//       const res = await signupUser(values);

//       if (res.type === "awaiting_admin_approval") {
//         toast.info(
//           "Your account has been verified but is awaiting admin approval.",
//         );

//         router.push("/login");
//         return;
//       }

//       if (res.type === "exists_verified") {
//         toast.error("Account already exists. Please log in.");
//         router.push("/login");
//         return;
//       }

//       if (res.type === "exists_unverified") {
//         toast.error("An unverified account already exists with this email.");
//         router.push(`/verify-request?email=${values.email}`);
//         return;
//       }

//       if (res.type === "created") {
//         toast.success("Verification email sent. Check your inbox.");
//         router.push(`/verify-request?email=${values.email}`);
//         return;
//       }

//       toast.error("Something went wrong.");
//     } finally {
//       setLoading(false);
//     }
//   }

//   const getStrength = (pass: string) => {
//     let score = 0;
//     if (!pass) return score;
//     if (pass.length > 6) score++;
//     if (pass.match(/[A-Z]/)) score++;
//     if (pass.match(/[0-9]/)) score++;
//     if (pass.match(/[^A-Za-z0-9]/)) score++;
//     return score;
//   };

//   const strength = getStrength(password);
//   const strengthColor = [
//     "bg-zinc-800",
//     "bg-red-500",
//     "bg-orange-500",
//     "bg-yellow-500",
//     "bg-indigo-500",
//   ][strength];

//   return (
//     <div className="min-h-screen w-full bg-background text-white flex items-center justify-center p-6 font-sans relative overflow-hidden">
//       {/* Grid background like login */}
//       <div
//         className="absolute inset-0 opacity-10 z-0"
//         style={{
//           backgroundImage: `linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)`,
//           backgroundSize: "20px 20px",
//         }}
//       />

//       <SignupBackgroundGlow />

//       {/* ✅ MATCH LOGIN WIDTH */}
//       <div className="w-full max-w-md p-2 rounded-2xl bg-[#111111]/80 border border-white/10 backdrop-blur-md relative z-10 shadow-[0_0_50px_-12px_rgba(99,102,241,0.2)]">
//         {/* inner card exactly like login */}
//         <div className="bg-[#0a0a0a] rounded-xl border border-white/5 py-12 px-8 min-h-150 flex flex-col justify-between">
//           {/* header */}
//           <div className="flex flex-col items-center">
//             <div className="mb-6 scale-90">
//               <Image src={LogoImg} alt="Logo" width={50} height={50} priority />
//             </div>
//             <h2 className="text-3xl font-bold tracking-tight">
//               Create Account
//             </h2>
//             <p className="text-zinc-500 text-sm mt-2">
//               Join a community of modern developers
//             </p>
//           </div>

//           {/* form */}
//           <Form {...form}>
//             <form
//               onSubmit={form.handleSubmit(signUpWithEmail)}
//               className="space-y-5"
//             >
//               <div className="space-y-4">
//                 <FormField
//                   control={form.control}
//                   name="name"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormControl>
//                         <Input
//                           placeholder="Full Name"
//                           {...field}
//                           className="h-12 bg-zinc-900/50 border-white/10 focus:ring-indigo-500/20 text-white"
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="email"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormControl>
//                         <Input
//                           placeholder="Email Address"
//                           {...field}
//                           className="h-12 bg-zinc-900/50 border-white/10 focus:ring-indigo-500/20 text-white"
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="password"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormControl>
//                         <div className="space-y-2">
//                           <Input
//                             type="password"
//                             placeholder="Password"
//                             {...field}
//                             onChange={(e) => {
//                               field.onChange(e);
//                               setPassword(e.target.value);
//                             }}
//                             className="h-12 bg-zinc-900/50 border-white/10 focus:ring-indigo-500/20 text-white"
//                           />

//                           <div className="flex gap-1 h-1 w-full px-1">
//                             {[1, 2, 3, 4].map((step) => (
//                               <div
//                                 key={step}
//                                 className={`h-full flex-1 rounded-full transition-all duration-500 ${
//                                   strength >= step
//                                     ? strengthColor
//                                     : "bg-zinc-800"
//                                 }`}
//                               />
//                             ))}
//                           </div>
//                         </div>
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="confirmPassword"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormControl>
//                         <Input
//                           type="password"
//                           placeholder="Confirm Password"
//                           {...field}
//                           className="h-12 bg-zinc-900/50 border-white/10 focus:ring-indigo-500/20 text-white"
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               <Button
//                 type="submit"
//                 className="h-12 w-full flex items-center justify-center gap-2 bg-[#857938] hover:bg-[#857948] text-white font-bold transition-all shadow-lg shadow-black/40"
//                 disabled={loading || isPending}
//               >
//                 {loading ? (
//                   <>
//                     <Loader className="animate-spin" size={18} /> CREATING...
//                   </>
//                 ) : (
//                   <>
//                     <UserPlus size={18} /> SIGN UP
//                   </>
//                 )}
//               </Button>
//             </form>
//           </Form>

//           {/* footer */}
//           <div className="text-center pt-4">
//             <p className="text-xs text-zinc-500">
//               Already have an account?{" "}
//               <Link
//                 href="/login"
//                 className="text-indigo-400 font-medium hover:text-white transition-colors"
//               >
//                 Sign in
//               </Link>
//             </p>
//           </div>
//         </div>

//         {/* bottom strip like login */}
//         <div className="p-4 bg-black/20">
//           <p className="text-[10px] text-zinc-500 text-center uppercase tracking-[0.2em]">
//             Secure encryption • Justdy.com
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }
