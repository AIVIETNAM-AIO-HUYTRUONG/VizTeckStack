import { createUploadthing } from "uploadthing/next";
import type { FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter: FileRouter = {
  coverUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    // No auth middleware: admin uses Bearer token (not cookies/sessions).
    // This upload endpoint is on port 3002 (admin app, not public).
    // TODO: add IP/CORS restriction or a signed URL approach when needed.
    .middleware(() => ({}))
    .onUploadComplete(({ file }) => {
      return { url: file.ufsUrl };
    }),
};

export type OurFileRouter = typeof ourFileRouter;
