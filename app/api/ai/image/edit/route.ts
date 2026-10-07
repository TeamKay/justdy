import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

const OPENAI_URL =
  "https://api.openai.com/v1/images/edits";

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const MIME_TO_EXTENSION: Record<
  string,
  string
> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

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

  return typeof value === "string" &&
    value.trim()
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
    (
      error as {
        providerStatus?: unknown;
      }
    ).providerStatus,
  );

  return Number.isFinite(value)
    ? value
    : null;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Image redesign failed.";
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

  const normalized =
    message.toLowerCase();

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

export async function POST(
  request: Request,
) {
  let generationId: string | null = null;
  let uploadedFileKey: string | null = null;
  let createdAssetId: string | null = null;

  const clientRequestId =
    createRequestId();

  try {
    const user =
      await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
          code: "UNAUTHORIZED",
          requestId: clientRequestId,
        },
        { status: 401 },
      );
    }

    const form =
      await request.formData();

    const image = form.get("image");
    const promptValue =
      form.get("prompt");
    const modelValue =
      form.get("model");
    const sizeValue =
      form.get("size");
    const qualityValue =
      form.get("quality");
    const outputFormatValue =
      form.get("outputFormat");
    const projectIdValue =
      form.get("projectId");

    if (!(image instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please upload an image to redesign.",
          code: "INVALID_REQUEST",
          requestId: clientRequestId,
        },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.has(image.type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please upload a PNG, JPEG, or WEBP image.",
          code: "INVALID_REQUEST",
          requestId: clientRequestId,
        },
        { status: 400 },
      );
    }

    if (image.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The uploaded image must be 20 MB or smaller.",
          code: "INVALID_REQUEST",
          requestId: clientRequestId,
        },
        { status: 400 },
      );
    }

    const prompt =
      typeof promptValue === "string"
        ? promptValue.trim()
        : "";

    if (!prompt) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please describe how you want to redesign the image.",
          code: "INVALID_REQUEST",
          requestId: clientRequestId,
        },
        { status: 400 },
      );
    }

    if (prompt.length > 10000) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The image redesign prompt is too long.",
          code: "INVALID_REQUEST",
          requestId: clientRequestId,
        },
        { status: 400 },
      );
    }

    const model =
      typeof modelValue === "string" &&
      modelValue.trim()
        ? modelValue.trim()
        : "gpt-image-2";

    const size =
      typeof sizeValue === "string" &&
      sizeValue.trim()
        ? sizeValue.trim()
        : "1024x1024";

    const quality =
      typeof qualityValue === "string" &&
      qualityValue.trim()
        ? qualityValue.trim()
        : "medium";

    const outputFormat =
      typeof outputFormatValue === "string" &&
      outputFormatValue.trim()
        ? outputFormatValue.trim()
        : "png";

    let projectId: string | null = null;

    if (
      typeof projectIdValue === "string" &&
      projectIdValue.trim()
    ) {
      const project =
        await prisma.aIProject.findFirst({
          where: {
            id: projectIdValue.trim(),
            userId: user.id,
          },
          select: {
            id: true,
          },
        });

      if (!project) {
        return NextResponse.json(
          {
            success: false,
            error: "Project not found.",
            code: "PROJECT_NOT_FOUND",
            requestId: clientRequestId,
          },
          { status: 404 },
        );
      }

      projectId = project.id;
    }

    const generation =
      await prisma.aIGeneration.create({
        data: {
          userId: user.id,
          projectId,
          type: "IMAGE",
          operation: "IMAGE",
          status: "PROCESSING",
          prompt,
          provider: "openai",
          model,
          requestId: clientRequestId,
          inputData: {
            mode: "EDIT",
            prompt,
            model,
            size,
            quality,
            outputFormat,
            sourceFileName: image.name,
            sourceMimeType: image.type,
            sourceFileSize: image.size,
          },
          startedAt: new Date(),
        },
      });

    generationId = generation.id;

    const openaiKey =
      process.env.OPENAI_API_KEY?.trim();

    if (!openaiKey) {
      throw new Error(
        "OPENAI_API_KEY is not configured.",
      );
    }

    const openaiForm = new FormData();

    openaiForm.append(
      "model",
      model,
    );

    openaiForm.append(
      "prompt",
      prompt,
    );

    openaiForm.append(
      "size",
      size,
    );

    openaiForm.append(
      "quality",
      quality,
    );

    openaiForm.append(
      "output_format",
      outputFormat,
    );

    openaiForm.append(
      "image",
      image,
      image.name ||
        `source.${
          MIME_TO_EXTENSION[
            image.type
          ] ?? "png"
        }`,
    );

    const openaiResponse =
      await fetch(OPENAI_URL, {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${openaiKey}`,
        },
        body: openaiForm,
      });

    const providerRequestId =
      openaiResponse.headers.get(
        "x-request-id",
      ) ??
      openaiResponse.headers.get(
        "x-client-request-id",
      ) ??
      null;

    const providerRequestIdOrClientId =
      providerRequestId ??
      clientRequestId;

    const openaiData =
      await openaiResponse
        .json()
        .catch(() => null);

    if (!openaiResponse.ok) {
      const providerMessage =
        typeof openaiData?.error?.message ===
        "string"
          ? openaiData.error.message
          : "OpenAI could not redesign the uploaded image.";

      const providerError =
        new Error(providerMessage) as Error & {
          code?: string;
          providerRequestId?: string | null;
          providerStatus?: number;
        };

      providerError.code =
        isSafetyRejection(providerMessage)
          ? "IMAGE_SAFETY_REJECTED"
          : "OPENAI_IMAGE_EDIT_FAILED";

      providerError.providerRequestId =
        providerRequestIdOrClientId;

      providerError.providerStatus =
        openaiResponse.status;

      throw providerError;
    }

    const base64 =
      typeof openaiData?.data?.[0]
        ?.b64_json === "string"
        ? openaiData.data[0].b64_json
        : null;

    if (!base64) {
      const emptyResponseError =
        new Error(
          "OpenAI returned no redesigned image.",
        ) as Error & {
          code?: string;
          providerRequestId?: string | null;
          providerStatus?: number;
        };

      emptyResponseError.code =
        "PROVIDER_EMPTY_RESPONSE";

      emptyResponseError.providerRequestId =
        providerRequestIdOrClientId;

      emptyResponseError.providerStatus =
        openaiResponse.status;

      throw emptyResponseError;
    }

    const outputBuffer =
      Buffer.from(base64, "base64");

    const extension =
      outputFormat === "jpeg"
        ? "jpg"
        : outputFormat === "webp"
          ? "webp"
          : "png";

    const mimeType =
      extension === "jpg"
        ? "image/jpeg"
        : extension === "webp"
          ? "image/webp"
          : "image/png";

    const {
      uploadThingStorage,
    } = await import("@/lib/storage");

    const storedFile =
      await uploadThingStorage.uploadBuffer({
        buffer: outputBuffer,
        name:
          `justdy-ai-redesign-${generation.id}.${extension}`,
        mimeType,
        customId:
          `justdy-ai-redesign-${generation.id}`,
      });

    uploadedFileKey =
      storedFile.key;

    const asset =
      await prisma.aIAsset.create({
        data: {
          userId: user.id,
          projectId,
          generationId:
            generation.id,
          type: "IMAGE",
          name: storedFile.name,
          fileKey: storedFile.key,
          url: storedFile.url,
          mimeType:
            storedFile.mimeType,
          fileSize:
            storedFile.size,
          metadata: {
            mode: "EDIT",
            model,
            size,
            quality,
            outputFormat,
            prompt,
            sourceFileName:
              image.name,
            sourceMimeType:
              image.type,
            storage: "uploadthing",
          },
        },
      });

    createdAssetId = asset.id;

    const completed =
      await prisma.aIGeneration.update({
        where: {
          id: generation.id,
        },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          outputData: {
            assetId: asset.id,
            fileKey: storedFile.key,
            url: storedFile.url,
            mimeType:
              storedFile.mimeType,
            fileSize:
              storedFile.size,
            model,
            size,
            quality,
            outputFormat,
            mode: "EDIT",
            storage: "uploadthing",
          },
        },
      });

    return NextResponse.json({
      success: true,
      requestId: clientRequestId,
      image: {
        generationId: completed.id,
        assetId: asset.id,
        url: storedFile.url,
        mimeType:
          storedFile.mimeType,
        model,
        size,
        quality,
        prompt,
        status:
          completed.status,
      },
    });
  } catch (error) {
    const message =
      getErrorMessage(error);

    if (generationId) {
      try {
        await prisma.aIGeneration.update({
          where: {
            id: generationId,
          },
          data: {
            status: "FAILED",
            errorMessage: message,
            completedAt: new Date(),
          },
        });
      } catch (updateError) {
        console.error(
          "Failed to mark image edit generation as failed:",
          updateError,
        );
      }
    }

    if (createdAssetId) {
      try {
        await prisma.aIAsset.delete({
          where: {
            id: createdAssetId,
          },
        });
      } catch (cleanupError) {
        console.error(
          "Failed to clean up image edit asset:",
          cleanupError,
        );
      }
    }

    if (uploadedFileKey) {
      try {
        const {
          uploadThingStorage,
        } = await import("@/lib/storage");

        await uploadThingStorage.delete(
          uploadedFileKey,
        );
      } catch (cleanupError) {
        console.error(
          "Failed to clean up image edit file:",
          cleanupError,
        );
      }
    }

    const errorCode =
      getErrorCode(error);

    const providerRequestId =
      getProviderRequestId(error);

    const providerStatus =
      getProviderStatus(error);

    const safetyRejected =
      isSafetyRejection(error);

    console.error(
      "POST /api/ai/image/edit failed:",
      {
        error,
        generationId,
        clientRequestId,
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
            "The image redesign was rejected by the image safety system. Try changing the redesign instructions or choose a different source image.",
          requestId:
            providerRequestId ??
            clientRequestId,
        },
        { status: 400 },
      );
    }

    if (
      errorCode ===
      "PROVIDER_EMPTY_RESPONSE"
    ) {
      return NextResponse.json(
        {
          success: false,
          code: errorCode,
          error: message,
          requestId:
            providerRequestId ??
            clientRequestId,
        },
        { status: 502 },
      );
    }

    if (
      errorCode === "INVALID_REQUEST" ||
      message.includes(
        "Please upload",
      ) ||
      message.includes(
        "Please describe",
      ) ||
      message.includes(
        "must be 20 MB",
      ) ||
      message.includes(
        "too long",
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          code:
            errorCode ||
            "INVALID_REQUEST",
          error: message,
          requestId:
            providerRequestId ??
            clientRequestId,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        code:
          errorCode ||
          "IMAGE_EDIT_FAILED",
        error: message,
        requestId:
          providerRequestId ??
          clientRequestId,
      },
      {
        status:
          providerStatus &&
          providerStatus >= 400 &&
          providerStatus < 500
            ? providerStatus
            : 500,
      },
    );
  }
}