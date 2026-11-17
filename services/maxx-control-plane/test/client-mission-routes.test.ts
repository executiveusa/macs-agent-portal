import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { signInstinctEnvelope } from "../src/instinct-a2a.js";
import type { createClientMissionController } from "../src/client-missions.js";
import type { createClientWorkspaceService } from "../src/client-workspaces.js";

const actor="22222222-2222-4222-8222-222222222222";
const missionId="99999999-9999-4999-8999-999999999999";
const projectId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const eventKey="test-event-ingest-key-0123456789";
const ingressKey="test-instinct-ingress-signature-key-that-is-more-than-32";
function makeApp(overrides:NodeJS.ProcessEnv={}){
 const counts={proposals:0,approvals:0,callbacks:0,starts:0};
 const config=loadConfig({
   NODE_ENV:"test",MAXX_CLIENT_WORKSPACES_ENABLED:"true",
   MAXX_PRODUCTION_MUTATIONS_ENABLED:"true",
   MAXX_EVENT_INGEST_KEY:eventKey,MAXX_EVENT_OPERATOR_ID:actor,
   MAXX_INSTINCT_INGRESS_KEY:ingressKey,
   ...overrides,
 });
 const clientWorkspaces={
   listForUser:async()=>[{id:projectId,role:"operator",status:"active"}],
 } as unknown as ReturnType<typeof createClientWorkspaceService>;
 const clientMissions={
   propose:async()=>{counts.proposals++;return {missionId,projectId,status:"pending"};},
   decide:async()=>{counts.approvals++;return {missionId,projectId,status:"approved"};},
   get:async()=>({missionId,projectId,status:"waiting_approval"}),
   start:async()=>{counts.starts++;return {missionId,projectId,status:"dispatched"};},
   poll:async()=>({missionId,projectId,status:"running"}),
   finishFromInstinct:async()=>{counts.callbacks++;return {missionId,status:"completed",verification:"human_review_required"};},
 } as unknown as ReturnType<typeof createClientMissionController>;
 const app=buildApp({
   config,clientWorkspaces,clientMissions,
   authenticate:async(request)=>{
     if(request.headers["x-maxx-event-key"]===eventKey)
       return {id:actor,email:"event-bridge@maxx.local",principal:"machine"};
     if(request.headers.authorization==="Bearer signed-user-session")
       return {id:actor,email:"stacy@example.test",principal:"human"};
     return null;
   },
 });
 return {app,counts};
}
test("human scoped mission lifecycle reaches only the registered contract, not legacy runs",async()=>{
 const {app,counts}=makeApp();
 try {
  const base=`/v1/client-workspaces/${projectId}/missions`;
  const proposal=await app.inject({method:"POST",url:base,
    headers:{authorization:"Bearer signed-user-session"},
    payload:{missionId,objective:"Draft internal Bunna note"}});
  assert.equal(proposal.statusCode,202);
  const decision=await app.inject({method:"POST",url:`${base}/${missionId}/decision`,
    headers:{authorization:"Bearer signed-user-session"},payload:{decision:"approved"}});
  assert.equal(decision.statusCode,200);
  const start=await app.inject({method:"POST",url:`${base}/${missionId}/start`,
    headers:{authorization:"Bearer signed-user-session"},payload:{}});
  assert.equal(start.statusCode,202);
  assert.deepEqual(counts,{proposals:1,approvals:1,callbacks:0,starts:1});
 }finally{await app.close();}
});
test("machine cannot create or approve client missions; unsigned webhook denied",async()=>{
 const {app,counts}=makeApp();
 try {
  const base=`/v1/client-workspaces/${projectId}/missions`;
  const machine=await app.inject({method:"POST",url:base,
    headers:{"x-maxx-event-key":eventKey},
    payload:{missionId,objective:"Exploit boundary"}});
  assert.equal(machine.statusCode,403);
  const machineDecision=await app.inject({method:"POST",url:`${base}/${missionId}/decision`,
    headers:{"x-maxx-event-key":eventKey},payload:{decision:"approved"}});
  assert.equal(machineDecision.statusCode,403);
  const webhook=await app.inject({method:"POST",url:"/v1/client-execution/instinct/events",
    headers:{"x-maxx-event-key":eventKey},
    payload:{actorId:actor,projectId,missionId,deliveryId:missionId,
      externalRunId:"instinct-123",outcome:"completed",summary:"hello"}});
  assert.equal(webhook.statusCode,401);
  assert.deepEqual(counts,{proposals:0,approvals:0,callbacks:0,starts:0});
 }finally{await app.close();}
});
test("dual-authenticated, in-window Instinct event records one scoped receipt",async()=>{
 const {app,counts}=makeApp();
 try {
  const event={actorId:actor,projectId,missionId,deliveryId:missionId,
    externalRunId:"instinct-123",outcome:"completed",summary:"Draft prepared"};
  const timestamp=String(Math.floor(Date.now()/1000));
  const signature="sha256="+signInstinctEnvelope(ingressKey,timestamp,missionId,event);
  const headers={"x-maxx-event-key":eventKey,
    "x-maxx-instinct-timestamp":timestamp,
    "x-maxx-instinct-delivery-id":missionId,
    "x-maxx-instinct-signature":signature};
  const success=await app.inject({method:"POST",url:"/v1/client-execution/instinct/events",
    headers,payload:event});
  assert.equal(success.statusCode,200);
  assert.equal(success.json().verification,"human_review_required");
  assert.equal(counts.callbacks,1);
  const forged=await app.inject({method:"POST",url:"/v1/client-execution/instinct/events",
    headers,payload:{...event,projectId:actor}});
  assert.equal(forged.statusCode,401);
  assert.equal(counts.callbacks,1);
 }finally{await app.close();}
});

test("production permits only independently gated client drafts, not global mutations",async()=>{
 const {app,counts}=makeApp({
   NODE_ENV:"production",
   MAXX_PRODUCTION_MUTATIONS_ENABLED:"false",
   MAXX_CLIENT_DRAFT_EXECUTOR_ENABLED:"true",
 });
 try{
  const base=`/v1/client-workspaces/${projectId}/missions`;
  const headers={authorization:"Bearer signed-user-session"};
  const allowed=await app.inject({method:"POST",url:base,headers,
    payload:{missionId,objective:"Draft an internal Bunna note"}});
  assert.equal(allowed.statusCode,202);
  assert.equal(counts.proposals,1);
  const denied=await app.inject({method:"POST",url:"/v1/missions",headers,
    payload:{objective:"Run global arbitrary mission"}});
  assert.equal(denied.statusCode,503);
  const deniedUnscoped=await app.inject({method:"POST",url:"/v1/hermes/runs",headers,
    payload:{runId:"x",missionId:"x",objective:"run all",workspacePath:"/tmp",stage:"hermes"}});
  assert.equal(deniedUnscoped.statusCode,503);
  assert.equal(counts.starts,0);
 } finally { await app.close(); }
});

test("production refuses scoped mission mutations until explicit executor gate is enabled",async()=>{
 const {app,counts}=makeApp({
   NODE_ENV:"production",
   MAXX_PRODUCTION_MUTATIONS_ENABLED:"false",
   MAXX_CLIENT_DRAFT_EXECUTOR_ENABLED:"false",
 });
 try{
   const response=await app.inject({method:"POST",
     url:`/v1/client-workspaces/${projectId}/missions`,
     headers:{authorization:"Bearer signed-user-session"},
     payload:{missionId,objective:"Should not create mission"}});
   assert.equal(response.statusCode,503);
   assert.equal(counts.proposals,0);
 }finally{await app.close();}
});
