/** Protect OAuth bearer tokens from accidentally using a plaintext remote URL. */
export function requireSecureControlTowerEndpoint(baseUrl: string, allowLocalHttp: boolean): void {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new Error("MAXX control plane endpoint is not a valid URL.");
  }
  if (url.username || url.password || url.hash || url.search) {
    throw new Error("MAXX control plane endpoint must not contain credentials, query strings or fragments.");
  }
  if (url.protocol === "https:") return;
  if (allowLocalHttp && url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) return;
  throw new Error("MAXX control plane requires HTTPS before client credentials can be sent. Configure VITE_CONTROL_TOWER_API_URL with a verified TLS endpoint.");
}
