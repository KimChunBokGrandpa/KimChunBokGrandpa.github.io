use serde::Deserialize;

#[derive(Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct Rgb {
    pub r: u8,
    pub g: u8,
    pub b: u8,
}

#[derive(Deserialize, Clone, Debug)]
pub struct QuantizeRequest {
    pub width: u32,
    pub height: u32,
    pub pixel_size: u32,
    pub palette: Vec<Rgb>,
    pub dither_type: String, // "none", "ordered", "floyd_steinberg"
}

const BITS: u32 = 5;
const SHIFT: u32 = 8 - BITS;

const BAYER_8X8: [i32; 64] = [
    0, 48, 12, 60, 3, 51, 15, 63, 32, 16, 44, 28, 35, 19, 47, 31, 8, 56, 4, 52, 11, 59, 7, 55, 40,
    24, 36, 20, 43, 27, 39, 23, 2, 50, 14, 62, 1, 49, 13, 61, 34, 18, 46, 30, 33, 17, 45, 29, 10,
    58, 6, 54, 9, 57, 5, 53, 42, 26, 38, 22, 41, 25, 37, 21,
];

pub fn quantize_rgba(data: &[u8], req: &QuantizeRequest) -> Vec<u8> {
    let width = req.width as usize;
    let height = req.height as usize;
    let effective_pixel_size = std::cmp::max(1, req.pixel_size as usize);

    if effective_pixel_size <= 1 && req.palette.is_empty() {
        return data.to_vec();
    }

    let use_palette = !req.palette.is_empty();

    if req.dither_type == "floyd_steinberg" && use_palette {
        return apply_floyd_steinberg(data, width, height, effective_pixel_size, &req.palette);
    }

    if req.dither_type == "ordered" && use_palette {
        return apply_ordered_dither(data, width, height, effective_pixel_size, &req.palette);
    }

    apply_default(
        data,
        width,
        height,
        effective_pixel_size,
        if use_palette {
            Some(&req.palette)
        } else {
            None
        },
    )
}

#[inline]
fn color_distance(cr: i32, cg: i32, cb: i32, r: i32, g: i32, b: i32) -> i32 {
    let dr = cr - r;
    let dg = cg - g;
    let db = cb - b;
    2 * dr * dr + 4 * dg * dg + 3 * db * db
}

fn build_rgb_lut(palette: &[Rgb]) -> Vec<u8> {
    let mut rgb_lut = vec![0u8; 32768 * 3];
    for ri in 0..32 {
        let r_val = (ri << SHIFT) | ((1 << (SHIFT - 1)) - 1);
        for gi in 0..32 {
            let g_val = (gi << SHIFT) | ((1 << (SHIFT - 1)) - 1);
            for bi in 0..32 {
                let b_val = (bi << SHIFT) | ((1 << (SHIFT - 1)) - 1);
                let idx = (ri << (BITS * 2)) | (gi << BITS) | bi;

                let mut min_dist = i32::MAX;
                let mut nearest_idx = 0;

                for (pi, color) in palette.iter().enumerate() {
                    let d = color_distance(
                        color.r as i32,
                        color.g as i32,
                        color.b as i32,
                        r_val as i32,
                        g_val as i32,
                        b_val as i32,
                    );
                    if d == 0 {
                        nearest_idx = pi;
                        break;
                    }
                    if d < min_dist {
                        min_dist = d;
                        nearest_idx = pi;
                    }
                }

                let c = &palette[nearest_idx];
                let off = (idx * 3) as usize;
                rgb_lut[off] = c.r;
                rgb_lut[off + 1] = c.g;
                rgb_lut[off + 2] = c.b;
            }
        }
    }
    rgb_lut
}

#[inline]
fn lut_lookup_rgb(rgb_lut: &[u8], r: u8, g: u8, b: u8) -> (u8, u8, u8) {
    let idx = (((r as u32 >> SHIFT) << (BITS * 2))
        | ((g as u32 >> SHIFT) << BITS)
        | (b as u32 >> SHIFT)) as usize;
    let off = idx * 3;
    (rgb_lut[off], rgb_lut[off + 1], rgb_lut[off + 2])
}

fn apply_default(
    pixels: &[u8],
    width: usize,
    height: usize,
    pixel_size: usize,
    palette: Option<&Vec<Rgb>>,
) -> Vec<u8> {
    let mut out_data = vec![0u8; width * height * 4];
    let rgb_lut = palette.map(|p| build_rgb_lut(p));
    let sample_stride = if pixel_size >= 5 { 2 } else { 1 };

    for y in (0..height).step_by(pixel_size) {
        for x in (0..width).step_by(pixel_size) {
            let block_h = std::cmp::min(pixel_size, height - y);
            let block_w = std::cmp::min(pixel_size, width - x);

            let mut r = 0u32;
            let mut g = 0u32;
            let mut b = 0u32;
            let mut a = 0u32;
            let mut count = 0u32;

            for by in (0..block_h).step_by(sample_stride) {
                let row_base = ((y + by) * width + x) * 4;
                for bx in (0..block_w).step_by(sample_stride) {
                    let idx = row_base + bx * 4;
                    r += pixels[idx] as u32;
                    g += pixels[idx + 1] as u32;
                    b += pixels[idx + 2] as u32;
                    a += pixels[idx + 3] as u32;
                    count += 1;
                }
            }

            let avg_r = (r / count) as u8;
            let avg_g = (g / count) as u8;
            let avg_b = (b / count) as u8;
            let avg_a = (a / count) as u8;

            let (nr, ng, nb) = if avg_a < 128 {
                (0, 0, 0)
            } else if let Some(ref lut) = rgb_lut {
                lut_lookup_rgb(lut, avg_r, avg_g, avg_b)
            } else {
                (avg_r, avg_g, avg_b)
            };

            for by in 0..block_h {
                let row_offset = (y + by) * width;
                for bx in 0..block_w {
                    let out_idx = (row_offset + x + bx) * 4;
                    out_data[out_idx] = nr;
                    out_data[out_idx + 1] = ng;
                    out_data[out_idx + 2] = nb;
                    out_data[out_idx + 3] = if avg_a < 128 { 0 } else { 255 };
                }
            }
        }
    }

    out_data
}

fn apply_ordered_dither(
    pixels: &[u8],
    width: usize,
    height: usize,
    pixel_size: usize,
    palette: &Vec<Rgb>,
) -> Vec<u8> {
    let mut out_data = vec![0u8; width * height * 4];
    let rgb_lut = build_rgb_lut(palette);

    let p_len = std::cmp::max(2, palette.len() as i32);
    let spread = std::cmp::max(8, (384.0 / p_len as f32).round() as i32);
    let od_stride = if pixel_size >= 5 { 2 } else { 1 };

    for y in (0..height).step_by(pixel_size) {
        for x in (0..width).step_by(pixel_size) {
            let block_h = std::cmp::min(pixel_size, height - y);
            let block_w = std::cmp::min(pixel_size, width - x);

            let mut r = 0u32;
            let mut g = 0u32;
            let mut b = 0u32;
            let mut a = 0u32;
            let mut count = 0u32;
            for by in (0..block_h).step_by(od_stride) {
                let row_base = ((y + by) * width + x) * 4;
                for bx in (0..block_w).step_by(od_stride) {
                    let idx = row_base + bx * 4;
                    r += pixels[idx] as u32;
                    g += pixels[idx + 1] as u32;
                    b += pixels[idx + 2] as u32;
                    a += pixels[idx + 3] as u32;
                    count += 1;
                }
            }

            let r_avg = (r / count) as i32;
            let g_avg = (g / count) as i32;
            let b_avg = (b / count) as i32;
            let a_avg = (a / count) as u8;

            if a_avg < 128 {
                continue;
            }

            let bx = x / pixel_size;
            let by = y / pixel_size;
            let thresh =
                (BAYER_8X8[((by & 7) * 8 + (bx & 7)) as usize] as f32 / 64.0 - 0.5) * spread as f32;

            let dr = (r_avg as f32 + thresh).round().clamp(0.0, 255.0) as u8;
            let dg = (g_avg as f32 + thresh).round().clamp(0.0, 255.0) as u8;
            let db = (b_avg as f32 + thresh).round().clamp(0.0, 255.0) as u8;

            let (nr, ng, nb) = lut_lookup_rgb(&rgb_lut, dr, dg, db);

            for by2 in 0..block_h {
                let row_offset = (y + by2) * width;
                for bx2 in 0..block_w {
                    let out_idx = (row_offset + x + bx2) * 4;
                    out_data[out_idx] = nr;
                    out_data[out_idx + 1] = ng;
                    out_data[out_idx + 2] = nb;
                    out_data[out_idx + 3] = 255;
                }
            }
        }
    }

    out_data
}

fn apply_floyd_steinberg(
    pixels: &[u8],
    width: usize,
    height: usize,
    pixel_size: usize,
    palette: &Vec<Rgb>,
) -> Vec<u8> {
    let rw = width.div_ceil(pixel_size);
    let rh = height.div_ceil(pixel_size);

    let mut buf = vec![0.0_f32; rw * rh * 3];
    let fs_stride = if pixel_size >= 5 { 2 } else { 1 };

    for ry in 0..rh {
        for rx in 0..rw {
            let sx = rx * pixel_size;
            let sy = ry * pixel_size;
            let block_w = std::cmp::min(pixel_size, width - sx);
            let block_h = std::cmp::min(pixel_size, height - sy);

            let mut r = 0u32;
            let mut g = 0u32;
            let mut b = 0u32;
            let mut count = 0u32;
            for by in (0..block_h).step_by(fs_stride) {
                let row_base = ((sy + by) * width + sx) * 4;
                for bx in (0..block_w).step_by(fs_stride) {
                    let idx = row_base + bx * 4;
                    r += pixels[idx] as u32;
                    g += pixels[idx + 1] as u32;
                    b += pixels[idx + 2] as u32;
                    count += 1;
                }
            }

            let off = (ry * rw + rx) * 3;
            buf[off] = r as f32 / count as f32;
            buf[off + 1] = g as f32 / count as f32;
            buf[off + 2] = b as f32 / count as f32;
        }
    }

    let rgb_lut = build_rgb_lut(palette);
    let mut out_data = vec![0u8; width * height * 4];

    for ry in 0..rh {
        for rx in 0..rw {
            let off = (ry * rw + rx) * 3;
            let r = buf[off].round().clamp(0.0, 255.0) as u8;
            let g = buf[off + 1].round().clamp(0.0, 255.0) as u8;
            let b = buf[off + 2].round().clamp(0.0, 255.0) as u8;

            let (nr, ng, nb) = lut_lookup_rgb(&rgb_lut, r, g, b);

            let err_r = buf[off] - nr as f32;
            let err_g = buf[off + 1] - ng as f32;
            let err_b = buf[off + 2] - nb as f32;

            if rx + 1 < rw {
                let noff = off + 3;
                buf[noff] += err_r * (7.0 / 16.0);
                buf[noff + 1] += err_g * (7.0 / 16.0);
                buf[noff + 2] += err_b * (7.0 / 16.0);
            }
            if ry + 1 < rh && rx > 0 {
                let noff = ((ry + 1) * rw + rx - 1) * 3;
                buf[noff] += err_r * (3.0 / 16.0);
                buf[noff + 1] += err_g * (3.0 / 16.0);
                buf[noff + 2] += err_b * (3.0 / 16.0);
            }
            if ry + 1 < rh {
                let noff = ((ry + 1) * rw + rx) * 3;
                buf[noff] += err_r * (5.0 / 16.0);
                buf[noff + 1] += err_g * (5.0 / 16.0);
                buf[noff + 2] += err_b * (5.0 / 16.0);
            }
            if ry + 1 < rh && rx + 1 < rw {
                let noff = ((ry + 1) * rw + rx + 1) * 3;
                buf[noff] += err_r * (1.0 / 16.0);
                buf[noff + 1] += err_g * (1.0 / 16.0);
                buf[noff + 2] += err_b * (1.0 / 16.0);
            }

            let sx = rx * pixel_size;
            let sy = ry * pixel_size;
            let block_w = std::cmp::min(pixel_size, width - sx);
            let block_h = std::cmp::min(pixel_size, height - sy);

            for by in 0..block_h {
                let row_offset = (sy + by) * width;
                for bx in 0..block_w {
                    let out_idx = (row_offset + sx + bx) * 4;
                    let alpha_idx = ((sy + by) * width + sx + bx) * 4 + 3;

                    if pixels[alpha_idx] < 128 {
                        continue;
                    }

                    out_data[out_idx] = nr;
                    out_data[out_idx + 1] = ng;
                    out_data[out_idx + 2] = nb;
                    out_data[out_idx + 3] = 255;
                }
            }
        }
    }

    out_data
}

#[cfg(test)]
mod tests {
    use super::{QuantizeRequest, Rgb, quantize_rgba};

    #[test]
    fn returns_original_bytes_for_no_op_request() {
        let data = vec![10, 20, 30, 255, 40, 50, 60, 255];
        let req = QuantizeRequest {
            width: 2,
            height: 1,
            pixel_size: 1,
            palette: vec![],
            dither_type: "none".to_string(),
        };

        let out = quantize_rgba(&data, &req);

        assert_eq!(out, data);
    }

    #[test]
    fn maps_pixels_to_palette_and_preserves_transparency_threshold() {
        let data = vec![250, 10, 10, 255, 10, 250, 10, 100];
        let req = QuantizeRequest {
            width: 2,
            height: 1,
            pixel_size: 1,
            palette: vec![Rgb { r: 255, g: 0, b: 0 }, Rgb { r: 0, g: 255, b: 0 }],
            dither_type: "none".to_string(),
        };

        let out = quantize_rgba(&data, &req);

        assert_eq!(&out[0..4], &[255, 0, 0, 255]);
        assert_eq!(&out[4..8], &[0, 0, 0, 0]);
    }

    #[test]
    fn pixelation_averages_block_before_palette_lookup() {
        let data = vec![
            255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255,
        ];
        let req = QuantizeRequest {
            width: 2,
            height: 2,
            pixel_size: 2,
            palette: vec![Rgb { r: 255, g: 0, b: 0 }, Rgb { r: 0, g: 0, b: 255 }],
            dither_type: "none".to_string(),
        };

        let out = quantize_rgba(&data, &req);

        assert_eq!(out.len(), data.len());
        assert!(out.chunks_exact(4).all(|px| px == [255, 0, 0, 255]));
    }
}
