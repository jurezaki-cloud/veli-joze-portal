import sharp from "sharp";
export const MAX_UPLOAD = 5 * 1024 * 1024;
export async function prepareGalleryImage(bytes: Uint8Array) {
 if (!bytes.length || bytes.length > MAX_UPLOAD) throw new Error("Fotografija mora biti velika največ 5 MB.");
 const source = sharp(bytes, { limitInputPixels: 40_000_000, animated: false });
 const meta = await source.metadata();
 if (!meta.format || !["jpeg", "png", "webp"].includes(meta.format) || (meta.pages ?? 1) > 1) throw new Error("Izberi fotografijo JPG, PNG ali WebP.");
 const { data, info } = await source.rotate().resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
 return { image: data, width: info.width, height: info.height };
}
