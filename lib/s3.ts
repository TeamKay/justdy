// // lib/s3.ts
// import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
// import { env } from "./env";

// const S3 = new S3Client({
//   region: env.AWS_REGION!,
//   credentials: {
//     accessKeyId: env.AWS_ACCESS_KEY_ID!,
//     secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
//   },
// });

// export async function deleteFromS3(key: string) {
//   if (!key) return;

//   await S3.send(
//     new DeleteObjectCommand({
//       Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES!,
//       Key: key,
//     }),
//   );
// }
