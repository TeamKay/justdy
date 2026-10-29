import { redirect } from "next/navigation";

/**
 * The resend button is a reusable client component now located at
 * app/_components/ResendVerification.tsx. Keep this route valid for any
 * old links, but send visitors to the verification request page.
 */
export default function ResendVerificationPage() {
  redirect("/verify-request");
}
