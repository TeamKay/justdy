export type AIImageErrorCode =
  | "IMAGE_GENERATION_ERROR"
  | "PROVIDER_ERROR"
  | "PROVIDER_EMPTY_RESPONSE"
  | "PROVIDER_INVALID_RESPONSE"
  | "IMAGE_SAFETY_REJECTED"
  | "GENERATION_IN_PROGRESS"
  | "ASSET_MISSING"
  | "GENERATION_FAILED"
  | "INVALID_REQUEST";

export class AIImageError extends Error {
  readonly code: AIImageErrorCode;
  readonly requestId?: string;

  constructor(
    message: string,
    code: AIImageErrorCode = "IMAGE_GENERATION_ERROR",
    requestId?: string,
  ) {
    super(message);

    this.name = "AIImageError";
    this.code = code;
    this.requestId = requestId;

    Object.setPrototypeOf(this, AIImageError.prototype);
  }
}