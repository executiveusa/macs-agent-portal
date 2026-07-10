export type FeatureFlagName =
  | "MAXX_HERMES_ENABLED"
  | "MAXX_VOICE_ENABLED"
  | "MAXX_BROWSER_ENABLED"
  | "MAXX_BROWSER_MUTATIONS_ENABLED"
  | "MAXX_MEMORY_ENABLED"
  | "MAXX_SCHEDULER_ENABLED"
  | "MAXX_PRODUCTION_MUTATIONS_ENABLED";

const FLAG_DEFAULTS: Record<FeatureFlagName, boolean> = {
  MAXX_HERMES_ENABLED: false,
  MAXX_VOICE_ENABLED: false,
  MAXX_BROWSER_ENABLED: false,
  MAXX_BROWSER_MUTATIONS_ENABLED: false,
  MAXX_MEMORY_ENABLED: false,
  MAXX_SCHEDULER_ENABLED: false,
  MAXX_PRODUCTION_MUTATIONS_ENABLED: false,
};

export type FeatureFlags = Record<FeatureFlagName, boolean>;

export function loadFeatureFlags(env: NodeJS.ProcessEnv = process.env): FeatureFlags {
  const flags = {} as FeatureFlags;
  for (const name of Object.keys(FLAG_DEFAULTS) as FeatureFlagName[]) {
    flags[name] = env[name] === "true" ? true : FLAG_DEFAULTS[name];
  }
  return flags;
}

export function isEmergencyDisabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.MAXX_EMERGENCY_DISABLE === "true";
}
