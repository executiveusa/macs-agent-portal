export type STTResult = { text: string; confidence: number; language: string; durationMs: number };
export type TTSResult = { audioBase64: string; durationMs: number; format: string };

export interface VoiceProvider {
  transcribe(input: { audioBase64: string; mimeType: string }): Promise<STTResult>;
  synthesize(input: { text: string; voiceId?: string }): Promise<TTSResult>;
}

// Used whenever MAXX_VOICE_ENABLED=false or no endpoint/key is configured.
// Both methods reject with the exact missing-config reason rather than
// returning a fabricated result, so callers can surface an honest 503 with
// the browser-fallback hint instead of silently pretending voice works.
export class UnavailableVoiceProvider implements VoiceProvider {
  constructor(private readonly reason: string) {}

  async transcribe(): Promise<STTResult> {
    throw new Error(this.reason);
  }

  async synthesize(): Promise<TTSResult> {
    throw new Error(this.reason);
  }
}

// Generic HTTP-backed provider. Deliberately not bound to a specific
// vendor's request/response shape (Deepgram, ElevenLabs, etc.) - no
// credentials are available in this environment to verify one against a
// real endpoint, and guessing a vendor contract without being able to test
// it would be worse than staying generic. Swap in a vendor-specific adapter
// once a provider is selected and reachable; the VoiceProvider interface
// does not need to change.
export class HttpVoiceProvider implements VoiceProvider {
  constructor(
    private readonly endpoint: string,
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async transcribe(input: { audioBase64: string; mimeType: string }): Promise<STTResult> {
    const response = await this.fetchImpl(`${this.endpoint}/transcribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error(`STT request failed with status ${response.status}`);
    return (await response.json()) as STTResult;
  }

  async synthesize(input: { text: string; voiceId?: string }): Promise<TTSResult> {
    const response = await this.fetchImpl(`${this.endpoint}/synthesize`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error(`TTS request failed with status ${response.status}`);
    return (await response.json()) as TTSResult;
  }
}

export type VoiceGatewayConfig = {
  voiceEnabled: boolean;
  sttEndpoint?: string;
  sttApiKey?: string;
  ttsEndpoint?: string;
  ttsApiKey?: string;
};

export function createVoiceGateway(config: VoiceGatewayConfig): { stt: VoiceProvider; tts: VoiceProvider } {
  const fallbackReason =
    "Server voice is not configured (set MAXX_VOICE_ENABLED=true plus the endpoint/key pair); browser fallback remains available";
  const stt =
    config.voiceEnabled && config.sttEndpoint && config.sttApiKey
      ? new HttpVoiceProvider(config.sttEndpoint, config.sttApiKey)
      : new UnavailableVoiceProvider(fallbackReason);
  const tts =
    config.voiceEnabled && config.ttsEndpoint && config.ttsApiKey
      ? new HttpVoiceProvider(config.ttsEndpoint, config.ttsApiKey)
      : new UnavailableVoiceProvider(fallbackReason);
  return { stt, tts };
}
