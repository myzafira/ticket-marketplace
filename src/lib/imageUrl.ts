import { z } from "zod";

// Only accept image URLs that came from our own upload endpoint (Vercel
// Blob), never an arbitrary external URL — prevents hotlinking/tracking
// pixels or unrelated content being passed off as a ticket photo.
const uploadedImageUrlSchema = z
  .string()
  .url()
  .refine((url) => url.includes(".public.blob.vercel-storage.com/"), {
    message: "Invalid image URL",
  });

export const imageUrlSchema = uploadedImageUrlSchema.optional();
export const requiredImageUrlSchema = uploadedImageUrlSchema;
