/**
 * Zoom & Pan composable for image preview.
 * Extracts all zoom/pan state and handlers from +page.svelte.
 */

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 8;
const ZOOM_STEP_WHEEL = 0.15;
const ZOOM_STEP_BUTTON = 0.5;

export function createZoomPan() {
  let zoomLevel = $state(1);
  let panX = $state(0);
  let panY = $state(0);
  let isPanning = $state(false);
  let panStartX = 0;
  let panStartY = 0;
  let showGrid = $state(false);

  // Touch state
  let lastTouchDist = 0;
  let isTouchPanning = $state(false);

  // Refs
  let previewContainer: HTMLDivElement | undefined = $state();
  let previewImg: HTMLImageElement | undefined = $state();

  // ─── Mouse Handlers ───
  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP_WHEEL : ZOOM_STEP_WHEEL;
    zoomLevel = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomLevel + delta));
    if (zoomLevel <= 1) {
      panX = 0;
      panY = 0;
    }
  }

  function handleMouseDown(e: MouseEvent) {
    if (zoomLevel <= 1 || e.button !== 0) return;
    isPanning = true;
    panStartX = e.clientX - panX;
    panStartY = e.clientY - panY;
    e.preventDefault();
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isPanning) return;
    panX = e.clientX - panStartX;
    panY = e.clientY - panStartY;
  }

  function handleMouseUp() {
    isPanning = false;
  }

  // ─── Touch Handlers (Pinch Zoom + Pan) ───
  function handleTouchStart(e: TouchEvent) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist = Math.hypot(dx, dy);
      isTouchPanning = false;
    } else if (e.touches.length === 1 && zoomLevel > 1) {
      isTouchPanning = true;
      panStartX = e.touches[0].clientX - panX;
      panStartY = e.touches[0].clientY - panY;
    }
  }

  function handleTouchMove(e: TouchEvent) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (lastTouchDist > 0) {
        const scale = dist / lastTouchDist;
        zoomLevel = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomLevel * scale));
        if (zoomLevel <= 1) {
          panX = 0;
          panY = 0;
        }
      }
      lastTouchDist = dist;
    } else if (e.touches.length === 1 && isTouchPanning) {
      panX = e.touches[0].clientX - panStartX;
      panY = e.touches[0].clientY - panStartY;
    }
  }

  function handleTouchEnd(e: TouchEvent) {
    if (e.touches.length < 2) {
      lastTouchDist = 0;
    }
    if (e.touches.length === 0) {
      isTouchPanning = false;
    }
  }

  // ─── Zoom Controls ───
  function resetZoom() {
    zoomLevel = 1;
    panX = 0;
    panY = 0;
  }

  function zoomToFit() {
    if (previewContainer && previewImg && previewImg.naturalWidth > 0) {
      const containerW = previewContainer.clientWidth;
      const containerH = previewContainer.clientHeight;
      const imgW = previewImg.naturalWidth;
      const imgH = previewImg.naturalHeight;
      zoomLevel = Math.min(containerW / imgW, containerH / imgH, MAX_ZOOM);
    } else {
      zoomLevel = 1;
    }
    panX = 0;
    panY = 0;
  }

  function zoomIn() {
    zoomLevel = Math.min(MAX_ZOOM, zoomLevel + ZOOM_STEP_BUTTON);
  }

  function zoomOut() {
    zoomLevel = Math.max(MIN_ZOOM, zoomLevel - ZOOM_STEP_BUTTON);
    if (zoomLevel <= 1) {
      panX = 0;
      panY = 0;
    }
  }

  return {
    get zoomLevel() {
      return zoomLevel;
    },
    get panX() {
      return panX;
    },
    get panY() {
      return panY;
    },
    get isPanning() {
      return isPanning;
    },
    get isTouchPanning() {
      return isTouchPanning;
    },
    get showGrid() {
      return showGrid;
    },
    set showGrid(v: boolean) {
      showGrid = v;
    },
    get previewContainer() {
      return previewContainer;
    },
    set previewContainer(v: HTMLDivElement | undefined) {
      previewContainer = v;
    },
    get previewImg() {
      return previewImg;
    },
    set previewImg(v: HTMLImageElement | undefined) {
      previewImg = v;
    },
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetZoom,
    zoomToFit,
    zoomIn,
    zoomOut,
    setZoom: (val: number) => { zoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, val)); },
  };
}
