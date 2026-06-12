import { readRemotePageSnapshot } from "./lib/maxx-browser-client.mjs";

const targetUrl = process.argv[2] ?? "http://127.0.0.1:4173/";

try {
  const snapshot = await readRemotePageSnapshot(targetUrl);
  console.log(
    JSON.stringify(
      {
        ok: true,
        url: targetUrl,
        title: snapshot.title,
        bodyPreview: snapshot.body.slice(0, 1000),
        bodyLength: snapshot.body.length,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        url: targetUrl,
        error: error instanceof Error ? error.message : String(error),
        hint: "Check MAXX_BROWSER_WS_ENDPOINT and confirm the remote Browser API credentials are valid.",
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
}
