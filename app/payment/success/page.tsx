import { Suspense } from "react";
import PaymentSuccessfulClient from "./PaymentSuccessfulClient";

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <div className="flex flex-col items-center gap-4">
            <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

            <p className="text-sm text-slate-500">Confirming your payment...</p>
          </div>
        </div>
      }
    >
      <PaymentSuccessfulClient />
    </Suspense>
  );
}

// "use client";

// import { buttonVariants } from "@/app/_components/ui/button";
// import { Card, CardContent } from "@/app/_components/ui/card";
// import { useConfetti } from "@/hooks/use-confetti";
// import { ArrowRight, CheckIcon, Mail } from "lucide-react";
// import Link from "next/link";
// import { useSearchParams } from "next/navigation";
// import { useEffect, useState } from "react";

// export default function PaymentSuccessful() {
//   const { triggerConfetti } = useConfetti();

//   const searchParams = useSearchParams();
//   const sessionId = searchParams.get("session_id");

//   const [customerName, setCustomerName] = useState<string | null>(null);
//   const [loadingCustomer, setLoadingCustomer] = useState(true);

//   useEffect(() => {
//     triggerConfetti();

//     // Clear cart after successful checkout
//     localStorage.removeItem("cart");

//     // Notify Navbar/cart components
//     window.dispatchEvent(new Event("cartUpdated"));
//   }, [triggerConfetti]);

//   useEffect(() => {
//     async function getCustomerDetails() {
//       if (!sessionId) {
//         setLoadingCustomer(false);
//         return;
//       }

//       try {
//         const response = await fetch(
//           `/api/payment/success?session_id=${encodeURIComponent(sessionId)}`,
//         );

//         if (!response.ok) {
//           throw new Error("Failed to retrieve customer information.");
//         }

//         const data = await response.json();

//         setCustomerName(data.name ?? null);
//       } catch (error) {
//         console.error("Failed to retrieve customer information:", error);
//       } finally {
//         setLoadingCustomer(false);
//       }
//     }

//     getCustomerDetails();
//   }, [sessionId]);

//   return (
//     <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
//       <Card className="w-full max-w-lg border-slate-200 shadow-xl">
//         <CardContent className="p-8 sm:p-10">
//           {/* SUCCESS ICON */}
//           <div className="flex justify-center">
//             <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100">
//               <CheckIcon className="size-8 text-emerald-600" />
//             </div>
//           </div>

//           {/* TITLE */}
//           <div className="mt-6 text-center">
//             <h1 className="text-2xl font-bold tracking-tight text-slate-900">
//               Payment Successful
//             </h1>

//             <p className="mt-2 text-slate-500">
//               {loadingCustomer
//                 ? "Thank you for your purchase!"
//                 : customerName
//                   ? `Thank you, ${customerName}!`
//                   : "Thank you for your purchase!"}
//             </p>
//           </div>

//           {/* EMAIL NOTICE */}
//           <div className="mt-7 rounded-xl border border-blue-100 bg-blue-50 p-5">
//             <div className="flex gap-3">
//               <Mail className="size-5 shrink-0 text-blue-600 mt-0.5" />

//               <div>
//                 <h2 className="font-semibold text-blue-900">
//                   Check your email
//                 </h2>

//                 <p className="mt-1 text-sm leading-6 text-blue-800">
//                   We have sent your purchase confirmation and account
//                   information to the email address you used during checkout.
//                   Follow the account setup instructions in that email to access
//                   your purchases.
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* ACTIONS */}
//           <div className="mt-7 space-y-3">
//             {/* OPEN LOGIN MODAL */}
//             <Link
//               href="/?login=true"
//               className={buttonVariants({
//                 className: "w-full h-11 bg-blue-600 hover:bg-blue-700",
//               })}
//             >
//               Sign In to My Account
//               <ArrowRight className="size-4" />
//             </Link>

//             {/* CONTINUE SHOPPING */}
//             <Link
//               href="/"
//               className={buttonVariants({
//                 variant: "outline",
//                 className: "w-full h-11",
//               })}
//             >
//               Continue Shopping
//             </Link>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

// "use client";

// import { buttonVariants } from "@/app/_components/ui/button";
// import { Card, CardContent } from "@/app/_components/ui/card";
// import { useConfetti } from "@/hooks/use-confetti";
// import { ArrowRight, CheckIcon, Mail } from "lucide-react";
// import Link from "next/link";
// import { useEffect } from "react";

// export default function PaymentSuccessful() {
//   const { triggerConfetti } = useConfetti();

//   useEffect(() => {
//     triggerConfetti();

//     // Clear cart after successful checkout
//     localStorage.removeItem("cart");

//     // Notify Navbar/cart components
//     window.dispatchEvent(new Event("cartUpdated"));
//   }, [triggerConfetti]);

//   return (
//     <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
//       <Card className="w-full max-w-lg border-slate-200 shadow-xl">
//         <CardContent className="p-8 sm:p-10">
//           {/* SUCCESS ICON */}
//           <div className="flex justify-center">
//             <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100">
//               <CheckIcon className="size-8 text-emerald-600" />
//             </div>
//           </div>

//           {/* TITLE */}
//           <div className="mt-6 text-center">
//             <h1 className="text-2xl font-bold tracking-tight text-slate-900">
//               Payment Successful
//             </h1>

//             <p className="mt-2 text-slate-500">Thank you for your purchase!</p>
//           </div>

//           {/* EMAIL NOTICE */}
//           <div className="mt-7 rounded-xl border border-blue-100 bg-blue-50 p-5">
//             <div className="flex gap-3">
//               <Mail className="size-5 shrink-0 text-blue-600 mt-0.5" />

//               <div>
//                 <h2 className="font-semibold text-blue-900">
//                   Check your email
//                 </h2>

//                 <p className="mt-1 text-sm leading-6 text-blue-800">
//                   We have sent your purchase confirmation and account
//                   information to the email address you used during checkout.
//                   Follow the account setup instructions in that email to access
//                   your purchases.
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* ACTIONS */}
//           <div className="mt-7 space-y-3">
//             {/* OPEN LOGIN MODAL */}
//             <Link
//               href="/?login=true"
//               className={buttonVariants({
//                 className: "w-full h-11 bg-blue-600 hover:bg-blue-700",
//               })}
//             >
//               Sign In to My Account
//               <ArrowRight className="size-4" />
//             </Link>

//             {/* CONTINUE SHOPPING */}
//             <Link
//               href="/"
//               className={buttonVariants({
//                 variant: "outline",
//                 className: "w-full h-11",
//               })}
//             >
//               Continue Shopping
//             </Link>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

// "use client";

// import { buttonVariants } from "@/app/_components/ui/button";
// import { Card, CardContent } from "@/app/_components/ui/card";
// import { useConfetti } from "@/hooks/use-confetti";
// import { ArrowRight, CheckIcon, Mail } from "lucide-react";
// import Link from "next/link";
// import { useEffect } from "react";

// export default function PaymentSuccessful() {
//   const { triggerConfetti } = useConfetti();

//   useEffect(() => {
//     triggerConfetti();

//     // Clear cart after successful checkout
//     localStorage.removeItem("cart");

//     // Notify Navbar/cart components
//     window.dispatchEvent(new Event("cartUpdated"));

//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   return (
//     <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
//       <Card className="w-full max-w-lg border-slate-200 shadow-xl">
//         <CardContent className="p-8 sm:p-10">
//           {/* SUCCESS ICON */}
//           <div className="flex justify-center">
//             <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100">
//               <CheckIcon className="size-8 text-emerald-600" />
//             </div>
//           </div>

//           {/* TITLE */}
//           <div className="mt-6 text-center">
//             <h1 className="text-2xl font-bold tracking-tight text-slate-900">
//               Payment Successful
//             </h1>

//             <p className="mt-2 text-slate-500">Thank you for your purchase!</p>
//           </div>

//           {/* EMAIL NOTICE */}
//           <div className="mt-7 rounded-xl border border-blue-100 bg-blue-50 p-5">
//             <div className="flex gap-3">
//               <Mail className="size-5 shrink-0 text-blue-600 mt-0.5" />

//               <div>
//                 <h2 className="font-semibold text-blue-900">
//                   Check your email
//                 </h2>

//                 <p className="mt-1 text-sm leading-6 text-blue-800">
//                   We have sent your purchase confirmation and account
//                   information to the email address you used during checkout.
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* ACTIONS */}
//           <div className="mt-7 space-y-3">
//             {/* GO TO UNIVERSAL PRODUCT LIBRARY */}
//             <Link
//               href="/login"
//               className={buttonVariants({
//                 className: "w-full h-11 bg-blue-600 hover:bg-blue-700",
//               })}
//             >
//               Sign In to My Account
//               <ArrowRight className="size-4" />
//             </Link>

//             {/* CONTINUE SHOPPING */}
//             <Link
//               href="/"
//               className={buttonVariants({
//                 variant: "outline",
//                 className: "w-full h-11",
//               })}
//             >
//               Continue Shopping
//             </Link>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

// "use client";

// import { buttonVariants } from "@/app/_components/ui/button";
// import { Card, CardContent } from "@/app/_components/ui/card";
// import { useConfetti } from "@/hooks/use-confetti";
// import { ArrowRight, CheckIcon, Mail } from "lucide-react";
// import Link from "next/link";
// import { useEffect } from "react";

// export default function PaymentSuccessful() {
//   const { triggerConfetti } = useConfetti();

//   useEffect(() => {
//     triggerConfetti();

//     // Clear cart after successful checkout.
//     localStorage.removeItem("cart");

//     // Notify Navbar/cart components.
//     window.dispatchEvent(new Event("cartUpdated"));

//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   return (
//     <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
//       <Card className="w-full max-w-lg border-slate-200 shadow-xl">
//         <CardContent className="p-8 sm:p-10">
//           <div className="flex justify-center">
//             <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100">
//               <CheckIcon className="size-8 text-emerald-600" />
//             </div>
//           </div>

//           <div className="mt-6 text-center">
//             <h1 className="text-2xl font-bold tracking-tight text-slate-900">
//               Payment Successful
//             </h1>

//             <p className="mt-2 text-slate-500">Thank you for your purchase!</p>
//           </div>

//           <div className="mt-7 rounded-xl border border-blue-100 bg-blue-50 p-5">
//             <div className="flex gap-3">
//               <Mail className="size-5 shrink-0 text-blue-600 mt-0.5" />

//               <div>
//                 <h2 className="font-semibold text-blue-900">
//                   Check your email
//                 </h2>

//                 <p className="mt-1 text-sm leading-6 text-blue-800">
//                   We have sent your purchase confirmation and account
//                   information to the email address you used during checkout.
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div className="mt-7 space-y-3">
//             <Link
//               href="/client"
//               className={buttonVariants({
//                 className: "w-full h-11 bg-blue-600 hover:bg-blue-700",
//               })}
//             >
//               Go to My Library
//               <ArrowRight className="size-4" />
//             </Link>

//             <Link
//               href="/"
//               className={buttonVariants({
//                 variant: "outline",
//                 className: "w-full h-11",
//               })}
//             >
//               Continue Shopping
//             </Link>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

// "use client";

// import { buttonVariants } from "@/app/_components/ui/button";
// import { Card, CardContent } from "@/app/_components/ui/card";
// import { useConfetti } from "@/hooks/use-confetti";
// import { ArrowLeft, CheckIcon } from "lucide-react";
// import Link from "next/link";
// import { useEffect } from "react";

// export default function PaymentSuccessful() {
//   const { triggerConfetti } = useConfetti();

//   useEffect(() => {
//     // 🎉 Celebrate successful payment
//     triggerConfetti();

//     // 🛒 Clear the shopping cart
//     localStorage.removeItem("cart");

//     // 🔄 Tell the Navbar/cart UI that the cart has changed
//     window.dispatchEvent(new Event("cartUpdated"));

//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   return (
//     <div className="w-full min-h-screen flex flex-1 justify-center items-center">
//       <Card className="w-87.5">
//         <CardContent>
//           <div className="w-full flex justify-center">
//             <CheckIcon className="size-12 p-2 bg-green-500/30 text-green-500 rounded-full" />
//           </div>

//           <div className="mt-3 text-center sm:mt-5 w-full">
//             <h2 className="text-xl font-semibold">Payment Successful</h2>

//             <p className="text-sm mt-2 text-muted-foreground tracking-tight text-balance">
//               Congratulations
//             </p>

//             <p className="text-sm mt-2 text-muted-foreground tracking-tight text-balance">
//               Your payment was successful. You should now be granted full
//               access.
//               <span> Thank you for the payment.</span>
//             </p>

//             <Link
//               href="/"
//               className={buttonVariants({
//                 className: "w-full mt-5",
//               })}
//             >
//               <ArrowLeft className="size-4" />
//               Go to Dashboard
//             </Link>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
