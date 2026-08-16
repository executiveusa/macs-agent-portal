import { writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const raw = process.env.MAXX_DESKTOP_URL;
if (!raw) {
  console.error("MAXX_DESKTOP_URL is required, for example https://maxx.example.com");
  process.exit(1);
}

let url;
try {
  url = new URL(raw);
} catch {
  console.error("MAXX_DESKTOP_URL must be a valid URL");
  process.exit(1);
}
if (url.protocol !== "https:" || url.username || url.password) {
  console.error("MAXX_DESKTOP_URL must be an HTTPS URL without embedded credentials");
  process.exit(1);
}

const runtimeConfig = {
  app: {
    windows: [
      {
        label: "main",
        title: "Agent MAXX",
        width: 1180,
        height: 820,
        minWidth: 760,
        minHeight: 620,
        url: url.toString(),
      },
    ],
  },
};

const configPath = new URL("./src-tauri/tauri.runtime.conf.json", import.meta.url);
await writeFile(configPath, `${JSON.stringify(runtimeConfig, null, 2)}\n`, { mode: 0o600 });

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(command, ["tauri", "build", "--config", configPath.pathname], {
  cwd: new URL(".", import.meta.url),
  stdio: "inherit",
  shell: false,
});
process.exit(result.status ?? 1);
