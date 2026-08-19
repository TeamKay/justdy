"use client";

import { useState } from "react";
import {
  User,
  Shield,
  Bell,
  Palette,
  Lock,
  BookOpen,
  Users,
  Globe,
  CreditCard,
  Mail,
  Settings2,
  Database,
  FileText,
  Trash2,
  ChevronRight,
  Check,
  Moon,
  Sun,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";

type UserRole = "ADMIN" | "LEARNER";

interface SettingsPageProps {
  role?: UserRole;
}

type SettingsSection = {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  adminOnly?: boolean;
};

const learnerSections: SettingsSection[] = [
  {
    id: "profile",
    title: "Profile",
    description: "Manage your personal information and profile",
    icon: User,
  },
  {
    id: "account",
    title: "Account & Security",
    description: "Password, login and account security",
    icon: Shield,
  },
  {
    id: "learning",
    title: "Learning Preferences",
    description: "Customize your learning experience",
    icon: BookOpen,
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Choose what notifications you receive",
    icon: Bell,
  },
  {
    id: "appearance",
    title: "Appearance",
    description: "Customize how the platform looks",
    icon: Palette,
  },
  {
    id: "privacy",
    title: "Privacy",
    description: "Control your profile and activity visibility",
    icon: Lock,
  },
];

const adminSections: SettingsSection[] = [
  ...learnerSections,
  {
    id: "platform",
    title: "Platform Settings",
    description: "Configure your education platform",
    icon: Settings2,
    adminOnly: true,
  },
  {
    id: "users",
    title: "User Management",
    description: "Configure users, roles and permissions",
    icon: Users,
    adminOnly: true,
  },
  {
    id: "courses",
    title: "Learning & Courses",
    description: "Configure enrollment and course behavior",
    icon: BookOpen,
    adminOnly: true,
  },
  {
    id: "email",
    title: "Email Settings",
    description: "Configure platform email behavior",
    icon: Mail,
    adminOnly: true,
  },
  {
    id: "payments",
    title: "Payments & Billing",
    description: "Configure payments and transactions",
    icon: CreditCard,
    adminOnly: true,
  },
  {
    id: "security",
    title: "Platform Security",
    description: "Manage security and access controls",
    icon: Shield,
    adminOnly: true,
  },
  {
    id: "audit",
    title: "Audit Logs",
    description: "Review important platform activity",
    icon: FileText,
    adminOnly: true,
  },
];

export default function SettingsPage({ role = "LEARNER" }: SettingsPageProps) {
  const isAdmin = role === "ADMIN";

  const sections = isAdmin ? adminSections : learnerSections;

  const [activeSection, setActiveSection] = useState("profile");

  const activeSettings = sections.find(
    (section) => section.id === activeSection,
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Settings
          </h1>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Manage your account and preferences.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* SIDEBAR */}
          <aside className="h-fit rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-card">
            <div className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                const active = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                      active
                        ? "bg-[#857938]/10 text-[#857938]"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                    )}
                  >
                    <Icon className="size-5 shrink-0" />

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          active && "font-semibold",
                        )}
                      >
                        {section.title}
                      </p>

                      <p className="mt-0.5 hidden truncate text-xs text-slate-400 sm:block">
                        {section.description}
                      </p>
                    </div>

                    <ChevronRight
                      className={cn(
                        "size-4 shrink-0",
                        active ? "text-[#857938]" : "text-slate-400",
                      )}
                    />
                  </button>
                );
              })}
            </div>

            {/* ADMIN INDICATOR */}
            {isAdmin && (
              <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-800">
                <div className="flex items-center gap-2 rounded-lg bg-[#857938]/10 px-3 py-2">
                  <Shield className="size-4 text-[#857938]" />

                  <span className="text-xs font-medium text-[#857938]">
                    Administrator
                  </span>
                </div>
              </div>
            )}
          </aside>

          {/* CONTENT */}
          <main className="min-w-0">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-card">
              {/* SECTION HEADER */}
              {activeSettings && (
                <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800 sm:px-6">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#857938]/10">
                      <activeSettings.icon className="size-5 text-[#857938]" />
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {activeSettings.title}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {activeSettings.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION CONTENT */}
              <div className="p-5 sm:p-6">
                {activeSection === "profile" && <ProfileSettings />}

                {activeSection === "account" && <AccountSettings />}

                {activeSection === "learning" && <LearningSettings />}

                {activeSection === "notifications" && <NotificationSettings />}

                {activeSection === "appearance" && <AppearanceSettings />}

                {activeSection === "privacy" && <PrivacySettings />}

                {activeSection === "platform" && isAdmin && (
                  <PlatformSettings />
                )}

                {activeSection === "users" && isAdmin && <UserSettings />}

                {activeSection === "courses" && isAdmin && <CourseSettings />}

                {activeSection === "email" && isAdmin && <EmailSettings />}

                {activeSection === "payments" && isAdmin && <PaymentSettings />}

                {activeSection === "security" && isAdmin && (
                  <SecuritySettings />
                )}

                {activeSection === "audit" && isAdmin && <AuditSettings />}
              </div>
            </div>

            {/* DANGER ZONE */}
            <div className="mt-6 rounded-xl border border-red-200 bg-white shadow-sm dark:border-red-900/40 dark:bg-card">
              <div className="border-b border-red-100 px-5 py-4 dark:border-red-900/30">
                <div className="flex items-center gap-2">
                  <Trash2 className="size-5 text-red-500" />

                  <h2 className="font-semibold text-red-600 dark:text-red-400">
                    Danger Zone
                  </h2>
                </div>
              </div>

              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                    {isAdmin ? "Platform data" : "Delete your account"}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {isAdmin
                      ? "Irreversible actions affecting platform data."
                      : "Permanently delete your account and personal data."}
                  </p>
                </div>

                <button
                  type="button"
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-950/30"
                >
                  {isAdmin ? "Manage" : "Delete Account"}
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   SHARED COMPONENTS
========================================================================== */

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-100 py-5 last:border-0 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h3 className="text-sm font-medium text-slate-900 dark:text-white">
          {title}
        </h3>

        <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>

      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors",
        checked ? "bg-[#857938]" : "bg-slate-300 dark:bg-slate-700",
      )}
    >
      <span
        className={cn(
          "absolute top-1 size-4 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}

function SaveButton() {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-lg bg-[#857938] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#746a32]"
    >
      <Check className="size-4" />
      Save Changes
    </button>
  );
}

/* ==========================================================================
   LEARNER SETTINGS
========================================================================== */

function ProfileSettings() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-[#857938]/10 text-2xl font-bold text-[#857938]">
          JK
        </div>

        <div>
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Change Photo
          </button>

          <p className="mt-2 text-xs text-slate-400">
            JPG, PNG or WEBP. Maximum 5MB.
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <InputField label="First Name" defaultValue="John" />

        <InputField label="Last Name" defaultValue="Learner" />

        <InputField
          label="Email"
          type="email"
          defaultValue="learner@example.com"
        />

        <InputField
          label="Phone Number"
          defaultValue=""
          placeholder="Optional"
        />
      </div>

      <div className="flex justify-end border-t border-slate-100 pt-5 dark:border-slate-800">
        <SaveButton />
      </div>
    </div>
  );
}

function AccountSettings() {
  return (
    <div>
      <SettingRow
        title="Email address"
        description="Your account email address."
      >
        <span className="text-sm text-slate-600 dark:text-slate-300">
          learner@example.com
        </span>
      </SettingRow>

      <SettingRow title="Password" description="Change your account password.">
        <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
          Change Password
        </button>
      </SettingRow>

      <SettingRow
        title="Two-factor authentication"
        description="Add another layer of security to your account."
      >
        <Toggle checked={false} onChange={() => {}} />
      </SettingRow>

      <SettingRow
        title="Login sessions"
        description="Review devices currently signed into your account."
      >
        <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
          View Sessions
        </button>
      </SettingRow>
    </div>
  );
}

function LearningSettings() {
  return (
    <div>
      <SettingRow
        title="Preferred grade level"
        description="Used to personalize learning recommendations."
      >
        <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-background">
          <option>Grade 6</option>
          <option>Grade 7</option>
          <option>Grade 8</option>
          <option>Grade 9</option>
          <option>Grade 10</option>
          <option>Grade 11</option>
          <option>Grade 12</option>
        </select>
      </SettingRow>

      <SettingRow
        title="Learning reminders"
        description="Receive reminders about incomplete courses and activities."
      >
        <Toggle checked={true} onChange={() => {}} />
      </SettingRow>

      <SettingRow
        title="Show completed courses"
        description="Display completed courses in your dashboard."
      >
        <Toggle checked={true} onChange={() => {}} />
      </SettingRow>

      <SettingRow
        title="Auto-play lessons"
        description="Automatically start the next lesson when available."
      >
        <Toggle checked={false} onChange={() => {}} />
      </SettingRow>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div>
      <SettingRow
        title="Course updates"
        description="Receive notifications when your enrolled courses change."
      >
        <Toggle checked={true} onChange={() => {}} />
      </SettingRow>

      <SettingRow
        title="Assignment reminders"
        description="Get reminders about upcoming assignments."
      >
        <Toggle checked={true} onChange={() => {}} />
      </SettingRow>

      <SettingRow
        title="Announcements"
        description="Receive important platform announcements."
      >
        <Toggle checked={true} onChange={() => {}} />
      </SettingRow>

      <SettingRow
        title="Marketing emails"
        description="Receive news, offers and educational recommendations."
      >
        <Toggle checked={false} onChange={() => {}} />
      </SettingRow>
    </div>
  );
}

function AppearanceSettings() {
  const [theme, setTheme] = useState("system");

  return (
    <div>
      <p className="mb-4 text-sm font-medium text-slate-900 dark:text-white">
        Theme
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            id: "light",
            title: "Light",
            icon: Sun,
          },
          {
            id: "dark",
            title: "Dark",
            icon: Moon,
          },
          {
            id: "system",
            title: "System",
            icon: Monitor,
          },
        ].map((item) => {
          const Icon = item.icon;
          const selected = theme === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTheme(item.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                selected
                  ? "border-[#857938] bg-[#857938]/5"
                  : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800",
              )}
            >
              <Icon className="size-5" />

              <span className="text-sm font-medium">{item.title}</span>

              {selected && <Check className="ml-auto size-4 text-[#857938]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PrivacySettings() {
  return (
    <div>
      <SettingRow
        title="Profile visibility"
        description="Allow other learners to view your profile."
      >
        <Toggle checked={true} onChange={() => {}} />
      </SettingRow>

      <SettingRow
        title="Show learning progress"
        description="Allow educators to see your learning progress."
      >
        <Toggle checked={true} onChange={() => {}} />
      </SettingRow>

      <SettingRow
        title="Show activity"
        description="Allow others to see your recent learning activity."
      >
        <Toggle checked={false} onChange={() => {}} />
      </SettingRow>

      <SettingRow
        title="Download my data"
        description="Download a copy of your account and learning data."
      >
        <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
          Request Data
        </button>
      </SettingRow>
    </div>
  );
}

/* ==========================================================================
   ADMIN SETTINGS
========================================================================== */

function PlatformSettings() {
  return (
    <div>
      <div className="mb-5 rounded-lg bg-[#857938]/5 p-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          These settings affect the entire learning platform. Only
          administrators can modify them.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <InputField label="Platform Name" defaultValue="My Learning Platform" />

        <InputField
          label="Support Email"
          type="email"
          defaultValue="support@example.com"
        />

        <InputField label="Platform URL" defaultValue="https://example.com" />

        <InputField label="Default Language" defaultValue="English" />
      </div>

      <div className="mt-5 flex justify-end">
        <SaveButton />
      </div>
    </div>
  );
}

function UserSettings() {
  return (
    <div>
      <SettingRow
        title="Allow learner registration"
        description="Allow new learners to create accounts."
      >
        <Toggle checked={true} onChange={() => {}} />
      </SettingRow>

      <SettingRow
        title="Require email verification"
        description="Require users to verify their email before accessing the platform."
      >
        <Toggle checked={true} onChange={() => {}} />
      </SettingRow>

      <SettingRow
        title="Educator approval"
        description="Require administrator approval before educators can publish courses."
      >
        <Toggle checked={true} onChange={() => {}} />
      </SettingRow>

      <SettingRow
        title="Default user role"
        description="Role assigned to newly registered users."
      >
        <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-background">
          <option>LEARNER</option>
          <option>EDUCATOR</option>
        </select>
      </SettingRow>
    </div>
  );
}

function CourseSettings() {
  return (
    <div>
      <SettingRow
        title="Require enrollment approval"
        description="Require administrator approval before learners can enroll."
      >
        <Toggle checked={false} onChange={() => {}} />
      </SettingRow>

      <SettingRow
        title="Allow course reviews"
        description="Allow learners to rate and review completed courses."
      >
        <Toggle checked={true} onChange={() => {}} />
      </SettingRow>

      <SettingRow
        title="Allow course certificates"
        description="Enable certificates for eligible completed courses."
      >
        <Toggle checked={true} onChange={() => {}} />
      </SettingRow>

      <SettingRow
        title="Allow course previews"
        description="Allow learners to preview selected course content before enrollment."
      >
        <Toggle checked={true} onChange={() => {}} />
      </SettingRow>
    </div>
  );
}

function EmailSettings() {
  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-2">
        <InputField label="Sender Name" defaultValue="My Learning Platform" />

        <InputField
          label="Sender Email"
          type="email"
          defaultValue="noreply@example.com"
        />
      </div>

      <div className="mt-5">
        <SettingRow
          title="Enrollment emails"
          description="Send confirmation emails when learners enroll in courses."
        >
          <Toggle checked={true} onChange={() => {}} />
        </SettingRow>

        <SettingRow
          title="Course completion emails"
          description="Notify learners when they complete a course."
        >
          <Toggle checked={true} onChange={() => {}} />
        </SettingRow>

        <SettingRow
          title="Welcome emails"
          description="Send a welcome message to newly registered users."
        >
          <Toggle checked={true} onChange={() => {}} />
        </SettingRow>
      </div>

      <div className="mt-5 flex justify-end">
        <SaveButton />
      </div>
    </div>
  );
}

function PaymentSettings() {
  return (
    <div>
      <SettingRow
        title="Currency"
        description="Default currency used for course pricing."
      >
        <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-background">
          <option>USD — US Dollar</option>
          <option>GHS — Ghanaian Cedi</option>
          <option>EUR — Euro</option>
          <option>GBP — British Pound</option>
        </select>
      </SettingRow>

      <SettingRow
        title="Accept payments"
        description="Allow learners to purchase paid courses."
      >
        <Toggle checked={true} onChange={() => {}} />
      </SettingRow>

      <SettingRow
        title="Payment provider"
        description="Configure the payment provider used by your platform."
      >
        <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
          Configure
        </button>
      </SettingRow>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div>
      <SettingRow
        title="Require two-factor authentication"
        description="Require administrators to use two-factor authentication."
      >
        <Toggle checked={false} onChange={() => {}} />
      </SettingRow>

      <SettingRow
        title="Session timeout"
        description="Automatically sign users out after inactivity."
      >
        <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-background">
          <option>30 minutes</option>
          <option>1 hour</option>
          <option>4 hours</option>
          <option>8 hours</option>
          <option>24 hours</option>
        </select>
      </SettingRow>

      <SettingRow
        title="Login notifications"
        description="Notify users when a new login is detected."
      >
        <Toggle checked={true} onChange={() => {}} />
      </SettingRow>
    </div>
  );
}

function AuditSettings() {
  return (
    <div>
      <div className="mb-5 rounded-lg bg-slate-50 p-5 dark:bg-slate-900/50">
        <div className="flex items-start gap-3">
          <Database className="mt-0.5 size-5 text-[#857938]" />

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Platform Activity
            </h3>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Audit logs allow administrators to review important changes and
              account activity.
            </p>
          </div>
        </div>
      </div>

      <SettingRow
        title="Audit logging"
        description="Record important administrative actions."
      >
        <Toggle checked={true} onChange={() => {}} />
      </SettingRow>

      <SettingRow
        title="Retention period"
        description="How long audit records should be retained."
      >
        <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-background">
          <option>30 days</option>
          <option>90 days</option>
          <option>180 days</option>
          <option>1 year</option>
          <option>Indefinitely</option>
        </select>
      </SettingRow>

      <div className="mt-5">
        <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
          View Audit Logs
        </button>
      </div>
    </div>
  );
}

/* ==========================================================================
   INPUT
========================================================================== */

function InputField({
  label,
  type = "text",
  defaultValue,
  placeholder,
}: {
  label: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>

      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="
          w-full
          rounded-lg
          border
          border-slate-200
          bg-white
          px-3
          py-2.5
          text-sm
          outline-none
          transition
          placeholder:text-slate-400
          focus:border-[#857938]
          focus:ring-2
          focus:ring-[#857938]/20
          dark:border-slate-700
          dark:bg-background
          dark:text-white
        "
      />
    </div>
  );
}
