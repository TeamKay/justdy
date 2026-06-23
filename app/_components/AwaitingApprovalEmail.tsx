import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Img,
} from "@react-email/components";
import * as React from "react";

interface AwaitingApprovalEmailProps {
  username: string;
}

export const AwaitingApprovalEmail = ({
  username,
}: AwaitingApprovalEmailProps) => {
  return (
    <Html>
      <Head />

      <Preview>
        Your email has been verified. Your educator profile is awaiting review.
      </Preview>

      <Body style={main}>
        <Container style={container}>
          {/* Brand */}
          <Section style={brandSection}>
            <Img
              src={`${process.env.BETTER_AUTH_URL}/images/logo.png`}
              alt="Justdy"
              width="42"
              height="42"
              style={logo}
            />
          </Section>

          {/* Main Card */}
          <Section style={card}>
            <Heading style={heading}>Email verified successfully 🎉</Heading>

            <Text style={paragraph}>Hi {username},</Text>

            <Text style={paragraph}>
              Thanks for verifying your email address. Your educator profile has
              been successfully submitted and is now waiting for our team to
              review.
            </Text>

            {/* Status */}
            <Section style={statusWrapper}>
              <Text style={statusBadge}>● Awaiting Admin Approval</Text>
            </Section>

            <Text style={paragraph}>
              Our team is currently reviewing your credentials, experience, and
              professional information. This process usually takes
              <strong> 24 - 48 hours</strong>.
            </Text>

            <Text style={paragraph}>
              No action is required from you right now. We&apos;ll notify you as
              soon as your educator workspace is approved and ready.
            </Text>

            <Hr style={divider} />

            <Text style={mutedText}>
              Need to make changes or have questions? Contact our support team
              and we&apos;ll be happy to help.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Justdy. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default AwaitingApprovalEmail;

/* ---------------- Styles ---------------- */

const main = {
  backgroundColor: "#f8fafc",
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const container = {
  maxWidth: "540px",
  margin: "0 auto",
  padding: "40px 20px",
};

const brandSection = {
  textAlign: "center" as const,
  marginBottom: "28px",
};

const logo = {
  margin: "0 auto",
  borderRadius: "12px",
};

const card = {
  backgroundColor: "#ffffff",
  borderRadius: "18px",
  border: "1px solid #e5e7eb",
  padding: "40px",
  boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
};

const heading = {
  fontSize: "24px",
  lineHeight: "32px",
  fontWeight: "700",
  color: "#111827",
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const paragraph = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#475569",
  margin: "0 0 18px",
};

const statusWrapper = {
  textAlign: "center" as const,
  margin: "28px 0",
};

const statusBadge = {
  display: "inline-block",
  backgroundColor: "#fff7ed",
  color: "#c2410c",
  border: "1px solid #fed7aa",
  borderRadius: "999px",
  padding: "8px 18px",
  fontSize: "13px",
  fontWeight: "600",
  margin: 0,
};

const divider = {
  borderColor: "#e5e7eb",
  margin: "32px 0 24px",
};

const mutedText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#94a3b8",
  margin: 0,
};

const footer = {
  textAlign: "center" as const,
  marginTop: "24px",
};

const footerText = {
  fontSize: "12px",
  color: "#94a3b8",
};
