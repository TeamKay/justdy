
"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  LockKeyhole,
  GraduationCap,
  ImagePlus,
  Loader2,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

import { updateSocialProfile } from "@/app/actions/social-profile";
import { uploadFileToStorage } from "@/lib/storage/client-upload";

type TeachingProfile = {
  headline: string | null;
  specialty: string | null;
  experience: number | null;
  description: string | null;
  hourlyRate: number | null;
  currency: string;
  subjects: unknown;
  gradeLevels: unknown;
  verificationStatus: string;
} | null;

type Props = {
  initialDisplayName: string;
  initialBio: string;
  username: string;
  initialImageUrl: string | null;
  initialTeachingProfile: TeachingProfile;
  canManageTeachingProfile: boolean;
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is string => typeof item === "string",
  );
}

export default function SocialProfileEditForm({
  initialDisplayName,
  initialBio,
  username,
  initialImageUrl,
  initialTeachingProfile,
  canManageTeachingProfile,
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);

  const [headline, setHeadline] = useState(
    initialTeachingProfile?.headline ?? "",
  );
  const [specialty, setSpecialty] = useState(
    initialTeachingProfile?.specialty ?? "",
  );
  const [experience, setExperience] = useState(
    initialTeachingProfile?.experience?.toString() ?? "",
  );
  const [description, setDescription] = useState(
    initialTeachingProfile?.description ?? "",
  );
  const [hourlyRate, setHourlyRate] = useState(
    initialTeachingProfile?.hourlyRate != null
      ? (initialTeachingProfile.hourlyRate / 100).toString()
      : "",
  );
  const [currency, setCurrency] = useState(
    initialTeachingProfile?.currency ?? "USD",
  );
  const [subjects, setSubjects] = useState(
    toStringArray(initialTeachingProfile?.subjects).join(", "),
  );
  const [gradeLevels, setGradeLevels] = useState(
    toStringArray(initialTeachingProfile?.gradeLevels).join(", "),
  );

  const [imageUrl, setImageUrl] = useState<string | null>(
    initialImageUrl,
  );
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const profileCompletion = useMemo(() => {
    const fields = [
      headline.trim(),
      specialty.trim(),
      experience.trim(),
      description.trim(),
      subjects.trim(),
      gradeLevels.trim(),
      hourlyRate.trim(),
    ];

    return Math.round(
      (fields.filter(Boolean).length / fields.length) * 100,
    );
  }, [
    headline,
    specialty,
    experience,
    description,
    subjects,
    gradeLevels,
    hourlyRate,
  ]);

  function handleImageSelection(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a JPG, PNG, WebP or AVIF image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile images must be 5MB or smaller.");
      event.target.value = "";
      return;
    }

    setSelectedImage(file);
    setImageUrl(URL.createObjectURL(file));
    event.target.value = "";
  }

  async function attachProfileImage(): Promise<void> {
    if (!selectedImage) return;

    const uploaded = await uploadFileToStorage({
      file: selectedImage,
      purpose: "PROFILE_IMAGE",
    });

    const response = await fetch(
      "/api/storage/profile-image/attach",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageMediaId: uploaded.id,
        }),
      },
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        data?.error ?? "Unable to save your profile photo.",
      );
    }

    setImageUrl(data.imageUrl);
    setSelectedImage(null);
  }

  async function saveTeachingProfile(): Promise<void> {
    if (!canManageTeachingProfile) return;

    const parsedExperience =
      experience.trim() === "" ? null : Number(experience);

    if (
      parsedExperience !== null &&
      (!Number.isFinite(parsedExperience) ||
        parsedExperience < 0 ||
        !Number.isInteger(parsedExperience))
    ) {
      throw new Error(
        "Years of experience must be a valid non-negative whole number.",
      );
    }

    const parsedHourlyRate =
      hourlyRate.trim() === "" ? null : Number(hourlyRate);

    if (
      parsedHourlyRate !== null &&
      (!Number.isFinite(parsedHourlyRate) || parsedHourlyRate < 0)
    ) {
      throw new Error("Please enter a valid non-negative hourly rate.");
    }

    const payload = {
      headline: headline.trim(),
      specialty: specialty.trim(),
      experience: parsedExperience,
      description: description.trim(),
      hourlyRate:
        parsedHourlyRate === null
          ? null
          : Math.round(parsedHourlyRate * 100),
      currency,
      subjects: subjects
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      gradeLevels: gradeLevels
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    const response = await fetch("/api/educator/profile", {
      method: initialTeachingProfile ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        data?.error ?? "Unable to save educator information.",
      );
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (saving) return;

    if (!displayName.trim()) {
      toast.error("Please enter a display name.");
      return;
    }

    setSaving(true);

    try {
      // Save the social identity first.
      const socialResult = await updateSocialProfile({
        displayName,
        bio,
      });

      if (!socialResult.success) {
        throw new Error(socialResult.error);
      }

      // Attach the shared user profile photo, if one was selected.
      await attachProfileImage();

      // Save professional information only for authorized educators.
      await saveTeachingProfile();

      toast.success("Your profile has been updated.");
      router.push(`/profile/${username}`);
      router.refresh();
    } catch (error) {
      console.error("Unified profile save error:", error);

      toast.error("Unable to complete all profile updates", {
        description:
          error instanceof Error
            ? error.message
            : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/profile/${username}`}
        className="mb-8 inline-flex items-center gap-2 text-sm text-[#64746A] transition hover:text-[#173B2F]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to profile
      </Link>

      <form onSubmit={handleSubmit} className="space-y-7">
        {/* Personal profile */}
        <section className="rounded-3xl border border-[#E8E9E2] bg-white p-6 shadow-sm sm:p-9">
          <div className="mb-7">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#B97832]">
              Your learning identity
            </p>

            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Edit your profile
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#64746A]">
              Manage your personal identity, profile photo, and
              professional teaching information in one place.
            </p>
          </div>

          {/* Shared profile photo */}
          <div className="mb-7 flex flex-col items-center gap-4 rounded-2xl bg-[#F7F8F4] p-5 sm:flex-row">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#EAF1EB] text-2xl font-semibold text-[#173B2F] shadow-sm">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt="Profile photo"
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <UserRound className="h-9 w-9" />
              )}
            </div>

            <div className="text-center sm:text-left">
              <p className="text-sm font-semibold">
                Your profile photo
              </p>
              <p className="mt-1 text-xs leading-5 text-[#87938A]">
                This photo is shared across your Justdy profile and
                educator features.
              </p>

              <button
                type="button"
                disabled={saving}
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg border border-[#DDE3DC] bg-white px-3 text-xs font-semibold text-[#173B2F] transition hover:bg-[#EAF1EB] disabled:opacity-50"
              >
                <ImagePlus className="h-4 w-4" />
                Change photo
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                onChange={handleImageSelection}
              />

              <p className="mt-2 text-[11px] text-[#87938A]">
                JPG, PNG, WebP or AVIF · Maximum 5MB
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="displayName"
                className="mb-2 block text-sm font-medium"
              >
                Display name
              </label>

              <input
                id="displayName"
                required
                maxLength={50}
                value={displayName}
                onChange={(event) =>
                  setDisplayName(event.target.value)
                }
                placeholder="Your display name"
                className="h-12 w-full rounded-xl border border-[#DDE3DC] bg-[#FCFDFB] px-4 text-sm outline-none transition focus:border-[#173B2F] focus:ring-2 focus:ring-[#173B2F]/10"
              />

              <p className="mt-2 text-xs text-[#87938A]">
                {displayName.length}/50 characters
              </p>
            </div>

            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium"
              >
                Username
              </label>

              <div className="flex h-12 items-center rounded-xl border border-[#E8E9E2] bg-[#F7F8F4] px-4 text-sm text-[#87938A]">
                @{username}
              </div>

              <p className="mt-2 text-xs text-[#87938A]">
                Your username cannot be changed here.
              </p>
            </div>

            <div>
              <label
                htmlFor="bio"
                className="mb-2 block text-sm font-medium"
              >
                About you
              </label>

              <textarea
                id="bio"
                rows={5}
                maxLength={300}
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Share a little about yourself and your learning interests..."
                className="w-full resize-y rounded-xl border border-[#DDE3DC] bg-[#FCFDFB] p-4 text-sm leading-6 outline-none transition focus:border-[#173B2F] focus:ring-2 focus:ring-[#173B2F]/10"
              />

              <p className="mt-2 text-right text-xs text-[#87938A]">
                {bio.length}/300 characters
              </p>
            </div>

            <div className="rounded-xl bg-[#F7F8F4] p-4">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-[#52745D]" />

                <div>
                  <p className="text-sm font-medium text-[#173B2F]">
                    Your privacy settings are unchanged
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#718075]">
                    Editing your profile does not change who can view it.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Educator information */}
        {canManageTeachingProfile && (
          <section className="rounded-3xl border border-[#E8E9E2] bg-white p-6 shadow-sm sm:p-9">
            <div className="mb-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF1EB] text-[#52745D]">
                  <GraduationCap className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-xl font-semibold">
                    Educator information
                  </h2>
                  <p className="mt-1 text-xs text-[#87938A]">
                    Professional details shown on your public profile
                  </p>
                </div>
              </div>

              <p className="mt-5 text-xs text-[#52745D]">
                Profile completion: {profileCompletion}%
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="headline"
                  className="mb-2 block text-sm font-medium"
                >
                  Professional headline
                </label>
                <input
                  id="headline"
                  maxLength={150}
                  value={headline}
                  onChange={(event) =>
                    setHeadline(event.target.value)
                  }
                  placeholder="e.g. Mathematics tutor helping students build confidence"
                  className="h-12 w-full rounded-xl border border-[#DDE3DC] bg-[#FCFDFB] px-4 text-sm outline-none focus:border-[#173B2F] focus:ring-2 focus:ring-[#173B2F]/10"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-medium"
                >
                  About your teaching
                </label>
                <textarea
                  id="description"
                  rows={5}
                  maxLength={3000}
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Tell students about your teaching approach, experience, and what they can expect."
                  className="w-full resize-y rounded-xl border border-[#DDE3DC] bg-[#FCFDFB] p-4 text-sm leading-6 outline-none focus:border-[#173B2F] focus:ring-2 focus:ring-[#173B2F]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="specialty"
                  className="mb-2 block text-sm font-medium"
                >
                  Specialty
                </label>
                <input
                  id="specialty"
                  maxLength={150}
                  value={specialty}
                  onChange={(event) =>
                    setSpecialty(event.target.value)
                  }
                  placeholder="e.g. Algebra & Geometry"
                  className="h-12 w-full rounded-xl border border-[#DDE3DC] bg-[#FCFDFB] px-4 text-sm outline-none focus:border-[#173B2F] focus:ring-2 focus:ring-[#173B2F]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="subjects"
                  className="mb-2 block text-sm font-medium"
                >
                  Subjects
                </label>
                <input
                  id="subjects"
                  value={subjects}
                  onChange={(event) =>
                    setSubjects(event.target.value)
                  }
                  placeholder="Mathematics, Algebra, Geometry"
                  className="h-12 w-full rounded-xl border border-[#DDE3DC] bg-[#FCFDFB] px-4 text-sm outline-none focus:border-[#173B2F] focus:ring-2 focus:ring-[#173B2F]/10"
                />
                <p className="mt-1 text-xs text-[#87938A]">
                  Separate subjects with commas.
                </p>
              </div>

              <div>
                <label
                  htmlFor="gradeLevels"
                  className="mb-2 block text-sm font-medium"
                >
                  Grade levels
                </label>
                <input
                  id="gradeLevels"
                  value={gradeLevels}
                  onChange={(event) =>
                    setGradeLevels(event.target.value)
                  }
                  placeholder="Middle School, High School"
                  className="h-12 w-full rounded-xl border border-[#DDE3DC] bg-[#FCFDFB] px-4 text-sm outline-none focus:border-[#173B2F] focus:ring-2 focus:ring-[#173B2F]/10"
                />
                <p className="mt-1 text-xs text-[#87938A]">
                  Separate grade levels with commas.
                </p>
              </div>

              <div>
                <label
                  htmlFor="experience"
                  className="mb-2 block text-sm font-medium"
                >
                  Years of experience
                </label>
                <input
                  id="experience"
                  type="number"
                  min="0"
                  max="80"
                  step="1"
                  value={experience}
                  onChange={(event) =>
                    setExperience(event.target.value)
                  }
                  placeholder="e.g. 5"
                  className="h-12 w-full rounded-xl border border-[#DDE3DC] bg-[#FCFDFB] px-4 text-sm outline-none focus:border-[#173B2F] focus:ring-2 focus:ring-[#173B2F]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="hourlyRate"
                  className="mb-2 block text-sm font-medium"
                >
                  Hourly rate
                </label>
                <input
                  id="hourlyRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={hourlyRate}
                  onChange={(event) =>
                    setHourlyRate(event.target.value)
                  }
                  placeholder="0.00"
                  className="h-12 w-full rounded-xl border border-[#DDE3DC] bg-[#FCFDFB] px-4 text-sm outline-none focus:border-[#173B2F] focus:ring-2 focus:ring-[#173B2F]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="currency"
                  className="mb-2 block text-sm font-medium"
                >
                  Currency
                </label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(event) =>
                    setCurrency(event.target.value)
                  }
                  className="h-12 w-full rounded-xl border border-[#DDE3DC] bg-[#FCFDFB] px-4 text-sm outline-none focus:border-[#173B2F] focus:ring-2 focus:ring-[#173B2F]/10"
                >
                  <option value="USD">USD — US Dollar</option>
                  <option value="GHS">GHS — Ghanaian Cedi</option>
                  <option value="GBP">GBP — British Pound</option>
                  <option value="EUR">EUR — Euro</option>
                </select>
              </div>
            </div>
          </section>
        )}

        {saving && (
          <p className="text-center text-xs text-[#87938A]">
            Saving your profile information...
          </p>
        )}

        <button
          type="submit"
          disabled={saving || !displayName.trim()}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#173B2F] px-5 text-sm font-semibold text-white transition hover:bg-[#24513F] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving profile...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save all changes
            </>
          )}
        </button>
      </form>
    </div>
  );
}
