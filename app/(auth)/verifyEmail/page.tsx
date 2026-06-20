import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
} from "@react-email/components";

interface VerifyEmailProps {
  username?: string;
  verificationUrl: string;
}

export default function VerifyEmail({
  username,
  verificationUrl,
}: VerifyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your password - Justdy</Preview>

      <Body className="bg-gray-100 py-10 font-sans">
        <Container className="mx-auto max-w-lg rounded-xl bg-white p-8 shadow">
          <Heading className="text-center text-2xl font-bold text-gray-900">
            Reset Your Justdy Password
          </Heading>

          <Text className="mt-6 text-gray-700">Hi {username || "there"},</Text>

          <Text className="text-gray-700">
            Thanks {username} for signing up. Please verify your email address
            to activate your account.
          </Text>

          <Section className="my-8 text-center">
            <Button
              href={verificationUrl}
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white"
            >
              Verify Email
            </Button>
          </Section>

          <Text className="text-sm text-gray-500">
            If you did not create an account, you can safely ignore this email.
          </Text>

          <Text className="mt-6 text-xs text-gray-400">
            This verification link may expire after a certain period for
            security reasons.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
