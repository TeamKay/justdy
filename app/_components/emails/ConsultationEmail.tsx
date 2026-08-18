import * as React from "react";

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
  sessionDate,
  startTime,
  purpose,
}: FreeConsultationEmailProps) {
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f9fafb",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          padding: "32px",
          border: "1px solid #e5e7eb",
        }}
      >
        <h1 style={{ color: "#111827", fontSize: "22px", marginTop: "0" }}>
          Free Consultation Confirmed! 🎉
        </h1>
        <p style={{ color: "#4b5563", fontSize: "15px", lineHeight: "1.5" }}>
          Hi {name},
        </p>
        <p style={{ color: "#4b5563", fontSize: "15px", lineHeight: "1.5" }}>
          Your 15-minute free consultation for <strong>{subject}</strong> has
          been successfully scheduled. Here are your booking details:
        </p>

        <div
          style={{
            backgroundColor: "#f3f4f6",
            borderRadius: "9px",
            padding: "16px",
            margin: "20px 0",
          }}
        >
          <p style={{ margin: "4px 0", color: "#1f2937", fontSize: "14px" }}>
            <strong>Subject:</strong> {subject}
          </p>
          <p style={{ margin: "4px 0", color: "#1f2937", fontSize: "14px" }}>
            <strong>Date:</strong> {sessionDate}
          </p>
          <p style={{ margin: "4px 0", color: "#1f2937", fontSize: "14px" }}>
            <strong>Time:</strong> {startTime}
          </p>
          {purpose && (
            <p style={{ margin: "4px 0", color: "#1f2937", fontSize: "14px" }}>
              <strong>Goal:</strong> {purpose}
            </p>
          )}
        </div>

        <p style={{ color: "#4b5563", fontSize: "14px" }}>
          Our team will reach out with a meeting link shortly prior to your
          scheduled time slot.
        </p>

        <p style={{ color: "#9ca3af", fontSize: "12px", marginTop: "24px" }}>
          If you need to reschedule or have any questions, feel free to reply to
          this email.
        </p>
      </div>
    </div>
  );
}
