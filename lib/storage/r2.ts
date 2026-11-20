
import "server-only";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { randomUUID } from "node:crypto";
import path from "node:path";

import type {
  FileStorage,
  StoredFile,
  UploadBufferInput,
} from "./types";

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const endpoint = process.env.R2_ENDPOINT;

  const missing = [
    ["R2_ACCOUNT_ID", accountId],
    ["R2_ACCESS_KEY_ID", accessKeyId],
    ["R2_SECRET_ACCESS_KEY", secretAccessKey],
    ["R2_BUCKET_NAME", bucketName],
    ["R2_ENDPOINT", endpoint],
  ]
    .filter(([, value]) => !value?.trim())
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(
      `Cloudflare R2 configuration is incomplete: ${missing.join(", ")}`,
    );
  }

  if (!endpoint!.startsWith("https://")) {
    throw new Error("R2_ENDPOINT must use HTTPS.");
  }

  return {
    accountId: accountId!,
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
    bucketName: bucketName!,
    endpoint: endpoint!,
  };
}

let client: S3Client | null = null;

function getR2Client() {
  if (client) return client;

  const config = getR2Config();

  client = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },

    // Prevent automatic CRC32 checksum parameters from being
    // added to presigned URLs when they are not required.
    requestChecksumCalculation: "WHEN_REQUIRED",
  });

  return client;
}


function sanitizeFileName(name: string) {
  const baseName = path.basename(name);

  const sanitized = baseName
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.{2,}/g, ".")
    .replace(/^\.+/, "")
    .slice(0, 150);

  return sanitized || "file";
}

function createObjectKey(name: string, customId?: string) {
  const id = customId
    ? customId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 100)
    : randomUUID();

  if (!id) {
    throw new Error("Invalid custom file identifier.");
  }

  return `uploads/${id}/${sanitizeFileName(name)}`;
}

function validateObjectKey(key: string) {
  if (
    !key ||
    key.length > 1024 ||
    key.startsWith("/") ||
    key.includes("\\") ||
    key.split("/").some((segment) => segment === "." || segment === "..")
  ) {
    throw new Error("Invalid R2 object key.");
  }
}

export const r2Storage: FileStorage = {
  async uploadBuffer({
    buffer,
    name,
    mimeType,
    customId,
  }: UploadBufferInput): Promise<StoredFile> {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      throw new Error("Cannot upload an empty or invalid file.");
    }

    if (!name.trim()) {
      throw new Error("A file name is required.");
    }

    if (!mimeType.trim()) {
      throw new Error("A MIME type is required.");
    }

    const config = getR2Config();
    const key = createObjectKey(name, customId);

    await getR2Client().send(
      new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: buffer,
        ContentLength: buffer.length,
        ContentType: mimeType,
      }),
    );

    return {
      key,
      // Internal storage locator, NOT a browser-accessible URL.
      // Use an authorized, short-lived signed URL for downloads.
      url: `r2://${config.bucketName}/${key}`,
      name: sanitizeFileName(name),
      size: buffer.length,
      mimeType,
    };
  },

  async delete(key: string): Promise<void> {
    if (!key?.trim()) return;

    validateObjectKey(key);

    const config = getR2Config();

    await getR2Client().send(
      new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      }),
    );
  },
};


export type R2UploadPurpose =
  | "SOCIAL_POST"
  | "PROFILE_IMAGE"
  | "GENERAL"
  | "EDUCATIONAL_RESOURCE"
  | "DELIVERABLE";

const R2_UPLOAD_LIMITS: Record<R2UploadPurpose, number> = {
  SOCIAL_POST: 256 * 1024 * 1024,
  PROFILE_IMAGE: 5 * 1024 * 1024,
  GENERAL: 256 * 1024 * 1024,
  EDUCATIONAL_RESOURCE: 512 * 1024 * 1024,
  DELIVERABLE: 512 * 1024 * 1024,
};

const R2_UPLOAD_EXPIRY_SECONDS = 300;
const R2_DOWNLOAD_EXPIRY_SECONDS = 300;

function validateUploadMimeType(
  purpose: R2UploadPurpose,
  mimeType: string,
) {
  const allowedMimeTypes: Record<R2UploadPurpose, string[]> = {
    PROFILE_IMAGE: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ],

    SOCIAL_POST: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
      "image/gif",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ],

    GENERAL: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
      "image/gif",
      "video/mp4",
      "video/webm",
      "application/pdf",
      "text/plain",
      "text/csv",
      "application/zip",
      "application/x-zip-compressed",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],

    EDUCATIONAL_RESOURCE: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
      "image/gif",
      "video/mp4",
      "video/webm",
      "application/pdf",
      "text/plain",
      "text/csv",
      "application/zip",
      "application/x-zip-compressed",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],

    DELIVERABLE: [
      "application/pdf",
      "application/zip",
      "application/x-zip-compressed",
      "application/vnd.rar",
      "application/x-rar-compressed",
      "video/mp4",
      "video/webm",
      "image/jpeg",
      "image/png",
      "image/webp",
      "text/plain",
      "text/csv",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  };

  if (!allowedMimeTypes[purpose].includes(mimeType)) {
    throw new Error(
      `File type "${mimeType}" is not allowed for ${purpose.toLowerCase()} uploads.`,
    );
  }
}

export async function createR2UploadUrl(input: {
  userId: string;
  purpose: R2UploadPurpose;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}) {
  const { userId, purpose, fileName, mimeType, sizeBytes } = input;

  if (!userId?.trim()) {
    throw new Error("An authenticated user is required.");
  }

  if (!fileName?.trim() || !mimeType?.trim()) {
    throw new Error("File name and MIME type are required.");
  }

  if (
    !Number.isSafeInteger(sizeBytes) ||
    sizeBytes <= 0 ||
    sizeBytes > R2_UPLOAD_LIMITS[purpose]
  ) {
    throw new Error("The file size is invalid or exceeds the allowed limit.");
  }

  validateUploadMimeType(purpose, mimeType);

  const config = getR2Config();

  const key = [
    "users",
    userId,
    purpose.toLowerCase(),
    randomUUID(),
    sanitizeFileName(fileName),
  ].join("/");

  const command = new PutObjectCommand({
  Bucket: config.bucketName,
  Key: key,
  ContentType: mimeType,
});

  const uploadUrl = await getSignedUrl(
    getR2Client(),
    command,
    { expiresIn: R2_UPLOAD_EXPIRY_SECONDS },
  );

  return {
    key,
    uploadUrl,
    expiresIn: R2_UPLOAD_EXPIRY_SECONDS,
    requiredHeaders: {
      "Content-Type": mimeType,
    },
  };
}

export async function verifyR2Upload(input: {
  key: string;
  userId: string;
  purpose: R2UploadPurpose;
  expectedSize: number;
  expectedMimeType: string;
}) {
  const { key, userId, purpose, expectedSize, expectedMimeType } = input;

  validateObjectKey(key);

  const expectedPrefix =
    `users/${userId}/${purpose.toLowerCase()}/`;

  if (!key.startsWith(expectedPrefix)) {
    throw new Error("This object does not belong to the requested upload.");
  }

  const config = getR2Config();

  const result = await getR2Client().send(
    new HeadObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    }),
  );

  if (result.ContentLength !== expectedSize) {
    throw new Error("Uploaded file size does not match the request.");
  }

  if (result.ContentType !== expectedMimeType) {
    throw new Error("Uploaded file type does not match the request.");
  }

  return {
    key,
    size: result.ContentLength,
    mimeType: result.ContentType,
  };
}

export async function createR2DownloadUrl(key: string) {
  validateObjectKey(key);

  const config = getR2Config();

  const command = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: key,
  });

  return getSignedUrl(
    getR2Client(),
    command,
    { expiresIn: R2_DOWNLOAD_EXPIRY_SECONDS },
  );
}

