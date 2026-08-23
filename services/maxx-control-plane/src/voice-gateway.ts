export type STTResult = { text: string; confidence: number; language: string; durationMs: number };
export type TTSResult = { audioBase64: string; durationMs: number; format: string };

export type VoiceSessionResult = {
  clientSecret?: string;
  expiresAt?: number;
  model?: string;
  provider: string;
};

export interface SpeechInputProvider {
  readonly name: string;
  transcribe(input: { audioBase64: string; mimeType: string }): Promise<STTResult>;
  createSession?(input: { operatorId: string }): Promise<VoiceSessionResult>;
  isReady(): boolean;
}

export interface SpeechOutputProvider {
  readonly name: string;
  synthesize(input: { text: string; voiceId?: string }): Promise<TTSResult>;
  isReady(): boolean;
}

export interface VoiceProvider {
  transcribe(input: { audioBase64: string; mimeType: string }): Promise<STTResult>;
  synthesize(input: { text: string; voiceId?: string }): Promise<TTSResult>;
}

// Used whenever voice is disabled or credentials are missing.
export class UnavailableSpeechInputProvider implements SpeechInputProvider {
  readonly name = "unavailable";
  constructor(private readonly reason: string) {}

  async transcribe(): Promise<STTResult> {
    throw new Error(this.reason);
  }

  async createSession(): Promise<VoiceSessionResult> {
    throw new Error(this.reason);
  }

  isReady(): boolean {
    return false;
  }
}

export class UnavailableSpeechOutputProvider implements SpeechOutputProvider {
  readonly name = "unavailable";
  constructor(private readonly reason: string) {}

  async synthesize(): Promise<TTSResult> {
    throw new Error(this.reason);
  }

  isReady(): boolean {
    return false;
  }
}

// Legacy combined unavailable provider for backward compatibility
export class UnavailableVoiceProvider implements VoiceProvider {
  constructor(private readonly reason: string) {}

  async transcribe(): Promise<STTResult> {
    throw new Error(this.reason);
  }

  async synthesize(): Promise<TTSResult> {
    throw new Error(this.reason);
  }
}

// Generic HTTP-backed input provider
export class HttpSpeechInputProvider implements SpeechInputProvider {
  readonly name = "http";
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

  isReady(): boolean {
    return Boolean(this.endpoint && this.apiKey);
  }
}

// Generic HTTP-backed output provider
export class HttpSpeechOutputProvider implements SpeechOutputProvider {
  readonly name = "http";
  constructor(
    private readonly endpoint: string,
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async synthesize(input: { text: string; voiceId?: string }): Promise<TTSResult> {
    const response = await this.fetchImpl(`${this.endpoint}/synthesize`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error(`TTS request failed with status ${response.status}`);
    return (await response.json()) as TTSResult;
  }

  isReady(): boolean {
    return Boolean(this.endpoint && this.apiKey);
  }
}

// Legacy HTTP combined voice provider for backward compatibility
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

// OpenAI Realtime / Speech Input Provider
export class OpenAIRealtimeSpeechInputProvider implements SpeechInputProvider {
  readonly name = "openai";
  constructor(
    private readonly apiKey: string,
    private readonly model: string = "gpt-realtime-2.1-mini",
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async createSession(input: { operatorId: string }): Promise<VoiceSessionResult> {
    const response = await this.fetchImpl("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: this.model,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI Realtime session negotiation failed with status ${response.status}`);
    }

    const payload = (await response.json()) as {
      value?: string;
      client_secret?: { value: string; expires_at?: number };
      expires_at?: number;
      session?: { model?: string };
    };

    return {
      clientSecret: payload.value ?? payload.client_secret?.value,
      expiresAt: payload.expires_at ?? payload.client_secret?.expires_at,
      model: payload.session?.model ?? this.model,
      provider: "openai",
    };
  }

  async transcribe(input: { audioBase64: string; mimeType: string }): Promise<STTResult> {
    const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;
    const buffer = Buffer.from(input.audioBase64, "base64");
    const filename = input.mimeType.includes("wav") ? "audio.wav" : input.mimeType.includes("mp4") ? "audio.mp4" : "audio.mp3";

    const parts: Buffer[] = [
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${input.mimeType}\r\n\r\n`),
      buffer,
      Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-1\r\n--${boundary}--\r\n`),
    ];
    const fullBody = Buffer.concat(parts);

    const response = await this.fetchImpl("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body: fullBody,
    });

    if (!response.ok) {
      throw new Error(`OpenAI transcription failed with status ${response.status}`);
    }

    const payload = (await response.json()) as { text?: string };
    return {
      text: (payload.text ?? "").trim(),
      confidence: 0.98,
      language: "en",
      durationMs: 0,
    };
  }

  isReady(): boolean {
    return Boolean(this.apiKey);
  }
}

export class ElevenLabsSpeechOutputProvider implements SpeechOutputProvider {
  readonly name = "elevenlabs";
  private readonly fallbackProvider?: SpeechOutputProvider;
  private readonly fetchImpl: typeof fetch;

  constructor(
    private readonly apiKey: string,
    private readonly voiceId: string = "21m00Tcm4TlvDq8ikWAM",
    private readonly modelId: string = "eleven_flash_v2_5",
    fallbackOrFetch?: SpeechOutputProvider | typeof fetch,
    fetchImpl: typeof fetch = fetch,
  ) {
    if (typeof fallbackOrFetch === "function") {
      this.fetchImpl = fallbackOrFetch;
      this.fallbackProvider = undefined;
    } else {
      this.fallbackProvider = fallbackOrFetch;
      this.fetchImpl = fetchImpl;
    }
  }

  async synthesize(input: { text: string; voiceId?: string }): Promise<TTSResult> {
    try {
      const targetVoiceId = input.voiceId || this.voiceId;
      const response = await this.fetchImpl(`https://api.elevenlabs.io/v1/text-to-speech/${targetVoiceId}?output_format=mp3_44100_128`, {
        method: "POST",
        headers: {
          "xi-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: input.text,
          model_id: this.modelId,
        }),
      });

      if (!response.ok) {
        if (this.fallbackProvider) {
          return await this.fallbackProvider.synthesize(input);
        }
        throw new Error(`ElevenLabs synthesis failed with status ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBase64 = Buffer.from(arrayBuffer).toString("base64");
      return {
        audioBase64,
        durationMs: Math.round((input.text.length / 15) * 1000),
        format: "audio/mpeg",
      };
    } catch (error) {
      if (this.fallbackProvider) {
        return await this.fallbackProvider.synthesize(input);
      }
      throw error;
    }
  }

  isReady(): boolean {
    return Boolean(this.apiKey || this.fallbackProvider?.isReady());
  }
}

// OpenAI Speech Output Provider (fallback)
export class OpenAISpeechOutputProvider implements SpeechOutputProvider {
  readonly name = "openai";
  constructor(
    private readonly apiKey: string,
    private readonly model: string = "tts-1",
    private readonly voice: string = "alloy",
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async synthesize(input: { text: string; voiceId?: string }): Promise<TTSResult> {
    const response = await this.fetchImpl("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        voice: input.voiceId || this.voice,
        input: input.text,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI synthesis failed with status ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(arrayBuffer).toString("base64");
    return {
      audioBase64,
      durationMs: Math.round((input.text.length / 15) * 1000),
      format: "audio/mpeg",
    };
  }

  isReady(): boolean {
    return Boolean(this.apiKey);
  }
}

export type VoiceGatewayConfig = {
  voiceEnabled: boolean;
  inputProvider?: "openai" | "http" | "unavailable";
  outputProvider?: "elevenlabs" | "openai" | "http" | "unavailable";
  openaiApiKey?: string;
  openaiRealtimeModel?: string;
  elevenlabsApiKey?: string;
  elevenlabsVoiceId?: string;
  elevenlabsModelId?: string;
  sttEndpoint?: string;
  sttApiKey?: string;
  ttsEndpoint?: string;
  ttsApiKey?: string;
};

export type VoiceGateway = {
  stt: SpeechInputProvider;
  tts: SpeechOutputProvider;
  inputProviderName: string;
  outputProviderName: string;
  isInputReady: () => boolean;
  isOutputReady: () => boolean;
};

export function createVoiceGateway(config: VoiceGatewayConfig): VoiceGateway {
  const fallbackReason =
    "Server voice is not configured (set MAXX_VOICE_ENABLED=true plus required credentials); browser fallback remains available";

  if (!config.voiceEnabled) {
    const stt = new UnavailableSpeechInputProvider(fallbackReason);
    const tts = new UnavailableSpeechOutputProvider(fallbackReason);
    return {
      stt,
      tts,
      inputProviderName: "unavailable",
      outputProviderName: "unavailable",
      isInputReady: () => false,
      isOutputReady: () => false,
    };
  }

  // Select Speech Input Provider
  let stt: SpeechInputProvider;
  const inputChoice = config.inputProvider ?? (config.openaiApiKey ? "openai" : config.sttEndpoint ? "http" : "unavailable");

  if (inputChoice === "openai" && config.openaiApiKey) {
    stt = new OpenAIRealtimeSpeechInputProvider(config.openaiApiKey, config.openaiRealtimeModel || "gpt-realtime-2.1-mini");
  } else if (inputChoice === "http" && config.sttEndpoint && config.sttApiKey) {
    stt = new HttpSpeechInputProvider(config.sttEndpoint, config.sttApiKey);
  } else {
    stt = new UnavailableSpeechInputProvider(fallbackReason);
  }

  // Select Speech Output Provider
  let tts: SpeechOutputProvider;
  const outputChoice = config.outputProvider ?? (config.elevenlabsApiKey ? "elevenlabs" : config.openaiApiKey ? "openai" : config.ttsEndpoint ? "http" : "unavailable");

  const openAiFallback = config.openaiApiKey ? new OpenAISpeechOutputProvider(config.openaiApiKey) : undefined;

  if (outputChoice === "elevenlabs" && config.elevenlabsApiKey) {
    tts = new ElevenLabsSpeechOutputProvider(
      config.elevenlabsApiKey,
      config.elevenlabsVoiceId || "21m00Tcm4TlvDq8ikWAM",
      config.elevenlabsModelId || "eleven_flash_v2_5",
      openAiFallback,
    );
  } else if (outputChoice === "openai" && config.openaiApiKey) {
    tts = new OpenAISpeechOutputProvider(config.openaiApiKey);
  } else if (outputChoice === "http" && config.ttsEndpoint && config.ttsApiKey) {
    tts = new HttpSpeechOutputProvider(config.ttsEndpoint, config.ttsApiKey);
  } else {
    tts = new UnavailableSpeechOutputProvider(fallbackReason);
  }

  return {
    stt,
    tts,
    inputProviderName: stt.name,
    outputProviderName: tts.name,
    isInputReady: () => stt.isReady(),
    isOutputReady: () => tts.isReady(),
  };
}
