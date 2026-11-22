import { Heading, Text } from "@react-email/components";
import JustdyEmailLayout, { justdyEmailColors as c } from "./JustdyEmailLayout";

interface FreeConsultationEmailProps {
  name: string;
  subject: string;
  gradeLevel: string;
  sessionDate: string;
  startTime: string;
  purpose?: string;
}

export default function FreeConsultationEmail({
  name,
  subject,
  gradeLevel,
  sessionDate,
  startTime,
  purpose,
}: FreeConsultationEmailProps) {
  return (
    <JustdyEmailLayout preview="Your Justdy consultation details" footerNote="You received this email about your Justdy consultation.">
      <Heading as="h1" style={{ margin: "0 0 18px", color: c.navy, fontSize: "25px", lineHeight: "1.3" }}>Your Free Consultation</Heading>
      <Text style={{ margin: "0 0 14px", color: c.text, fontSize: "15px", lineHeight: "1.8" }}>Hello {name},</Text>
      <Text style={{ margin: "0 0 22px", color: "#475569", fontSize: "15px", lineHeight: "1.8" }}>Your free consultation has been arranged. Here are the details:</Text>
      <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{ borderCollapse: "collapse", border: `1px solid ${c.border}`, borderRadius: "10px" }}>
        {[
          ["Subject", subject],
          ["Grade level", gradeLevel],
          ["Date", sessionDate],
          ["Start time", startTime],
          ...(purpose ? [["Purpose", purpose]] : []),
        ].map(([label, value]) => (
          <tr key={label}>
            <td style={{ padding: "12px 14px", borderBottom: `1px solid ${c.border}`, color: c.muted, fontSize: "13px", width: "38%" }}>{label}</td>
            <td style={{ padding: "12px 14px", borderBottom: `1px solid ${c.border}`, color: c.text, fontSize: "14px", fontWeight: 600 }}>{value}</td>
          </tr>
        ))}
      </table>
    </JustdyEmailLayout>
  );
}
