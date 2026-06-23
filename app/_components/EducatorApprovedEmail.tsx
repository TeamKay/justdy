import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Tailwind,
} from "@react-email/components";

interface Props {
  username: string;
  setupUrl: string;
}

export default function EducatorApprovedEmail({ username, setupUrl }: Props) {
  return (
    <Html>
      <Head />

      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto my-10 max-w-140 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            {/* Header */}
            <Section className="mb-6">
              <div className="mb-4 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
                ✓ Application Approved
              </div>

              <Text className="m-0 text-3xl font-semibold tracking-tight text-gray-900">
                Congratulations, {username}! 🎉
              </Text>

              <Text className="mt-3 text-base leading-6 text-gray-600">
                Your educator application has been reviewed and approved.
                Welcome aboard!
              </Text>
            </Section>

            <Hr className="my-6 border-gray-200" />

            {/* Content */}
            <Section>
              <Text className="text-base leading-6 text-gray-700">
                Your educator account is ready. Set up your password to unlock
                access to your educator dashboard and start managing your
                teaching experience.
              </Text>

              <Section className="my-8 text-center">
                <Button
                  href={setupUrl}
                  className="
                    rounded-lg 
                    bg-emerald-600 
                    px-6 
                    py-3 
                    text-sm 
                    font-semibold 
                    text-white
                    no-underline
                  "
                >
                  Create Your Password
                </Button>
              </Section>

              <Section className="rounded-lg bg-gray-50 p-4">
                <Text className="m-0 text-sm leading-5 text-gray-500">
                  For your security, this setup link will expire automatically.
                  If you did not request this, you can safely ignore this email.
                </Text>
              </Section>
            </Section>

            <Hr className="my-6 border-gray-200" />

            {/* Footer */}
            <Text className="text-center text-xs text-gray-400">
              © {new Date().getFullYear()} Your Platform. All rights reserved.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
