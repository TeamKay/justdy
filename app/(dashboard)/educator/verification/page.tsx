import { Button } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { getCurrentUser } from "@/app/actions/onboarding";
import {
  AlertCircle,
  Clock,
  XCircle,
  ArrowLeft,
  ShieldCheck,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function VerificationPage() {
  const user = await getCurrentUser();

  if (user?.verificationStatus === "Verified") {
    redirect("/educator");
  }

  const isRejected = user?.verificationStatus === "Rejected";

  return (
    <div className="h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-2xl relative z-10 animate-in fade-in zoom-in duration-500">
        <Card className="border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">
          <div
            className={`h-1.5 w-full ${isRejected ? "bg-red-500/50" : "bg-amber-500/50"}`}
          />

          <CardHeader className="pt-8 pb-4 text-center">
            <div className="mx-auto mb-4 relative">
              <div
                className={`absolute inset-0 blur-2xl opacity-20 rounded-full ${isRejected ? "bg-red-500" : "bg-amber-500"}`}
              />
              <div
                className={`relative mx-auto flex items-center justify-center size-16 rounded-2xl border backdrop-blur-md transition-transform hover:scale-105 duration-300 ${
                  isRejected
                    ? "bg-red-500/10 border-red-500/20 shadow-red-500/10"
                    : "bg-amber-500/10 border-amber-500/20 shadow-amber-500/10"
                }`}
              >
                {isRejected ? (
                  <XCircle className="size-8 text-red-400" />
                ) : (
                  <Clock className="size-8 text-amber-400 animate-pulse" />
                )}
              </div>
            </div>

            <CardTitle className="text-2xl font-bold tracking-tight text-white mb-2">
              {isRejected
                ? "Verification Update"
                : "Reviewing Your Application"}
            </CardTitle>
            <CardDescription className="text-slate-400 text-sm max-w-md mx-auto">
              {isRejected
                ? "Your application was not approved at this time. You can update your details and resubmit."
                : "Our team is currently reviewing your credentials to ensure the highest quality of educators."}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-8 space-y-5">
            <div
              className={`rounded-xl border p-4 backdrop-blur-sm ${
                isRejected
                  ? "bg-red-500/5 border-red-500/10"
                  : "bg-slate-800/30 border-white/5"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-1.5 rounded-lg mt-0.5 ${isRejected ? "bg-red-500/10" : "bg-blue-500/10"}`}
                >
                  <AlertCircle
                    className={`size-4 ${isRejected ? "text-red-400" : "text-blue-400"}`}
                  />
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-white text-xs uppercase tracking-wider">
                    {isRejected ? "Reasoning & Feedback" : "What to expect"}
                  </h4>

                  {isRejected ? (
                    <div className="text-slate-400 text-xs leading-relaxed space-y-2">
                      <p>Areas needing attention:</p>
                      <ul className="grid grid-cols-2 gap-2">
                        {[
                          "Document clarity",
                          "Bio details",
                          "Link authenticity",
                          "Experience proof",
                        ].map((item) => (
                          <li key={item} className="flex items-center gap-2">
                            <div className="size-1 bg-red-400 rounded-full" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Verification typically takes **24-48 hours**. We will send
                      a confirmation email as soon as a decision is made.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Button
                asChild
                variant="ghost"
                className="w-full sm:w-auto text-slate-400 hover:text-white hover:bg-white/5 order-2 sm:order-1 text-sm h-10"
              >
                <Link href="/">
                  <ArrowLeft className="mr-2 size-4" />
                  Back to Home
                </Link>
              </Button>

              <Button
                asChild
                className={`w-full sm:flex-1 h-10 text-sm font-semibold shadow-lg transition-all active:scale-[0.98] order-1 sm:order-2 ${
                  isRejected
                    ? "bg-red-600 hover:bg-red-500 text-white"
                    : "bg-white text-slate-950 hover:bg-slate-200"
                }`}
              >
                <Link href={isRejected ? "/onboarding" : "/contact-support"}>
                  {isRejected ? (
                    "Update Application"
                  ) : (
                    <span className="flex items-center gap-2">
                      <Mail className="size-4" /> Contact Support
                    </span>
                  )}
                </Link>
              </Button>
            </div>

            <p className="text-center text-[10px] text-slate-500 pt-1 flex items-center justify-center gap-1.5">
              <ShieldCheck className="size-3" />
              Secure Verification System
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// import { Button } from "@/app/_components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/app/_components/ui/card";
// import { getCurrentUser } from "@/app/actions/onboarding";
// import { AlertCircle, ClipboardCheck, XCircle } from "lucide-react";
// import Link from "next/link";
// import { redirect } from "next/navigation";

// export default async function VerificationPage() {
//   const user = await getCurrentUser();

//   if (user?.verificationStatus === "Verified") {
//     redirect("/educator");
//   }

//   const isRejected = user?.verificationStatus === "Rejected";

//   return (
//     <div className="container mx-auto px-4 py-12">
//       <div className="max-w-2xl mx-auto">
//         <Card className="border-emerald-900/20">
//           <CardHeader className="text-center">
//             <div
//               className={`mx-auto p-4 ${
//                 isRejected ? "bg-red-900/20" : "bg-amber-900/20"
//               } rounded-full mb-4 w-fit`}
//             >
//               {isRejected ? (
//                 <XCircle className="size-8 text-red-400" />
//               ) : (
//                 <ClipboardCheck className="size-8 text-emerald-400" />
//               )}
//             </div>
//             <CardTitle className="text-2xl font-bold text-white">
//               {isRejected ? "Verification Decline" : "Verification in Progress"}
//             </CardTitle>
//             <CardDescription className="text-lg">
//               {isRejected
//                 ? "Unfortunately, your verification was not successful. Please review the requirements and submit your information again."
//                 : "Your verification is currently being reviewed by our team."}
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             {isRejected ? (
//               <div className="bg-red-900/10 border border-red-900/2 rounded-lg p-4 mb-6 flex items-start">
//                 <AlertCircle className="size-5 text-red-400 mr-3 mt-0.5 shrink-0" />
//                 <div className="text-muted-foreground text-left">
//                   <p className="mb-2">
//                     Our team have reviewed your application carefully and found
//                     that it does not meet our. Common reasons for rejection
//                     include:
//                   </p>
//                   <ul className="list-disc list-inside mb-2">
//                     <li>Incomplete or unclear documentation.</li>
//                     <li>Failure to meet the minimum qualifications.</li>
//                     <li>
//                       Concerns about the authenticity of the provided
//                       information.
//                     </li>
//                   </ul>
//                   <p>
//                     We encourage you to review the requirements and submit your
//                     application again with the necessary corrections. If you
//                     have any questions or need further assistance, please
//                     contact our support team.
//                   </p>
//                 </div>
//               </div>
//             ) : (
//               <div className="bg-red-900/10 border border-red-900/2 rounded-lg p-4 mb-6 flex items-start">
//                 <AlertCircle className="size-5 text-amber-400 mr-3 mt-0.5 shrink-0" />
//                 <p className="text-muted-foreground text-left">
//                   We appreciate your patience during this process. Our team is
//                   working diligently to review all applications and will notify
//                   you of the outcome as soon as possible. In the meantime, if
//                   you have any questions or need further assistance, please
//                   contact our support team.
//                 </p>
//               </div>
//             )}

//             <p className="text-muted-foreground mb-6">
//               {isRejected
//                 ? "You can update your application and resubmit for review."
//                 : "While you wait, you can familiarize yourself with our platform or reach out to our support team for any questions."}
//             </p>

//             <div className="flex flex-col sm:flex-row gap-4 justify-center">
//               <Button
//                 asChild
//                 variant="outline"
//                 className="border-emerald-900/30"
//               >
//                 <Link href="/">Return to Home</Link>
//               </Button>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }
