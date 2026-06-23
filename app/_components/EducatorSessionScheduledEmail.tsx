import * as React from "react";

interface EducatorEmailProps {
  educatorName: string;
  learnerName: string;
  subject: string;
  date: string;
  time: string;
}

export default function EducatorSessionScheduledEmail({
  educatorName,
  learnerName,
  subject,
  date,
  time,
}: EducatorEmailProps) {
  return (
    <div style={{ fontFamily: "sans-serif", padding: "20px", color: "#333" }}>
      <h2>Hello {educatorName},</h2>
      <p>
        Great news! A new student has just successfully completed onboarding
        configurations and booked an available window with you.
      </p>
      <div
        style={{
          background: "#f9f9f9",
          padding: "15px",
          borderRadius: "5px",
          borderLeft: "4px solid #10B981",
        }}
      >
        <p>
          <strong>Student Name:</strong> {learnerName}
        </p>
        <p>
          <strong>Focus Subject:</strong> {subject}
        </p>
        <p>
          <strong>Date:</strong> {date}
        </p>
        <p>
          <strong>Allocated Timeframe:</strong> {time}
        </p>
      </div>
      <p style={{ marginTop: "20px" }}>
        Please check your platform profile calendar dashboard to find dynamic
        links or study materials attached by the learner.
      </p>
      <p>
        Keep up the great work,
        <br />
        The Team
      </p>
    </div>
  );
}
