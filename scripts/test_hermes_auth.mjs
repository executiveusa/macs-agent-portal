import crypto from "node:crypto";

const masterKey = process.env.MAXX_HERMES_API_KEY;
const profile = "chief-pup";
const derivedKey = crypto.createHmac("sha256", masterKey).update(`maxx-hermes-profile:${profile}`).digest("hex");

async function test() {
  console.log("Testing POST with master key:");
  const r1 = await fetch("http://maxx-hermes:8642/p/chief-pup/v1/runs", {
    method: "POST",
    headers: { Authorization: `Bearer ${masterKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ task: "hello" })
  });
  console.log("Master key on /p/chief-pup status:", r1.status);

  console.log("Testing POST with derived key:");
  const r2 = await fetch("http://maxx-hermes:8642/p/chief-pup/v1/runs", {
    method: "POST",
    headers: { Authorization: `Bearer ${derivedKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ task: "hello" })
  });
  console.log("Derived key on /p/chief-pup status:", r2.status);

  console.log("Testing default route POST with master key:");
  const r3 = await fetch("http://maxx-hermes:8642/v1/runs", {
    method: "POST",
    headers: { Authorization: `Bearer ${masterKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ task: "hello" })
  });
  console.log("Master key on /v1/runs status:", r3.status);
}

test().catch(console.error);
