import { env } from "@/lib/env";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json();

    // Basic Validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Send Email via Resend
    const data = await resend.emails.send({
      from: `${env.EMAIL_SENDER_NAME} <${env.EMAIL_SENDER_ADDRESS}>`,
      to: [process.env.CONTACT_EMAIL || "your-email@example.com"],
      replyTo: email,
      subject: `[Contact Form] ${subject} from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded: 8px;">
          <h2 style="color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 8px;">New Website Contact Inquiry</h2>
          
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Topic / Interest:</strong> ${subject}</p>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-left: 4px solid #4f46e5;">
            <p style="margin: 0; font-weight: bold; color: #374151;">Message:</p>
            <p style="margin-top: 8px; color: #4b5563; whitespace: pre-line;">${message}</p>
          </div>
          
          <p style="font-size: 12px; color: #9ca3af; margin-top: 30px;">
            This email was sent automatically from your website contact form.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Resend Error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
