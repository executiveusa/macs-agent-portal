import { createHash, randomBytes } from "node:crypto";

export type PhoneSessionStatus = "idle" | "paired" | "active" | "disconnected" | "error";

export type PhonePairingInfo = {
  sessionId: string;
  passcode: string;
  qrPayload: string;
  lanUrl?: string;
  wanUrl?: string;
  status: PhoneSessionStatus;
  createdAt: string;
  expiresAt: string;
};

export type PhoneMessagePayload = {
  id: string;
  role: "user" | "operator" | "maxx" | "system";
  text: string;
  timestamp: string;
  source: "mobile_web" | "mobile_voice" | "cdp_mirror";
  metadata?: Record<string, unknown>;
};

export interface PhoneChatGateway {
  getPairingInfo(operatorId: string): Promise<PhonePairingInfo>;
  verifyPasscode(sessionId: string, passcode: string): Promise<boolean>;
  getStatus(): { status: PhoneSessionStatus; port: number; tunnelProvider?: string; activeClients: number };
}

export class DefaultPhoneChatGateway implements PhoneChatGateway {
  private readonly pairings = new Map<string, PhonePairingInfo>();
  private readonly port: number;
  private readonly tunnelProvider?: string;
  private activeClients = 0;

  constructor(options?: { port?: number; tunnelProvider?: string }) {
    this.port = options?.port ?? 3000;
    this.tunnelProvider = options?.tunnelProvider ?? "cloudflare";
  }

  async getPairingInfo(operatorId: string): Promise<PhonePairingInfo> {
    const sessionId = `phone_${randomBytes(8).toString("hex")}`;
    const passcode = Math.floor(100000 + Math.random() * 900000).toString();
    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const lanUrl = `http://127.0.0.1:${this.port}`;
    const wanUrl = process.env.MAXX_PHONE_CHAT_WAN_URL || `https://phone.executiveusa.com`;
    const qrPayload = JSON.stringify({
      session: sessionId,
      operator: operatorId,
      url: wanUrl || lanUrl,
      code: passcode,
    });

    const info: PhonePairingInfo = {
      sessionId,
      passcode,
      qrPayload,
      lanUrl,
      wanUrl,
      status: "idle",
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    };

    this.pairings.set(sessionId, info);
    return info;
  }

  async verifyPasscode(sessionId: string, passcode: string): Promise<boolean> {
    const pairing = this.pairings.get(sessionId);
    if (!pairing) return false;
    if (new Date() > new Date(pairing.expiresAt)) {
      this.pairings.delete(sessionId);
      return false;
    }
    const match = pairing.passcode === passcode;
    if (match) {
      pairing.status = "paired";
      this.activeClients++;
    }
    return match;
  }

  getStatus(): { status: PhoneSessionStatus; port: number; tunnelProvider?: string; activeClients: number } {
    return {
      status: this.activeClients > 0 ? "active" : "idle",
      port: this.port,
      tunnelProvider: this.tunnelProvider,
      activeClients: this.activeClients,
    };
  }
}
