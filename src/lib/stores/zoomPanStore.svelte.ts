/**
 * Zoom & Pan composable for image preview.
 * Extracts all zoom/pan state and handlers from +page.svelte.
 */

export function createZoomPan() {
  let zoomLevel = $state(1);
  let panX = $state(0);
  let panY = $state(0);
  let isPanning = $state(false);
  let panStartX = 0;
  let panStartY = 0;

  // Touch state
  let lastTouchDist = 0;
  let isTouchPanning = $state(false);

  // Refs
  let previewContainer: HTMLDivElement | undefined = $state();
  let previewImg: HTMLImageElement | undefined = $state();

  // ─── Mouse Handlers ───
  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    zoomLevel = Math.min(8, Math.max(0.25, zoomLevel + delta));
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
        zoomLevel = Math.min(8, Math.max(0.25, zoomLevel * scale));
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
      zoomLevel = Math.min(containerW / imgW, containerH / imgH, 8);
    } else {
      zoomLevel = 1;
    }
    panX = 0;
    panY = 0;
  }

  function zoomIn() {
    zoomLevel = Math.min(8, zoomLevel + 0.5);
  }

  function zoomOut() {
    zoomLevel = Math.max(0.25, zoomLevel - 0.5);
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
  };
}
