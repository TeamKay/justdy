import { z } from "zod";
export const productStatus = [
  "Draft",
  "Published",
  "Rejected",
  "Pending",
] as const;

export const productType = [
  "Course",
  "Worksheets",
  "Workbooks",
  "Planners",
  "Journals",
  "Templates",
  "Checklists",
  "Trackers",
  "Guides",
  "Bundles",
] as const;
export const courseCategories = ["Mathematics", "Writing", "Reading"] as const;

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

export const productSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters long" })
    .max(100, { message: "Title must be at most 100 characters long" }),
  description: z
    .string()
    .min(3, { message: "Description must be at least 3 characters long" }),
  price: z.coerce
    .number()
    .min(1, { message: "Price must be a positive number" }),
  printedPrice: z.number().nonnegative().optional(),
  type: z.enum(productType, { message: "Type is required" }),
  slug: z
    .string()
    .min(3, { message: "Slug must be at least 3 characters long" }),
  status: z.enum(productStatus, { message: "Status is required" }),
  fileKey: z.string().optional(),
  duration: z.coerce.number().optional().nullable(),
  category: z.enum(courseCategories).optional().or(z.literal("")),
});

export const chapterSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" }),
  productId: z.string(),
});

export const lessonSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" }),
  productId: z.string().min(1, { message: "Invalid product id" }),
  chapterId: z.string().min(1, { message: "Invalid chapter id" }),
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

export const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  description: z.string().optional().nullable(),
});

export const packagesSchema = z.object({
  name: z.string().min(1, "Package name is required"),
  description: z.string().optional().nullable(),
  targetGrades: z.string().min(1, "Target grades are required"),
  price: z.coerce
    .number()
    .min(1, { message: "Price must be a positive number" }),
  subjectId: z.string().min(1, "Subject is required"),
});

export type ProductSchemaType = z.output<typeof productSchema>;
export type ChapterSchemaType = z.infer<typeof chapterSchema>;
export type LessonSchemaType = z.infer<typeof lessonSchema>;
export type SettingsSchemaType = z.infer<typeof settingsSchema>;
export type EducatorSchemaType = z.infer<typeof educatorSchema>;
export type SubjectSchemaType = z.infer<typeof subjectSchema>;
export type PackagesSchemaType = z.infer<typeof packagesSchema>;
