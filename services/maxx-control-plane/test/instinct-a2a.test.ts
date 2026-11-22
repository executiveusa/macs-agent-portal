import assert from "node:assert/strict";
import test from "node:test";
import { loadConfig } from "../src/config.js";
import { canonicalA2A,signInstinctEnvelope,verifyInstinctEnvelope,dispatchInstinctDraft } from "../src/instinct-a2a.js";

const key="a-unique-inert-test-key-with-over-thirty-two-characters";
const claim={
  missionId:"99999999-9999-4999-8999-999999999999",
  projectId:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  organizationId:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  approvedBy:"cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  actionHash:"a".repeat(64),
  objective:"Draft a Bunna internal announcement",
  action:"client_draft_only" as const,
  allowedTools:[] as [],
  externalSideEffects:false as const,
  budgetUsd:0 as const,
};
const cfg=()=>loadConfig({
 NODE_ENV:"test",MAXX_INSTINCT_A2A_URL:"https://instinct.example.test/a2a",
 MAXX_INSTINCT_A2A_KEY:key,
});
test("Instinct HMAC is canonical across property order and rejects wrong key/time/body",()=>{
 const id=claim.missionId, timestamp=String(Math.floor(Date.now()/1000));
 const body={missionId:id, projectId:claim.projectId, restrictions:{tools:[], sideEffects:false}};
 const swapped={restrictions:{sideEffects:false,tools:[]},projectId:claim.projectId,missionId:id};
 assert.equal(canonicalA2A(body),canonicalA2A(swapped));
 const signature="sha256="+signInstinctEnvelope(key,timestamp,id,body);
 assert.equal(verifyInstinctEnvelope(key,timestamp,id,swapped,signature),true);
 assert.equal(verifyInstinctEnvelope(key+"wrong",timestamp,id,body,signature),false);
 assert.equal(verifyInstinctEnvelope(key,timestamp,id,{...body,projectId:claim.organizationId},signature),false);
 assert.equal(verifyInstinctEnvelope(key,String(Number(timestamp)-601),id,body,signature),false);
 assert.equal(verifyInstinctEnvelope(key,timestamp,id,body,"sha256="+"0".repeat(64)),false);
});
test("dispatch sends only a signed approved empty-tool draft, accepts exact 202 ACK",async()=>{
 let calls=0;
 const stub=async (input:RequestInfo|URL,opts?:RequestInit)=>{
  calls++;
  assert.equal(String(input),"https://instinct.example.test/a2a");
  assert.equal(opts?.method,"POST");
  assert.equal(opts?.redirect,"error");
  const payload=JSON.parse(String(opts?.body));
  assert.equal(payload.missionId,claim.missionId);
  assert.equal(payload.projectId,claim.projectId);
  assert.equal(payload.action,"client_draft_only");
  assert.deepEqual(payload.allowedTools,[]);
  assert.equal(payload.externalSideEffects,false);
  assert.equal(payload.budgetUsd,0);
  const h=new Headers(opts?.headers);
  assert.equal(verifyInstinctEnvelope(key,
    h.get("x-maxx-instinct-timestamp")??undefined,
    h.get("x-maxx-instinct-delivery-id")??undefined,
    payload,h.get("x-maxx-instinct-signature")??undefined),true);
  return new Response(JSON.stringify({accepted:true,missionId:claim.missionId,
    projectId:claim.projectId,externalRunId:"instinct-real-123"}),{status:202});
 };
 assert.equal(await dispatchInstinctDraft(cfg(),claim,claim.approvedBy,stub as typeof fetch),
  "instinct-real-123");
 assert.equal(calls,1);
});
test("refuses insecure endpoint and mismatched ACK without fabricating completion",async()=>{
 const insecure=loadConfig({NODE_ENV:"test",MAXX_INSTINCT_A2A_URL:"http://example.test/a2a",MAXX_INSTINCT_A2A_KEY:key});
 let calls=0;
 const stub=async()=>{calls++;return new Response(JSON.stringify({accepted:true,
  missionId:claim.missionId,projectId:claim.organizationId,
  externalRunId:"fake-job"}),{status:202});};
 await assert.rejects(dispatchInstinctDraft(insecure,claim,claim.approvedBy,stub as typeof fetch),/HTTPS/);
 assert.equal(calls,0);
 await assert.rejects(dispatchInstinctDraft(cfg(),claim,claim.approvedBy,stub as typeof fetch),/acknowledgement/);
});
