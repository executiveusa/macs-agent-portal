import { createHmac, timingSafeEqual } from "node:crypto";
import type { MaxxConfig } from "./config.js";

export type ScopedClientDraftClaim = {
  missionId: string; projectId: string; organizationId: string;
  approvedBy: string; actionHash: string; objective: string;
  action: "client_draft_only"; allowedTools: []; externalSideEffects: false; budgetUsd: 0;
};

export function canonicalA2A(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonicalA2A).join(",") + "]";
  if (value && typeof value === "object") {
    const entries = Object.entries(value).filter(([,v]) => v !== undefined).sort(([a],[b])=>a.localeCompare(b));
    return "{" + entries.map(([k,v])=>JSON.stringify(k)+":"+canonicalA2A(v)).join(",") + "}";
  }
  const encoded = JSON.stringify(value);
  if (encoded===undefined) throw new Error("Unsupported A2A payload value");
  return encoded;
}

export function signInstinctEnvelope(key: string, timestamp: string, deliveryId: string, body: unknown): string {
  if(key.length < 32) throw new Error("Instinct signing key unavailable");
  return createHmac("sha256", key)
    .update(timestamp + "\n" + deliveryId + "\n" + canonicalA2A(body))
    .digest("hex");
}

export function verifyInstinctEnvelope(
  key: string | undefined, timestamp: string | undefined,
  deliveryId: string | undefined, body: unknown, signature: string | undefined,
  nowMs = Date.now(),
): boolean {
  if (!key || key.length < 32 || !timestamp || !deliveryId ||
      !/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(deliveryId) ||
      !signature || !/^sha256=[0-9a-f]{64}$/i.test(signature)) return false;
  const time = Number(timestamp);
  if (!Number.isInteger(time) || Math.abs(nowMs - time * 1000) > 300_000) return false;
  try {
    const calculated=Buffer.from(signInstinctEnvelope(key,timestamp,deliveryId,body),"hex");
    const received=Buffer.from(signature.slice(7),"hex");
    return calculated.length===received.length && timingSafeEqual(calculated,received);
  } catch { return false; }
}

export async function dispatchInstinctDraft(
  config: MaxxConfig, claim: ScopedClientDraftClaim, actorId: string,
  request: typeof fetch = fetch,
): Promise<string> {
  if (!config.MAXX_INSTINCT_A2A_KEY || !config.MAXX_INSTINCT_A2A_URL)
    throw new Error("Instinct A2A bridge not configured");
  const endpoint=new URL(config.MAXX_INSTINCT_A2A_URL);
  if (endpoint.protocol!=="https:" || endpoint.username || endpoint.password ||
      endpoint.hash || endpoint.search)
    throw new Error("Instinct A2A bridge requires a configured private HTTPS endpoint");
  const payload={
    version:"maxx.client_draft.v1" as const,
    missionId:claim.missionId, projectId:claim.projectId,
    organizationId:claim.organizationId, requestedBy:actorId,
    approvedBy:claim.approvedBy, requestHash:claim.actionHash,
    objective:claim.objective, action:claim.action,
    allowedTools:[] as string[], externalSideEffects:false, budgetUsd:0,
    resultWebhookPath:"/v1/client-execution/instinct/events",
  };
  const stamp=String(Math.floor(Date.now()/1000));
  const deliveryId=claim.missionId;
  const signature=signInstinctEnvelope(config.MAXX_INSTINCT_A2A_KEY,stamp,deliveryId,payload);
  const response=await request(endpoint,{
    method:"POST",redirect:"error",cache:"no-store",signal:AbortSignal.timeout(15_000),
    headers:{
      "Content-Type":"application/json",
      "x-maxx-instinct-timestamp":stamp,
      "x-maxx-instinct-delivery-id":deliveryId,
      "x-maxx-instinct-signature":"sha256="+signature,
    },
    body:canonicalA2A(payload),
  });
  if(response.status!==202) throw new Error("Instinct did not accept the approved draft task");
  const result:unknown=await response.json();
  if(!result||typeof result!=="object"||Array.isArray(result))
    throw new Error("Instinct acknowledgement malformed");
  const a=result as Record<string,unknown>;
  if(a.accepted!==true||a.missionId!==claim.missionId||a.projectId!==claim.projectId||
    typeof a.externalRunId!=="string"||a.externalRunId.length<1||a.externalRunId.length>150)
    throw new Error("Instinct did not return a matching durable run acknowledgement");
  return a.externalRunId;
}
