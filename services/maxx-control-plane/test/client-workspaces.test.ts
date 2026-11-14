import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import {
  createClientWorkspaceService, WorkspaceForbidden, WorkspaceUnavailable,
  WorkspaceInvalid, WorkspaceConflict,
} from "../src/client-workspaces.js";
const alice="11111111-1111-4111-8111-111111111111";
const bob="22222222-2222-4222-8222-222222222222";
const org="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const project="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const foreign="dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const requestId="eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const row={
  id:project,organizationId:org,slug:"bunna-restaurant",name:"BUNNA RESTAURANT",
  role:"operator",status:"active",archiveRequestId:null,recoveryUntil:null,
  pendingApprovalCount:2,urgentApprovalCount:1,approvalCoverage:"maxx_only",
  suggestedTasks:["Check Bunna lunch paid receipts"],promptsSource:"verified",
};
const config={SUPABASE_URL:"https://example.supabase.co",SUPABASE_SERVICE_ROLE_KEY:"server-key-not-public"};
function adapter(handler:(name:string,payload:Record<string,unknown>)=>unknown,status=200) {
  const calls:Array<{name:string,payload:Record<string,unknown>}>=[];
  const request=(async(input: URL | RequestInfo,init?:RequestInit)=>{
    const url=new URL(String(input));
    assert.equal(init?.method,"POST");
    assert.equal(url.origin,"https://example.supabase.co");
    assert.ok(url.pathname.startsWith("/rest/v1/rpc/maxx_service_"));
    assert.equal(new Headers(init?.headers).get("Authorization"),"Bearer server-key-not-public");
    assert.equal(new Headers(init?.headers).get("Content-Type"),"application/json");
    const name=url.pathname.split("/").pop()??"";
    const payload=JSON.parse(String(init?.body||"{}")) as Record<string,unknown>;
    calls.push({name,payload});
    return Response.json(handler(name,payload),{status});
  }) as typeof fetch;
  return {request,calls};
}
test("client data API remains OFF and never sends credentials by default",async()=>{
  const {request,calls}=adapter(()=>[row]);
  const service=createClientWorkspaceService(config,false,request);
  await assert.rejects(service.listForUser(alice),WorkspaceUnavailable);
  assert.deepEqual(calls,[]);
});
test("one private JSON RPC returns a valid, real member-scoped client with approval evidence",async()=>{
  const {request,calls}=adapter((name,payload)=>{
    assert.equal(name,"maxx_service_client_workspaces");
    return payload.p_user_id===alice?[row]:[];
  });
  const svc=createClientWorkspaceService(config,true,request);
  const result=await svc.listForUser(alice);
  assert.equal(result[0]?.slug,"bunna-restaurant");
  assert.equal(result[0]?.suggestedTasks[0],"Check Bunna lunch paid receipts");
  assert.equal(result[0]?.pendingApprovalCount,2);
  assert.equal(result[0]?.urgentApprovalCount,1);
  assert.equal(calls.length,1);
  assert.equal((await svc.listForUser(bob)).length,0);
  await assert.rejects(svc.authorize(bob,project,true),WorkspaceForbidden);
  await assert.rejects(svc.authorize(alice,foreign),WorkspaceForbidden);
});
test("reject malformed RPC data and duplicate project records",async()=>{
  const mk=(rows:unknown[])=>createClientWorkspaceService(config,true,adapter(()=>rows).request);
  await assert.rejects(mk([{...row,organizationId:foreign,role:"superuser"}]).listForUser(alice),WorkspaceUnavailable);
  await assert.rejects(mk([row,row]).listForUser(alice),WorkspaceUnavailable);
  await assert.rejects(mk([{...row,pendingApprovalCount:-1}]).listForUser(alice),WorkspaceUnavailable);
  await assert.rejects(mk([{...row,suggestedTasks:["ok",9]}]).listForUser(alice),WorkspaceUnavailable);
});
test("source errors do not fall back to guessed or simulated authorized workspaces",async()=>{
  const svc=createClientWorkspaceService(config,true,adapter(()=>({code:"PGRST106"}),406).request);
  await assert.rejects(svc.listForUser(alice),WorkspaceUnavailable);
  await assert.rejects(svc.listForUser("local-stacy"),WorkspaceForbidden);
});
test("client creation sends only verified actor identity to a restricted RPC",async()=>{
  const {request,calls}=adapter((name,payload)=>{
    if(name==="maxx_service_create_client_workspace"){
      assert.equal(payload.p_actor,alice);
      assert.equal(payload.p_organization_id,org);
      return {id:project,status:"active",slug:"new-client"};
    }
    return [row];
  });
  const svc=createClientWorkspaceService(config,true,request);
  const created=await svc.createClient(alice,org,"New Client","new-client");
  assert.equal(created.slug,"new-client");
  assert.equal(calls.length,1);
  await assert.rejects(svc.createClient(alice,org,"x","invalid slug"),WorkspaceInvalid);
});
test("archive and restore demand owner permissions and enforce sequential RPC steps",async()=>{
  const owner={...row,role:"owner"};
  let phase=0;
  const {request,calls}=adapter((name,payload)=>{
    if(name==="maxx_service_client_workspaces") {
      return [{...owner,status:phase===4?"archived":"active"}];
    }
    if(name==="maxx_service_archive_client_step"){
      const state=["requested","confirmed_one","confirmed_two","archived","restored"][phase]??"requested";
      phase++;
      return {requestId,projectId:project,state,recoveryUntil:phase>=4?"2026-12-14T00:00:00Z":null};
    }
    return [];
  });
  const svc=createClientWorkspaceService(config,true,request);
  const start=await svc.archiveStep(alice,project,"start");
  assert.equal((start as {state:string}).state,"requested");
  await svc.archiveStep(alice,project,"acknowledge",requestId);
  await svc.archiveStep(alice,project,"type_name",requestId,"BUNNA RESTAURANT");
  await svc.archiveStep(alice,project,"archive",requestId);
  await svc.archiveStep(alice,project,"restore",requestId);
  assert.equal(calls.filter(x=>x.name==="maxx_service_archive_client_step").length,5);
  await assert.rejects(svc.archiveStep(alice,project,"archive","not-a-uuid"),WorkspaceInvalid);
});
test("viewer cannot advance an archive, even when the read RPC returns a client",async()=>{
  const svc=createClientWorkspaceService(config,true,adapter(()=>[{...row,role:"viewer"}]).request);
  await assert.rejects(svc.archiveStep(alice,project,"start"),WorkspaceForbidden);
});
test("anonymous and machine client routes cannot read the private client registry",async()=>{
  const app=buildApp({authenticate:async()=>null});
  assert.equal((await app.inject({method:"GET",url:"/v1/client-workspaces"})).statusCode,401);
  await app.close();
  const machine=buildApp({
    config:loadConfig({NODE_ENV:"test",MAXX_CLIENT_WORKSPACES_ENABLED:"true"}),
    authenticate:async()=>({id:alice,email:"machine@example.com",principal:"machine"}),
  });
  assert.equal((await machine.inject({method:"GET",url:"/v1/client-workspaces"})).statusCode,403);
  assert.equal((await machine.inject({method:"POST",url:"/v1/client-workspaces",
    payload:{organizationId:org,name:"Acme",slug:"acme"}})).statusCode,403);
  await machine.close();
});
test("unconfigured gateway rejects client reads and chat without sending the request to Hermes",async()=>{
  const app=buildApp({
    config:loadConfig({NODE_ENV:"test",MAXX_CLIENT_WORKSPACES_ENABLED:"false"}),
    authenticate:async()=>({id:alice,email:"user@example.com",principal:"human"}),
  });
  assert.equal((await app.inject({method:"GET",url:"/v1/client-workspaces"})).statusCode,503);
  assert.equal((await app.inject({method:"POST",url:"/v1/chat",
    payload:{workspaceId:project,message:"Run the campaign"}})).statusCode,503);
  await app.close();
});
