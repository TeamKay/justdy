"use client";

import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "../ui/card"; // Adjust paths as necessary
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import Image from "next/image";

interface UploaderProps {
  onChange: (file: File | null) => void;
  value?: File | null;
}

export function ImageUploader({ onChange }: UploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    maxFiles: 1,
    multiple: false,
    onDrop: (files) => {
      const selectedFile = files[0] || null;
      if (selectedFile) {
        setPreview(URL.createObjectURL(selectedFile));
      }
      onChange(selectedFile);
    },
  });

  return (
    <Card
      {...getRootProps()}
      className={cn(
        "relative border-2 border-dashed w-full h-64 cursor-pointer transition-colors",
        isDragActive
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary",
      )}
    >
      <CardContent className="flex items-center justify-center h-full w-full p-4">
        <input {...getInputProps()} />
        {!preview ? (
          <p className="text-muted-foreground">Drag Profile Image Here</p>
        ) : (
          <Image
            src={preview}
            alt="Preview"
            width={400}
            height={400}
            className="max-h-64 mx-auto rounded"
          />
        )}
      </CardContent>
    </Card>
  );
}

export function VideoUploader({ onChange }: UploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "video/mp4": [],
      "video/webm": [],
      "video/quicktime": [],
    },
    maxFiles: 1,
    multiple: false,
    onDrop: (files) => {
      const file = files[0] || null;
      if (file) {
        setPreview(URL.createObjectURL(file));
      }
      onChange(file);
    },
  });

  return (
    <Card
      {...getRootProps()}
      className={cn(
        "relative border-2 border-dashed w-full h-64 cursor-pointer transition-colors",
        isDragActive
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary",
      )}
    >
      <CardContent className="flex items-center justify-center h-full w-full p-4">
        <input {...getInputProps()} />
        {!preview ? (
          <div className="text-center text-muted-foreground">
            <p>Drag Intro Video Here</p>
            <p className="text-xs mt-1">MP4, MOV, WEBM</p>
          </div>
        ) : (
          <video
            src={preview}
            controls
            className="w-full h-full rounded object-cover"
          />
        )}
      </CardContent>
    </Card>
  );
}

// "use client";

// import { useDropzone } from "react-dropzone";
// import { Card, CardContent } from "../ui/card";
// import { cn } from "@/lib/utils";
// import { useEffect, useState } from "react";
// import Image from "next/image";

// interface UploaderProps {
//   onFileSelect: (file: File | null) => void;
// }
// interface VideoUploaderProps {
//   onFileSelect: (file: File | null) => void;
// }

// export function ImageUploader({ onFileSelect }: UploaderProps) {
//   const [preview, setPreview] = useState<string | null>(null);

//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     accept: { "image/*": [] },
//     maxFiles: 1,
//     multiple: false,
//     onDrop: (files) => {
//       const selectedFile = files[0];
//       if (!selectedFile) return;

//       setPreview(URL.createObjectURL(selectedFile));
//       onFileSelect(selectedFile);
//     },
//   });

//   return (
//     <Card
//       {...getRootProps()}
//       className={cn(
//         "relative border-2 border-dashed w-full h-64 cursor-pointer transition-colors",
//         isDragActive
//           ? "border-primary bg-primary/10"
//           : "border-border hover:border-primary",
//       )}
//     >
//       <CardContent className="flex items-center justify-center h-full w-full p-4">
//         <input {...getInputProps()} />

//         {!preview ? (
//           <p className="text-muted-foreground">Drag Profile Image Here</p>
//         ) : (
//           <Image
//             src={preview}
//             alt="Preview"
//             width={400}
//             height={400}
//             className="max-h-64 mx-auto rounded"
//           />
//         )}
//       </CardContent>
//     </Card>
//   );
// }

// export function VideoUploader({ onFileSelect }: VideoUploaderProps) {
//   const [preview, setPreview] = useState<string | null>(null);

//   useEffect(() => {
//     return () => {
//       if (preview) {
//         URL.revokeObjectURL(preview);
//       }
//     };
//   }, [preview]);

//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     accept: {
//       "video/mp4": [],
//       "video/webm": [],
//       "video/quicktime": [],
//     },
//     maxFiles: 1,
//     multiple: false,
//     onDrop: (files) => {
//       const file = files[0];

//       if (!file) return;

//       const previewUrl = URL.createObjectURL(file);

//       setPreview(previewUrl);
//       onFileSelect(file);
//     },
//   });

//   return (
//     <Card
//       {...getRootProps()}
//       className={cn(
//         "relative border-2 border-dashed w-full h-64 cursor-pointer transition-colors",
//         isDragActive
//           ? "border-primary bg-primary/10"
//           : "border-border hover:border-primary",
//       )}
//     >
//       <CardContent className="flex items-center justify-center h-full w-full p-4">
//         <input {...getInputProps()} />

//         {!preview ? (
//           <div className="text-center text-muted-foreground">
//             <p>Drag Intro Video Here</p>
//             <p className="text-xs mt-1">MP4, MOV, WEBM</p>
//           </div>
//         ) : (
//           <video
//             src={preview}
//             controls
//             className="w-full h-full rounded object-cover"
//           />
//         )}
//       </CardContent>
//     </Card>
//   );
// }
