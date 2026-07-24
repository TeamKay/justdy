import { createUploadthing, type FileRouter } from "uploadthing/next";
import { v4 as uuidv4 } from "uuid";

const f = createUploadthing();

export const ourFileRouter = {
  mediaUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 6, // Updated from 1 to 6 (or whatever your max limit is)
    },
    video: {
      maxFileSize: "256MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ files }) => {
      const file = files[0];
      const extension = file?.name?.split(".").pop() || "png";
      const uniqueFileName = `${uuidv4()}.${extension}`;
      return {
        uniqueFileName,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        url: file.url,
        key: file.key,
        uniqueFileName: metadata.uniqueFileName,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

// import { createUploadthing, type FileRouter } from "uploadthing/next";
// import { v4 as uuidv4 } from "uuid";

// const f = createUploadthing();

// export const ourFileRouter = {
//   mediaUploader: f({
//     image: {
//       maxFileSize: "4MB",
//       maxFileCount: 1,
//     },
//     video: {
//       maxFileSize: "256MB",
//       maxFileCount: 1,
//     },
//   })
//     .middleware(async ({ files }) => {
//       const file = files[0];
//       const extension = file.name.split(".").pop();
//       const uniqueFileName = `${uuidv4()}.${extension}`;
//       return {
//         uniqueFileName,
//       };
//     })
//     .onUploadComplete(async ({ metadata, file }) => {
//       return {
//         url: file.url,
//         key: file.key,
//         uniqueFileName: metadata.uniqueFileName,
//       };
//     }),
// } satisfies FileRouter;

// export type OurFileRouter = typeof ourFileRouter;
