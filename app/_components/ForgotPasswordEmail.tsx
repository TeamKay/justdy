import { Button, Heading, Link, Section, Text } from "@react-email/components";
import JustdyEmailLayout, { justdyEmailColors as c } from "./emails/JustdyEmailLayout";

interface ForgotPasswordEmailProps {
  username: string;
  resetUrl: string;
  userEmail: string;
}

export default function ForgotPasswordEmail({ username, resetUrl, userEmail }: ForgotPasswordEmailProps) {
  return (
    <JustdyEmailLayout preview="Reset your Justdy password — action required" recipientEmail={userEmail} footerNote="If you did not request a password reset, you can safely ignore this email.">
      <Heading as="h1" style={{ margin: "0 0 12px", color: c.navy, fontSize: "25px", lineHeight: "1.3" }}>Reset Your Password</Heading>
      <Text style={{ margin: "0 0 14px", color: c.text, fontSize: "15px", lineHeight: "1.8" }}>Hello, {username}</Text>
      <Text style={{ margin: "0 0 14px", color: "#475569", fontSize: "15px", lineHeight: "1.8" }}>We received a password reset request for your account associated with <strong>{userEmail}</strong>.</Text>
      <Text style={{ margin: "0 0 24px", color: "#475569", fontSize: "15px", lineHeight: "1.8" }}>Click the button below to create a new password. This link will expire in 24 hours for security reasons.</Text>
      <Section style={{ margin: "0 0 26px" }}><Button href={resetUrl} style={{ display: "inline-block", backgroundColor: c.navy, color: "#ffffff", padding: "14px 26px", borderRadius: "8px", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>Reset Password</Button></Section>
      <Text style={{ margin: "0 0 8px", color: c.muted, fontSize: "13px", lineHeight: "1.7" }}>If the button doesn’t work, copy and paste this link into your browser:</Text>
      <Text style={{ margin: "0 0 24px", fontSize: "12px", lineHeight: "1.7", overflowWrap: "anywhere" }}><Link href={resetUrl} style={{ color: "#2563eb" }}>{resetUrl}</Link></Text>
      <Section style={{ padding: "16px 18px", backgroundColor: "#f8fafc", border: `1px solid ${c.border}`, borderRadius: "10px" }}>
        <Text style={{ margin: "0 0 8px", color: c.text, fontSize: "13px", lineHeight: "1.6", fontWeight: 700 }}>Security notice</Text>
        <Text style={{ margin: "0 0 6px", color: c.muted, fontSize: "13px", lineHeight: "1.7" }}>• If you didn’t request this password reset, please ignore this email.</Text>
        <Text style={{ margin: "0 0 6px", color: c.muted, fontSize: "13px", lineHeight: "1.7" }}>• This link will expire in 24 hours.</Text>
        <Text style={{ margin: 0, color: c.muted, fontSize: "13px", lineHeight: "1.7" }}>• For security, never share this link with anyone.</Text>
      </Section>
      <Text style={{ margin: "22px 0 0", color: c.muted, fontSize: "13px", lineHeight: "1.7" }}>Need help? Contact our support team at <Link href="mailto:support@company.com" style={{ color: "#2563eb" }}>noreply@justdy.com</Link>.</Text>
    </JustdyEmailLayout>
  );
}
