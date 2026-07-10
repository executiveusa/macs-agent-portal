import assert from "node:assert/strict";
import test from "node:test";
import { UnavailableVoiceProvider, HttpVoiceProvider, createVoiceGateway } from "../src/voice-gateway.js";

test("UnavailableVoiceProvider rejects both methods with the exact reason", async () => {
  const provider = new UnavailableVoiceProvider("no server voice configured");
  await assert.rejects(() => provider.transcribe({ audioBase64: "x", mimeType: "audio/wav" }), /no server voice configured/);
  await assert.rejects(() => provider.synthesize({ text: "hello" }), /no server voice configured/);
});

test("HttpVoiceProvider posts audio and parses the transcription result", async () => {
  const calls: Array<{ url: string; body: unknown }> = [];
  const fakeFetch = (async (url: string, init?: RequestInit) => {
    calls.push({ url: String(url), body: init?.body ? JSON.parse(String(init.body)) : undefined });
    return new Response(
      JSON.stringify({ text: "hello world", confidence: 0.95, language: "en-US", durationMs: 1200 }),
      { status: 200 },
    );
  }) as typeof fetch;

  const provider = new HttpVoiceProvider("https://voice.internal", "key-123", fakeFetch);
  const result = await provider.transcribe({ audioBase64: "abc", mimeType: "audio/wav" });

  assert.equal(result.text, "hello world");
  assert.equal(calls[0].url, "https://voice.internal/transcribe");
});

test("HttpVoiceProvider posts text and parses the synthesis result", async () => {
  const fakeFetch = (async () =>
    new Response(JSON.stringify({ audioBase64: "base64audio", durationMs: 800, format: "mp3" }), { status: 200 })) as typeof fetch;

  const provider = new HttpVoiceProvider("https://voice.internal", "key-123", fakeFetch);
  const result = await provider.synthesize({ text: "hello" });
  assert.equal(result.format, "mp3");
});

test("HttpVoiceProvider throws on a non-ok response", async () => {
  const fakeFetch = (async () => new Response(null, { status: 500 })) as typeof fetch;
  const provider = new HttpVoiceProvider("https://voice.internal", "key-123", fakeFetch);
  await assert.rejects(() => provider.transcribe({ audioBase64: "x", mimeType: "audio/wav" }));
});

test("createVoiceGateway only wires the HTTP provider when enabled and fully configured", () => {
  const disabled = createVoiceGateway({ voiceEnabled: false });
  assert.ok(disabled.stt instanceof UnavailableVoiceProvider);
  assert.ok(disabled.tts instanceof UnavailableVoiceProvider);

  const enabledNoKeys = createVoiceGateway({ voiceEnabled: true });
  assert.ok(enabledNoKeys.stt instanceof UnavailableVoiceProvider);

  const fullyConfigured = createVoiceGateway({
    voiceEnabled: true,
    sttEndpoint: "https://stt.internal",
    sttApiKey: "key",
    ttsEndpoint: "https://tts.internal",
    ttsApiKey: "key",
  });
  assert.ok(fullyConfigured.stt instanceof HttpVoiceProvider);
  assert.ok(fullyConfigured.tts instanceof HttpVoiceProvider);
});
