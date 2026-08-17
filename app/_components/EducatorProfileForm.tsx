"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { updateEducatorProfile } from "@/app/actions/user";

interface Props {
  educator: {
    id: string;
    name: string;
    email: string;
    imageUrl: string | null;
    verificationStatus: string | null;
  };
}

export function EducatorProfileForm({ educator }: Props) {
  const [pending, startTransition] = useTransition();

  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: educator.name || "",
    imageUrl: educator.imageUrl || "",
  });

  // ============================================================
  // IMAGE SELECT
  // ============================================================

  const handleImageClick = () => {
    fileRef.current?.click();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    /*
     * This creates a temporary browser preview.
     *
     * IMPORTANT:
     * A blob URL should eventually be replaced by an
     * UploadThing URL/key if you want the image to persist
     * permanently.
     */
    const imageUrl = URL.createObjectURL(file);

    setForm((previous) => ({
      ...previous,
      imageUrl,
    }));
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        await updateEducatorProfile(form);
      } catch (error) {
        console.error("Failed to update educator profile:", error);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* ========================================================
          HEADER
      ========================================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            My Profile
          </h2>

          <p className="text-sm text-muted-foreground">
            Manage your profile and keep it up to date
          </p>
        </div>
      </div>

      {/* ========================================================
          PROFILE CARD
      ========================================================= */}

      <div className="rounded-md border bg-card p-8 shadow-sm">
        <div className="grid gap-10 md:grid-cols-[220px_1fr]">
          {/* ====================================================
              IMAGE SECTION
          ==================================================== */}

          <div className="flex flex-col items-center">
            <div
              onClick={handleImageClick}
              className="group relative cursor-pointer"
            >
              <Image
                src={form.imageUrl || "/placeholder-avatar.png"}
                alt={
                  educator.name
                    ? `${educator.name} profile photo`
                    : "Educator profile"
                }
                width={160}
                height={160}
                className="h-60 w-60 rounded-md border-4 object-cover shadow-md"
              />

              <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/40 text-sm text-white opacity-0 transition group-hover:opacity-100">
                Change photo
              </div>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleImageChange}
            />

            <p className="mt-3 text-center text-xs text-muted-foreground">
              Click image to upload
            </p>

            <div className="mb-8 flex items-center pt-10">
              <span className="rounded-md bg-emerald-900/40 px-4 py-1 text-[10px] text-white">
                {educator.verificationStatus ?? "Pending"}
              </span>
            </div>
          </div>

          {/* ====================================================
              FORM
          ==================================================== */}

          <div className="space-y-6">
            {/* NAME + EMAIL */}

            <div className="grid gap-5 md:grid-cols-2">
              <Input
                label="Full Name"
                value={form.name}
                onChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    name: value,
                  }))
                }
              />

              <Input label="Email" value={educator.email} disabled />
            </div>

            {/* ACCOUNT INFORMATION */}

            <div className="grid gap-5 md:grid-cols-2">
              <Input
                label="Account Status"
                value={educator.verificationStatus ?? "Pending"}
                disabled
              />

              <Input label="User ID" value={educator.id} disabled />
            </div>

            {/* PROFILE PHOTO */}

            <div>
              <label className="mb-2 block text-sm font-medium">
                Profile Photo
              </label>

              <p className="text-sm text-muted-foreground">
                Click your profile image to select a new photo.
              </p>
            </div>

            {/* SAVE */}

            <button
              type="button"
              disabled={pending}
              onClick={handleSubmit}
              className="
                mt-4
                rounded-xl
                bg-black
                px-8
                py-3
                font-medium
                text-white
                transition
                hover:bg-neutral-800
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {pending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// INPUT COMPONENT
// ============================================================

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>

      <input
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
        className="
          w-full
          rounded-xl
          border
          bg-background
          px-4
          py-3
          outline-none
          transition
          focus:ring-2
          disabled:bg-muted
        "
      />
    </div>
  );
}
