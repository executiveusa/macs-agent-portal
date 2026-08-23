import test from "node:test";
import assert from "node:assert/strict";
import { DefaultPhoneChatGateway } from "../src/phone-chat.js";

test("DefaultPhoneChatGateway creates pairing session and validates 6-digit passcode", async () => {
  const gateway = new DefaultPhoneChatGateway({ port: 3000, tunnelProvider: "cloudflare" });

  const initialStatus = gateway.getStatus();
  assert.equal(initialStatus.status, "idle");
  assert.equal(initialStatus.port, 3000);
  assert.equal(initialStatus.tunnelProvider, "cloudflare");
  assert.equal(initialStatus.activeClients, 0);

  const pairing = await gateway.getPairingInfo("op-stacy-123");
  assert.ok(pairing.sessionId.startsWith("phone_"));
  assert.equal(pairing.passcode.length, 6);
  assert.ok(pairing.qrPayload.includes("op-stacy-123"));

  // Incorrect passcode fails
  const invalid = await gateway.verifyPasscode(pairing.sessionId, "000000");
  assert.equal(invalid, false);

  // Correct passcode succeeds
  const valid = await gateway.verifyPasscode(pairing.sessionId, pairing.passcode);
  assert.equal(valid, true);

  const activeStatus = gateway.getStatus();
  assert.equal(activeStatus.status, "active");
  assert.equal(activeStatus.activeClients, 1);
});
