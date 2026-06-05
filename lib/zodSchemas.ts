import { z } from "zod";

export const courseLevels = ["Beginner", "Intermediate", "Advanced"] as const;
export const courseStatus = [
  "Draft",
  "Published",
  "Rejected",
  "Pending",
] as const;
export const courseCategories = [
  "Development",
  "Business",
  "Finance & Accounting",
  "IT & Software",
  "Marketing",
  "Lifestyle",
  "Photography & Video",
  "Health & Fitness",
  "Teaching & Academics",
] as const;

export const communityCategories = [
  "IT & Software",
  "Photography & Video",
  "Teaching & Academics",
] as const;

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signupSchema = z
  .object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const courseSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters long" })
    .max(100, { message: "Title must be at most 100 characters long" }),
  description: z
    .string()
    .min(3, { message: "Description must be at least 3 characters long" }),
  fileKey: z.string().min(1, "File key is required"),

  price: z.coerce
    .number()
    .min(1, { message: "Price must be a positive number" }),
  duration: z.coerce
    .number()
    .min(1, { message: "Duration must be at least 1 hour" })
    .max(500, { message: "Duration must be at most 500 hours" }),
  level: z.enum(courseLevels, { message: "Level is required" }),
  category: z.enum(courseCategories, { message: "Category is required" }),
  smallDescription: z
    .string()
    .min(3, { message: "Small description must be at least 3 characters long" })
    .max(200, {
      message: "Small description must be at most 200 characters long",
    }),
  slug: z
    .string()
    .min(3, { message: "Slug must be at least 3 characters long" }),
  status: z.enum(courseStatus, { message: "Status is required" }),
});

export const chapterSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" }),
  courseId: z.string().uuid({ message: "Invalid course id" }),
});

export const lessonSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" }),
  courseId: z.string().uuid({ message: "Invalid course id" }),
  chapterId: z.string().uuid({ message: "Invalid chapter id" }),
  description: z
    .string()
    .min(3, { message: "Description must be at least 3 characters long" })
    .optional(),
  thumbnailKey: z.string().optional(),
  videoKey: z.string().optional(),
});

export const settingsSchema = z.object({
  fullName: z.string().min(3).max(150),
  profileImage: z.string(),
});

export const educatorSchema = z.object({
  specialty: z.string().min(1, { message: "Specialty is required" }),
  experience: z
    .number()
    .min(1, { message: "Experience must be a non-negative number" }),
  credentialUrl: z.string().url(),
  description: z.string().min(3).max(500),
});

export const communitySchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  smallDescription: z
    .string()
    .min(10, "Small description must be at least 10 characters")
    .max(500, "Small description cannot exceed 500 characters"),
  description: z.string().min(1),
  category: z.string().min(1),
  fileKey: z.string().min(1),
  videoKey: z.string().min(1),
  price: z.number().optional(),
});

export type CourseSchemaType = z.output<typeof courseSchema>;
export type ChapterSchemaType = z.infer<typeof chapterSchema>;
export type LessonSchemaType = z.infer<typeof lessonSchema>;
export type SettingsSchemaType = z.infer<typeof settingsSchema>;
export type EducatorSchemaType = z.infer<typeof educatorSchema>;
export type CommunitySchemaType = z.output<typeof communitySchema>;
