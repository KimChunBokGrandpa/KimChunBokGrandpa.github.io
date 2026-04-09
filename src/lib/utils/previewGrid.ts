type PreviewGridOptions = {
  pixelSize: number;
  zoomLevel: number;
  panX: number;
  panY: number;
  naturalWidth: number;
  naturalHeight: number;
  containerWidth: number;
  containerHeight: number;
};

export function getPixelGridStyle({
  pixelSize,
  zoomLevel,
  panX,
  panY,
  naturalWidth,
  naturalHeight,
  containerWidth,
  containerHeight,
}: PreviewGridOptions): string {
  if (
    pixelSize <= 1 ||
    zoomLevel < 2 ||
    naturalWidth <= 0 ||
    naturalHeight <= 0 ||
    containerWidth <= 0 ||
    containerHeight <= 0
  ) {
    return '';
  }

  const fitScale = Math.min(containerWidth / naturalWidth, containerHeight / naturalHeight);
  const renderedWidth = naturalWidth * fitScale;
  const renderedHeight = naturalHeight * fitScale;
  const baseCellSize = pixelSize * fitScale;

  if (baseCellSize * zoomLevel < 4) {
    return '';
  }

  return [
    `width:${renderedWidth}px`,
    `height:${renderedHeight}px`,
    `background-size:${baseCellSize}px ${baseCellSize}px`,
    `transform:translate(-50%, -50%) scale(${zoomLevel}) translate(${panX / zoomLevel}px, ${panY / zoomLevel}px)`,
  ].join(';') + ';';
}
