"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  BookOpen,
  Briefcase,
  Link as LinkIcon,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
} from "lucide-react";

interface SubjectOption {
  id: string;
  name: string;
  description: string | null;
}

interface EducatorApplicationFormProps {
  subjects: SubjectOption[];
}

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  specialty: string;
  experience: string;
  credentialUrl: string;
  description: string;
}

interface InputFieldProps {
  icon: React.ReactNode;
  label: string;
  name: keyof FormState;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: "text" | "email" | "tel" | "url" | "number";
  placeholder?: string;
  required?: boolean;
  min?: string | number;
}

const steps = ["Identity", "Competency", "Validation", "Review", "Status"];

const stepColors = [
  "bg-[#4B4C4E]",
  "bg-[#FFC700]",
  "bg-[#0A7080]",
  "bg-[#4B4C4E]",
  "bg-[#0A7080]",
];

export default function EducatorApplicationForm({
  subjects,
}: EducatorApplicationFormProps) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormState>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    specialty: "",
    experience: "",
    credentialUrl: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setStep(4);

    try {
      // Inside your frontend Form component -> submitForm function:
      const res = await fetch("/api/educator/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.fullName, // <-- Added
          email: formData.email, // <-- Added
          specialty: formData.specialty,
          experience: Number(formData.experience),
          credentialUrl: formData.credentialUrl,
          description: formData.description,
          contactNumber: formData.phone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Throw the error payload returned by your API route
        throw new Error(data.error || "Something went wrong on the server.");
      }

      setStatus({
        type: "success",
        text: "Application submitted successfully!",
      });
    } catch (err: unknown) {
      setStatus({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Unable to submit application. Please check your network details and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateAndNext = () => {
    if (step === 0 && (!formData.fullName || !formData.email)) return;
    if (step === 1 && (!formData.specialty || !formData.experience)) return;
    setStep((prev) => prev + 1);
  };

  const back = () => {
    setStep((prev) => prev - 1);
  };

  return (
    <div className="grow h-full flex flex-col items-center justify-center bg-background px-6 py-10">
      {/* --- STEPPER HEADER SECTION --- */}
      <div className="text-center mb-6 select-none">
        <h1 className="text-2xl font-extrabold tracking-tight text-white/70 sm:text-3xl pt-10">
          Setup Your Educator Profile
        </h1>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mt-1">
          Step {step + 1} of {steps.length} — {steps[step]}
        </p>
      </div>

      {/* --- REDESIGNED CHEVRON STEPPER BAR --- */}
      <div className="w-full max-w-4xl mb-10 overflow-x-auto no-scrollbar">
        <div className="flex items-center min-w-175 w-full select-none">
          {steps.map((item, index) => {
            const isActiveOrPassed = index <= step;
            const baseColor = stepColors[index];

            return (
              <div
                key={item}
                className="relative flex-1 h-12 flex items-center justify-center transition-opacity duration-300"
                style={{
                  clipPath:
                    "polygon(0% 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 0% 100%, 12px 50%)",
                  marginLeft: index === 0 ? "0px" : "-10px",
                  zIndex: steps.length - index,
                }}
              >
                <div
                  className={`absolute inset-0 transition-colors duration-300 ${
                    isActiveOrPassed ? baseColor : "bg-gray-200"
                  }`}
                />

                <span
                  className={`relative z-10 text-[10px] font-bold tracking-wider uppercase pl-2 ${
                    isActiveOrPassed
                      ? baseColor === "bg-[#FFC700]"
                        ? "text-black"
                        : "text-white"
                      : "text-gray-400"
                  }`}
                >
                  {item}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- FORM CONTENT CONTAINER --- */}
      <div className="max-w-xl w-full bg-white text-slate-900 rounded-md shadow-lg p-8">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {/* STEP 1: IDENTITY DETAILS */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold">Personal Information</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Your official platform communication details.
                </p>
              </div>

              <InputField
                icon={<User size={16} />}
                label="Full Name"
                name="fullName"
                placeholder="e.g., Sarah Jenkins"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
              <InputField
                icon={<Mail size={16} />}
                label="Email Address"
                type="email"
                name="email"
                placeholder="sarah@university.edu"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <InputField
                icon={<Phone size={16} />}
                label="Contact Number"
                type="tel"
                name="phone"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={handleChange}
              />

              <button
                type="button"
                disabled={!formData.fullName || !formData.email}
                onClick={validateAndNext}
                className="mt-4 bg-black text-white rounded-md py-3 w-full font-medium text-sm transition-colors disabled:opacity-50"
              >
                Continue Setup
              </button>
            </div>
          )}

          {/* STEP 2: COMPETENCY DETAILS */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold">Teaching Experience</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Specify your core domains of scholastic authority.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wide text-slate-700 flex items-center gap-2">
                  <BookOpen size={14} className="text-slate-400" /> Primary
                  Subject Specialty <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2.5 focus-within:ring-2 focus-within:ring-black/20 transition-all">
                  <select
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleChange}
                    className="w-full bg-transparent border-0 p-0 text-sm focus:outline-none focus:ring-0 text-slate-900"
                    required
                  >
                    <option value="">Select standard subject...</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.name}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <InputField
                icon={<Briefcase size={16} />}
                label="Years of Experience"
                type="number"
                name="experience"
                placeholder="e.g., 5"
                value={formData.experience}
                onChange={handleChange}
                min="0"
                required
              />

              <button
                type="button"
                disabled={!formData.specialty || !formData.experience}
                onClick={validateAndNext}
                className="mt-4 bg-black text-white rounded-md py-3 w-full font-medium text-sm transition-colors disabled:opacity-50"
              >
                Continue Setup
              </button>
            </div>
          )}

          {/* STEP 3: VALIDATION DETAILS */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold">Professional Verification</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Links to curriculum vitae, credentials, or external
                  verification profiles.
                </p>
              </div>

              <InputField
                icon={<LinkIcon size={16} />}
                label="Credential / Digital Portfolio URL"
                name="credentialUrl"
                type="url"
                placeholder="https://linkedin.com/in/username"
                value={formData.credentialUrl}
                onChange={handleChange}
              />

              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wide text-slate-700 flex items-center gap-2">
                  <FileText size={14} className="text-slate-400" /> Professional
                  Bio
                </label>
                <div className="relative rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2.5 focus-within:ring-2 focus-within:ring-black/20 transition-all">
                  <textarea
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full bg-transparent border-0 p-0 text-sm focus:outline-none focus:ring-0 text-slate-900 resize-none placeholder-slate-400"
                    placeholder="Describe your pedagogical accomplishments or metrics..."
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={validateAndNext}
                className="mt-4 bg-black text-white rounded-md py-3 w-full font-medium text-sm transition-colors"
              >
                Review Application
              </button>
            </div>
          )}

          {/* NEW STEP 4: REVIEW PANEL */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Eye size={20} className="text-slate-500" /> Review
                  Application
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Double-check your information details before dynamic
                  registration submission.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-lg p-5 space-y-4 text-sm divide-y divide-slate-100">
                <div className="grid grid-cols-3 gap-2 pb-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Identity
                  </span>
                  <div className="col-span-2 space-y-1">
                    <p className="font-semibold text-gray-900">
                      {formData.fullName}
                    </p>
                    <p className="text-xs text-gray-600">{formData.email}</p>
                    {formData.phone && (
                      <p className="text-xs text-gray-600">{formData.phone}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Domain
                  </span>
                  <div className="col-span-2 space-y-1">
                    <p className="font-semibold text-gray-900">
                      {formData.specialty}
                    </p>
                    <p className="text-xs text-gray-600">
                      {formData.experience} Years of Active Experience
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Credentials
                  </span>
                  <div className="col-span-2 space-y-2">
                    <p className="text-xs text-indigo-600 font-medium truncate">
                      {formData.credentialUrl || "No portfolio URL provided"}
                    </p>
                    <p className="text-xs text-gray-600 italic line-clamp-3 bg-white border border-gray-100 p-2 rounded">
                      {formData.description ||
                        "No professional overview biography summary text added yet."}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={submitForm}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md py-3 w-full font-medium text-sm transition-colors shadow-sm"
              >
                Confirm & Submit Application
              </button>
            </div>
          )}

          {/* STEP 5: PROCESSING RUNTIME OUTCOME */}
          {step === 4 && (
            <div className="text-center py-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-3">
                  <Loader2 size={45} className="animate-spin text-slate-500" />
                  <h2 className="text-xl font-bold mt-2">
                    Uploading Credentials
                  </h2>
                  <p className="text-sm text-gray-500">
                    Transmitting file hashes to registration pipeline...
                  </p>
                </div>
              ) : status?.type === "success" ? (
                <div className="space-y-3">
                  <CheckCircle size={50} className="mx-auto text-emerald-500" />
                  <h2 className="text-2xl font-bold">
                    Application Received 🎉
                  </h2>
                  <p className="text-sm text-gray-500 px-4">{status.text}</p>
                  <button
                    onClick={() => window.location.assign("/")}
                    className="mt-6 bg-black text-white rounded-md py-3 w-full font-medium text-sm"
                  >
                    Go To Home
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <AlertCircle size={50} className="mx-auto text-rose-500" />
                  <h2 className="text-2xl font-bold">Submission Failed</h2>
                  <p className="text-sm text-gray-500 px-4">{status?.text}</p>
                  <button
                    onClick={() => setStep(3)} // Route back safely onto editable preview deck grid
                    className="mt-6 bg-black text-white rounded-md py-3 w-full font-medium text-sm"
                  >
                    Modify Step Fields
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {step > 0 && step < 4 && (
          <button
            onClick={back}
            className="mt-6 text-sm text-gray-500 hover:underline block"
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}

function InputField({
  icon,
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  min,
}: InputFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold tracking-wide text-slate-700 flex items-center gap-2">
        <span className="text-slate-400">{icon}</span>
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative flex items-center rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2.5 focus-within:ring-2 focus-within:ring-black/20 transition-all">
        <input
          className="w-full bg-transparent border-0 p-0 text-sm focus:outline-none focus:ring-0 text-slate-900 placeholder-slate-400"
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          min={min}
        />
      </div>
    </div>
  );
}
