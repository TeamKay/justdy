"use server";

import { render } from "@react-email/render";

import { Resend } from "resend";
import ForgotPasswordEmail from "../_components/ForgotPasswordEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendResetEmail(
  email: string,
  username: string,
  resetToken: string,
) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}&email=${email}`;

  const emailHtml = await render(
    ForgotPasswordEmail({
      username,
      userEmail: email,
      resetUrl,
    }),
  );

  await resend.emails.send({
    from: "Justdy <no-reply@justdy.com>",
    to: email,
    subject: "Reset your password",
    html: emailHtml,
  });
}
