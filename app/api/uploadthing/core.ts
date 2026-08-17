import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  mediaUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 6,
    },

    video: {
      maxFileSize: "256MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      console.log("Media upload completed:", {
        name: file.name,
        key: file.key,
        url: file.ufsUrl,
      });

      return {
        key: file.key,
        url: file.ufsUrl,
      };
    }),

  deliverableUploader: f({
    blob: {
      maxFileSize: "512MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      console.log("Deliverable upload completed:", {
        name: file.name,
        type: file.type,
        size: file.size,
        key: file.key,
        url: file.ufsUrl,
      });

      return {
        key: file.key,
        url: file.ufsUrl,
        name: file.name,
        type: file.type,
        size: file.size,
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
