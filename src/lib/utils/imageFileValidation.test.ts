import { describe, expect, it } from 'vitest';

import {
  MAX_IMAGE_SIZE_BYTES,
  validateImageFile,
} from './imageFileValidation';

describe('validateImageFile', () => {
  it('accepts supported image files within the size budget', () => {
    const file = new File(['pixel'], 'sample.png', { type: 'image/png' });

    expect(validateImageFile(file)).toEqual({ ok: true });
  });

  it('rejects unsupported file types', () => {
    const file = new File(['text'], 'sample.txt', { type: 'text/plain' });

    expect(validateImageFile(file)).toEqual({ ok: false, reason: 'type' });
  });

  it('rejects oversized images', () => {
    const file = new File(['pixel'], 'huge.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: MAX_IMAGE_SIZE_BYTES + 1 });

    expect(validateImageFile(file)).toEqual({ ok: false, reason: 'size' });
  });
});
