export type VisionFrame = {
  imageBase64: string;
  mimeType: string;
  timestampMs?: number;
  sourceDevice?: string;
};

export type VisionAnalysisResult = {
  description: string;
  detectedObjects?: Array<{ label: string; confidence: number; boundingBox?: [number, number, number, number] }>;
  actionSuggested?: string;
};

export interface VisionInputAdapter {
  readonly name: string;
  readonly deviceType: "glasses" | "phone" | "camera" | "generic";
  processFrame(frame: VisionFrame): Promise<VisionAnalysisResult>;
  isReady(): boolean;
}

export class UnavailableVisionAdapter implements VisionInputAdapter {
  readonly name = "unavailable";
  readonly deviceType = "generic";

  constructor(private readonly reason = "Vision adapter not configured") {}

  async processFrame(): Promise<VisionAnalysisResult> {
    throw new Error(this.reason);
  }

  isReady(): boolean {
    return false;
  }
}

export class MetaDATAdapter implements VisionInputAdapter {
  readonly name = "meta-dat";
  readonly deviceType = "glasses";

  constructor(private readonly endpoint?: string, private readonly apiKey?: string) {}

  async processFrame(frame: VisionFrame): Promise<VisionAnalysisResult> {
    return {
      description: `Meta DAT frame received (${frame.mimeType})`,
      actionSuggested: undefined,
    };
  }

  isReady(): boolean {
    return Boolean(this.apiKey || !this.endpoint);
  }
}

export class VisionClawAdapter implements VisionInputAdapter {
  readonly name = "vision-claw";
  readonly deviceType = "glasses";

  constructor(private readonly endpoint?: string) {}

  async processFrame(frame: VisionFrame): Promise<VisionAnalysisResult> {
    return {
      description: `VisionClaw frame ingested (${frame.mimeType})`,
      actionSuggested: undefined,
    };
  }

  isReady(): boolean {
    return true;
  }
}

export class PhoneCameraAdapter implements VisionInputAdapter {
  readonly name = "phone-camera";
  readonly deviceType = "phone";

  async processFrame(frame: VisionFrame): Promise<VisionAnalysisResult> {
    return {
      description: `Phone camera frame captured (${frame.mimeType})`,
      actionSuggested: undefined,
    };
  }

  isReady(): boolean {
    return true;
  }
}

export class GenericWebRTCGlassesAdapter implements VisionInputAdapter {
  readonly name = "generic-webrtc-glasses";
  readonly deviceType = "glasses";

  async processFrame(frame: VisionFrame): Promise<VisionAnalysisResult> {
    return {
      description: `WebRTC glasses frame stream captured (${frame.mimeType})`,
      actionSuggested: undefined,
    };
  }

  isReady(): boolean {
    return true;
  }
}

export type VisionGatewayConfig = {
  visionEnabled: boolean;
  adapterName?: "meta-dat" | "vision-claw" | "phone-camera" | "generic-webrtc-glasses" | "unavailable";
};

export function createVisionGateway(config: VisionGatewayConfig): {
  adapter: VisionInputAdapter;
  isReady: () => boolean;
} {
  if (!config.visionEnabled) {
    const adapter = new UnavailableVisionAdapter("MAXX_VISION_ENABLED is false");
    return { adapter, isReady: () => false };
  }

  let adapter: VisionInputAdapter;
  switch (config.adapterName) {
    case "meta-dat":
      adapter = new MetaDATAdapter();
      break;
    case "vision-claw":
      adapter = new VisionClawAdapter();
      break;
    case "phone-camera":
      adapter = new PhoneCameraAdapter();
      break;
    case "generic-webrtc-glasses":
      adapter = new GenericWebRTCGlassesAdapter();
      break;
    default:
      adapter = new PhoneCameraAdapter();
      break;
  }

  return { adapter, isReady: () => adapter.isReady() };
}
