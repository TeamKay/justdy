
"use client";

export type R2UploadPurpose = "SOCIAL_POST" | "PROFILE_IMAGE";

export interface R2ClientUploadResult {
  id: string;
  key: string;
}

export interface R2ClientUploadOptions {
  file: File;
  purpose: R2UploadPurpose;
  onProgress?: (progress: number) => void;
}

interface UploadUrlResponse {
  uploadUrl: string;
  key: string;
  expiresIn: number;
}

interface CompleteUploadResponse {
  id: string;
  key: string;
}

async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error || data?.message || "The upload request failed.",
    );
  }

  return data as T;
}

function uploadFileToR2(
  uploadUrl: string,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(
          Math.min(100, Math.round((event.loaded / event.total) * 100)),
        );
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        reject(
          new Error(`Cloudflare R2 upload failed (${xhr.status}).`),
        );
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error while uploading the file."));
    };

    xhr.onabort = () => {
      reject(new Error("File upload was cancelled."));
    };

    xhr.send(file);
  });
}

export async function uploadFileToStorage({
  file,
  purpose,
  onProgress,
}: R2ClientUploadOptions): Promise<R2ClientUploadResult> {
  if (!file || file.size <= 0) {
    throw new Error("Please select a valid file.");
  }

  const uploadUrlResponse = await fetch("/api/storage/upload-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      purpose,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    }),
  });

  const uploadUrlData = await readJson<UploadUrlResponse>(
    uploadUrlResponse,
  );

  await uploadFileToR2(
    uploadUrlData.uploadUrl,
    file,
    onProgress,
  );

  const completeResponse = await fetch("/api/storage/complete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      purpose,
      key: uploadUrlData.key,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    }),
  });

  const completeData = await readJson<CompleteUploadResponse>(
    completeResponse,
  );

  return {
    id: completeData.id,
    key: completeData.key,
  };
}
