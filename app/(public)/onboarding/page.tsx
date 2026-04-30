"use client";

import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  GraduationCap,
  Loader2,
  User,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { Textarea } from "@/app/_components/ui/textarea";

import { setUserRole } from "@/app/actions/onboarding";
import useFetch from "@/hooks/use-fetch";
import { Specialties } from "@/lib/Specialties";
import { educatorSchema } from "@/lib/zodSchemas";
import { z } from "zod";

type EducatorFormValues = z.infer<typeof educatorSchema>;

export default function OnboardingPage() {
  const [step, setStep] = useState("choose-role");
  const { data, fn: submitUserRole, loading } = useFetch(setUserRole);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
  } = useForm({
    resolver: zodResolver(educatorSchema),
    defaultValues: {
      specialty: "",
      experience: 0,
      credentialUrl: "",
      description: "",
    },
  });

  // Fixed: use the control from the main useForm instance
  const specialtyValue = useWatch({
    control,
    name: "specialty",
  });

  const handleStudentSelection = async () => {
    if (loading) return;
    const formData = new FormData();
    formData.append("role", "Student");
    await submitUserRole(formData);
  };

  useEffect(() => {
    if (data?.success) {
      toast.success("Account set up successfully!");
      window.location.href = data.redirect;
    }
  }, [data]);

  const onEducatorSubmit = async (values: EducatorFormValues) => {
    if (loading) return;
    const formData = new FormData();
    formData.append("role", "Educator");
    formData.append("specialty", values.specialty);
    formData.append("experience", values.experience.toString());
    formData.append("credentialUrl", values.credentialUrl);
    formData.append("description", values.description);
    await submitUserRole(formData);
  };

  return (
    <div className="min-h-screen flex items-start justify-center pt-20 pb-20 px-4 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950">
      <div className="w-full max-w-3xl">
        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-3">
            Welcome to Justdy Online Tutoring
          </h1>
          <p className="text-slate-400 text-lg">
            {step === "choose-role"
              ? "How would you like to use our platform?"
              : "Tell us more about your teaching background."}
          </p>
        </div>

        {step === "choose-role" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in duration-300">
            {/* Student Card */}
            <Card
              onClick={handleStudentSelection}
              className={`group relative overflow-hidden border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 transition-all cursor-pointer ${loading ? "opacity-50 pointer-events-none" : ""}`}
            >
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="mb-6 rounded-2xl bg-emerald-500/10 p-4 ring-1 ring-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                  <User className="h-10 w-10 text-emerald-400" />
                </div>
                <CardTitle className="text-2xl font-bold text-white mb-3">
                  Student
                </CardTitle>
                <CardDescription className="text-slate-400 leading-relaxed mb-6">
                  Access materials, book sessions, and track your personalized
                  learning journey.
                </CardDescription>
                <div className="w-full py-2 px-4 rounded-lg bg-emerald-600 group-hover:bg-emerald-500 text-white font-medium transition-colors flex justify-center items-center">
                  {loading ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    "Get Started"
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Educator Card */}
            <Card
              onClick={() => setStep("educator-form")}
              className="group relative overflow-hidden border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 transition-all cursor-pointer"
            >
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="mb-6 rounded-2xl bg-blue-500/10 p-4 ring-1 ring-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                  <GraduationCap className="h-10 w-10 text-blue-400" />
                </div>
                <CardTitle className="text-2xl font-bold text-white mb-3">
                  Educator
                </CardTitle>
                <CardDescription className="text-slate-400 leading-relaxed mb-6">
                  Share your knowledge, manage availability, and grow your
                  teaching career.
                </CardDescription>
                <div className="w-full py-2 px-4 rounded-lg border border-slate-700 group-hover:border-blue-500 text-slate-300 group-hover:text-white font-medium transition-all">
                  Apply as Teacher
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "educator-form" && (
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm animate-in slide-in-from-bottom-4 duration-300">
            <CardHeader className="border-b border-slate-800/50 pb-8">
              <div
                className="flex items-center gap-2 text-emerald-400 mb-2 cursor-pointer hover:text-emerald-300 transition-colors"
                onClick={() => setStep("choose-role")}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="text-sm font-medium">Back to selection</span>
              </div>
              <CardTitle className="text-2xl text-white">
                Educator Application
              </CardTitle>
              <CardDescription>
                We verify all our educators to maintain high teaching standards.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-8">
              <form
                onSubmit={handleSubmit(onEducatorSubmit)}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Specialty Area</Label>
                    <Select
                      value={specialtyValue}
                      onValueChange={(value) => setValue("specialty", value)}
                    >
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                        <SelectValue placeholder="What do you teach?" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-white">
                        {Specialties.map((spec) => (
                          <SelectItem key={spec.name} value={spec.name}>
                            <div className="flex items-center gap-2">
                              <span>{spec.icon}</span>
                              <span>{spec.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.specialty && (
                      <p className="text-xs text-red-400 font-medium">
                        {errors.specialty.message as string}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">
                      Years of Experience
                    </Label>
                    <Input
                      type="number"
                      className="bg-slate-950 border-slate-800 text-white"
                      placeholder="e.g. 5"
                      {...register("experience", { valueAsNumber: true })}
                    />
                    {errors.experience && (
                      <p className="text-xs text-red-400 font-medium">
                        {errors.experience.message as string}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">
                    Credential Portfolio URL
                  </Label>
                  <Input
                    className="bg-slate-950 border-slate-800 text-white"
                    placeholder="https://your-portfolio.com or drive-link"
                    {...register("credentialUrl")}
                  />
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Verification link (PDF, LinkedIn, or Portfolio)
                  </p>
                  {errors.credentialUrl && (
                    <p className="text-xs text-red-400 font-medium">
                      {errors.credentialUrl.message as string}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Professional Bio</Label>
                  <Textarea
                    className="bg-slate-950 border-slate-800 text-white min-h-30 resize-none"
                    placeholder="Describe your teaching philosophy and background..."
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-400 font-medium">
                      {errors.description.message as string}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg shadow-emerald-900/20"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Complete Setup
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// "use client";

// import { Button } from "@/app/_components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardTitle,
// } from "@/app/_components/ui/card";
// import { Input } from "@/app/_components/ui/input";
// import { Label } from "@/app/_components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/app/_components/ui/select";
// import { Textarea } from "@/app/_components/ui/textarea";
// import { setUserRole } from "@/app/actions/onboarding";
// import useFetch from "@/hooks/use-fetch";
// import { Specialties } from "@/lib/Specialties";
// import { educatorSchema } from "@/lib/zodSchemas";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { GraduationCap, Loader2, User } from "lucide-react";
// import { useEffect, useState } from "react";
// import { useForm } from "react-hook-form";
// import { toast } from "sonner";
// import { useWatch } from "react-hook-form";

// export default function OnboardingPage() {
//   const [step, setStep] = useState("choose-role");
//   const { data, fn: submitUserRole, loading } = useFetch(setUserRole);

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//     setValue,
//   } = useForm({
//     resolver: zodResolver(educatorSchema),
//     defaultValues: {
//       specialty: "",
//       experience: 0,
//       credentialUrl: "",
//       description: "",
//     },
//   });

//   const { control } = useForm();
//   const specialtyValue = useWatch({
//     control,
//     name: "specialty",
//   });

//   const handleStudentSelection = async () => {
//     if (loading) return;

//     const formData = new FormData();
//     formData.append("role", "Student");

//     await submitUserRole(formData);
//   };

//   useEffect(() => {
//     if (data && data?.success) {
//       toast.success("Role set successfully! Redirecting...");
//       window.location.href = data.redirect;
//     }
//   }, [data]);

//   const onDoctorSubmit = async (data) => {
//     if (loading) return;

//     const formData = new FormData();
//     formData.append("role", "Educator");
//     formData.append("specialty", data.specialty);
//     formData.append("experience", data.experience.toString());
//     formData.append("credentialUrl", data.credentialUrl);
//     formData.append("description", data.description);

//     await submitUserRole(formData);
//   };

//   if (step === "choose-role") {
//     return (
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <Card
//           onClick={() => !loading && handleStudentSelection()}
//           className="border-emerald-900/20 hover:border-emerald-700/40 cursor-pointer transition-all"
//         >
//           <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
//             <div className="p-4 bg-emerald-900/20 rounded-full mb-4">
//               <User className="h-8 w-8 text-emerald-400 mb-4" />
//             </div>
//             <CardTitle className="text-xl font-semibold text-white mb-2">
//               Proceed as Student
//             </CardTitle>
//             <CardDescription className="mb-4">
//               Book tutoring sessions, access course materials, and track your
//               learning progress.
//             </CardDescription>
//             <Button className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 disabled={loading}">
//               {loading ? (
//                 <>
//                   <Loader2 className="mr-2 size-4 animate-spin" />
//                   Processing...
//                 </>
//               ) : (
//                 "Continue as Student"
//               )}
//             </Button>
//           </CardContent>
//         </Card>

//         <Card
//           onClick={() => !loading && setStep("educator-form")}
//           className="border-emerald-900/20 hover:border-emerald-700/40 cursor-pointer transition-all"
//         >
//           <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
//             <div className="p-4 bg-emerald-900/20 rounded-full mb-4">
//               <GraduationCap className="h-8 w-8 text-emerald-400 mb-4" />
//             </div>
//             <CardTitle className="text-xl font-semibold text-white mb-2">
//               Proceed as Educator
//             </CardTitle>
//             <CardDescription className="mb-4">
//               Create your professional profile, set your availability, and offer
//               tutoring sessions.
//             </CardDescription>
//             <Button
//               disabled={loading}
//               className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700"
//             >
//               Continue as Educator
//             </Button>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   if (step === "educator-form") {
//     return (
//       <Card className="border-emerald-900/20">
//         <CardContent className="pt-6">
//           <div className="mb-6">
//             <CardTitle className="text-2xl font-bold text-white mb-2">
//               Complete Your Educator Profile
//             </CardTitle>
//             <CardDescription className="mb-4">
//               Please provide the following information to complete your educator
//               profile.
//             </CardDescription>
//           </div>

//           <form className="space-y-6" onSubmit={handleSubmit(onDoctorSubmit)}>
//             <div className="space-y-2">
//               <Label htmlFor="specialty">Teacher Specialty</Label>
//               <Select
//                 value={specialtyValue}
//                 onValueChange={(value) => setValue("specialty", value)}
//               >
//                 <SelectTrigger id="specialty">
//                   <SelectValue placeholder="Select your specialty" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {Specialties.map((spec) => {
//                     return (
//                       <SelectItem key={spec.name} value={spec.name}>
//                         <div className="flex items-center gap-2">
//                           <span className="text-emerald-400">{spec.icon}</span>
//                           {spec.name}
//                         </div>
//                       </SelectItem>
//                     );
//                   })}
//                 </SelectContent>
//               </Select>
//               {errors.specialty && (
//                 <p className="text-sm font-medium text-red-500 mt-1">
//                   {errors.specialty.message}
//                 </p>
//               )}
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="specialty">Years of Experience</Label>
//               <Input
//                 id="experience"
//                 type="number"
//                 placeholder="e.g. 5"
//                 {...register("experience", { valueAsNumber: true })}
//               />
//               {errors.experience && (
//                 <p className="text-sm font-medium text-red-500 mt-1">
//                   {errors.experience.message}
//                 </p>
//               )}
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="specialty">Link to Credential Documents</Label>
//               <Input
//                 id="credentialUrl"
//                 type="url"
//                 placeholder="https://drive.google.com/your-credentials"
//                 {...register("credentialUrl")}
//               />
//               {errors.credentialUrl && (
//                 <p className="text-sm font-medium text-red-500 mt-1">
//                   {errors.credentialUrl.message}
//                 </p>
//               )}
//               <p className="text-sm text-muted-foreground">
//                 Provide a URL to your teaching credentials (e.g., a link to a
//                 PDF or Google Drive folder).
//               </p>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="specialty">
//                 Description of your Teaching Experience
//               </Label>
//               <Textarea
//                 id="description"
//                 placeholder="Describe your teaching experience, approach, and what students can expect from your sessions."
//                 {...register("description")}
//                 rows={9}
//               />
//               {errors.description && (
//                 <p className="text-sm font-medium text-red-500 mt-1">
//                   {errors.description.message}
//                 </p>
//               )}
//             </div>

//             <div className="pt-2 flex items-center justify-between">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => setStep("choose-role")}
//                 disabled={loading}
//                 className="border-emerald-900/30"
//               >
//                 Back
//               </Button>

//               <Button
//                 type="submit"
//                 className="bg-emerald-600 hover:bg-emerald-700"
//                 disabled={loading}
//               >
//                 {loading ? (
//                   <>
//                     <Loader2 className="mr-2 size-4 animate-spin" />
//                     Submitting...
//                   </>
//                 ) : (
//                   "Submit for Verification"
//                 )}
//               </Button>
//             </div>
//           </form>
//         </CardContent>
//       </Card>
//     );
//   }

//   return <div>Onboarding</div>;
// }
