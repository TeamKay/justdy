import type * as OTNamespace from "opentok";

declare global {
  interface Window {
    OT: typeof OTNamespace;
  }
}

declare module "*.css";

declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

// // global.d.ts
// export {};

// declare global {
//   interface Window {
//     OT: any; // You can use 'any' or import specific types if available
//   }
// }
