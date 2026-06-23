"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { updateEducatorProfile } from "../actions/user";

interface Props {
  educator: {
    id: string;
    name: string;
    email: string;
    imageUrl: string | null;
    specialty: string | null;
    experience: number | null;
    description: string | null;
    credentialUrl: string | null;
    verificationStatus: string | null;
  };
}

export function EducatorProfileForm({ educator }: Props) {
  const [pending, startTransition] = useTransition();

  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: educator.name || "",
    imageUrl: educator.imageUrl || "",
    specialty: educator.specialty || "",
    experience: educator.experience || 0,
    description: educator.description || "",
    credentialUrl: educator.credentialUrl || "",
  });

  const handleImageClick = () => {
    fileRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    setForm({
      ...form,
      imageUrl,
    });
  };

  const handleSubmit = () => {
    startTransition(async () => {
      await updateEducatorProfile(form);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            My Profile
          </h2>
          <p className="text-muted-foreground text-sm">
            Manage your profile and keep it up to date
          </p>
        </div>
      </div>

      <div className="rounded-md border bg-card p-8 shadow-sm">
        {/* Header */}

        <div className="grid gap-10 md:grid-cols-[220px_1fr]">
          {/* IMAGE SECTION */}

          <div className="flex flex-col items-center">
            <div
              onClick={handleImageClick}
              className="group relative cursor-pointer"
            >
              <Image
                src={form.imageUrl || "/placeholder-avatar.png"}
                alt="Educator"
                width={160}
                height={160}
                className="h-60 w-60 rounded-mdn border-4 object-cover shadow-md"
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

            <p
              className="
              mt-3
              text-center
              text-xs
              text-muted-foreground
            "
            >
              Click image to upload
            </p>

            <div className="mb-8 flex items-center pt-10 justify-between">
              <span className="rounded-md bg-emerald-900/40 px-4 py-1 text-[10px] text-white">
                {educator.verificationStatus ?? "Pending"}
              </span>
            </div>
          </div>

          {/* FORM */}

          <div className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <Input
                label="Full Name"
                value={form.name}
                onChange={(v) =>
                  setForm({
                    ...form,
                    name: v,
                  })
                }
              />

              <Input
                label="Specialty"
                placeholder="Mathematics"
                value={form.specialty}
                onChange={(v) =>
                  setForm({
                    ...form,
                    specialty: v,
                  })
                }
              />
            </div>

            <Input
              label="Years of Experience"
              type="number"
              value={String(form.experience)}
              onChange={(v) =>
                setForm({
                  ...form,
                  experience: Number(v),
                })
              }
            />

            <div>
              <label
                className="
                mb-2
                block
                text-sm
                font-medium
              "
              >
                Professional Bio
              </label>

              <textarea
                rows={5}
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                className="
                  w-full
                  rounded-xl
                  border
                  bg-background
                  px-4
                  py-3
                  outline-none
                  focus:ring-2
                "
                placeholder="
                Tell students about your teaching experience...
                "
              />
            </div>

            <Input
              label="Credential URL"
              placeholder="https://certificate.com"
              value={form.credentialUrl}
              onChange={(v) =>
                setForm({
                  ...form,
                  credentialUrl: v,
                })
              }
            />

            <div
              className="
              grid
              gap-5
              md:grid-cols-2
            "
            >
              <Input label="Email" value={educator.email} disabled />

              <Input
                label="Account Status"
                value={educator.verificationStatus ?? "Pending"}
                disabled
              />
            </div>

            <button
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
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label
        className="
 mb-2
 block
 text-sm
 font-medium
"
      >
        {label}
      </label>

      <input
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
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
