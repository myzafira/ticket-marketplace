import { Jimp } from "jimp";
import jsQR from "jsqr";

// Best-effort QR/barcode decode from raw image bytes — used to auto-extract
// a ticket's code from its uploaded proof photo. Returns null on any
// failure (corrupt image, unsupported format like WebP, no code found)
// rather than throwing, since this is an enhancement on top of the upload,
// never a blocking requirement.
export async function decodeQrCode(bytes: Uint8Array): Promise<string | null> {
  try {
    const image = await Jimp.read(Buffer.from(bytes));
    const { data, width, height } = image.bitmap;
    const pixels = new Uint8ClampedArray(data.buffer, data.byteOffset, data.length);
    const result = jsQR(pixels, width, height);
    return result?.data ?? null;
  } catch {
    return null;
  }
}
