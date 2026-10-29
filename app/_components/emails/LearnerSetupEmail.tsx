import { Button, Heading, Link, Text } from "@react-email/components";
import JustdyEmailLayout, { justdyEmailColors as c } from "./JustdyEmailLayout";

interface Props {
  username: string;
  userEmail: string;
  setupUrl: string;
  verifyUrl: string;
}

export default function LearnerSetupEmail({ username, userEmail, setupUrl, verifyUrl }: Props) {
  return (
    <JustdyEmailLayout preview="Finish setting up your Justdy learner account" recipientEmail={userEmail} footerNote="You received this email to help you finish setting up your Justdy account.">
      <Heading as="h1" style={{ margin: "0 0 14px", color: c.navy, fontSize: "25px", lineHeight: "1.3" }}>Welcome to Justdy, {username}!</Heading>
      <Text style={{ margin: "0 0 16px", color: "#475569", fontSize: "15px", lineHeight: "1.8" }}>Your learner account is almost ready. Confirm your email address and complete your account setup using the buttons below.</Text>
      <div style={{ margin: "0 0 14px" }}><Button href={verifyUrl} style={{ display: "inline-block", backgroundColor: c.navy, color: "#ffffff", padding: "14px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>Verify Email Address</Button></div>
      <div style={{ margin: "0 0 24px" }}><Button href={setupUrl} style={{ display: "inline-block", backgroundColor: "#eff6ff", color: c.navy, padding: "13px 24px", border: `1px solid ${c.border}`, borderRadius: "8px", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>Complete Account Setup</Button></div>
      <Text style={{ margin: "0 0 8px", color: c.muted, fontSize: "13px", lineHeight: "1.7" }}>If a button doesn’t work, use the corresponding link:</Text>
      <Text style={{ margin: "0 0 8px", fontSize: "12px", lineHeight: "1.7", overflowWrap: "anywhere" }}>Verify: <Link href={verifyUrl} style={{ color: "#2563eb" }}>{verifyUrl}</Link></Text>
      <Text style={{ margin: 0, fontSize: "12px", lineHeight: "1.7", overflowWrap: "anywhere" }}>Setup: <Link href={setupUrl} style={{ color: "#2563eb" }}>{setupUrl}</Link></Text>
    </JustdyEmailLayout>
  );
}
