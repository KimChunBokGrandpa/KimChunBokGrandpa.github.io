export const ACCEPTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/bmp',
  'image/webp',
] as const;

export const MAX_IMAGE_SIZE_BYTES = 50 * 1024 * 1024;

export type ImageFileValidationResult =
  | { ok: true }
  | { ok: false; reason: 'type' | 'size' };

export function validateImageFile(file: File): ImageFileValidationResult {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return { ok: false, reason: 'type' };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { ok: false, reason: 'size' };
  }

  return { ok: true };
}
