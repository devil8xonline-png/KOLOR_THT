import type { Product } from "@/lib/types";

export const FALLBACK_IMAGE = "https://picsum.photos/900/700";

export function normalizeImageUrl(value: string | null | undefined) {
  const url = String(value || "").trim();
  if (!url) return "";

  if (url.includes("drive.google.com/thumbnail")) {
    return url.includes("&sz=") || url.includes("?sz=")
      ? url
      : url + "&sz=w1200";
  }

  const driveFileId = getGoogleDriveFileId(url);
  if (driveFileId) {
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(
      driveFileId
    )}&sz=w1200`;
  }

  return url;
}

export function normalizeGalleryString(value: string | null | undefined) {
  return String(value || "")
    .split("|")
    .map((item) => normalizeImageUrl(item))
    .filter(Boolean)
    .join("|");
}

export function productGalleryImages(product: Product) {
  const images: string[] = [];

  [
    product.drive_image_url,
    product.image,
    ...String(product.gallery || "").split("|"),
  ].forEach((item) => {
    const image = normalizeImageUrl(item);
    if (image && !images.includes(image)) images.push(image);
  });

  return images.length ? images : [FALLBACK_IMAGE];
}

export function firstProductImage(product: Product) {
  return productGalleryImages(product)[0] || FALLBACK_IMAGE;
}

function getGoogleDriveFileId(url: string) {
  if (!url.includes("drive.google.com")) return "";

  let match = url.match(/\/file\/d\/([^/?#]+)/);
  if (match?.[1]) return match[1];

  match = url.match(/\/d\/([^/?#]+)/);
  if (match?.[1]) return match[1];

  match = url.match(/[?&]id=([^&#]+)/);
  if (match?.[1]) return decodeURIComponent(match[1]);

  return "";
}
