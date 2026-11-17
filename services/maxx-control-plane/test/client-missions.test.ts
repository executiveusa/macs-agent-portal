import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp,rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { loadConfig } from "../src/config.js";
import { ClientExecutorUnavailable,createClientMissionController } from "../src/client-missions.js";
import type { createClientWorkspaceService } from "../src/client-workspaces.js";
import type { HermesAdapter,HermesRunInput,HermesRunState } from "../src/hermes-adapter.js";

const actor="22222222-2222-4222-8222-222222222222";
const reviewer="44444444-4444-4444-8444-444444444444";
const projectId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const organizationId="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const missionId="99999999-9999-4999-8999-999999999999";
const actionHash="c".repeat(64);

function config(root:string,overrides:NodeJS.ProcessEnv={}) {
 return loadConfig({
   NODE_ENV:"test",MAXX_CLIENT_WORKSPACES_ENABLED:"true",
   MAXX_PRODUCTION_MUTATIONS_ENABLED:"true",
   MAXX_CLIENT_DRAFT_EXECUTOR_ENABLED:"true",
   MAXX_CLIENT_DRAFT_EXECUTOR:"hermes",
   MAXX_CLIENT_DRAFT_HERMES_PROFILE:"client-draft-sandbox",
   MAXX_HERMES_ENABLED:"true",
   MAXX_HERMES_ENDPOINT:"https://hermes.test",
   MAXX_HERMES_API_KEY:"testing-only-secret",
   MAXX_ICM_ROOT:root,...overrides,
 });
}
function fixture(override:Record<string,unknown>={}) {
 let claimCount=0,finishCount=0,dispatchCount=0;
 const ws={
   proposeClientMission:async()=>({missionId,projectId,approvalId:reviewer,status:"pending"}),
   decideClientMission:async()=>({missionId,projectId,status:"approved"}),
   getClientMission:async()=>({
     missionId,projectId,status:"running",approvalStatus:"approved",
     approvalId:reviewer,receiptId:null,verification:"not_yet_executed",
     dispatch:{source:"hermes",externalRunId:"hermes-actual-123"},
   }),
   claimClientMission:async()=>{
     claimCount++;
     return {
       missionId,projectId,organizationId,approvedBy:reviewer,actionHash,
       objective:"Draft an internal Bunna announcement",
       action:"client_draft_only",allowedTools:[],externalSideEffects:false,budgetUsd:0,
     };
   },
   recordClientDispatch:async(_user:string,_project:string,_mission:string,
     source:string,externalRunId:string)=>{
     dispatchCount++;return {source,externalRunId};
   },
   finishClientMission:async(_actor:string,_project:string,_mission:string,receiptId:string,
     outcome:string,receipt:{source:string;externalRunId:string})=>{
     finishCount++;
     assert.equal(receiptId,missionId);
     assert.equal(outcome,"completed");
     assert.equal(receipt.source,"hermes");
     assert.equal(receipt.externalRunId,"hermes-actual-123");
     return {missionId,receiptId,status:outcome,verification:"human_review_required"};
   },...override,
 } as unknown as ReturnType<typeof createClientWorkspaceService>;
 let started=0,polls=0;
 const hermes:HermesAdapter={
   chat:async()=>{throw Error("Never use unscoped Hermes chat");},
   startRun:async (input:HermesRunInput):Promise<HermesRunState>=>{
     started++;
     assert.equal(input.runId,missionId);
     assert.equal(input.profile,"client-draft-sandbox");
     assert.match(input.objective,/NO TOOLS OR EXTERNAL SIDE EFFECTS/);
     assert.match(input.workspacePath,/runs/);
     return {runId:"hermes-actual-123",status:"running",
       startedAt:new Date().toISOString(),endedAt:null,
       stage:"04_execute",progress:.5,result:null,error:null};
   },
   getRunState:async(id:string,profile?:string)=>{
     polls++;assert.equal(id,"hermes-actual-123");
     assert.equal(profile,"client-draft-sandbox");
     return {runId:id,status:"completed" as const,
       startedAt:new Date().toISOString(),endedAt:new Date().toISOString(),
       stage:"04_execute",progress:1,result:{output:"Internal draft text, unverified"},error:null};
   },
   resolveApproval:async()=>undefined,steerRun:async()=>undefined,cancelRun:async()=>undefined,
 };
 return {ws,hermes,counts:()=>({claimCount,dispatchCount,finishCount,started,polls})};
}
test("execution refuses default-disabled flags BEFORE claiming an approved mission",async()=>{
 const x=fixture();
 const ctl=createClientMissionController(config("/tmp",{MAXX_CLIENT_DRAFT_EXECUTOR_ENABLED:"false"}),x.ws,x.hermes);
 await assert.rejects(ctl.start(actor,projectId,missionId),ClientExecutorUnavailable);
 assert.deepEqual(x.counts(),{claimCount:0,dispatchCount:0,finishCount:0,started:0,polls:0});
});
test("independent approval is followed by a bounded Hermes run and PARTIAL evidence only",async()=>{
 const root=await mkdtemp(path.join(tmpdir(),"maxx-client-icm-"));
 try {
   const x=fixture();
   const ctl=createClientMissionController(config(root),x.ws,x.hermes);
   const proposed=await ctl.propose(actor,projectId,missionId,"Draft an internal Bunna announcement");
   assert.equal(proposed.status,"pending");
   const decision=await ctl.decide(reviewer,projectId,missionId,"approved");
   assert.equal(decision.status,"approved");
   const ack=await ctl.start(actor,projectId,missionId);
   assert.equal(ack.status,"dispatched");
   assert.equal(ack.externalRunId,"hermes-actual-123");
   assert.equal(ack.verification,"human_review_required");
   const evidence=await ctl.poll(actor,projectId,missionId);
   assert.equal(evidence.verification,"human_review_required");
   assert.deepEqual(x.counts(),{claimCount:1,dispatchCount:1,finishCount:1,started:1,polls:1});
 } finally {await rm(root,{recursive:true,force:true});}
});
test("signed Instinct receipt must match a running ACK and never accepts wrong project",async()=>{
 const x=fixture({
   getClientMission:async()=>({
     status:"running",dispatch:{source:"instinct",externalRunId:"instinct-actual-22"},
   }),
   finishClientMission:async (_actor:string,_project:string,_mission:string,eventId:string,
     _outcome:string,receipt:{source:string;externalRunId:string})=>{
     assert.equal(eventId,missionId);assert.equal(receipt.source,"instinct");
     return {receiptId:eventId,verification:"human_review_required"};
   },
 });
 const ctl=createClientMissionController(config("/tmp",{
  MAXX_CLIENT_DRAFT_EXECUTOR:"instinct",
 }),x.ws,x.hermes);
 await assert.rejects(ctl.finishFromInstinct({
   actorId:actor,projectId,missionId,deliveryId:missionId,
   externalRunId:"other-project-run",outcome:"completed",summary:"unverified",
 }),ClientExecutorUnavailable);
 const result=await ctl.finishFromInstinct({
   actorId:actor,projectId,missionId,deliveryId:missionId,
   externalRunId:"instinct-actual-22",outcome:"completed",summary:"Draft completed",
 });
 assert.equal(result.verification,"human_review_required");
});
