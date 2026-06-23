import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Img,
  Hr,
} from "@react-email/components";

interface VerifyEmailProps {
  username: string;
  verifyUrl: string;
}

export default function VerifyEmail({ username, verifyUrl }: VerifyEmailProps) {
  return (
    <Html>
      <Head />

      <Body
        style={{
          backgroundColor: "#f8fafc",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
          padding: "40px 20px",
          margin: 0,
        }}
      >
        <Container
          style={{
            maxWidth: "520px",
            margin: "0 auto",
          }}
        >
          {/* Header */}
          <Section
            style={{
              textAlign: "center",
              marginBottom: "32px",
            }}
          >
            <Img
              src={`${process.env.BETTER_AUTH_URL}/images/logo.png`}
              alt="Justdy"
              width="42"
              height="42"
              style={{
                margin: "0 auto",
                borderRadius: "12px",
              }}
            />
          </Section>

          {/* Card */}
          <Section
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "16px",
              padding: "40px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.04)",
            }}
          >
            {/* Title */}
            <Text
              style={{
                fontSize: "24px",
                fontWeight: "700",
                lineHeight: "32px",
                color: "#111827",
                margin: "0 0 16px",
                textAlign: "center",
              }}
            >
              Verify your email
            </Text>

            {/* Description */}
            <Text
              style={{
                fontSize: "15px",
                lineHeight: "24px",
                color: "#6b7280",
                textAlign: "center",
                margin: "0 0 32px",
              }}
            >
              Hi {username}, welcome to Justdy 🎉
              <br />
              Please confirm your email address to activate your account.
            </Text>

            {/* CTA */}
            <Section
              style={{
                textAlign: "center",
              }}
            >
              <Button
                href={verifyUrl}
                style={{
                  backgroundColor: "#111827",
                  color: "#ffffff",
                  padding: "14px 32px",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: "600",
                  textDecoration: "none",
                  display: "inline-block",
                  letterSpacing: "0.02em",
                }}
              >
                Verify Email
              </Button>
            </Section>

            {/* Divider */}
            <Hr
              style={{
                borderColor: "#e5e7eb",
                margin: "32px 0",
              }}
            />

            {/* Fallback */}
            <Text
              style={{
                fontSize: "13px",
                lineHeight: "20px",
                color: "#9ca3af",
                marginBottom: "8px",
              }}
            >
              If the button doesn’t work, copy and paste this link:
            </Text>

            <Text
              style={{
                fontSize: "12px",
                lineHeight: "18px",
                color: "#2563eb",
                wordBreak: "break-all",
                margin: 0,
              }}
            >
              {verifyUrl}
            </Text>
          </Section>

          {/* Footer */}
          <Section
            style={{
              textAlign: "center",
              marginTop: "28px",
            }}
          >
            <Text
              style={{
                fontSize: "12px",
                color: "#9ca3af",
                lineHeight: "18px",
              }}
            >
              If you didn&apos;t create this account, you can safely ignore this
              email.
            </Text>

            <Text
              style={{
                fontSize: "12px",
                color: "#9ca3af",
                marginTop: "8px",
              }}
            >
              © {new Date().getFullYear()} Justdy. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
