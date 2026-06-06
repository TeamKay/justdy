import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "../core";

// Export the route handlers so Next.js recognizes this file as a valid module
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,

  // Optional: If you are using custom tokens/secret keys config, you can pass them here:
  // config: { ... }
});
