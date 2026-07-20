import { z } from "zod";

// Only accept image URLs that came from our own upload endpoint (Vercel
// Blob), never an arbitrary external URL — prevents hotlinking/tracking
// pixels or unrelated content being passed off as a ticket photo.
// Must check the actual hostname, not just look for the substring anywhere
// in the URL — a substring check passes for e.g.
// "https://evil.example/x?y=.public.blob.vercel-storage.com/" too.
const uploadedImageUrlSchema = z
  .string()
  .url()
  .refine((url) => {
    try {
      return new URL(url).hostname.endsWith(".public.blob.vercel-storage.com");
    } catch {
      return false;
    }
  }, {
    message: "Invalid image URL",
  });

export const imageUrlSchema = uploadedImageUrlSchema.optional();
export const requiredImageUrlSchema = uploadedImageUrlSchema;
