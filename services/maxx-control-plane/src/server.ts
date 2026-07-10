import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";

const config = loadConfig();
const app = buildApp({ config });

try {
  await app.listen({ host: config.HOST, port: config.PORT });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}

// Graceful shutdown: stop accepting new connections, let in-flight requests
// finish (app.close() waits for them), and run the onClose hooks already
// registered in app.ts (scheduler.stop(), browser.close()) before exiting.
let shuttingDown = false;
async function shutdown(signal: NodeJS.Signals) {
  if (shuttingDown) return;
  shuttingDown = true;
  app.log.info({ signal }, "Received shutdown signal, draining in-flight requests");
  try {
    await app.close();
    app.log.info("Shutdown complete");
    process.exit(0);
  } catch (error) {
    app.log.error(error, "Error during shutdown");
    process.exit(1);
  }
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
