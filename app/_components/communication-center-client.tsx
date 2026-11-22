"use client";

import { useEffect, useState } from "react";
import MarketingCenterClient from "@/app/_components/marketing-center-client";
import { toast } from "sonner";
import {
  Search,
  RefreshCw,
  Users,
  GraduationCap,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  Eye,
  X,
} from "lucide-react";

type Contact = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  role: "LEARNER" | "TUTOR";
  accountStatus: string;
  emailVerified: boolean;
  createdAt: string;
  marketingStatus: string;
  marketingEligible: boolean;
  marketingReason: string;
  suppressed: boolean;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type RoleFilter = "ALL" | "LEARNER" | "TUTOR";

type CommunicationPurpose =
  | "ACCOUNT_SUPPORT"
  | "TUTORING_INQUIRY"
  | "BOOKING"
  | "PAYMENT"
  | "SERVICE_UPDATE"
  | "OTHER_SERVICE";

type CommunicationMessage = {
  id: string;
  textContent: string;
  resendMessageId: string | null;
  purpose: CommunicationPurpose;
  status: "PENDING" | "SENDING" | "SENT" | "FAILED";
  recipientEmail: string;
  recipientName: string | null;
  subject: string;
  serviceReason: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
  sender: {
    name: string;
  };
};

const purposeLabels: Record<CommunicationPurpose, string> = {
  ACCOUNT_SUPPORT: "Account support",
  TUTORING_INQUIRY: "Tutoring inquiry",
  BOOKING: "Booking",
  PAYMENT: "Payment",
  SERVICE_UPDATE: "Service update",
  OTHER_SERVICE: "Other service-related reason",
};


async function readResponse(response: Response) {
  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.providerAccepted || result.inProgress) {
    const error = new Error(
      result.error || "Unable to complete the request.",
    ) as Error & {
      communicationId?: string;
      uncertain?: boolean;
    };

    error.communicationId = result.communicationId;
    error.uncertain = Boolean(result.inProgress || result.providerAccepted);

    throw error;
  }

  return result;
}


function AccountStatus({ contact }: { contact: Contact }) {
  const active = contact.accountStatus === "Active";

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-slate-600">
        {contact.emailVerified ? "Email verified" : "Email not verified"}
      </span>

      <span className="h-1 w-1 rounded-full bg-slate-400" />

      <span
        className={`w-fit rounded-lg px-2.5 py-1 text-xs font-semibold ${
          active
            ? "bg-emerald-50 text-emerald-700"
            : "bg-slate-100 text-slate-600"
        }`}
      >
        {contact.accountStatus}
      </span>
    </div>
  );
}

export default function CommunicationCenterClient() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<RoleFilter>("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<CommunicationMessage | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [purpose, setPurpose] = useState<CommunicationPurpose>("ACCOUNT_SUPPORT");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [serviceReason, setServiceReason] = useState("");
  const [sending, setSending] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"contacts" | "marketing">("contacts");

  const openHistory = async (contact: Contact) => {
  setSelectedContact(contact);
  setHistoryOpen(true);
  setSelectedMessage(null);
  setMessages([]);
  setHistoryLoading(true);

  try {
    const params = new URLSearchParams({
      recipientId: contact.id,
    });

    const response = await fetch(
      `/api/admin/communications/contacts/messages?${params.toString()}`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      },
    );

    const result = await readResponse(response);
    setMessages(result.messages ?? []);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to load communication history.",
      );
    } finally {
    setHistoryLoading(false);
  }
};

  const openComposer = async (contact: Contact) => {
    setRequestId(null);
    setSelectedContact(contact);
    setComposerOpen(true);
    setMessages([]);
    setHistoryLoading(true);

    try {
      const params = new URLSearchParams({
        recipientId: contact.id,
      });

      const response = await fetch(
        `/api/admin/communications/contacts/messages?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        },
      );

      const result = await readResponse(response);
      setMessages(result.messages ?? []);
    } catch (error) {
      console.error("Unable to load communication history:", error);
      setMessages([]);
    } finally {
      setHistoryLoading(false);
    }
  };




const sendMessage = async () => {
  if (!selectedContact || sending) return;
  const activeRequestId = requestId ?? crypto.randomUUID();

  if (!requestId) {
    setRequestId(activeRequestId);
  }

  setSending(true);
  try {
    const response = await fetch(
      "/api/admin/communications/contacts/messages",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
       body: JSON.stringify({
          requestId: activeRequestId,
          recipientId: selectedContact.id,
          purpose,
          subject,
          message,
          serviceReason:
            purpose === "OTHER_SERVICE" ? serviceReason : undefined,
        }),
      },
    );

    await readResponse(response);

    // The email was successfully sent.
    toast.success("Email sent successfully.");
    setSubject("");
    setMessage("");
    setServiceReason("");
    setPurpose("ACCOUNT_SUPPORT");
    setRequestId(null);

    // Refresh history separately. A history error must not
    // incorrectly report that the email failed.
    try {
      const params = new URLSearchParams({
        recipientId: selectedContact.id,
      });

      const historyResponse = await fetch(
        `/api/admin/communications/contacts/messages?${params}`,
        {
          credentials: "include",
          cache: "no-store",
        },
      );

      const historyResult = await readResponse(historyResponse);
      setMessages(historyResult.messages ?? []);
    } catch (historyError) {
      console.error("Email sent, but history could not be refreshed:", historyError);
    }
  } catch (error) {
  const sendError = error as Error & {
    communicationId?: string;
    uncertain?: boolean;
  };

  toast.error(sendError.message || "Unable to send the email.");

  if (sendError.uncertain) {
   toast.warning(
        "Delivery is uncertain. Do not create another message until this one has been investigated.",
      );
  }
} finally {
  setSending(false);
}
};



useEffect(() => {
  const controller = new AbortController();

  const fetchContacts = async () => {
    try {
      const params = new URLSearchParams({
        search: search.trim(),
        role,
        page: String(page),
        pageSize: "20",
      });

      const response = await fetch(
        `/api/admin/communications/contacts?${params.toString()}`,
        {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        },
      );

      const result = await readResponse(response);

      setContacts(result.contacts ?? []);
      setPagination(result.pagination ?? null);
      setError("");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your contacts.",
      );
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  void fetchContacts();

  return () => controller.abort();
}, [search, role, page, refreshKey]);

    function changeRole(nextRole: RoleFilter) {
      setLoading(true);
      setError("");
      setRole(nextRole);
      setPage(1);
    }

    function changeSearch(value: string) {
      setLoading(true);
      setError("");
      setSearch(value);
      setPage(1);
    }

  const total = pagination?.total ?? 0;

   return (
    <>
     <main className={`${activeTab === "contacts" ? "min-h-full" : ""} bg-[#F8FAF7] px-4 py-6 text-[#20372A] sm:px-6 lg:px-8`}>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#173B2F] sm:text-3xl">
              Communication Center
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage learner and tutor contacts and see their communication
              eligibility.
            </p>
          </div>

          <button
            type="button"
          onClick={() => {
              setLoading(true);
              setError("");
              setRefreshKey((current) => current + 1);
            }}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#DCE7DD] bg-white px-4 text-sm font-semibold text-[#245C43] shadow-sm transition hover:bg-[#F0F6F0] disabled:opacity-60"
          >
            <RefreshCw
              className={`size-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
               </div>

        {/* Communication Center Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[#E1E9E2]">
          <button
            type="button"
            onClick={() => setActiveTab("contacts")}
            className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
              activeTab === "contacts"
                ? "border-[#245C43] text-[#245C43]"
                : "border-transparent text-slate-500 hover:text-[#245C43]"
            }`}
          >
            Contacts &amp; Service Emails
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("marketing")}
            className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
              activeTab === "marketing"
                ? "border-[#245C43] text-[#245C43]"
                : "border-transparent text-slate-500 hover:text-[#245C43]"
            }`}
          >
            Marketing Campaigns
          </button>
        </div>

        {activeTab === "contacts" ? (
          <>
            {/* Overview */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-[#E1E9E2] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">
                    <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900">
                  {loading && !pagination ? "—" : total.toLocaleString()}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Registered learners and tutors
                </p>
                  </span>
                  <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                    <Users className="size-5" />
                  </span>
                </div>
              </div>

          <div className="rounded-lg border border-[#E1E9E2] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                <p className="mt-3 text-2xl font-bold text-slate-900">
              {role === "ALL"
                ? "All accounts"
                : role === "LEARNER"
                  ? "Learners"
                  : "Tutors"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {total.toLocaleString()} matching records
            </p>
              </span>
              <span className="flex size-10 items-center justify-center rounded-lg bg-amber-50 text-amber-800">
                <GraduationCap className="size-5" />
              </span>
            </div>
          </div>
        </div>


       {composerOpen && selectedContact && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="service-email-title"
              className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-[#DCE7DD] bg-white shadow-2xl"
            >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#47805D]">
                  <Mail className="size-4" />
                  Compose message
                </div>
              </div>

              <button
                type="button"
                onClick={() => setComposerOpen(false)}
                className="rounded-full border border-slate-200 px-2 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                <X className="size-7 rounded-full"/>
               
              </button>
            </div>

            <div className="grid gap-6 p-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-5">
                <div className="rounded-xl bg-[#F8FAF7] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Recipient
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {selectedContact.name}
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Message purpose
                  </label>
                  <select
                    value={purpose}
                   onChange={(event) => {
                      setRequestId(null);
                      setPurpose(event.target.value as CommunicationPurpose);
                    }}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#438260]"
                  >
                    {Object.entries(purposeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {purpose === "OTHER_SERVICE" && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Explain the service-related reason
                    </label>
                    <textarea
                      value={serviceReason}
                      onChange={(event) => {
                        setRequestId(null);
                        setServiceReason(event.target.value);
                      }}
                      rows={3}
                      maxLength={1000}
                      placeholder="Explain why this message is necessary for the recipient's Justdy service relationship..."
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#438260]"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Subject
                  </label>
                  <input
                    value={subject}
                    onChange={(event) => {
                      setRequestId(null);
                      setSubject(event.target.value);
                    }}
                    maxLength={200}
                    placeholder="Enter email subject"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#438260]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(event) => {
                      setRequestId(null);
                      setMessage(event.target.value);
                    }}
                    rows={9}
                    maxLength={20000}
                    placeholder="Write your service-related message..."
                    className="w-full rounded-lg border border-slate-200 p-3 text-sm leading-6 outline-none focus:border-[#438260]"
                  />
                  <p className="mt-1 text-right text-xs text-slate-400">
                    {message.length.toLocaleString()} / 20,000 characters
                  </p>
                </div>

                

                <div className="flex flex-wrap gap-3">
                 <button
                    type="button"
                    disabled={
                      sending ||
                      !subject.trim() ||
                      !message.trim() ||
                      (purpose === "OTHER_SERVICE" && !serviceReason.trim())
                    }
                    onClick={() => void sendMessage()}
                    className="rounded-xl bg-[#245C43] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#194832] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? "Sending..." : "Send email"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setComposerOpen(false);
                    }}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <aside className="overflow-hidden rounded-xl border border-[#E1E9E2] bg-[#F8FAF7]">
                <div className="border-b border-[#E1E9E2] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Eye className="size-4 text-[#47805D]" />
                      <h3 className="font-bold text-[#173B2F]">
                        Live email preview
                      </h3>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                      LIVE
                    </span>
                  </div>
                
                </div>

                <div className="max-h-[65vh] overflow-y-auto p-4">
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-[#183F2D] p-5 text-white">
                      <div className="flex items-center gap-2">
                        <Mail className="size-5" />
                        <span className="text-lg font-bold tracking-wide">
                          JUSTDY
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-emerald-100">
                        Learning made easier.
                      </p>
                    </div>

                    <div className="space-y-4 p-5">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          To
                        </p>
                        <p className="mt-1 break-all text-sm font-medium text-slate-700">
                          {selectedContact.email}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Subject
                        </p>
                        <p className="mt-1 break-words text-sm font-bold text-slate-900">
                          {subject.trim() || "Your email subject will appear here"}
                        </p>
                      </div>

                      <div className="border-t border-slate-100 pt-4">
                        <p className="mb-3 text-xs text-slate-500">
                          Hello {selectedContact.name},
                        </p>

                        <div className="min-h-40 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                          {message.trim() || "Your email message will appear here as you type..."}
                        </div>
                      </div>

                      {purpose === "OTHER_SERVICE" && (
                        <div className="rounded-lg bg-amber-50 p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
                            Internal service reason
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-xs text-amber-800">
                            {serviceReason || "No reason entered yet."}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-100 bg-[#F8FAF7] p-4 text-center">
                      <p className="text-xs font-semibold text-[#245C43]">
                        Justdy
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        This email relates to your Justdy service.
                      </p>
                    </div>
                  </div>
                </div>
              </aside>

            </div>
          </section>
          </div>
        )}

        {/* Directory */}
        <section className="overflow-hidden rounded-lg border border-[#E1E9E2] bg-white shadow-sm">
          <div className="space-y-4 border-b border-slate-100 p-4 sm:p-5">
            <div>
             
              <p className="mt-1 text-sm text-slate-500">
                Registered accounts, including people who have not subscribed
                to marketing emails.
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={search}
                  onChange={(event) => changeSearch(event.target.value)}
                  placeholder="Search name, email, or phone..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#438260] focus:ring-4 focus:ring-emerald-900/5"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["ALL", "Everyone"],
                    ["LEARNER", "Learners"],
                    ["TUTOR", "Tutors"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => changeRole(value)}
                    className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                      role === value
                        ? "bg-[#245C43] text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-230 text-left">
              <thead className="bg-[#F8FAF7]">
                <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Phone</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Joined</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center">
                      <RefreshCw className="mx-auto size-6 animate-spin text-[#47805D]" />
                      <p className="mt-3 text-sm text-slate-500">
                        Loading contacts...
                      </p>
                    </td>
                  </tr>
                ) : contacts.length === 0 ? (
                  <tr>
                   <td colSpan={7} className="px-5 py-14 text-center">
                      <Users className="mx-auto size-8 text-slate-300" />
                      <p className="mt-3 font-semibold text-slate-700">
                        No contacts found
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Try a different search or account filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  contacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className="transition hover:bg-[#FAFCFA]"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">
                          {contact.name} ({contact.role === "TUTOR" ? "T" : "L"})
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                          <Mail className="size-3.5 shrink-0" />
                          {contact.email}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {contact.phoneNumber ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="size-3.5 text-slate-400" />
                            {contact.phoneNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400">Not provided</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <AccountStatus contact={contact} />
                      </td>

                    
                      <td className="px-5 py-4 text-sm text-slate-500">
                        {new Date(contact.createdAt).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </td>
                     <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void openHistory(contact)}
                          title="View communication history"
                          aria-label={`View communication history for ${contact.name}`}
                          className="inline-flex size-9 items-center justify-center rounded-lg border border-[#DCE7DD] bg-white text-[#245C43] transition hover:bg-[#F0F6F0]"
                        >
                          <Eye className="size-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => void openComposer(contact)}
                          title="Send service email"
                          aria-label={`Send service email to ${contact.name}`}
                          className="inline-flex size-9 items-center justify-center rounded-lg bg-[#245C43] text-white transition hover:bg-[#194832]"
                        >
                          <Mail className="size-4" />
                        </button>
                      </div>
                    </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-sm text-slate-500">
              {total === 0
                ? "No contacts"
                : `Showing ${(page - 1) * 20 + 1}–${Math.min(
                    page * 20,
                    total,
                  )} of ${total.toLocaleString()} contacts`}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!pagination?.hasPreviousPage || loading}
               onClick={() => {
                  setLoading(true);
                  setPage((current) => Math.max(1, current - 1));
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
                Previous
              </button>

              <span className="px-2 text-sm tabular-nums text-slate-500">
                {pagination?.page ?? 1} / {Math.max(1, pagination?.totalPages ?? 1)}
              </span>

              <button
                type="button"
                disabled={!pagination?.hasNextPage || loading}
                onClick={() => {
                  setLoading(true);
                  setPage((current) => current + 1);
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="size-4" />
              </button>
            </div>
            </div>
        </section>
          </>
        ) : null}
      </div>
    </main>


    {historyOpen && selectedContact && (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="communication-history-title"
          className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          {/* Modal header */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#47805D]">
                <MessageSquareText className="size-4" />
                Individual communication history
              </div>

              <h2
                id="communication-history-title"
                className="mt-2 text-xl font-bold text-[#173B2F]"
              >
                {selectedContact.name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {selectedContact.email} · {selectedContact.role === "TUTOR" ? "Tutor" : "Learner"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setHistoryOpen(false);
                setSelectedMessage(null);
              }}
              aria-label="Close communication history"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
          </div>

          {/* Modal content */}
          <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[0.9fr_1.1fr]">
            {/* Message list */}
            <div className="border-b border-slate-100 p-4 md:border-b-0 md:border-r sm:p-5">
              <h3 className="mb-4 font-bold text-[#173B2F]">
                Previous emails ({messages.length})
              </h3>

              {historyLoading ? (
                <div className="py-12 text-center">
                  <RefreshCw className="mx-auto size-6 animate-spin text-[#47805D]" />
                  <p className="mt-3 text-sm text-slate-500">
                    Loading communication history...
                  </p>
                </div>
             
              ) : messages.length === 0 ? (
                <div className="rounded-xl bg-[#F8FAF7] px-4 py-10 text-center">
                  <Mail className="mx-auto size-7 text-slate-400" />
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    No previous emails
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    No individual service emails have been recorded for this contact.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedMessage(item)}
                      className={`w-full rounded-xl border p-3 text-left transition ${
                        selectedMessage?.id === item.id
                          ? "border-[#47805D] bg-[#F0F6F0]"
                          : "border-slate-200 bg-white hover:border-[#B8D0BD] hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#47805D]">
                          {purposeLabels[item.purpose]}
                        </span>

                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                            item.status === "SENT"
                              ? "bg-emerald-50 text-emerald-700"
                              : item.status === "FAILED"
                                ? "bg-red-50 text-red-700"
                                : item.status === "SENDING"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {item.status === "SENDING" ? "PROCESSING" : item.status}
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-semibold text-slate-800">
                        {item.subject}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected message details */}
            <div className="p-4 sm:p-6">
              {selectedMessage ? (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#47805D]">
                      Email details
                    </p>
                    <h3 className="mt-2 break-words text-xl font-bold text-[#173B2F]">
                      {selectedMessage.subject}
                    </h3>
                  </div>

                  <div className="grid gap-3 rounded-xl bg-[#F8FAF7] p-4 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-500">Recipient</p>
                      <p className="mt-1 break-all font-semibold text-slate-800">
                        {selectedMessage.recipientEmail}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Sent by</p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {selectedMessage.sender.name}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Created</p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {new Date(selectedMessage.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Sent at</p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {selectedMessage.sentAt
                          ? new Date(selectedMessage.sentAt).toLocaleString()
                          : "Not confirmed"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Status</p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {selectedMessage.status === "SENDING"
                          ? "Processing"
                          : selectedMessage.status}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Purpose</p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {purposeLabels[selectedMessage.purpose]}
                      </p>
                    </div>
                  </div>

                  {selectedMessage.serviceReason && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Service reason
                      </p>
                      <p className="rounded-xl border border-slate-200 p-3 text-sm leading-6 text-slate-700">
                        {selectedMessage.serviceReason}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Full email content
                    </p>
                    <div className="min-h-40 whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-700">
                      {selectedMessage.textContent}
                    </div>
                  </div>

                  {selectedMessage.errorMessage && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                      <p className="text-xs font-bold text-red-700">
                        Delivery error
                      </p>
                      <p className="mt-1 text-sm text-red-600">
                        {selectedMessage.errorMessage}
                      </p>
                    </div>
                  )}

                  {selectedMessage.resendMessageId && (
                    <div>
                      <p className="text-xs text-slate-500">
                        Resend message reference
                      </p>
                      <p className="mt-1 break-all font-mono text-xs text-slate-600">
                        {selectedMessage.resendMessageId}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex min-h-64 flex-col items-center justify-center text-center">
                  <Mail className="size-9 text-slate-300" />
                  <p className="mt-3 font-semibold text-slate-700">
                    Select an email
                  </p>
                  <p className="mt-1 max-w-xs text-sm text-slate-500">
                    Choose an email from the history list to view its complete details.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    )}


    {activeTab === "marketing" && <MarketingCenterClient />}
    </>
  );
}