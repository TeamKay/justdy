// import { PutObjectCommand } from "@aws-sdk/client-s3";
// import { NextResponse } from "next/server";
// import { z } from "zod";
// import { v4 as uuidv4 } from "uuid";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// export const fileUploadSchema = z.object({
//   fileName: z.string().min(1),
//   contentType: z.string().min(1),
//   size: z.number().min(1),
//   isImage: z.boolean().optional(),
// });

// export async function POST(request: Request) {
//   try {
//     const body = await request.json();

//     const validation = fileUploadSchema.safeParse(body);

//     if (!validation.success) {
//       return NextResponse.json(
//         { error: "Invalid request body" },
//         { status: 400 },
//       );
//     }

//     const { fileName } = validation.data;

//     const uniqueKey = `${uuidv4()}-${fileName}`;

//     const command = new PutObjectCommand({
//       Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
//       Key: uniqueKey,
//     });

//     const presignedUrl = await getSignedUrl(S3, command, {
//       expiresIn: 360,
//     });

//     return NextResponse.json({ presignedUrl, key: uniqueKey });
//   } catch (err) {
//     console.error("Upload URL error:", err);

//     return NextResponse.json(
//       { error: "Failed to generate presigned URL" },
//       { status: 500 },
//     );
//   }
// }

// import { env } from "@/lib/env";
// import { PutObjectCommand } from "@aws-sdk/client-s3";
// import { NextResponse } from "next/server";
// import { z } from "zod";
// import { v4 as uuidv4 } from "uuid";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// import { S3 } from "@/lib/S3Client";

// export const fileUploadSchema = z.object({
//   fileName: z.string().min(1, { message: "File name is required" }),
//   contentType: z.string().min(1, { message: "Content type is required" }),
//   size: z.number().min(1, { message: "File size must be greater than 0" }),
//   isImage: z.boolean().optional(),
// });

// export async function POST(request: Request) {
//   try {
//     const body = await request.json();

//     const validation = fileUploadSchema.safeParse(body);

//     if (!validation.success) {
//       return NextResponse.json(
//         { error: "invalid request body" },
//         { status: 400 },
//       );
//     }

//     const { fileName, contentType } = validation.data;

//     const uniqueKey = `${uuidv4()}-${fileName}`;

//     const command = new PutObjectCommand({
//       Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
//       Key: uniqueKey,
//       ContentType: contentType,
//       ACL: "private", // or REMOVE ACL entirely if Tigris rejects it
//     });

//     const presignedUrl = await getSignedUrl(S3, command, { expiresIn: 360 });

//     return NextResponse.json({ presignedUrl, key: uniqueKey });
//   } catch {
//     return NextResponse.json(
//       { error: "An error occurred while generating the presigned URL" },
//       { status: 500 },
//     );
//   }
// }
