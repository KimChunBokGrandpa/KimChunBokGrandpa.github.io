use crate::quantizer_core::{QuantizeRequest, quantize_rgba};

#[tauri::command]
pub fn process_image_rs(data: Vec<u8>, req: QuantizeRequest) -> Result<Vec<u8>, String> {
    Ok(quantize_rgba(&data, &req))
}
