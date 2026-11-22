import { describe, expect, it } from "vitest";
import { requireSecureControlTowerEndpoint } from "./control-tower-endpoint";

describe("MAXX browser control-plane endpoint authentication boundary", () => {
  it("accepts a configured HTTPS reverse proxy", () => {
    expect(() => requireSecureControlTowerEndpoint(
      "https://api.thepaulieffect.com/maxx", false,
    )).not.toThrow();
  });
  it("refuses the insecure configured public server URL before token retrieval", () => {
    expect(() => requireSecureControlTowerEndpoint(
      "http://31.220.58.212:8788", false,
    )).toThrow(/requires HTTPS/);
    expect(() => requireSecureControlTowerEndpoint(
      "http://31.220.58.212:8788", true,
    )).toThrow(/requires HTTPS/);
  });
  it("permits a loopback development server but not a remote HTTP alias", () => {
    expect(() => requireSecureControlTowerEndpoint(
      "http://127.0.0.1:8787", true,
    )).not.toThrow();
    expect(() => requireSecureControlTowerEndpoint(
      "http://localhost:8787", true,
    )).not.toThrow();
    expect(() => requireSecureControlTowerEndpoint(
      "http://127.0.0.1:8787", false,
    )).toThrow(/requires HTTPS/);
    expect(() => requireSecureControlTowerEndpoint(
      "http://localhost.evil.example:8787", true,
    )).toThrow(/requires HTTPS/);
  });
  it("rejects endpoint credentials and malformed URLs", () => {
    expect(() => requireSecureControlTowerEndpoint(
      "https://operator:password@api.example.com", false,
    )).toThrow(/credentials/);
    expect(() => requireSecureControlTowerEndpoint(
      "https://api.example.com?token=secret", false,
    )).toThrow(/query/);
    expect(() => requireSecureControlTowerEndpoint(
      "not-an-endpoint", false,
    )).toThrow(/valid URL/);
  });
});
