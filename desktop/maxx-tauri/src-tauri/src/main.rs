#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        // Deliberately no invoke_handler, plugins, filesystem, shell, or native
        // commands. Remote MAXX content gets a webview, not local authority.
        .run(tauri::generate_context!())
        .expect("error while running Agent MAXX desktop shell");
}
