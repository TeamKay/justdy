interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function getCroppedImg(
  imageSrc: string,
  crop: CropArea,
): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;

  await new Promise<void>((resolve) => {
    image.onload = () => resolve();
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  canvas.width = crop.width;
  canvas.height = crop.height;

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas is empty"));
        return;
      }

      resolve(blob);
    }, "image/jpeg");
  });
}

// export async function getCroppedImg(imageSrc: string, crop: any) {
//   const image = new Image();
//   image.src = imageSrc;

//   await new Promise((resolve) => {
//     image.onload = resolve;
//   });

//   const canvas = document.createElement("canvas");
//   const ctx = canvas.getContext("2d");

//   canvas.width = crop.width;
//   canvas.height = crop.height;

//   ctx?.drawImage(
//     image,
//     crop.x,
//     crop.y,
//     crop.width,
//     crop.height,
//     0,
//     0,
//     crop.width,
//     crop.height,
//   );

//   return new Promise<Blob>((resolve) => {
//     canvas.toBlob((blob) => resolve(blob!), "image/jpeg");
//   });
// }
