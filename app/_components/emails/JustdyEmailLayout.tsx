import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

export const justdyEmailColors = {
  page: "#f3f6fb",
  navy: "#102c54",
  accent: "#60a5fa",
  paleBlue: "#dbeafe",
  text: "#172033",
  muted: "#64748b",
  border: "#e8edf4",
};

interface JustdyEmailLayoutProps {
  preview: string;
  children: ReactNode;
  footerNote?: string;
  recipientEmail?: string;
}

export default function JustdyEmailLayout({
  preview,
  children,
  footerNote = "You received this email because of your activity with Justdy.",
  recipientEmail,
}: JustdyEmailLayoutProps) {
  const c = justdyEmailColors;
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, padding: "32px 12px", backgroundColor: c.page, color: c.text, fontFamily: "Arial, Helvetica, sans-serif" }}>
        <Container style={{ width: "100%", maxWidth: "600px", margin: "0 auto", backgroundColor: "#ffffff", borderRadius: "16px", overflow: "hidden" }}>
          <Section style={{ backgroundColor: c.navy, padding: "28px 32px" }}>
            <Text style={{ margin: 0, color: "#ffffff", fontSize: "29px", lineHeight: "1.2", fontWeight: 800, letterSpacing: "-1.2px" }}>
              justdy<span style={{ color: c.accent }}>.</span>
            </Text>
            <Text style={{ margin: "7px 0 0", color: c.paleBlue, fontSize: "13px", lineHeight: "20px" }}>Learn. Grow. Achieve.</Text>
          </Section>
          <Section style={{ padding: "34px 32px 24px" }}>{children}</Section>
          <Section style={{ padding: "8px 32px 30px" }}>
            <div style={{ height: "1px", backgroundColor: c.border, marginBottom: "18px" }} />
            {recipientEmail ? <Text style={{ margin: "0 0 8px", color: c.muted, fontSize: "12px", lineHeight: "1.7" }}>This email was sent to {recipientEmail}.</Text> : null}
            <Text style={{ margin: "0 0 8px", color: c.muted, fontSize: "12px", lineHeight: "1.7" }}>{footerNote}</Text>
            <Text style={{ margin: 0, color: "#94a3b8", fontSize: "12px", lineHeight: "1.7" }}>© {new Date().getFullYear()} Justdy. All rights reserved.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
