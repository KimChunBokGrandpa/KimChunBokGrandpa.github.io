mod quantizer_core {
    include!("../../../src-tauri/src/quantizer_core.rs");
}

use quantizer_core::{QuantizeRequest, Rgb, quantize_rgba};

#[unsafe(no_mangle)]
pub extern "C" fn alloc(len: usize) -> *mut u8 {
    let mut buffer = Vec::<u8>::with_capacity(len);
    let ptr = buffer.as_mut_ptr();
    std::mem::forget(buffer);
    ptr
}

#[unsafe(no_mangle)]
pub extern "C" fn free(ptr: *mut u8, len: usize) {
    if ptr.is_null() || len == 0 {
        return;
    }

    // SAFETY: ptr/len pair must come from alloc() or quantize().
    unsafe {
        let _ = Vec::from_raw_parts(ptr, len, len);
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn quantize(
    input_ptr: *const u8,
    input_len: usize,
    width: u32,
    height: u32,
    pixel_size: u32,
    palette_ptr: *const u8,
    palette_len: usize,
    dither_type: u32,
) -> *mut u8 {
    if input_ptr.is_null() || input_len == 0 {
        return std::ptr::null_mut();
    }

    // SAFETY: caller provides valid pointers into wasm memory.
    let input = unsafe { std::slice::from_raw_parts(input_ptr, input_len) };
    let palette_bytes = if palette_ptr.is_null() || palette_len == 0 {
        &[][..]
    } else {
        // SAFETY: caller provides valid palette bytes into wasm memory.
        unsafe { std::slice::from_raw_parts(palette_ptr, palette_len) }
    };

    let palette = palette_bytes
        .chunks_exact(3)
        .map(|chunk| Rgb {
            r: chunk[0],
            g: chunk[1],
            b: chunk[2],
        })
        .collect::<Vec<_>>();

    let req = QuantizeRequest {
        width,
        height,
        pixel_size,
        palette,
        dither_type: match dither_type {
            1 => "ordered".to_string(),
            2 => "floyd_steinberg".to_string(),
            _ => "none".to_string(),
        },
    };

    let mut out = quantize_rgba(input, &req);
    out.shrink_to_fit();
    let ptr = out.as_mut_ptr();
    std::mem::forget(out);
    ptr
}
