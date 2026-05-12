"use client";

import { useEffect, useRef, useState, useTransition, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckCircle, Pencil, Save } from "lucide-react";
import { updateEducatorProfile } from "@/app/actions/educator-get-profile";
import { uploadProfileImage } from "../actions/educator-upload-profile";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { getCroppedImg } from "@/lib/cropImage";

/* ---------------- TYPES ---------------- */

type User = {
  id: string;
  name?: string;
  email?: string;
  specialty?: string;
  experience?: number | string;
  description?: string;
  credentialUrl?: string;
  imageUrl?: string;
  verificationStatus?: "Verified" | "Unverified" | string;
};

type ProfileForm = {
  name: string;
  specialty: string;
  experience: string;
  description: string;
  credentialUrl: string;
};

type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/* ---------------- COMPONENT ---------------- */

export default function EducatorProfile({ user }: { user: User }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(
    null,
  );

  const [showCrop, setShowCrop] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);

  const [form, setForm] = useState<ProfileForm>({
    name: "",
    specialty: "",
    experience: "",
    description: "",
    credentialUrl: "",
  });

  /* ---------------- CROPPER ---------------- */

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    if (!rawImage || !croppedAreaPixels) return;

    const blob = await getCroppedImg(rawImage, croppedAreaPixels);

    const croppedFile = new File([blob], "profile.jpg", {
      type: "image/jpeg",
    });

    setFile(croppedFile);
    setPreviewUrl(URL.createObjectURL(croppedFile));

    setShowCrop(false);
  };

  /* ---------------- CLEANUP ---------------- */

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  /* ---------------- EDIT TOGGLE ---------------- */

  const handleEditToggle = () => {
    if (!isEditing) {
      setForm({
        name: user?.name || "",
        specialty: user?.specialty || "",
        experience: String(user?.experience ?? ""),
        description: user?.description || "",
        credentialUrl: user?.credentialUrl || "",
      });
    }
    setIsEditing((p) => !p);
  };

  /* ---------------- FORM CHANGE ---------------- */

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  /* ---------------- SAVE ---------------- */

  const handleSave = () => {
    startTransition(async () => {
      if (file) {
        const uploadRes = await uploadProfileImage(user.id, file);

        if (!uploadRes.success) {
          alert("Image upload failed");
          return;
        }
      }

      const res = await updateEducatorProfile(user.id, form);

      if (res.success) {
        setIsEditing(false);
        setFile(null);
        setPreviewUrl(null);
        router.refresh();
      } else {
        alert(res.error);
      }
    });
  };

  const imageSrc = previewUrl ?? user?.imageUrl ?? "/avatar.png";
  const completeness = calculateCompleteness(user);

  return (
    <div className="min-h-screen bg-background text-white flex justify-center p-0">
      <div className="w-full max-w-6xl">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          {/* HEADER */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-800">
            <div>
              <h1 className="text-xl font-semibold">Educator Profile</h1>
              <p className="text-sm text-zinc-400">
                Manage your professional information
              </p>
            </div>

            <button
              onClick={handleEditToggle}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"
            >
              <Pencil size={16} />
              {isEditing ? "Cancel" : "Edit"}
            </button>
          </div>

          {/* PROFILE */}
          <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative group w-22.5 h-22.5">
                <Image
                  src={imageSrc}
                  alt="profile"
                  width={90}
                  height={90}
                  className={`rounded-xl border border-zinc-700 object-cover cursor-pointer ${
                    isEditing ? "group-hover:opacity-70" : ""
                  }`}
                  onClick={() => isEditing && fileInputRef.current?.click()}
                />

                {isEditing && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white cursor-pointer transition"
                  >
                    Change
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const selectedFile = e.target.files?.[0];
                    if (!selectedFile) return;

                    e.target.value = "";

                    const url = URL.createObjectURL(selectedFile);
                    setRawImage(url);
                    setCrop({ x: 0, y: 0 });
                    setZoom(1);
                    setShowCrop(true);
                  }}
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-semibold">{user?.name}</h2>
                  {user?.verificationStatus === "Verified" && (
                    <CheckCircle className="text-emerald-400" size={18} />
                  )}
                </div>
                <p className="text-zinc-400 text-sm">{user?.email}</p>
                <p className="text-zinc-500 text-sm mt-1">
                  {user?.specialty || "No specialty added"}
                </p>
              </div>
            </div>

            {/* COMPLETENESS */}
            <div className="bg-zinc-800 border border-zinc-700 p-4 rounded-xl w-full md:w-64">
              <p className="text-sm text-zinc-400">Profile completeness</p>
              <p className="text-lg font-semibold">{completeness}%</p>
              <div className="h-2 bg-zinc-700 rounded-full mt-2">
                <div
                  className="h-2 bg-emerald-500 rounded-full"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="p-6">
            {!isEditing ? (
              <div className="grid md:grid-cols-3 gap-4">
                <Card
                  title="Specialty"
                  value={user?.specialty || "Not added"}
                />
                <Card
                  title="Experience"
                  value={`${user?.experience || 0} years`}
                />
                <Card
                  title="Credentials"
                  value={user?.credentialUrl || "Not added"}
                />

                <div className="md:col-span-3 bg-zinc-800 p-4 rounded-xl border border-zinc-700">
                  <p className="text-sm text-zinc-400 mb-2">About</p>
                  <p className="text-sm text-zinc-200">
                    {user?.description || "No description added yet."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                />
                <Input
                  label="Specialty"
                  name="specialty"
                  value={form.specialty}
                  onChange={handleChange}
                />
                <Input
                  label="Experience"
                  name="experience"
                  value={form.experience}
                  onChange={handleChange}
                />
                <Input
                  label="Credential URL"
                  name="credentialUrl"
                  value={form.credentialUrl}
                  onChange={handleChange}
                />

                <div className="md:col-span-2">
                  <label className="text-sm text-zinc-400">Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={5}
                    className="w-full mt-2 p-3 rounded-lg bg-zinc-800 border border-zinc-700"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end mt-4">
                  <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm"
                  >
                    <Save size={16} />
                    {isPending ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CROPPER MODAL */}
      {showCrop && rawImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-xl w-[90%] max-w-lg">
            <div className="relative h-64 w-full">
              <Cropper
                image={rawImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="mt-4 flex justify-between items-center">
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setZoom(Number(e.target.value))
                }
              />

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCrop(false);
                    setRawImage(null);
                  }}
                  className="px-4 py-2 bg-zinc-700 rounded-lg"
                >
                  Cancel
                </button>

                <button
                  onClick={handleCropSave}
                  className="px-4 py-2 bg-emerald-600 rounded-lg"
                >
                  Crop & Use
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- HELPERS ---------------- */

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-zinc-800 border border-zinc-700 p-4 rounded-xl">
      <p className="text-xs text-zinc-400">{title}</p>
      <p className="text-sm font-medium mt-1">{value || "Not set"}</p>
    </div>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: keyof ProfileForm;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
}) {
  return (
    <div>
      <label className="text-sm text-zinc-400">{label}</label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        className="w-full mt-2 p-3 rounded-lg bg-zinc-800 border border-zinc-700"
      />
    </div>
  );
}

/* ---------------- UTIL ---------------- */

function calculateCompleteness(user: User) {
  const fields = [
    user?.name,
    user?.specialty,
    user?.experience,
    user?.description,
    user?.credentialUrl,
  ];

  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

// "use client";

// import { useEffect, useRef, useState, useTransition } from "react";
// import Image from "next/image";
// import { useRouter } from "next/navigation";
// import { CheckCircle, Pencil, Save } from "lucide-react";
// import { updateEducatorProfile } from "@/app/actions/educator-get-profile";
// import { uploadProfileImage } from "../actions/educator-upload-profile";
// import Cropper from "react-easy-crop";
// import { useCallback } from "react";
// import { getCroppedImg } from "@/lib/cropImage";

// export default function EducatorProfile({ user }: { user: any }) {
//   const [isEditing, setIsEditing] = useState(false);
//   const [isPending, startTransition] = useTransition();

//   const router = useRouter();
//   const fileInputRef = useRef<HTMLInputElement | null>(null);
//   const [file, setFile] = useState<File | null>(null);
//   const [previewUrl, setPreviewUrl] = useState<string | null>(null);
//   const [crop, setCrop] = useState({ x: 0, y: 0 });
//   const [zoom, setZoom] = useState(1);
//   const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

//   const [showCrop, setShowCrop] = useState(false);
//   const [rawImage, setRawImage] = useState<string | null>(null);

//   const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
//     setCroppedAreaPixels(croppedAreaPixels);
//   }, []);

//   const [form, setForm] = useState({
//     name: "",
//     specialty: "",
//     experience: "",
//     description: "",
//     credentialUrl: "",
//   });

//   const handleCropSave = async () => {
//     if (!rawImage || !croppedAreaPixels) return;

//     const blob = await getCroppedImg(rawImage, croppedAreaPixels);

//     const croppedFile = new File([blob], "profile.jpg", {
//       type: "image/jpeg",
//     });

//     setFile(croppedFile);
//     setPreviewUrl(URL.createObjectURL(croppedFile));

//     setShowCrop(false);
//   };

//   useEffect(() => {
//     return () => {
//       if (previewUrl) {
//         URL.revokeObjectURL(previewUrl);
//       }
//     };
//   }, [previewUrl]);

//   const handleEditToggle = () => {
//     if (!isEditing) {
//       setForm({
//         name: user?.name || "",
//         specialty: user?.specialty || "",
//         experience: user?.experience ?? "",
//         description: user?.description || "",
//         credentialUrl: user?.credentialUrl || "",
//       });
//     }
//     setIsEditing((p) => !p);
//   };

//   const handleChange = (e: any) => {
//     setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
//   };

//   const handleSave = () => {
//     startTransition(async () => {
//       // 1. upload image first (if exists)
//       if (file) {
//         const uploadRes = await uploadProfileImage(user.id, file);

//         if (!uploadRes.success) {
//           alert("Image upload failed");
//           return;
//         }
//       }

//       // 2. update profile
//       const res = await updateEducatorProfile(user.id, form);

//       if (res.success) {
//         setIsEditing(false);
//         setFile(null);
//         setPreviewUrl(null);
//         router.refresh();
//       } else {
//         alert(res.error);
//       }
//     });
//   };

//   const imageSrc = previewUrl ?? user?.imageUrl ?? "/avatar.png";

//   const completeness = calculateCompleteness(user);

//   return (
//     <div className="min-h-screen bg-background text-white flex justify-center p-0">
//       <div className="w-full max-w-6xl">
//         {/* HEADER CARD */}
//         <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
//           {/* TOP BAR */}
//           <div className="flex items-center justify-between p-6 border-b border-zinc-800">
//             <div>
//               <h1 className="text-xl font-semibold">Educator Profile</h1>
//               <p className="text-sm text-zinc-400">
//                 Manage your professional information
//               </p>
//             </div>

//             <button
//               onClick={handleEditToggle}
//               className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"
//             >
//               <Pencil size={16} />
//               {isEditing ? "Cancel" : "Edit"}
//             </button>
//           </div>

//           {/* PROFILE HEADER */}
//           <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
//             <div className="flex items-center gap-5">
//               <div className="relative">
//                 <div className="relative group w-22.5 h-22.5">
//                   {/* IMAGE */}
//                   <Image
//                     src={imageSrc}
//                     alt="profile"
//                     width={90}
//                     height={90}
//                     className={`rounded-xl border border-zinc-700 object-cover cursor-pointer ${
//                       isEditing ? "group-hover:opacity-70" : ""
//                     }`}
//                     onClick={() => {
//                       if (isEditing) {
//                         fileInputRef.current?.click();
//                       }
//                     }}
//                   />

//                   {/* OVERLAY (only in edit mode) */}
//                   {isEditing && (
//                     <div
//                       onClick={() => fileInputRef.current?.click()}
//                       className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white cursor-pointer transition"
//                     >
//                       Change
//                     </div>
//                   )}

//                   {/* HIDDEN INPUT */}
//                   <input
//                     ref={fileInputRef}
//                     type="file"
//                     accept="image/*"
//                     className="hidden"
//                     onChange={(e) => {
//                       const selectedFile = e.target.files?.[0];

//                       if (!selectedFile) return;

//                       // reset input so same file can re-trigger
//                       e.target.value = "";

//                       const url = URL.createObjectURL(selectedFile);

//                       setRawImage(url);
//                       setCrop({ x: 0, y: 0 }); // RESET
//                       setZoom(1); // RESET
//                       setShowCrop(true);
//                     }}
//                   />
//                 </div>
//               </div>

//               <div>
//                 <div className="flex items-center gap-2">
//                   <h2 className="text-2xl font-semibold">{user?.name}</h2>
//                   {user?.verificationStatus === "Verified" && (
//                     <CheckCircle className="text-emerald-400" size={18} />
//                   )}
//                 </div>
//                 <p className="text-zinc-400 text-sm">{user?.email}</p>
//                 <p className="text-zinc-500 text-sm mt-1">
//                   {user?.specialty || "No specialty added"}
//                 </p>
//               </div>
//             </div>

//             {/* COMPLETENESS */}
//             <div className="bg-zinc-800 border border-zinc-700 p-4 rounded-xl w-full md:w-64">
//               <p className="text-sm text-zinc-400">Profile completeness</p>
//               <p className="text-lg font-semibold">{completeness}%</p>
//               <div className="h-2 bg-zinc-700 rounded-full mt-2">
//                 <div
//                   className="h-2 bg-emerald-500 rounded-full"
//                   style={{ width: `${completeness}%` }}
//                 />
//               </div>
//             </div>
//           </div>

//           {/* CONTENT */}
//           <div className="p-6">
//             {/* PREVIEW MODE */}
//             {!isEditing && (
//               <div className="grid md:grid-cols-3 gap-4">
//                 <Card title="Specialty" value={user?.specialty} />
//                 <Card
//                   title="Experience"
//                   value={`${user?.experience || 0} years`}
//                 />
//                 <Card
//                   title="Credentials"
//                   value={user?.credentialUrl || "Not added"}
//                 />

//                 <div className="md:col-span-3 bg-zinc-800 p-4 rounded-xl border border-zinc-700">
//                   <p className="text-sm text-zinc-400 mb-2">About</p>
//                   <p className="text-sm text-zinc-200">
//                     {user?.description || "No description added yet."}
//                   </p>
//                 </div>
//               </div>
//             )}

//             {/* EDIT MODE */}
//             {isEditing && (
//               <div className="grid md:grid-cols-2 gap-4">
//                 <Input
//                   label="Full Name"
//                   name="name"
//                   value={form.name}
//                   onChange={handleChange}
//                   isEditing={isEditing}
//                 />

//                 <Input
//                   label="Specialty"
//                   name="specialty"
//                   value={form.specialty}
//                   onChange={handleChange}
//                   isEditing={isEditing}
//                 />

//                 <Input
//                   label="Experience"
//                   name="experience"
//                   value={form.experience}
//                   onChange={handleChange}
//                   isEditing={isEditing}
//                 />

//                 <Input
//                   label="Credential URL"
//                   name="credentialUrl"
//                   value={form.credentialUrl}
//                   onChange={handleChange}
//                   isEditing={isEditing}
//                 />

//                 <div className="md:col-span-2">
//                   <label className="text-sm text-zinc-400">Description</label>
//                   <textarea
//                     name="description"
//                     value={form.description}
//                     onChange={handleChange}
//                     rows={5}
//                     className="w-full mt-2 p-3 rounded-lg bg-zinc-800 border border-zinc-700"
//                   />
//                 </div>

//                 {/* SAVE BUTTON */}
//                 <div className="md:col-span-2 flex justify-end mt-4">
//                   <button
//                     onClick={handleSave}
//                     disabled={isPending}
//                     className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm"
//                   >
//                     <Save size={16} />
//                     {isPending ? "Saving..." : "Save Changes"}
//                   </button>
//                 </div>
//               </div>
//             )}

//             {/* CROP MODAL stays unchanged */}
//           </div>
//         </div>
//       </div>

//       {showCrop && rawImage && (
//         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
//           <div className="bg-zinc-900 p-6 rounded-xl w-[90%] max-w-lg">
//             <div className="relative h-64 w-full">
//               <Cropper
//                 image={rawImage}
//                 crop={crop}
//                 zoom={zoom}
//                 aspect={1}
//                 onCropChange={setCrop}
//                 onZoomChange={setZoom}
//                 onCropComplete={onCropComplete}
//               />
//             </div>

//             <div className="mt-4 flex justify-between items-center">
//               <input
//                 type="range"
//                 min={1}
//                 max={3}
//                 step={0.1}
//                 value={zoom}
//                 onChange={(e) => setZoom(Number(e.target.value))}
//               />

//               <div className="flex gap-2">
//                 <button
//                   onClick={() => {
//                     setShowCrop(false);
//                     setRawImage(null);
//                   }}
//                   className="px-4 py-2 bg-zinc-700 rounded-lg"
//                 >
//                   Cancel
//                 </button>

//                 <button
//                   onClick={handleCropSave}
//                   className="px-4 py-2 bg-emerald-600 rounded-lg"
//                 >
//                   Crop & Use
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// /* ---------------- HELPERS ---------------- */

// function Card({ title, value }: any) {
//   return (
//     <div className="bg-zinc-800 border border-zinc-700 p-4 rounded-xl">
//       <p className="text-xs text-zinc-400">{title}</p>
//       <p className="text-sm font-medium mt-1">{value || "Not set"}</p>
//     </div>
//   );
// }

// function Input({ label, name, value, onChange, isEditing }: any) {
//   return (
//     <div>
//       <label className="text-sm text-zinc-400">{label}</label>
//       <input
//         name={name}
//         value={value}
//         onChange={onChange}
//         disabled={!isEditing}
//         className="w-full mt-2 p-3 rounded-lg bg-zinc-800 border border-zinc-700 disabled:opacity-60"
//       />
//     </div>
//   );
// }

// function calculateCompleteness(user: any) {
//   const fields = [
//     user?.name,
//     user?.specialty,
//     user?.experience,
//     user?.description,
//     user?.credentialUrl,
//   ];

//   const filled = fields.filter(Boolean).length;
//   return Math.round((filled / fields.length) * 100);
// }
