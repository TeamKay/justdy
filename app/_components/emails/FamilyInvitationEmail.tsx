import * as React from "react";

export default function FamilyInvitationEmail({
  childName,
  inviterName,
  familyName,
  acceptUrl,
}: {
  childName: string;
  inviterName: string;
  familyName: string;
  acceptUrl: string;
}) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", lineHeight: 1.6 }}>
      <h2>You’ve been invited to join a Justdy family</h2>
      <p>
        {inviterName} has invited you to join <strong>{familyName}</strong> on
        Justdy so your tutoring bookings and learning history can be connected.
      </p>
      <p>
        Sign in to the Justdy account for this email address, then use the
        button below to accept the invitation.
      </p>
      <p>
        <a
          href={acceptUrl}
          style={{
            display: "inline-block",
            padding: "12px 18px",
            borderRadius: 8,
            background: "#111827",
            color: "#ffffff",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Accept family invitation
        </a>
      </p>
      <p style={{ color: "#6b7280", fontSize: 13 }}>
        This invitation expires in 7 days. If you did not expect this
        invitation, you can ignore this email.
      </p>
    </div>
  );
}
