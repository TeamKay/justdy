import { Button, Heading, Text } from "@react-email/components";
import JustdyEmailLayout, { justdyEmailColors as c } from "./JustdyEmailLayout";

interface FamilyInvitationEmailProps {
  childName: string;
  inviterName: string;
  familyName: string;
  acceptUrl: string;
}

export default function FamilyInvitationEmail({ childName, inviterName, familyName, acceptUrl }: FamilyInvitationEmailProps) {
  return (
    <JustdyEmailLayout preview="You have been invited to join a Justdy family" footerNote="You received this email because someone invited you to a Justdy family.">
      <Heading as="h1" style={{ margin: "0 0 18px", color: c.navy, fontSize: "25px", lineHeight: "1.3" }}>Family Invitation</Heading>
      <Text style={{ margin: "0 0 14px", color: c.text, fontSize: "15px", lineHeight: "1.8" }}>Hello,</Text>
      <Text style={{ margin: "0 0 20px", color: "#475569", fontSize: "15px", lineHeight: "1.8" }}>
        {inviterName} has invited you to join the {familyName} family on Justdy{childName ? ` to help manage learning for ${childName}` : ""}.
      </Text>
      <Button href={acceptUrl} style={{ display: "inline-block", backgroundColor: c.navy, color: "#ffffff", padding: "14px 26px", borderRadius: "8px", fontSize: "14px", fontWeight: 700, lineHeight: "20px", textDecoration: "none" }}>Accept Invitation</Button>
      <Text style={{ margin: "24px 0 8px", color: c.muted, fontSize: "13px", lineHeight: "1.7" }}>If the button doesn’t work, copy and paste this link into your browser:</Text>
      <Text style={{ margin: 0, fontSize: "12px", lineHeight: "1.7", overflowWrap: "anywhere" }}><a href={acceptUrl} style={{ color: "#2563eb" }}>{acceptUrl}</a></Text>
    </JustdyEmailLayout>
  );
}
