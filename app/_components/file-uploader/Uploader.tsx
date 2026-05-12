"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "../ui/card";
import { cn } from "@/lib/utils";
import {
  RenderEmptyState,
  RenderErrorState,
  RenderUploadedState,
} from "./RenderState";

interface UploaderState {
  file: File | null;
  objectUrl?: string;
  error: boolean;
}

interface Props {
  value?: File | null;
  onChange?: (value: File | null) => void;
  fileTypeAccepted: "image" | "video";
}

export function Uploader({ onChange, value, fileTypeAccepted }: Props) {
  const [state, setState] = useState<UploaderState>({
    file: value || null,
    objectUrl: value ? URL.createObjectURL(value) : undefined,
    error: false,
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;

      const file = acceptedFiles[0];

      if (state.objectUrl && !state.objectUrl.startsWith("http")) {
        URL.revokeObjectURL(state.objectUrl);
      }

      const objectUrl = URL.createObjectURL(file);

      setState({
        file,
        objectUrl,
        error: false,
      });

      // 🔥 IMPORTANT: only send file upward (NO upload here)
      onChange?.(file);
    },
    [state.objectUrl, onChange],
  );

  const handleRemoveFile = () => {
    if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);

    setState({
      file: null,
      objectUrl: undefined,
      error: false,
    });

    onChange?.(null);
  };

  useEffect(() => {
    return () => {
      if (state.objectUrl && !state.objectUrl.startsWith("http")) {
        URL.revokeObjectURL(state.objectUrl);
      }
    };
  }, [state.objectUrl]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept:
      fileTypeAccepted === "video" ? { "video/*": [] } : { "image/*": [] },
    maxFiles: 1,
    multiple: false,
    maxSize:
      fileTypeAccepted === "image" ? 5 * 1024 * 1024 : 5000 * 1024 * 1024,
  });

  function renderContent() {
    if (state.error) return <RenderErrorState />;

    if (state.objectUrl) {
      return (
        <RenderUploadedState
          previewUrl={state.objectUrl}
          handleRemoveFile={handleRemoveFile}
          isDeleting={false}
          fileType={fileTypeAccepted}
        />
      );
    }

    return <RenderEmptyState isDragActive={isDragActive} />;
  }

  return (
    <Card
      {...getRootProps()}
      className={cn(
        "relative border-2 border-dashed transition-colors w-full h-64",
        isDragActive ? "border-primary bg-primary/10" : "border-border",
      )}
    >
      <CardContent className="flex items-center justify-center h-full p-4">
        <input {...getInputProps()} />
        {renderContent()}
      </CardContent>
    </Card>
  );
}

// "use client";

// import { useCallback, useEffect, useState } from "react";
// import { FileRejection, useDropzone } from "react-dropzone";
// import { Card, CardContent } from "../ui/card";
// import { cn } from "@/lib/utils";
// import {
//   RenderEmptyState,
//   RenderErrorState,
//   RenderUploadedState,
//   RenderUploadingState,
// } from "./RenderState";
// import { toast } from "sonner";
// import { v4 as uuidv4 } from "uuid";
// import { useConstructUrl } from "@/hooks/use-construct-url";

// interface UploaderState {
//   id: string | null;
//   file: File | null;
//   uploading: boolean;
//   progress: number;
//   key?: string;
//   isDeleting: boolean;
//   error: boolean;
//   objectUrl?: string;
//   fileType: "image" | "video";
// }

// interface iAppProps {
//   value?: string | null;
//   onChange?: (value: string | null) => void;
//   fileTypeAccepted: "image" | "video";
// }

// export function Uploader({ onChange, value, fileTypeAccepted }: iAppProps) {
//   const fileUrl = useConstructUrl(value || "");
//   const [fileState, setFileState] = useState<UploaderState>({
//     id: null,
//     file: null,
//     uploading: false,
//     progress: 0,
//     isDeleting: false,
//     error: false,
//     fileType: fileTypeAccepted,
//     key: value || undefined,
//     objectUrl: value ? fileUrl : undefined,
//   });

//   const uploadFile = useCallback(
//     async (file: File) => {
//       setFileState((prev) => ({
//         ...prev,
//         uploading: true,
//         progress: 0,
//       }));

//       try {
//         const presignedResponse = await fetch("/api/s3/upload", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             fileName: file.name,
//             contentType: file.type,
//             size: file.size,
//             isImage: fileTypeAccepted === "image" ? true : false,
//           }),
//         });

//         if (!presignedResponse.ok) {
//           toast.error("Failed to get presigned URL");
//           setFileState((prev) => ({
//             ...prev,
//             uploading: false,
//             progress: 0,
//             error: true,
//           }));

//           return;
//         }

//         const { presignedUrl, key } = await presignedResponse.json();

//         await new Promise<void>((resolve, reject) => {
//           const xhr = new XMLHttpRequest();

//           xhr.upload.onprogress = (event) => {
//             if (event.lengthComputable) {
//               const percentageComplated = (event.loaded / event.total) * 100;
//               setFileState((prev) => ({
//                 ...prev,
//                 progress: Math.round(percentageComplated),
//               }));
//             }
//           };

//           xhr.onload = () => {
//             if (xhr.status === 200 || xhr.status === 204) {
//               setFileState((prev) => ({
//                 ...prev,
//                 progress: 100,
//                 uploading: false,
//                 key: key,
//               }));

//               onChange?.(key);

//               toast.success("File uploaded successfully");
//               resolve();
//             } else {
//               reject(new Error("Upload failed"));
//             }
//           };

//           xhr.onerror = () => {
//             reject(new Error("Upload failed"));
//           };

//           xhr.open("PUT", presignedUrl);
//           xhr.setRequestHeader("Content-Type", file.type);
//           xhr.send(file);
//         });
//       } catch {
//         toast.error("An error occurred during file upload");
//         setFileState((prev) => ({
//           ...prev,
//           progress: 0,
//           error: true,
//           uploading: false,
//         }));
//       }
//     },
//     [fileTypeAccepted, onChange],
//   );

//   const onDrop = useCallback(
//     (acceptedFiles: File[]) => {
//       if (acceptedFiles.length > 0) {
//         const file = acceptedFiles[0];

//         if (fileState.objectUrl && !fileState.objectUrl.startsWith("http")) {
//           URL.revokeObjectURL(fileState.objectUrl);
//         }

//         setFileState({
//           file: file,
//           uploading: false,
//           progress: 0,
//           objectUrl: URL.createObjectURL(file),
//           error: false,
//           id: uuidv4(),
//           isDeleting: false,
//           fileType: fileTypeAccepted,
//         });

//         uploadFile(file);
//       }
//     },
//     [fileState.objectUrl, uploadFile, fileTypeAccepted],
//   );

//   async function handleRemoveFile() {
//     if (fileState.isDeleting || !fileState.objectUrl) return;

//     try {
//       setFileState((prev) => ({
//         ...prev,
//         isDeleting: true,
//       }));

//       const response = await fetch("/api/s3/delete", {
//         method: "DELETE",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ key: fileState.key }),
//       });

//       if (!response.ok) {
//         toast.error("Failed to delete file");
//         setFileState((prev) => ({
//           ...prev,
//           isDeleting: true,
//           error: true,
//         }));
//         return;
//       }

//       if (fileState.objectUrl && !fileState.objectUrl.startsWith("http")) {
//         URL.revokeObjectURL(fileState.objectUrl);
//       }

//       setFileState(() => ({
//         file: null,
//         uploading: false,
//         progress: 0,
//         objectUrl: undefined,
//         fileType: fileTypeAccepted,
//         isDeleting: false,
//         error: true,
//         id: null,
//       }));
//       toast.success("File deleted successfully");
//     } catch {
//       toast.error("An error occurred while deleting the file");
//       setFileState((prev) => ({
//         ...prev,
//         isDeleting: false,
//         error: true,
//       }));
//     }
//   }

//   function rejectedFiles(fileRejection: FileRejection[]) {
//     if (fileRejection.length > 0) {
//       const tooManyFiles = fileRejection.find(
//         (rejection) => rejection.errors[0].code === "too-many-files",
//       );
//       const fileTooLarge = fileRejection.find(
//         (rejection) => rejection.errors[0].code === "file-too-large",
//       );

//       if (tooManyFiles) {
//         toast.error("You can only upload one file at a time.");
//       }

//       if (fileTooLarge) {
//         toast.error("The file is too large. Maximum size is 5MB.");
//       }
//     }
//   }

//   function renderContent() {
//     if (fileState.uploading) {
//       return (
//         <RenderUploadingState
//           file={fileState.file as File}
//           progress={fileState.progress}
//         />
//       );
//     }

//     if (fileState.error) {
//       return <RenderErrorState />;
//     }

//     if (fileState.objectUrl) {
//       return (
//         <RenderUploadedState
//           handleRemoveFile={handleRemoveFile}
//           previewUrl={fileState.objectUrl}
//           isDeleting={fileState.isDeleting}
//           fileType={fileState.fileType}
//         />
//       );
//     }

//     return <RenderEmptyState isDragActive={isDragActive} />;
//   }

//   useEffect(() => {
//     return () => {
//       if (fileState.objectUrl && !fileState.objectUrl.startsWith("http")) {
//         URL.revokeObjectURL(fileState.objectUrl);
//       }
//     };
//   }, [fileState.objectUrl]);

//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     onDrop,
//     accept:
//       fileTypeAccepted === "video" ? { "video/*": [] } : { "image/*": [] },
//     maxFiles: 1,
//     multiple: false,
//     maxSize:
//       fileTypeAccepted === "image" ? 5 * 1024 * 1024 : 5000 * 1024 * 1024, // 5MB
//     onDropRejected: rejectedFiles,
//     disabled: fileState.uploading || !!fileState.objectUrl,
//   });

//   return (
//     <Card
//       {...getRootProps()}
//       className={cn(
//         "relative border-2 border-dashed transition-colors duration-200 ease-in-out w-full h-64",
//         isDragActive
//           ? "border-primary bg-primary/10 border-solid"
//           : "border-border hover:border-primary",
//       )}
//     >
//       <CardContent className="flex items-center justify-center h-full w-full p-4">
//         <input {...getInputProps()} />
//         {renderContent()}
//       </CardContent>
//     </Card>
//   );
// }
