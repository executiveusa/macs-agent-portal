import assert from "node:assert/strict";
import test from "node:test";
import { SignJWT } from "jose";
import type { FastifyRequest } from "fastify";
import { createAuthenticator } from "../src/auth.js";
import { loadConfig } from "../src/config.js";

const secret = "test-only-secret-32-characters-or-more";
const url = "http://127.0.0.1:1";
const issuer = `${url}/auth/v1`;
const alice = "11111111-1111-4111-8111-111111111111";

function config(overrides: NodeJS.ProcessEnv = {}) {
  return loadConfig({
    NODE_ENV: "production",
    SUPABASE_URL: url,
    SUPABASE_JWT_SECRET: secret,
    STACY_ALLOWED_EMAILS: "stacy@example.com",
    ...overrides,
  });
}

async function token(overrides: {
  sub?: string | null;
  issuer?: string | null;
  audience?: string;
  email?: string;
} = {}) {
  let jwt = new SignJWT({ email: overrides.email ?? "stacy@example.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(overrides.audience ?? "authenticated")
    .setIssuedAt()
    .setExpirationTime("15m");
  if (overrides.sub !== null) jwt = jwt.setSubject(overrides.sub ?? alice);
  if (overrides.issuer !== null) jwt = jwt.setIssuer(overrides.issuer ?? issuer);
  return jwt.sign(new TextEncoder().encode(secret));
}

async function authenticate(jwt: string, overrides: NodeJS.ProcessEnv = {}) {
  const request = {
    method: "GET",
    url: "/v1/client-workspaces",
    headers: { authorization: `Bearer ${jwt}` },
  } as unknown as FastifyRequest;
  return createAuthenticator(config(overrides))(request);
}

test("an issuer-bound, allowlisted UUID subject authenticates", async () => {
  const result = await authenticate(await token());
  assert.deepEqual(result, {
    id: alice,
    email: "stacy@example.com",
    principal: "human",
  });
});

test("allowlisted email cannot authenticate without a valid Supabase UUID subject", async () => {
  for (const sub of [null, "not-a-uuid", "local-stacy", ""] as const) {
    assert.equal(await authenticate(await token({ sub })), null, String(sub));
  }
});

test("signed JWT from a different project issuer or audience is not trusted", async () => {
  for (const jwt of [
    await token({ issuer: "https://foreign-project.supabase.co/auth/v1" }),
    await token({ issuer: null }),
    await token({ audience: "another-audience" }),
    await token({ email: "unlisted@example.com" }),
  ]) {
    assert.equal(await authenticate(jwt), null);
  }
});

test("a signing secret without an explicit Supabase issuer cannot grant access", async () => {
  assert.equal(await authenticate(await token(), { SUPABASE_URL: undefined }), null);
});
