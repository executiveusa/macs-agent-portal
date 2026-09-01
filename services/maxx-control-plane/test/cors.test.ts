import assert from "node:assert/strict";
import test from "node:test";
import { buildApp, isOriginAllowed } from "../src/app.js";
import { loadConfig } from "../src/config.js";

test("isOriginAllowed allows canonical production origins in production mode", () => {
  const prodConfig = loadConfig({ NODE_ENV: "production" });

  assert.equal(isOriginAllowed("https://macs-agent-portal-main.vercel.app", prodConfig), true);
  assert.equal(isOriginAllowed("https://macs-agent-portal-pi.vercel.app", prodConfig), true);
  assert.equal(isOriginAllowed("https://api.thepaulieffect.com", prodConfig), true);
  assert.equal(isOriginAllowed("https://thepaulieffect.com", prodConfig), true);
  assert.equal(isOriginAllowed("https://executiveusa.com", prodConfig), true);
});

test("isOriginAllowed strictly rejects unknown or malicious origins in production mode", () => {
  const prodConfig = loadConfig({ NODE_ENV: "production" });

  assert.equal(isOriginAllowed("https://evil-hacker.com", prodConfig), false);
  assert.equal(isOriginAllowed("https://not-our-site.vercel.app", prodConfig), false);
  assert.equal(isOriginAllowed("http://localhost:5173", prodConfig), false);
  assert.equal(isOriginAllowed("http://127.0.0.1:3000", prodConfig), false);
});

test("isOriginAllowed allows localhost in development/test mode", () => {
  const devConfig = loadConfig({ NODE_ENV: "development" });

  assert.equal(isOriginAllowed("http://localhost:5173", devConfig), true);
  assert.equal(isOriginAllowed("http://127.0.0.1:5173", devConfig), true);
  assert.equal(isOriginAllowed("https://evil-hacker.com", devConfig), false);
});

test("CORS preflight from unknown origin returns no access-control-allow-origin header", async () => {
  const prodConfig = loadConfig({ NODE_ENV: "production" });
  const app = buildApp({ config: prodConfig, authenticate: async () => null });

  const response = await app.inject({
    method: "OPTIONS",
    url: "/v1/chat",
    headers: {
      origin: "https://evil-phishing.com",
      "access-control-request-method": "POST",
      "access-control-request-headers": "content-type",
    },
  });

  assert.equal(response.headers["access-control-allow-origin"], undefined);
  await app.close();
});

test("CORS preflight from production origin returns 204 with access-control-allow-origin", async () => {
  const prodConfig = loadConfig({ NODE_ENV: "production" });
  const app = buildApp({ config: prodConfig, authenticate: async () => null });

  const response = await app.inject({
    method: "OPTIONS",
    url: "/v1/chat",
    headers: {
      origin: "https://macs-agent-portal-main.vercel.app",
      "access-control-request-method": "POST",
      "access-control-request-headers": "content-type,authorization,x-request-id",
    },
  });

  assert.equal(response.statusCode, 204);
  assert.equal(response.headers["access-control-allow-origin"], "https://macs-agent-portal-main.vercel.app");
  await app.close();
});
