
import JustdyEmailLayout, { justdyEmailColors as c } from "./emails/JustdyEmailLayout";
import { Button, Heading, Hr, Img, Link, Section, Text } from "@react-email/components";

interface VerifyEmailProps {
  username: string;
  verifyUrl: string;
}

export default function VerifyEmail({ username, verifyUrl }: VerifyEmailProps) {
  return (
    <JustdyEmailLayout preview="Confirm your email address to activate your Justdy account" footerNote="If you didn’t create this account, you can safely ignore this email.">
      <Section style={{ textAlign: "center", margin: "0 0 24px" }}>
        <Img
          src={`${process.env.BETTER_AUTH_URL}/images/logo.png`}
          alt="Justdy"
          width="42"
          height="42"
          style={{ margin: "0 auto", borderRadius: "12px" }}
        />
      </Section>
      <Heading as="h1" style={{ margin: "0 0 16px", color: c.navy, fontSize: "25px", lineHeight: "1.3", textAlign: "center" }}>Verify your email</Heading>
      <Text style={{ margin: "0 0 28px", color: "#475569", fontSize: "15px", lineHeight: "1.8", textAlign: "center" }}>Hi {username}, welcome to Justdy 🎉!<br />Please confirm your email address to activate your account.</Text>
      <Section style={{ textAlign: "center", margin: "0 0 28px" }}><Button href={verifyUrl} style={{ display: "inline-block", backgroundColor: c.navy, color: "#ffffff", padding: "14px 28px", borderRadius: "8px", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>Verify Email</Button></Section>
      <Hr style={{ borderColor: c.border, margin: "28px 0 20px" }} />
      <Text style={{ margin: "0 0 8px", color: c.muted, fontSize: "13px", lineHeight: "1.7" }}>If the button doesn’t work, copy and paste this link:</Text>
      <Text style={{ margin: 0, fontSize: "12px", lineHeight: "1.7", overflowWrap: "anywhere" }}><Link href={verifyUrl} style={{ color: "#2563eb" }}>{verifyUrl}</Link></Text>
    </JustdyEmailLayout>
  );
}
