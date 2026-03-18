import { describe, it, expect, beforeEach } from 'vitest';
import { createZoomPan } from './zoomPanStore.svelte';

describe('zoomPanStore', () => {
  let store: ReturnType<typeof createZoomPan>;

  beforeEach(() => {
    store = createZoomPan();
  });

  describe('initial state', () => {
    it('should start at zoom level 1', () => {
      expect(store.zoomLevel).toBe(1);
    });

    it('should start with no pan offset', () => {
      expect(store.panX).toBe(0);
      expect(store.panY).toBe(0);
    });

    it('should not be panning initially', () => {
      expect(store.isPanning).toBe(false);
      expect(store.isTouchPanning).toBe(false);
    });

    it('should have grid off by default', () => {
      expect(store.showGrid).toBe(false);
    });
  });

  describe('zoomIn / zoomOut', () => {
    it('should increase zoom level on zoomIn', () => {
      store.zoomIn();
      expect(store.zoomLevel).toBeGreaterThan(1);
    });

    it('should decrease zoom level on zoomOut', () => {
      store.zoomIn();
      store.zoomIn();
      const level = store.zoomLevel;
      store.zoomOut();
      expect(store.zoomLevel).toBeLessThan(level);
    });

    it('should not exceed max zoom (8)', () => {
      for (let i = 0; i < 50; i++) store.zoomIn();
      expect(store.zoomLevel).toBeLessThanOrEqual(8);
    });

    it('should not go below min zoom (0.25)', () => {
      for (let i = 0; i < 50; i++) store.zoomOut();
      expect(store.zoomLevel).toBeGreaterThanOrEqual(0.25);
    });

    it('should reset pan when zooming out to 1 or below', () => {
      store.setZoom(1.2);
      store.zoomOut(); // 1.2 - 0.5 = 0.7, <= 1
      expect(store.panX).toBe(0);
      expect(store.panY).toBe(0);
    });
  });

  describe('resetZoom', () => {
    it('should reset zoom to 1 and clear pan', () => {
      store.zoomIn();
      store.zoomIn();
      store.resetZoom();
      expect(store.zoomLevel).toBe(1);
      expect(store.panX).toBe(0);
      expect(store.panY).toBe(0);
    });
  });

  describe('setZoom', () => {
    it('should clamp to max (8)', () => {
      store.setZoom(100);
      expect(store.zoomLevel).toBe(8);
    });

    it('should clamp to min (0.25)', () => {
      store.setZoom(-5);
      expect(store.zoomLevel).toBe(0.25);
    });

    it('should set exact value within range', () => {
      store.setZoom(3);
      expect(store.zoomLevel).toBe(3);
    });
  });

  describe('showGrid', () => {
    it('should toggle grid display', () => {
      store.showGrid = true;
      expect(store.showGrid).toBe(true);
      store.showGrid = false;
      expect(store.showGrid).toBe(false);
    });
  });

  describe('zoomToFit', () => {
    it('should reset to zoom 1 without refs', () => {
      store.setZoom(3);
      store.zoomToFit();
      expect(store.zoomLevel).toBe(1);
      expect(store.panX).toBe(0);
    });
  });

  describe('previewContainer and previewImg refs', () => {
    it('should start undefined', () => {
      expect(store.previewContainer).toBeUndefined();
      expect(store.previewImg).toBeUndefined();
    });

    it('should be settable', () => {
      const div = {} as HTMLDivElement;
      store.previewContainer = div;
      expect(store.previewContainer).toBe(div);
    });
  });
});
