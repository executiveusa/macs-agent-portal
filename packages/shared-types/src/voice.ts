import { z } from "zod";

// Voice session state machine
export enum VoiceState {
  IDLE = "idle",
  ARMED = "armed",
  LISTENING = "listening",
  TRANSCRIBING = "transcribing",
  THINKING = "thinking",
  SPEAKING = "speaking",
  INTERRUPTED = "interrupted",
  COMPLETED = "completed",
  ERROR = "error",
}

// Voice session
export const voiceSessionSchema = z.object({
  session_id: z.string().uuid(),
  run_id: z.string(),
  operator_id: z.string().uuid(),
  state: z.nativeEnum(VoiceState),
  started_at: z.string().datetime(),
  ended_at: z.string().datetime().nullable(),
  transcript: z.string().optional(),
  response_text: z.string().optional(),
  metrics: z
    .object({
      listening_duration_ms: z.number(),
      transcription_latency_ms: z.number(),
      model_latency_ms: z.number(),
      synthesis_latency_ms: z.number(),
    })
    .optional(),
});

export type VoiceSession = z.infer<typeof voiceSessionSchema>;

// Voice configuration (per mission)
export const voiceConfigSchema = z.object({
  enabled: z.boolean().default(true),
  voice_id: z.string().optional(),
  language: z.string().default("en-US"),
  response_length: z.enum(["short", "medium", "long"]).default("medium"),
  speaking_rate: z.number().min(0.5).max(2.0).default(1.0),
  interruptible: z.boolean().default(true),
  strict_name_mode: z.boolean().default(false),
  wake_word_enabled: z.boolean().default(false),
  confirmation_wording: z.string().optional(),
  prohibited_action_classes: z.array(z.string()).default([]),
  transcript_retention_hours: z.number().default(24),
  audio_retention_hours: z.number().default(0),
  fallback_order: z.array(z.enum(["server", "browser", "text"])).default(["server", "browser", "text"]),
});

export type VoiceConfig = z.infer<typeof voiceConfigSchema>;

// STT provider response
export const sttResponseSchema = z.object({
  text: z.string(),
  confidence: z.number().min(0).max(1),
  language: z.string(),
  duration_ms: z.number(),
});

export type STTResponse = z.infer<typeof sttResponseSchema>;

// TTS provider response
export const ttsResponseSchema = z.object({
  audio_base64: z.string(),
  duration_ms: z.number(),
  format: z.string(),
});

export type TTSResponse = z.infer<typeof ttsResponseSchema>;
