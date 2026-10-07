import { NextResponse } from "next/server";

import { generateImage } from "@/lib/ai/image/generator";
import type {
  ImageBackground,
  ImageModel,
  ImageOutputFormat,
  ImageQuality,
  ImageSize,
} from "@/lib/ai/image/types";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

export const runtime = "nodejs";

interface ImageRequestBody {
  prompt?: unknown;
  model?: unknown;
  size?: unknown;
  quality?: unknown;
  outputFormat?: unknown;
  background?: unknown;
  requestId?: unknown;
  projectId?: unknown;
}

const VALID_MODELS: ImageModel[] = ["gpt-image-2"];

const VALID_SIZES: ImageSize[] = [
  "1024x1024",
  "1024x1536",
  "1536x1024",
  "auto",
];

const VALID_QUALITIES: ImageQuality[] = [
  "low",
  "medium",
  "high",
  "auto",
];

const VALID_FORMATS: ImageOutputFormat[] = [
  "png",
  "jpeg",
];

const VALID_BACKGROUNDS: ImageBackground[] = [
  "auto",
  "opaque",
];

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isValidModel(value: unknown): value is ImageModel {
  return (
    isString(value) &&
    VALID_MODELS.includes(value as ImageModel)
  );
}

function isValidSize(value: unknown): value is ImageSize {
  return (
    isString(value) &&
    VALID_SIZES.includes(value as ImageSize)
  );
}

function isValidQuality(value: unknown): value is ImageQuality {
  return (
    isString(value) &&
    VALID_QUALITIES.includes(value as ImageQuality)
  );
}

function isValidFormat(
  value: unknown,
): value is ImageOutputFormat {
  return (
    isString(value) &&
    VALID_FORMATS.includes(value as ImageOutputFormat)
  );
}

function isValidBackground(
  value: unknown,
): value is ImageBackground {
  return (
    isString(value) &&
    VALID_BACKGROUNDS.includes(value as ImageBackground)
  );
}

function createRequestId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function getErrorCode(error: unknown): string {
  if (
    !error ||
    typeof error !== "object" ||
    !("code" in error)
  ) {
    return "";
  }

  return String(
    (error as { code?: unknown }).code ?? "",
  );
}

function getProviderRequestId(
  error: unknown,
): string | null {
  if (
    !error ||
    typeof error !== "object" ||
    !("providerRequestId" in error)
  ) {
    return null;
  }

  const value = (
    error as {
      providerRequestId?: unknown;
    }
  ).providerRequestId;

  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

function getProviderStatus(
  error: unknown,
): number | null {
  if (
    !error ||
    typeof error !== "object" ||
    !("providerStatus" in error)
  ) {
    return null;
  }

  const value = Number(
    (error as { providerStatus?: unknown })
      .providerStatus,
  );

  return Number.isFinite(value) ? value : null;
}

function isSafetyRejection(
  error: unknown,
): boolean {
  const errorCode = getErrorCode(error);

  if (errorCode === "IMAGE_SAFETY_REJECTED") {
    return true;
  }

  const message =
    error instanceof Error
      ? error.message
      : String(error ?? "");

  const normalized = message.toLowerCase();

  return (
    normalized.includes("safety system") ||
    normalized.includes("safety policy") ||
    normalized.includes("safety filter") ||
    normalized.includes("content policy") ||
    normalized.includes("policy violation") ||
    normalized.includes("content violation") ||
    normalized.includes("image safety") ||
    (
      normalized.includes("safety") &&
      normalized.includes("rejected")
    )
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Image generation failed.";
}

export async function POST(request: Request) {
  let requestId: string | null = null;

  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
          code: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }

    let body: ImageRequestBody;

    try {
      body = (await request.json()) as ImageRequestBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON request body.",
          code: "INVALID_JSON",
        },
        { status: 400 },
      );
    }

    if (
      !isString(body.prompt) ||
      !body.prompt.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Image prompt cannot be empty.",
          code: "INVALID_REQUEST",
        },
        { status: 400 },
      );
    }

    const prompt = body.prompt.trim();

    if (prompt.length > 10000) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Image prompt is too long. Maximum length is 10,000 characters.",
          code: "INVALID_REQUEST",
        },
        { status: 400 },
      );
    }

    requestId =
      isString(body.requestId) &&
      body.requestId.trim()
        ? body.requestId.trim()
        : createRequestId();

    if (requestId.length > 255) {
      return NextResponse.json(
        {
          success: false,
          error: "Request ID is too long.",
          code: "INVALID_REQUEST",
        },
        { status: 400 },
      );
    }

    let projectId: string | undefined;

    if (body.projectId !== undefined) {
      if (
        !isString(body.projectId) ||
        !body.projectId.trim()
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid project ID.",
            code: "INVALID_REQUEST",
          },
          { status: 400 },
        );
      }

      projectId = body.projectId.trim();

      if (projectId.length > 255) {
        return NextResponse.json(
          {
            success: false,
            error: "Project ID is too long.",
            code: "INVALID_REQUEST",
          },
          { status: 400 },
        );
      }
    }

    let model: ImageModel | undefined;

    if (body.model !== undefined) {
      if (!isValidModel(body.model)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid image model.",
            code: "INVALID_REQUEST",
          },
          { status: 400 },
        );
      }

      model = body.model;
    }

    let size: ImageSize | undefined;

    if (body.size !== undefined) {
      if (!isValidSize(body.size)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid image size.",
            code: "INVALID_REQUEST",
          },
          { status: 400 },
        );
      }

      size = body.size;
    }

    let quality: ImageQuality | undefined;

    if (body.quality !== undefined) {
      if (!isValidQuality(body.quality)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid image quality.",
            code: "INVALID_REQUEST",
          },
          { status: 400 },
        );
      }

      quality = body.quality;
    }

    let outputFormat:
      | ImageOutputFormat
      | undefined;

    if (body.outputFormat !== undefined) {
      if (!isValidFormat(body.outputFormat)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid image output format.",
            code: "INVALID_REQUEST",
          },
          { status: 400 },
        );
      }

      outputFormat = body.outputFormat;
    }

    let background:
      | ImageBackground
      | undefined;

    if (body.background !== undefined) {
      if (!isValidBackground(body.background)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid image background.",
            code: "INVALID_REQUEST",
          },
          { status: 400 },
        );
      }

      background = body.background;
    }

    const image = await generateImage({
      userId: user.id,
      prompt,
      model,
      size,
      quality,
      outputFormat,
      background,
      requestId,
      projectId,
    });

    return NextResponse.json(
      {
        success: true,
        image,
        requestId,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = getErrorMessage(error);
    const errorCode = getErrorCode(error);
    const providerRequestId =
      getProviderRequestId(error);
    const providerStatus =
      getProviderStatus(error);

    const safetyRejected =
      isSafetyRejection(error);

    console.error(
      "POST /api/ai/image failed:",
      {
        error,
        errorCode,
        requestId,
        providerRequestId,
        providerStatus,
        safetyRejected,
      },
    );

    if (safetyRejected) {
      return NextResponse.json(
        {
          success: false,
          code: "IMAGE_SAFETY_REJECTED",
          error:
            "The image request was rejected by the image safety system. Try changing the wording of your prompt or, if you are redesigning an image, try a different source image.",
          requestId:
            providerRequestId ?? requestId,
        },
        { status: 400 },
      );
    }

    if (
      errorCode === "GENERATION_IN_PROGRESS"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: message,
          code: errorCode,
          requestId,
        },
        { status: 409 },
      );
    }

    if (errorCode === "ASSET_MISSING") {
      return NextResponse.json(
        {
          success: false,
          error: message,
          code: errorCode,
          requestId,
        },
        { status: 500 },
      );
    }

    if (
      errorCode ===
        "PROVIDER_EMPTY_RESPONSE" ||
      errorCode ===
        "PROVIDER_INVALID_RESPONSE"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: message,
          code: errorCode,
          requestId:
            providerRequestId ?? requestId,
        },
        { status: 502 },
      );
    }

    if (
      errorCode === "INVALID_REQUEST" ||
      message.includes("required") ||
      message.includes("cannot be empty") ||
      message.includes("Invalid") ||
      message.includes("too long")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: message,
          code:
            errorCode || "INVALID_REQUEST",
          requestId,
        },
        { status: 400 },
      );
    }

    const status =
      providerStatus &&
      providerStatus >= 400 &&
      providerStatus < 500
        ? providerStatus
        : 500;

    return NextResponse.json(
      {
        success: false,
        error: message,
        code:
          errorCode ||
          "IMAGE_GENERATION_FAILED",
        requestId:
          providerRequestId ?? requestId,
      },
      { status },
    );
  }
}