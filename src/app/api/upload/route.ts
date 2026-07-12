import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import { getCurrentUser } from "@/lib/auth";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("image");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Image must be 5MB or smaller" },
      { status: 400 }
    );
  }
  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP, or GIF images are allowed" },
      { status: 400 }
    );
  }

  const filename = `${randomUUID()}.${extension}`;
  const blob = await put(filename, file, {
    access: "public",
    contentType: file.type,
  });

  return NextResponse.json({ url: blob.url }, { status: 201 });
}
