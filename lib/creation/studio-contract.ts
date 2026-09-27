/**
 * Shared Phase 1 contract for all five Justdy creation studios.
 *
 * This is intentionally provider-agnostic. Studios may have different
 * structured document schemas, but the lifecycle around those schemas should
 * be consistent.
 */

export type StudioKind =
  | "WORKSHEET"
  | "WORKBOOK"
  | "COLORING"
  | "IMAGE"
  | "VIDEO";

export type GenerationStatus =
  | "QUEUED"
  | "GENERATING"
  | "VALIDATING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type ResourceLifecycle =
  | "DRAFT"
  | "REVIEW"
  | "PUBLISHED"
  | "UNPUBLISHED"
  | "ARCHIVED"
  | "REJECTED";

export interface CreationRequest {
  studio: StudioKind;
  prompt: string;
  projectId?: string | null;
  settings?: Record<string, unknown>;
  referenceAssetIds?: string[];
}

export interface GenerationReceipt {
  generationId: string;
  projectId?: string | null;
  resourceId?: string | null;
  status: GenerationStatus;
  estimatedCredits?: number | null;
  creditsUsed?: number | null;
}

export interface StudioAcceptanceState {
  hasPrompt: boolean;
  generated: boolean;
  qualityChecked: boolean;
  editable: boolean;
  dirty: boolean;
  saved: boolean;
  exportable: boolean;
  shareable: boolean;
  publishable: boolean;
}

/**
 * Every studio should be able to answer these lifecycle questions.
 * The studio-specific document/editor implementation remains separate.
 */
export interface CreationStudioContract {
  kind: StudioKind;
  create(request: CreationRequest): Promise<GenerationReceipt>;
  save(): Promise<{ resourceId: string; versionId?: string }>;
  export(format: string): Promise<void>;
  publish(resourceId: string): Promise<{ publicUrl: string }>;
}
