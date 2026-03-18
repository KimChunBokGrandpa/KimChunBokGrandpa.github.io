// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { createSpritesheet } from './spritesheetExporter';

describe('createSpritesheet', () => {
  it('throws for empty frames array', async () => {
    await expect(createSpritesheet([], 32, 32)).rejects.toThrow('No frames to export');
  });

  it('throws for zero frame width', async () => {
    await expect(createSpritesheet(['fake.png'], 0, 32)).rejects.toThrow('Frame dimensions must be positive');
  });

  it('throws for negative frame height', async () => {
    await expect(createSpritesheet(['fake.png'], 32, -1)).rejects.toThrow('Frame dimensions must be positive');
  });
});
