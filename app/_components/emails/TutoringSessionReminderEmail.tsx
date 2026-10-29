import { Button, Heading, Text } from "@react-email/components";
import JustdyEmailLayout, { justdyEmailColors as c } from "./JustdyEmailLayout";

interface Props {
  username: string;
  subject: string;
  date: string;
  time: string;
  tutoringUrl: string;
  lead: string;
}

export default function TutoringSessionReminderEmail({ username, subject, date, time, tutoringUrl, lead }: Props) {
  return (
    <JustdyEmailLayout preview="Your Justdy tutoring session is coming up" footerNote="This is a reminder about your upcoming Justdy tutoring session.">
      <Heading as="h1" style={{ margin: "0 0 14px", color: c.navy, fontSize: "25px", lineHeight: "1.3" }}>Your Session Is Coming Up</Heading>
      <Text style={{ margin: "0 0 18px", color: c.text, fontSize: "15px", lineHeight: "1.8" }}>Hi {username},</Text>
      <Text style={{ margin: "0 0 22px", color: "#475569", fontSize: "15px", lineHeight: "1.8" }}>{lead}</Text>
      <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{ borderCollapse: "collapse", border: `1px solid ${c.border}` }}>
        {([["Subject", subject], ["Date", date], ["Time", time]] as const).map(([label, value]) => <tr key={label}><td style={{ padding: "12px 14px", borderBottom: `1px solid ${c.border}`, color: c.muted, fontSize: "13px", width: "38%" }}>{label}</td><td style={{ padding: "12px 14px", borderBottom: `1px solid ${c.border}`, color: c.text, fontSize: "14px", fontWeight: 600 }}>{value}</td></tr>)}
      </table>
      <div style={{ marginTop: "26px" }}><Button href={tutoringUrl} style={{ display: "inline-block", backgroundColor: c.navy, color: "#ffffff", padding: "14px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>Open My Tutoring Sessions</Button></div>
    </JustdyEmailLayout>
  );
}
