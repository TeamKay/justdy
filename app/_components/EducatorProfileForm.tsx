"use client";

import {
  FormEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ImagePlus,
  Loader2,
  Save,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing";

type Profile = {
  id: string;
  headline: string | null;
  specialty: string | null;
  experience: number | null;
  description: string | null;
  hourlyRate: number | null;
  currency: string;
  subjects: unknown;
  gradeLevels: unknown;
  verificationStatus: string;
  imageUrl?: string | null;
};

type Props = {
  initialProfile: Profile | null;
  initialImageUrl: string | null;
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string",
  );
}

export default function EducatorProfileForm({
  initialProfile,
  initialImageUrl,
}: Props) {
  const router = useRouter();

  const [headline, setHeadline] = useState(
    initialProfile?.headline ?? "",
  );

  const [specialty, setSpecialty] = useState(
    initialProfile?.specialty ?? "",
  );

  const [experience, setExperience] = useState(
    initialProfile?.experience?.toString() ?? "",
  );

  const [description, setDescription] = useState(
    initialProfile?.description ?? "",
  );

  const [hourlyRate, setHourlyRate] = useState(
    initialProfile?.hourlyRate !== null &&
      initialProfile?.hourlyRate !== undefined
      ? (
          initialProfile.hourlyRate / 100
        ).toString()
      : "",
  );

  const [currency, setCurrency] = useState(
    initialProfile?.currency ?? "USD",
  );

  const [subjects, setSubjects] = useState(
    toStringArray(
      initialProfile?.subjects,
    ).join(", "),
  );

  const [gradeLevels, setGradeLevels] =
    useState(
      toStringArray(
        initialProfile?.gradeLevels,
      ).join(", "),
    );

  const [loading, setLoading] =
    useState(false);

  /*
   * This is the image currently being displayed.
   *
   * It can be:
   * - the existing UploadThing URL from the database
   * - a temporary blob URL while the user is selecting a new image
   */
  const [imageUrl, setImageUrl] =
    useState<string | null>(
      initialImageUrl ?? null,
    );

  /*
   * The actual new image selected by the user.
   *
   * This is uploaded to UploadThing only when
   * the user clicks "Save changes".
   */
  const [selectedImage, setSelectedImage] =
    useState<File | null>(null);

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  /*
   * UploadThing uploader.
   *
   * This assumes your existing UploadThing
   * FileRouter contains "mediaUploader".
   */
  const {
    startUpload: startProfileImageUpload,
  } = useUploadThing("mediaUploader");

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

    const completed =
      fields.filter(Boolean).length;

    return Math.round(
      (completed / fields.length) * 100,
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
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Invalid image", {
        description:
          "Please select a valid image file.",
      });

      event.target.value = "";
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      toast.error(
        "Image is too large",
        {
          description:
            "Profile images must be 5MB or smaller.",
        },
      );

      event.target.value = "";
      return;
    }

    /*
     * Create a temporary preview URL.
     *
     * This URL is NEVER sent to Prisma.
     * It is only used for the preview until
     * UploadThing returns the permanent URL.
     */
    const objectUrl =
      URL.createObjectURL(file);

    setSelectedImage(file);
    setImageUrl(objectUrl);

    /*
     * Reset the input so selecting the same
     * image again will still trigger onChange.
     */
    event.target.value = "";
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);

    try {
      const subjectList = subjects
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const gradeLevelList =
        gradeLevels
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

      const parsedExperience =
        experience.trim() === ""
          ? null
          : Number(experience);

      if (
        parsedExperience !== null &&
        (!Number.isFinite(
          parsedExperience,
        ) ||
          parsedExperience < 0)
      ) {
        throw new Error(
          "Years of experience must be a valid non-negative number.",
        );
      }

      const parsedHourlyRate =
        hourlyRate.trim() === ""
          ? null
          : Number(hourlyRate);

      if (
        parsedHourlyRate !== null &&
        (!Number.isFinite(
          parsedHourlyRate,
        ) ||
          parsedHourlyRate < 0)
      ) {
        throw new Error(
          "Hourly rate must be a valid non-negative amount.",
        );
      }

      /*
       * Keep the existing image if the user
       * didn't select a replacement.
       */
      let finalImageUrl =
        initialImageUrl ?? null;

      /*
       * Only upload when the user actually
       * selected a new image.
       */
      if (selectedImage) {
        const uploadResult =
          await startProfileImageUpload([
            selectedImage,
          ]);

        if (
          !uploadResult ||
          uploadResult.length === 0
        ) {
          throw new Error(
            "Profile image upload failed.",
          );
        }

        /*
         * This is the permanent UploadThing URL.
         */
        finalImageUrl =
          uploadResult[0].url;

        /*
         * Make sure the displayed image now
         * uses the permanent URL rather than
         * the temporary blob URL.
         */
        setImageUrl(finalImageUrl);
      }

      const payload = {
        headline: headline.trim(),
        specialty: specialty.trim(),
        experience: parsedExperience,
        description:
          description.trim(),

        hourlyRate:
          parsedHourlyRate === null
            ? null
            : Math.round(
                parsedHourlyRate * 100,
              ),

        currency,
        subjects: subjectList,
        gradeLevels: gradeLevelList,

        /*
         * Permanent UploadThing URL.
         */
        imageUrl: finalImageUrl,
      };

      const response = await fetch(
        "/api/educator/profile",
        {
          method: initialProfile
            ? "PATCH"
            : "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            payload,
          ),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to save teaching profile.",
        );
      }

      /*
       * If the API returned a saved image URL,
       * use it as the canonical image URL.
       */
      if (
        typeof data?.imageUrl ===
        "string"
      ) {
        setImageUrl(
          data.imageUrl,
        );
      }

      /*
       * The selected file has now been
       * successfully persisted.
       */
      setSelectedImage(null);

      toast.success(
        initialProfile
          ? "Teaching profile updated successfully."
          : "Teaching profile created successfully.",
        {
          description:
            "Your teaching profile and profile image have been saved.",
        },
      );

      router.refresh();
    } catch (err) {
      console.error(
        "Save educator profile error:",
        err,
      );

      toast.error(
        "Unable to save profile",
        {
          description:
            err instanceof Error
              ? err.message
              : "Something went wrong while saving your profile.",
        },
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-7"
    >
      {/* Profile completion */}

      {/* Profile editor */}
      <section className="overflow-hidden rounded-md border border-emerald-900 bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="border-b border-emerald-900 px-6 py-5">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-white">
              Teaching profile
            </h2>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Create a professional profile that helps students
              understand who you are, what you teach, and how you can
              help them.
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
            {/* =========================================================
                LEFT — PROFILE PHOTO
            ========================================================== */}
            <div>
              <div className="sticky top-6">
                <div className="mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-white">
                    Profile photo
                  </h3>
                </div>

                {/* Clickable photo frame */}
                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  disabled={loading}
                  className="group relative block w-full overflow-hidden rounded-md bg-emerald-900 text-left transition-all duration-200 hover:shadow-[0_8px_30px_rgba(16,185,129,0.10)] focus:outline-none focus:ring-4 focus:ring-emerald-900 disabled:cursor-not-allowed disabled:opacity-70"
                  aria-label="Choose profile photo"
                >
                  <div className="aspect-square w-full overflow-hidden">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt="Selected profile"
                        width={500}
                        height={500}
                        unoptimized
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full min-h-65 w-full flex-col items-center justify-center bg-emerald-900">
                        <div className="flex h-14 w-14 items-center justify-center rounded-md bg-emerald-900 text-slate-400 shadow-sm transition-colors group-hover:border-emerald-200 group-hover:text-emerald-600">
                          <ImagePlus className="h-6 w-6" />
                        </div>

                        <p className="mt-4 text-xs font-semibold text-white">
                          Add profile photo
                        </p>

                        <p className="mt-1 px-6 text-center text-[11px] leading-5 text-white">
                          Click anywhere here to upload your photo
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Hover upload overlay */}
                  {imageUrl ? (
                    <div className="absolute inset-x-0 bottom-0 translate-y-full bg-emerald-900 px-4 py-3 text-center backdrop-blur-sm transition-transform duration-200 group-hover:translate-y-0">
                      <div className="flex items-center justify-center gap-2 text-xs font-semibold text-white">
                        <ImagePlus className="h-3.5 w-3.5" />
                        Change photo
                      </div>
                    </div>
                  ) : null}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={
                    handleImageSelection
                  }
                />

                {/* Upload details */}
                <div className="mt-3 flex items-center justify-between px-1">
                  <span className="text-[10px] text-slate-400">
                    JPG, PNG or WebP
                  </span>

                  <span className="text-[10px] font-medium text-slate-400">
                    Max 5MB
                  </span>
                </div>
              </div>
            </div>

            {/* =========================================================
                RIGHT — PROFESSIONAL INFORMATION
            ========================================================== */}
            <div className="min-w-0">
              {/* Professional information */}
              <div>
                <div className="grid gap-5 sm:grid-cols-2">
                  {/* Headline */}
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="headline"
                      className="mb-1.5 block text-xs font-semibold text-white"
                    >
                      Professional Profile headline
                    </label>

                    <input
                      id="headline"
                      value={headline}
                      onChange={(event) =>
                        setHeadline(
                          event.target.value,
                        )
                      }
                      placeholder="e.g. Mathematics tutor helping students build confidence"
                      className="h-11 w-full rounded-none border border-emerald-900 bg-card px-3.5 text-sm text-white outline-none transition placeholder:text-muted-foreground hover:border-emerald-950 focus:border-emerald-950 focus:ring-emerald-950"
                    />
                  </div>

                  {/* About */}
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="description"
                      className="mb-1.5 block text-xs font-semibold text-white"
                    >
                      About your teaching
                    </label>

                    <textarea
                      id="description"
                      value={description}
                      onChange={(event) =>
                        setDescription(
                          event.target.value,
                        )
                      }
                      rows={5}
                      placeholder="Tell students about your teaching approach, experience, and what they can expect."
                      className="h-30 w-full resize-none rounded-none border border-emerald-900 bg-card px-3.5 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-muted-foreground hover:border-emerald-950 focus:border-emerald-950 focus:ring-emerald-950"
                    />
                  </div>

                  {/* Specialty */}
                  <div>
                    <label
                      htmlFor="specialty"
                      className="mb-1.5 block text-xs font-semibold text-white"
                    >
                      Specialty
                    </label>

                    <input
                      id="specialty"
                      value={specialty}
                      onChange={(event) =>
                        setSpecialty(
                          event.target.value,
                        )
                      }
                      placeholder="e.g. Algebra & Geometry"
                      className="h-11 w-full rounded-none border border-emerald-900 bg-card px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-muted-foreground hover:border-emerald-950 focus:border-emerald-950 focus:ring-emerald-950"
                    />
                  </div>

                  {/* Subjects */}
                  <div>
                    <label
                      htmlFor="subjects"
                      className="mb-1.5 block text-xs font-semibold text-white"
                    >
                      Subjects
                    </label>

                    <input
                      id="subjects"
                      value={subjects}
                      onChange={(event) =>
                        setSubjects(
                          event.target.value,
                        )
                      }
                      placeholder="Mathematics, Algebra, Geometry"
                      className="h-11 w-full rounded-none border border-emerald-900 bg-card px-3.5 text-sm text-white outline-none transition placeholder:text-muted-foreground hover:border-emerald-950 focus:border-emerald-950 focus:ring-emerald-950"
                    />
                  </div>

                  {/* Grade levels */}
                  <div>
                    <label
                      htmlFor="gradeLevels"
                      className="mb-1.5 block text-xs font-semibold text-white"
                    >
                      Grade levels
                    </label>

                    <input
                      id="gradeLevels"
                      value={gradeLevels}
                      onChange={(event) =>
                        setGradeLevels(
                          event.target.value,
                        )
                      }
                      placeholder="Middle School, High School"
                      className="h-11 w-full rounded-none border border-emerald-900 bg-card px-3.5 text-sm text-white outline-none transition placeholder:text-muted-foreground hover:border-emerald-950 focus:border-emerald-950 focus:ring-emerald-950"
                    />
                  </div>

                  {/* Years of experience + Hourly rate */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {/* Years of experience */}
                    <div className="min-w-0">
                      <label
                        htmlFor="experience"
                        className="mb-1.5 block text-xs font-semibold text-white"
                      >
                        Years of experience
                      </label>

                      <input
                        id="experience"
                        type="number"
                        min="0"
                        step="1"
                        value={experience}
                        onChange={(event) =>
                          setExperience(
                            event.target.value,
                          )
                        }
                        placeholder="e.g. 5"
                        className="h-11 w-full rounded-none border border-emerald-900 bg-card px-3.5 text-sm text-white outline-none transition placeholder:text-muted-foreground hover:border-emerald-950 focus:border-emerald-950 focus:ring-emerald-950"
                      />
                    </div>

                    {/* Hourly rate */}
                    <div className="min-w-0">
                      <label
                        htmlFor="hourlyRate"
                        className="mb-1.5 block text-xs font-semibold text-white"
                      >
                        Hourly rate
                      </label>

                      <div className="relative">
                        <input
                          id="hourlyRate"
                          type="number"
                          min="0"
                          step="0.01"
                          value={hourlyRate}
                          onChange={(event) =>
                            setHourlyRate(
                              event.target.value,
                            )
                          }
                          placeholder="0.00"
                          className="h-11 w-full rounded-none border border-emerald-900 bg-card px-3.5 text-sm text-white outline-none transition placeholder:text-muted-foreground hover:border-emerald-950 focus:border-emerald-950 focus:ring-emerald-950"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save action */}
                <div className="mt-7 flex justify-end border-t border-emerald-900 pt-5">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-emerald-950 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving changes...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </form>
  );
}