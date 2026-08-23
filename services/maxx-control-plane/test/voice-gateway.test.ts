import assert from "node:assert/strict";
import test from "node:test";
import {
  UnavailableSpeechInputProvider,
  UnavailableSpeechOutputProvider,
  HttpSpeechInputProvider,
  HttpSpeechOutputProvider,
  OpenAIRealtimeSpeechInputProvider,
  ElevenLabsSpeechOutputProvider,
  OpenAISpeechOutputProvider,
  createVoiceGateway,
} from "../src/voice-gateway.js";

test("Unavailable speech providers reject with honest reason", async () => {
  const inputProvider = new UnavailableSpeechInputProvider("no server voice configured");
  const outputProvider = new UnavailableSpeechOutputProvider("no server voice configured");

  await assert.rejects(() => inputProvider.transcribe({ audioBase64: "x", mimeType: "audio/wav" }), /no server voice configured/);
  await assert.rejects(() => inputProvider.createSession({ operatorId: "op-1" }), /no server voice configured/);
  await assert.rejects(() => outputProvider.synthesize({ text: "hello" }), /no server voice configured/);
  assert.equal(inputProvider.isReady(), false);
  assert.equal(outputProvider.isReady(), false);
});

test("OpenAIRealtimeSpeechInputProvider creates ephemeral session for operator", async () => {
  let requestedUrl = "";
  let requestHeaders: Record<string, string> = {};
  let requestBody: any;

  const fakeFetch = (async (url: string, init?: RequestInit) => {
    requestedUrl = String(url);
    requestHeaders = init?.headers as Record<string, string>;
    requestBody = JSON.parse(String(init?.body));
    return new Response(
      JSON.stringify({
        client_secret: { value: "eph_token_abc123", expires_at: 1789000000 },
        model: "gpt-realtime-2.1-mini",
      }),
      { status: 200 },
    );
  }) as typeof fetch;

  const provider = new OpenAIRealtimeSpeechInputProvider("sk-openai-test-key", "gpt-realtime-2.1-mini", fakeFetch);
  const session = await provider.createSession({ operatorId: "op-stacy-uuid" });

  assert.equal(requestedUrl, "https://api.openai.com/v1/realtime/client_secrets");
  assert.equal(requestHeaders.Authorization, "Bearer sk-openai-test-key");
  assert.equal(requestBody.session.model, "gpt-realtime-2.1-mini");
  assert.equal(session.clientSecret, "eph_token_abc123");
  assert.equal(session.provider, "openai");
  assert.equal(provider.isReady(), true);
});

test("OpenAIRealtimeSpeechInputProvider transcribes audio base64 payload", async () => {
  let requestedUrl = "";
  let requestHeaders: Record<string, string> = {};

  const fakeFetch = (async (url: string, init?: RequestInit) => {
    requestedUrl = String(url);
    requestHeaders = init?.headers as Record<string, string>;
    return new Response(
      JSON.stringify({ text: "Max draft an email to Stacy" }),
      { status: 200 },
    );
  }) as typeof fetch;

  const provider = new OpenAIRealtimeSpeechInputProvider("sk-openai-test-key", "gpt-realtime-2.1-mini", fakeFetch);
  const result = await provider.transcribe({
    audioBase64: Buffer.from("fake-audio-bytes").toString("base64"),
    mimeType: "audio/wav",
  });

  assert.equal(requestedUrl, "https://api.openai.com/v1/audio/transcriptions");
  assert.equal(result.text, "Max draft an email to Stacy");
});

test("ElevenLabsSpeechOutputProvider synthesizes audio using eleven_flash_v2_5", async () => {
  let requestedUrl = "";
  let requestHeaders: Record<string, string> = {};
  let requestBody: any;

  const fakeAudio = Buffer.from("elevenlabs-mp3-audio-data");
  const fakeFetch = (async (url: string, init?: RequestInit) => {
    requestedUrl = String(url);
    requestHeaders = init?.headers as Record<string, string>;
    requestBody = JSON.parse(String(init?.body));
    return new Response(fakeAudio, {
      status: 200,
      headers: { "Content-Type": "audio/mpeg" },
    });
  }) as typeof fetch;

  const provider = new ElevenLabsSpeechOutputProvider("eleven-key-123", "voice-rachel-id", "eleven_flash_v2_5", fakeFetch);
  const result = await provider.synthesize({ text: "I have prepared your draft email." });

  assert.equal(requestedUrl, "https://api.elevenlabs.io/v1/text-to-speech/voice-rachel-id?output_format=mp3_44100_128");
  assert.equal(requestHeaders["xi-api-key"], "eleven-key-123");
  assert.equal(requestBody.model_id, "eleven_flash_v2_5");
  assert.equal(requestBody.text, "I have prepared your draft email.");
  assert.equal(result.format, "audio/mpeg");
  assert.equal(Buffer.from(result.audioBase64, "base64").toString(), "elevenlabs-mp3-audio-data");
  assert.equal(provider.isReady(), true);
});

test("OpenAISpeechOutputProvider synthesizes audio as output fallback", async () => {
  let requestedUrl = "";
  let requestBody: any;

  const fakeAudio = Buffer.from("openai-tts-audio-data");
  const fakeFetch = (async (url: string, init?: RequestInit) => {
    requestedUrl = String(url);
    requestBody = JSON.parse(String(init?.body));
    return new Response(fakeAudio, {
      status: 200,
      headers: { "Content-Type": "audio/mpeg" },
    });
  }) as typeof fetch;

  const provider = new OpenAISpeechOutputProvider("sk-openai-key", "tts-1", "alloy", fakeFetch);
  const result = await provider.synthesize({ text: "Hello Stacy" });

  assert.equal(requestedUrl, "https://api.openai.com/v1/audio/speech");
  assert.equal(requestBody.model, "tts-1");
  assert.equal(requestBody.input, "Hello Stacy");
  assert.equal(result.format, "audio/mpeg");
  assert.equal(provider.isReady(), true);
});

test("HttpSpeechInputProvider and HttpSpeechOutputProvider post payloads properly", async () => {
  const fakeFetch = (async (url: string, init?: RequestInit) => {
    if (String(url).includes("/transcribe")) {
      return new Response(JSON.stringify({ text: "hello world", confidence: 0.95, language: "en", durationMs: 1000 }), { status: 200 });
    }
    return new Response(JSON.stringify({ audioBase64: "base64audio", durationMs: 800, format: "mp3" }), { status: 200 });
  }) as typeof fetch;

  const inputProvider = new HttpSpeechInputProvider("https://voice.internal", "key-123", fakeFetch);
  const outputProvider = new HttpSpeechOutputProvider("https://voice.internal", "key-123", fakeFetch);

  const sttRes = await inputProvider.transcribe({ audioBase64: "abc", mimeType: "audio/wav" });
  assert.equal(sttRes.text, "hello world");

  const ttsRes = await outputProvider.synthesize({ text: "hello" });
  assert.equal(ttsRes.format, "mp3");
});

test("createVoiceGateway selection logic", () => {
  // 1. Disabled
  const disabled = createVoiceGateway({ voiceEnabled: false });
  assert.equal(disabled.inputProviderName, "unavailable");
  assert.equal(disabled.outputProviderName, "unavailable");
  assert.equal(disabled.isInputReady(), false);
  assert.equal(disabled.isOutputReady(), false);

  // 2. Enabled but missing keys -> fails closed safely
  const enabledNoKeys = createVoiceGateway({ voiceEnabled: true });
  assert.equal(enabledNoKeys.inputProviderName, "unavailable");
  assert.equal(enabledNoKeys.outputProviderName, "unavailable");
  assert.equal(enabledNoKeys.isInputReady(), false);

  // 3. OpenAI Realtime Input + ElevenLabs Output
  const prodVoice = createVoiceGateway({
    voiceEnabled: true,
    inputProvider: "openai",
    outputProvider: "elevenlabs",
    openaiApiKey: "sk-proj-test",
    elevenlabsApiKey: "eleven-test",
  });
  assert.equal(prodVoice.inputProviderName, "openai");
  assert.equal(prodVoice.outputProviderName, "elevenlabs");
  assert.equal(prodVoice.isInputReady(), true);
  assert.equal(prodVoice.isOutputReady(), true);
  assert.ok(prodVoice.stt instanceof OpenAIRealtimeSpeechInputProvider);
  assert.ok(prodVoice.tts instanceof ElevenLabsSpeechOutputProvider);

  // 4. OpenAI Output fallback
  const openaiOutputVoice = createVoiceGateway({
    voiceEnabled: true,
    inputProvider: "openai",
    outputProvider: "openai",
    openaiApiKey: "sk-proj-test",
  });
  assert.equal(openaiOutputVoice.outputProviderName, "openai");
  assert.ok(openaiOutputVoice.tts instanceof OpenAISpeechOutputProvider);

  // 5. Generic HTTP
  const httpVoice = createVoiceGateway({
    voiceEnabled: true,
    inputProvider: "http",
    outputProvider: "http",
    sttEndpoint: "https://stt.internal",
    sttApiKey: "key",
    ttsEndpoint: "https://tts.internal",
    ttsApiKey: "key",
  });
  assert.equal(httpVoice.inputProviderName, "http");
  assert.equal(httpVoice.outputProviderName, "http");
  assert.ok(httpVoice.stt instanceof HttpSpeechInputProvider);
  assert.ok(httpVoice.tts instanceof HttpSpeechOutputProvider);
});
