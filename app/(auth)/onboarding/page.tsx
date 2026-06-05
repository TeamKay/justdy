"use client";

import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GraduationCap, Loader2, User, ChevronLeft, X } from "lucide-react";
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
import { getCommunities } from "@/app/actions/admin-communities";

type EducatorFormValues = z.infer<typeof educatorSchema>;

interface Community {
  id: string;
  name: string;
  smallDescription: string;
}

export default function OnboardingPage() {
  const [step, setStep] = useState<
    "choose-role" | "choose-community" | "educator-form"
  >("choose-role");

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);

  const { data, fn: submitUserRole, loading } = useFetch(setUserRole);

  const {
    register,
    handleSubmit,
    formState: {},
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

  const specialtyValue = useWatch({
    control,
    name: "specialty",
  });

  useEffect(() => {
    const loadCommunities = async () => {
      try {
        setLoadingCommunities(true);
        const data = await getCommunities();
        setCommunities(data);
      } catch {
        toast.error("Failed to load communities");
      } finally {
        setLoadingCommunities(false);
      }
    };

    loadCommunities();
  }, []);

  const handleStudentSelection = () => {
    setSelectedRole("Learner");
    setStep("choose-community");
  };

  const handleEducatorSelection = () => {
    setSelectedRole("Educator");
    setStep("choose-community");
  };

  const toggleCommunity = (id: string) => {
    setSelectedCommunities((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const handleFinalSubmit = async () => {
    if (loading) return;

    const formData = new FormData();
    formData.append("role", selectedRole || "");
    formData.append("communities", JSON.stringify(selectedCommunities));

    await submitUserRole(formData);
  };

  const onEducatorSubmit = async (values: EducatorFormValues) => {
    if (loading) return;

    const formData = new FormData();
    formData.append("role", "Educator");
    formData.append("specialty", values.specialty);
    formData.append("experience", values.experience.toString());
    formData.append("credentialUrl", values.credentialUrl);
    formData.append("description", values.description);
    formData.append("communities", JSON.stringify(selectedCommunities));

    await submitUserRole(formData);
  };

  useEffect(() => {
    if (data?.success) {
      toast.success("Account set up successfully!");
      window.location.href = data.redirect;
    }
  }, [data]);

  // Helper logic to get active stepper index configurations
  const getStepNumber = () => {
    if (step === "choose-role") return 1;
    if (step === "choose-community") return 2;
    return 3;
  };

  const activeStep = getStepNumber();

  return (
    <div className="min-h-screen flex items-start justify-center pt-20 pb-20 px-4 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950">
      <div className="w-full max-w-3xl">
        {/* HEADER */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-white mb-3">
            Welcome to Justdy Online Tutoring
          </h1>
          <p className="text-slate-400 text-lg">
            {step === "choose-role" &&
              "How would you like to use our platform?"}
            {step === "choose-community" &&
              "Join communities to personalize your experience."}
            {step === "educator-form" &&
              "Tell us more about your educational background."}
          </p>
        </div>

        {/* ================= STEPPER PROGRESS BAR ================= */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center w-full max-w-md justify-between relative">
            {/* Background Line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />

            {/* Step 1 */}
            <div className="z-10 flex items-center justify-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-slate-950 border-2 transition-all duration-300 ${
                  activeStep === 1
                    ? "border-pink-500 text-pink-500 ring-4 ring-pink-500/10"
                    : "border-slate-600 text-slate-400"
                }`}
              >
                1
              </div>
            </div>

            {/* Step 2 */}
            <div className="z-10 flex items-center justify-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-slate-950 border-2 transition-all duration-300 ${
                  activeStep === 2
                    ? "border-pink-500 text-pink-500 ring-4 ring-pink-500/10"
                    : "border-slate-600 text-slate-400"
                }`}
              >
                2
              </div>
            </div>

            {/* Step 3 (Only relevant visually if Educator path is continuous) */}
            <div className="z-10 flex items-center justify-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-slate-950 border-2 transition-all duration-300 ${
                  activeStep === 3
                    ? "border-pink-500 text-pink-500 ring-4 ring-pink-500/10"
                    : "border-slate-600 text-slate-400"
                }`}
              >
                3
              </div>
            </div>
          </div>
        </div>

        {/* ================= ROLE SELECTION ================= */}
        {step === "choose-role" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Learner */}
            <Card
              onClick={handleStudentSelection}
              className="cursor-pointer border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 transition-colors"
            >
              <CardContent className="p-8 text-center">
                <User className="h-10 w-10 text-emerald-400 mx-auto mb-4" />
                <CardTitle className="text-white text-2xl mb-2">
                  Learner
                </CardTitle>
                <CardDescription className="text-slate-400 mb-6">
                  Learn, track progress, and join communities.
                </CardDescription>
                <div className="bg-emerald-600 text-white py-2 rounded-lg font-medium">
                  Get Started
                </div>
              </CardContent>
            </Card>

            {/* Educator */}
            <Card
              onClick={handleEducatorSelection}
              className="cursor-pointer border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 transition-colors"
            >
              <CardContent className="p-8 text-center">
                <GraduationCap className="h-10 w-10 text-blue-400 mx-auto mb-4" />
                <CardTitle className="text-white text-2xl mb-2">
                  Educator
                </CardTitle>
                <CardDescription className="text-slate-400 mb-6">
                  Teach and grow your audience.
                </CardDescription>
                <div className="border border-slate-700 text-white py-2 rounded-lg font-medium">
                  Apply as Tutor
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ================= COMMUNITY SELECTION ================= */}
        {step === "choose-community" && (
          <Card className="bg-slate-900/50 border-slate-800 max-w-6xl mx-auto px-6 mt-10">
            <CardHeader>
              <CardTitle className="text-white text-xl text-center mb-1">
                Select Communities
              </CardTitle>
              <CardDescription className="text-slate-400 text-center">
                Choose one or multiple spaces you want to belong to.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingCommunities ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="animate-spin text-emerald-400" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-full flex items-center justify-center">
                    <Select onValueChange={(id) => toggleCommunity(id)}>
                      <SelectTrigger className="bg-slate-950 text-white border-slate-800 h-11 w-80">
                        <SelectValue placeholder="Click to explore and select communities" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-950 border-slate-800 text-white">
                        {communities
                          .filter((c) => !selectedCommunities.includes(c.id))
                          .map((community) => (
                            <SelectItem key={community.id} value={community.id}>
                              {community.name}
                            </SelectItem>
                          ))}
                        {communities.filter(
                          (c) => !selectedCommunities.includes(c.id),
                        ).length === 0 && (
                          <div className="p-2 text-sm text-slate-500 text-center">
                            All communities selected or none found
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* PREVIEW AND DESCRIPTION SECITON FOR SELECTED ITEMS */}
                  {selectedCommunities.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <Label className="text-slate-400 text-xs uppercase tracking-wider">
                        Your Selections ({selectedCommunities.length})
                      </Label>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {communities
                          .filter((c) => selectedCommunities.includes(c.id))
                          .map((community) => (
                            <div
                              key={community.id}
                              className="flex items-start justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 animate-in fade-in-50 duration-200"
                            >
                              <div className="space-y-1">
                                <h4 className="text-white text-sm font-semibold">
                                  {community.name}
                                </h4>
                                <p className="text-slate-400 text-xs line-clamp-2">
                                  {community.smallDescription}
                                </p>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-full shrink-0 ml-2"
                                onClick={() => toggleCommunity(community.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep("choose-role")}
                  className="flex-1 border-slate-800 text-slate-300 hover:bg-slate-800"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                <Button
                  onClick={() => {
                    if (selectedRole === "Educator") {
                      setStep("educator-form");
                    } else {
                      handleFinalSubmit();
                    }
                  }}
                  disabled={selectedCommunities.length === 0 || loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {loading && selectedRole !== "Educator" ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : selectedRole === "Educator" ? (
                    "Continue to Profile"
                  ) : (
                    "Complete Setup"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ================= EDUCATOR FORM ================= */}
        {step === "educator-form" && (
          <Card className="bg-slate-900/50 border-slate-800 max-w-xl mx-auto">
            <CardHeader>
              <div
                className="text-emerald-400 text-sm font-medium cursor-pointer mb-2 flex items-center hover:underline"
                onClick={() => setStep("choose-community")}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Back to Communities
              </div>
              <CardTitle className="text-white">Educator Profile</CardTitle>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={handleSubmit(onEducatorSubmit)}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label className="text-slate-300">Specialty</Label>
                  <Select
                    value={specialtyValue}
                    onValueChange={(v) => setValue("specialty", v)}
                  >
                    <SelectTrigger className="bg-slate-950 text-white border-slate-800">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-slate-800 text-white">
                      {Specialties.map((s) => (
                        <SelectItem key={s.name} value={s.name}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Experience</Label>
                  <Input
                    placeholder="Experience (years)"
                    type="number"
                    className="bg-slate-950 text-white border-slate-800"
                    {...register("experience", {
                      valueAsNumber: true,
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Credential Link</Label>
                  <Input
                    placeholder="Credential URL"
                    className="bg-slate-950 text-white border-slate-800"
                    {...register("credentialUrl")}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Short Bio</Label>
                  <Textarea
                    placeholder="Tell your future students about yourself..."
                    className="bg-slate-950 text-white border-slate-800 min-h-25"
                    {...register("description")}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {loading ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    "Complete Setup"
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

// import React, { useEffect, useState } from "react";
// import { useForm, useWatch } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import {
//   GraduationCap,
//   Loader2,
//   User,
//   ChevronLeft,
//   CheckCircle2,
// } from "lucide-react";
// import { toast } from "sonner";

// import { Button } from "@/app/_components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
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
// import { z } from "zod";

// type EducatorFormValues = z.infer<typeof educatorSchema>;

// export default function OnboardingPage() {
//   const [step, setStep] = useState("choose-role");
//   const { data, fn: submitUserRole, loading } = useFetch(setUserRole);

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//     setValue,
//     control,
//   } = useForm({
//     resolver: zodResolver(educatorSchema),
//     defaultValues: {
//       specialty: "",
//       experience: 0,
//       credentialUrl: "",
//       description: "",
//     },
//   });

//   // Fixed: use the control from the main useForm instance
//   const specialtyValue = useWatch({
//     control,
//     name: "specialty",
//   });

//   const handleStudentSelection = async () => {
//     if (loading) return;
//     const formData = new FormData();
//     formData.append("role", "Learner");
//     await submitUserRole(formData);
//   };

//   useEffect(() => {
//     if (data?.success) {
//       toast.success("Account set up successfully!");
//       window.location.href = data.redirect;
//     }
//   }, [data]);

//   const onEducatorSubmit = async (values: EducatorFormValues) => {
//     if (loading) return;
//     const formData = new FormData();
//     formData.append("role", "Educator");
//     formData.append("specialty", values.specialty);
//     formData.append("experience", values.experience.toString());
//     formData.append("credentialUrl", values.credentialUrl);
//     formData.append("description", values.description);
//     await submitUserRole(formData);
//   };

//   return (
//     <div className="min-h-screen flex items-start justify-center pt-20 pb-20 px-4 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950">
//       <div className="w-full max-w-3xl">
//         {/* Header Section */}
//         <div className="text-center mb-10">
//           <h1 className="text-4xl font-extrabold tracking-tight text-white mb-3">
//             Welcome to Justdy Online Tutoring
//           </h1>
//           <p className="text-slate-400 text-lg">
//             {step === "choose-role"
//               ? "How would you like to use our platform?"
//               : "Tell us more about your teaching background."}
//           </p>
//         </div>

//         {step === "choose-role" && (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in duration-300">
//             {/* Student Card */}
//             <Card
//               onClick={handleStudentSelection}
//               className={`group relative overflow-hidden border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 transition-all cursor-pointer ${loading ? "opacity-50 pointer-events-none" : ""}`}
//             >
//               <CardContent className="p-8 flex flex-col items-center text-center">
//                 <div className="mb-6 rounded-2xl bg-emerald-500/10 p-4 ring-1 ring-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
//                   <User className="h-10 w-10 text-emerald-400" />
//                 </div>
//                 <CardTitle className="text-2xl font-bold text-white mb-3">
//                   Learner
//                 </CardTitle>
//                 <CardDescription className="text-slate-400 leading-relaxed mb-6">
//                   Access materials, book sessions, and track your personalized
//                   learning journey.
//                 </CardDescription>
//                 <div className="w-full py-2 px-4 rounded-lg bg-emerald-600 group-hover:bg-emerald-500 text-white font-medium transition-colors flex justify-center items-center">
//                   {loading ? (
//                     <Loader2 className="animate-spin h-5 w-5" />
//                   ) : (
//                     "Get Started"
//                   )}
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Educator Card */}
//             <Card
//               onClick={() => setStep("educator-form")}
//               className="group relative overflow-hidden border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 transition-all cursor-pointer"
//             >
//               <CardContent className="p-8 flex flex-col items-center text-center">
//                 <div className="mb-6 rounded-2xl bg-blue-500/10 p-4 ring-1 ring-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
//                   <GraduationCap className="h-10 w-10 text-blue-400" />
//                 </div>
//                 <CardTitle className="text-2xl font-bold text-white mb-3">
//                   Educator
//                 </CardTitle>
//                 <CardDescription className="text-slate-400 leading-relaxed mb-6">
//                   Share your knowledge, manage availability, and grow your
//                   teaching career.
//                 </CardDescription>
//                 <div className="w-full py-2 px-4 rounded-lg border border-slate-700 group-hover:border-blue-500 text-slate-300 group-hover:text-white font-medium transition-all">
//                   Apply as Teacher
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         )}

//         {step === "educator-form" && (
//           <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm animate-in slide-in-from-bottom-4 duration-300">
//             <CardHeader className="border-b border-slate-800/50 pb-8">
//               <div
//                 className="flex items-center gap-2 text-emerald-400 mb-2 cursor-pointer hover:text-emerald-300 transition-colors"
//                 onClick={() => setStep("choose-role")}
//               >
//                 <ChevronLeft className="h-4 w-4" />
//                 <span className="text-sm font-medium">Back to selection</span>
//               </div>
//               <CardTitle className="text-2xl text-white">
//                 Educator Application
//               </CardTitle>
//               <CardDescription>
//                 We verify all our educators to maintain high teaching standards.
//               </CardDescription>
//             </CardHeader>

//             <CardContent className="pt-8">
//               <form
//                 onSubmit={handleSubmit(onEducatorSubmit)}
//                 className="space-y-8"
//               >
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div className="space-y-2">
//                     <Label className="text-slate-300">Specialty Area</Label>
//                     <Select
//                       value={specialtyValue}
//                       onValueChange={(value) => setValue("specialty", value)}
//                     >
//                       <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
//                         <SelectValue placeholder="What do you teach?" />
//                       </SelectTrigger>
//                       <SelectContent className="bg-slate-900 border-slate-800 text-white">
//                         {Specialties.map((spec) => (
//                           <SelectItem key={spec.name} value={spec.name}>
//                             <div className="flex items-center gap-2">
//                               <span>{spec.icon}</span>
//                               <span>{spec.name}</span>
//                             </div>
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                     {errors.specialty && (
//                       <p className="text-xs text-red-400 font-medium">
//                         {errors.specialty.message as string}
//                       </p>
//                     )}
//                   </div>

//                   <div className="space-y-2">
//                     <Label className="text-slate-300">
//                       Years of Experience
//                     </Label>
//                     <Input
//                       type="number"
//                       className="bg-slate-950 border-slate-800 text-white"
//                       placeholder="e.g. 5"
//                       {...register("experience", { valueAsNumber: true })}
//                     />
//                     {errors.experience && (
//                       <p className="text-xs text-red-400 font-medium">
//                         {errors.experience.message as string}
//                       </p>
//                     )}
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <Label className="text-slate-300">
//                     Credential Portfolio URL
//                   </Label>
//                   <Input
//                     className="bg-slate-950 border-slate-800 text-white"
//                     placeholder="https://your-portfolio.com or drive-link"
//                     {...register("credentialUrl")}
//                   />
//                   <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
//                     Verification link (PDF, LinkedIn, or Portfolio)
//                   </p>
//                   {errors.credentialUrl && (
//                     <p className="text-xs text-red-400 font-medium">
//                       {errors.credentialUrl.message as string}
//                     </p>
//                   )}
//                 </div>

//                 <div className="space-y-2">
//                   <Label className="text-slate-300">Professional Bio</Label>
//                   <Textarea
//                     className="bg-slate-950 border-slate-800 text-white min-h-30 resize-none"
//                     placeholder="Describe your teaching philosophy and background..."
//                     {...register("description")}
//                   />
//                   {errors.description && (
//                     <p className="text-xs text-red-400 font-medium">
//                       {errors.description.message as string}
//                     </p>
//                   )}
//                 </div>

//                 <Button
//                   type="submit"
//                   disabled={loading}
//                   className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg shadow-emerald-900/20"
//                 >
//                   {loading ? (
//                     <span className="flex items-center gap-2">
//                       <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
//                     </span>
//                   ) : (
//                     <span className="flex items-center gap-2">
//                       <CheckCircle2 className="h-4 w-4" /> Complete Setup
//                     </span>
//                   )}
//                 </Button>
//               </form>
//             </CardContent>
//           </Card>
//         )}
//       </div>
//     </div>
//   );
// }
