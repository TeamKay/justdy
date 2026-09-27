import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface Props {
  username: string;
  subject: string;
  date: string;
  time: string;
  tutoringUrl: string;
  lead: string;
}

export default function TutoringSessionReminderEmail({
  username,
  subject,
  date,
  time,
  tutoringUrl,
  lead,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Your Justdy tutoring session is coming up</Preview>
      <Body style={{ margin: 0, padding: "40px 16px", backgroundColor: "#f8fafc", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#0f172a" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <Section style={{ padding: "28px 32px", backgroundColor: "#0f172a" }}>
            <Text style={{ margin: 0, color: "#fff", fontSize: "22px", fontWeight: 700 }}>Justdy</Text>
            <Text style={{ margin: "6px 0 0", color: "#cbd5e1", fontSize: "13px" }}>Live tutoring reminder</Text>
          </Section>
          <Section style={{ padding: "36px 32px" }}>
            <Heading style={{ margin: "0 0 12px", fontSize: "28px", lineHeight: "36px" }}>Your session is coming up</Heading>
            <Text style={{ margin: "0 0 24px", fontSize: "16px", lineHeight: "26px", color: "#475569" }}>Hi {username},</Text>
            <Text style={{ margin: "0 0 20px", fontSize: "15px", lineHeight: "24px", color: "#475569" }}>{lead}</Text>
            <Text style={{ margin: "0 0 8px", fontSize: "15px", fontWeight: 700 }}>Subject: {subject}</Text>
            <Text style={{ margin: "0 0 24px", fontSize: "15px", color: "#475569" }}>{date} · {time}</Text>
            <Button href={tutoringUrl} style={{ backgroundColor: "#0f172a", color: "#fff", padding: "12px 20px", borderRadius: "8px", textDecoration: "none", fontWeight: 700 }}>Open my tutoring sessions</Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
