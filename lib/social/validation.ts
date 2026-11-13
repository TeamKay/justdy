import { z } from "zod";
import { getSocialPostText } from "@/lib/social/rich-text";

export const socialUsernameSchema = z.string().trim().min(3, "Username must contain at least 3 characters").max(24, "Username cannot exceed 24 characters").transform((value) => value.toLowerCase()).pipe(z.string().regex(/^[a-z0-9_]+$/, "Use only lowercase letters, numbers, and underscores"));
export const createSocialProfileSchema = z.object({ username: socialUsernameSchema });
export const updateSocialProfileSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required.").max(50, "Display name cannot exceed 50 characters."),
  bio: z.string().trim().max(300, "Bio cannot exceed 300 characters."),
});
export type UpdateSocialProfileInput = z.infer<typeof updateSocialProfileSchema>;
export type CreateSocialProfileInput = z.infer<typeof createSocialProfileSchema>;

const socialPostContentSchema = z.string().trim().max(100_000, "Post content is too large.").refine((content) => getSocialPostText(content).length <= 3000, "Your post cannot exceed 3,000 characters.").default("");
function hasSocialPostContent(content: string): boolean { return getSocialPostText(content).trim().length > 0; }
export const socialPostLayoutSchema = z.enum(["IMAGE_LEFT", "TEXT_LEFT", "IMAGE_TOP", "TEXT_TOP"]);
export type SocialPostLayout = z.infer<typeof socialPostLayoutSchema>;

export const createSocialPostSchema = z.object({
  content: socialPostContentSchema,
  mediaIds: z.array(z.string().min(1)).max(6, "You can attach up to 6 media files.").default([]),
  visibility: z.enum(["PUBLIC", "FOLLOWERS", "ONLY_ME"]).default("FOLLOWERS"),
  layout: socialPostLayoutSchema.default("TEXT_TOP"),
}).refine((data) => hasSocialPostContent(data.content) || data.mediaIds.length > 0, "Write something or attach at least one photo or video.").refine((data) => new Set(data.mediaIds).size === data.mediaIds.length, "A media file cannot be attached more than once.");
export type CreateSocialPostInput = z.infer<typeof createSocialPostSchema>;

export const createSocialCommentSchema = z.object({
  postId: z.string().min(1).max(100),
  content: z.string().trim().min(1, "Write a comment before submitting.").max(1000, "Comments cannot exceed 1,000 characters."),
});
export type CreateSocialCommentInput = z.infer<typeof createSocialCommentSchema>;

export const updateSocialPostSchema = z.object({
  postId: z.string().min(1).max(100),
  content: socialPostContentSchema,
  mediaIds: z.array(z.string().min(1)).max(6, "You can attach up to 6 media files.").default([]),
  visibility: z.enum(["PUBLIC", "FOLLOWERS", "ONLY_ME"]),
  layout: socialPostLayoutSchema.default("TEXT_TOP"),
}).refine((data) => hasSocialPostContent(data.content) || data.mediaIds.length > 0, "Write something or attach at least one photo or video.").refine((data) => new Set(data.mediaIds).size === data.mediaIds.length, "A media file cannot be attached more than once.");
export type UpdateSocialPostInput = z.infer<typeof updateSocialPostSchema>;
export const createSocialFollowSchema = z.object({ username: socialUsernameSchema });
export const respondSocialFollowSchema = z.object({ followId: z.string().min(1).max(100), decision: z.enum(["ACCEPT", "REJECT"]) });
export type CreateSocialFollowInput = z.infer<typeof createSocialFollowSchema>;
