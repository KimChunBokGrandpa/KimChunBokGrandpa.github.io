/** Shared test helpers */

/** Create a solid-color ImageData */
export function solidImageData(
  w: number,
  h: number,
  r: number,
  g: number,
  b: number,
  a = 255,
): ImageData {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = a;
  }
  return new ImageData(data, w, h);
}

/** Read a single pixel from ImageData */
export function getPixel(
  img: ImageData,
  x: number,
  y: number,
): [number, number, number, number] {
  const idx = (y * img.width + x) * 4;
  return [
    img.data[idx],
    img.data[idx + 1],
    img.data[idx + 2],
    img.data[idx + 3],
  ];
}
