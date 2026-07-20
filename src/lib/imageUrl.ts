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

// Listings can carry more than one photo (e.g. the ticket itself plus a
// seat-view shot) — capped to keep payload size and Blob storage cost bounded.
export const MAX_LISTING_IMAGES = 5;
export const imageUrlsSchema = z
  .array(uploadedImageUrlSchema)
  .max(MAX_LISTING_IMAGES, `Up to ${MAX_LISTING_IMAGES} photos allowed`)
  .default([]);
