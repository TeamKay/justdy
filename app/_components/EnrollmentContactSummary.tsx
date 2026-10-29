import React from "react";

type EnrollmentContactSummaryProps = {
  enrollmentType?: "self" | "parent_guardian" | "other_person" | string | null;
  contactName?: string | null;
  studentName?: string | null;
  phoneNumber?: string | null;
  assignedTutorName?: string | null;
  gradeLevel?: string | null;
  preferredContact?: string | null;
  potentialStartDate?: string | Date | null;
  createdAt?: string | Date | null;
  email?: string | null;
  assignedTutorContact?: string | null;
  assignedTutorEmail?: string | null;
  learnerEmail?: string | null;
  learnerUserId?: string | null;
  learnerAccountSetupSentAt?: string | Date | null;
  planAgreedAt?: string | Date | null;
};

const enrollmentLabels: Record<string, string> = {
  self: "Self-enrollment",
  parent_guardian: "Parent / guardian",
  other_person: "Someone else",
};

function formatDate(value?: string | Date | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function EnrollmentContactSummary({
  enrollmentType,
  contactName,
  studentName,
  phoneNumber,
  potentialStartDate,
  email,
  gradeLevel,
  preferredContact,
  assignedTutorEmail,
  createdAt,
  assignedTutorName,
  learnerEmail,
  learnerUserId,
  learnerAccountSetupSentAt,
  planAgreedAt,
}: EnrollmentContactSummaryProps) {
  const hasLearnerAccount = Boolean(learnerUserId);
  const accountSetupSent = Boolean(learnerAccountSetupSentAt);
  const planIsAgreed = Boolean(planAgreedAt);
  const setupPending = planIsAgreed && !hasLearnerAccount && !accountSetupSent;
  const accountStatus = hasLearnerAccount
    ? "Learner account created"
    : accountSetupSent
      ? "Account setup invitation sent"
      : setupPending
        ? "Pending — learner email/account setup needed"
        : "Not started";

  return (
    <section
      aria-labelledby="enrollment-contact-summary-title"
      className="rounded-lg border border-slate-200 bg-white shadow-sm"
    >
      {/* Compact Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/70 px-3 py-2">
        <h3
          id="enrollment-contact-summary-title"
          className="text-sm font-semibold text-slate-900"
        >
          Enrollment & Contact Details
        </h3>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full bg-slate-200/70 px-2 py-0.5 text-[11px] font-medium text-slate-700">
            {enrollmentLabels[enrollmentType ?? ""] ??
              "Enrollment type not recorded"}
          </span>

          <span
            className={[
              "inline-flex rounded-lg px-2 py-0.5 text-[11px] font-semibold",
              hasLearnerAccount
                ? "bg-emerald-100 text-emerald-800"
                : setupPending || accountSetupSent
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-200 text-slate-700",
            ].join(" ")}
          >
            {accountStatus}
          </span>
        </div>
      </div>

      {/* Compact Details Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <tbody className="divide-y divide-slate-100">
            {/* Contact Details */}
            <tr className="hover:bg-slate-50/70">
              <th
                scope="row"
                className="w-32 whitespace-nowrap px-3 py-2 font-semibold text-slate-500 sm:w-40"
              >
                Contact Details
              </th>
              <td className="px-3 py-2 text-slate-900">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="font-medium">
                    {contactName?.trim() || "Not provided"}
                  </span>
                  <span className="hidden text-slate-300 sm:inline">|</span>
                  <span className="break-all text-slate-600">
                    {email?.trim() || "Not provided"}
                  </span>
                  <span className="hidden text-slate-300 sm:inline">|</span>
                  <span className="text-slate-600">
                    {phoneNumber?.trim() || "Not provided"}
                  </span>
                  <span className="hidden text-slate-300 sm:inline">|</span>
                  <span className="text-slate-600">
                    {"Contact by: " + preferredContact?.trim() ||
                      "Not provided"}
                  </span>
                </div>
              </td>
            </tr>

            {/* Learner Details */}
            <tr className="hover:bg-slate-50/70">
              <th
                scope="row"
                className="w-32 whitespace-nowrap px-3 py-2 font-semibold text-slate-500 sm:w-40"
              >
                Learner Details
              </th>
              <td className="px-3 py-2 text-slate-900">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="font-medium">
                    {studentName?.trim() || "Not provided"}
                  </span>
                  <span className="hidden text-slate-300 sm:inline">|</span>
                  <span className="break-all text-slate-600">
                    {learnerEmail?.trim() || "Not provided yet"}
                  </span>
                  <span className="hidden text-slate-300 sm:inline">|</span>
                  <span className="text-slate-600">
                    {phoneNumber?.trim() || "Not provided"}
                  </span>
                  <span className="hidden text-slate-300 sm:inline">|</span>
                  <span className="text-slate-600">
                    {gradeLevel?.trim() || "Not provided"}
                  </span>
                </div>
              </td>
            </tr>

            {/* Assigned Tutor */}
            <tr className="hover:bg-slate-50/70">
              <th
                scope="row"
                className="w-32 whitespace-nowrap px-3 py-2 font-semibold text-slate-500 sm:w-40"
              >
                Assigned Tutor
              </th>
              <td className="px-3 py-2 font-medium text-slate-900">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="font-medium">
                    {assignedTutorName?.trim() || "Not assigned"}
                  </span>
                  <span className="hidden text-slate-300 sm:inline">|</span>
                  <span className="break-all text-slate-600">
                    {assignedTutorEmail?.trim() || "Not provided yet"}
                  </span>
                  <span className="hidden text-slate-300 sm:inline">|</span>
                  <span className="text-slate-600">
                    {phoneNumber?.trim() || "Not provided"}
                  </span>
                </div>
              </td>
            </tr>

            {/* Assigned Tutor */}
            <tr className="hover:bg-slate-50/70">
              <th
                scope="row"
                className="w-32 whitespace-nowrap px-3 py-2 font-semibold text-slate-500 sm:w-40"
              >
                Request details
              </th>
              <td className="px-3 py-2 text-slate-900">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="font-medium">
                    Created on: {formatDate(createdAt)}
                  </span>
                  <span className="hidden text-slate-300 sm:inline">|</span>
                  <span className="font-medium">
                    Contact on: {formatDate(potentialStartDate)}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Learner Account Warning */}
      {planIsAgreed && !learnerEmail?.trim() && !hasLearnerAccount && (
        <div className="border-t border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
          <span className="font-semibold">Action required:</span> The tutoring
          plan is agreed, but the learner’s own email has not been recorded.
          Collect the learner’s email before creating their account. Do not use
          the contact person’s email as the learner login.
        </div>
      )}
    </section>
  );
}
