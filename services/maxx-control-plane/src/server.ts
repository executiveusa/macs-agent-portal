import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";
import { registerOperationsHubRoutes } from "./operations-hub.js";
import { registerPupBrokerRoutes } from "./pup-broker.js";
import { registerPupRoutes } from "./pups.js";
import { registerPupRuntimeControlRoutes } from "./pup-runtime-control.js";
import { registerSandboxRoutes } from "./sandbox-routes.js";

const config = loadConfig();
const app = buildApp({ config });

// Background work does not pass through Fastify's mutation preHandler, so the
// Pup supervisor must inherit the same global stop conditions explicitly.
// Keep the routes available for read/status operations while disabling only
// proactive scheduling under an emergency or locked production rollout.
const proactivePupsAllowed =
  !config.emergencyDisabled &&
  (config.NODE_ENV !== "production" || config.featureFlags.MAXX_PRODUCTION_MUTATIONS_ENABLED);
const pupConfig = proactivePupsAllowed
  ? config
  : {
      ...config,
      featureFlags: {
        ...config.featureFlags,
        MAXX_SCHEDULER_ENABLED: false,
      },
    };
await registerPupRoutes(app, pupConfig);
await registerPupRuntimeControlRoutes(app, pupConfig);
await registerPupBrokerRoutes(app, pupConfig);
await registerOperationsHubRoutes(app, pupConfig);
await registerSandboxRoutes(app, pupConfig);

try {
  await app.listen({ host: config.HOST, port: config.PORT });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}

// Graceful shutdown: stop accepting new connections, let in-flight requests
// finish (app.close() waits for them), and run the onClose hooks already
// registered in app.ts (scheduler.stop(), browser.close(), Pup supervisor)
// before exiting.
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
