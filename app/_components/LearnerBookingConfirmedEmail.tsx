import * as React from "react";

interface LearnerEmailProps {
  username: string;
  subject: string;
  date: string;
  time: string;
  amountPaid: string;
  verificationUrl: string; // Dynamic URL passed from your webhook payload
}

export default function LearnerBookingConfirmedEmail({
  username,
  subject,
  date,
  time,
  amountPaid,
  verificationUrl, // 1. Destructure the prop here
}: LearnerEmailProps) {
  return (
    <div
      style={{
        fontFamily: "sans-serif",
        padding: "20px",
        color: "#333",
        lineHeight: "1.5",
      }}
    >
      <h2>Hi {username}! 🎉</h2>
      <p>Thank you for completing your onboarding setup and payment.</p>

      {/* 2. Verification Call to Action Button */}
      <div style={{ margin: "25px 0", textAlign: "center" }}>
        <p
          style={{
            marginBottom: "12px",
            fontSize: "15px",
            fontWeight: "bold",
            color: "#4F46E5",
          }}
        >
          Action Required: Please verify your account setup
        </p>
        <a
          href={verificationUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: "#4F46E5",
            color: "#ffffff",
            padding: "12px 24px",
            borderRadius: "6px",
            textDecoration: "none",
            display: "inline-block",
            fontWeight: "bold",
            boxShadow: "0 2px 4px rgba(79, 70, 229, 0.2)",
          }}
        >
          Verify My Email Address
        </a>
        <p style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
          This link will expire in 24 hours.
        </p>
      </div>

      <hr
        style={{
          border: "none",
          borderTop: "1px solid #eee",
          margin: "25px 0",
        }}
      />

      <p>
        Your tutoring session booking has been successfully secured. Below are
        your session details:
      </p>

      <div
        style={{
          background: "#f9f9f9",
          padding: "15px",
          borderRadius: "5px",
          borderLeft: "4px solid #4F46E5",
        }}
      >
        <p style={{ margin: "5px 0" }}>
          <strong>Subject:</strong> {subject}
        </p>
        <p style={{ margin: "5px 0" }}>
          <strong>Date:</strong> {date}
        </p>
        <p style={{ margin: "5px 0" }}>
          <strong>Time:</strong> {time}
        </p>
        <p style={{ margin: "5px 0" }}>
          <strong>Amount Processed:</strong> ${amountPaid} USD
        </p>
      </div>

      <p style={{ marginTop: "25px" }}>
        Please log in to your dashboard to view your calendar details or contact
        support if you need to adjust scheduling constraints.
      </p>

      <p style={{ marginTop: "20px" }}>
        Best regards,
        <br />
        <strong>The Team</strong>
      </p>

      {/* 3. Fallback plaintext URL layout for older email setups */}
      <div
        style={{
          marginTop: "40px",
          paddingTop: "15px",
          borderTop: "1px solid #f0f0f0",
        }}
      >
        <p style={{ fontSize: "11px", color: "#999", wordBreak: "break-all" }}>
          If the button above doesn&apos;t work, copy and paste this URL into
          your browser: <br />
          <a href={verificationUrl} style={{ color: "#4F46E5" }}>
            {verificationUrl}
          </a>
        </p>
      </div>
    </div>
  );
}
