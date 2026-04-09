mod image_processor;
mod quantizer_core;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![image_processor::process_image_rs])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
