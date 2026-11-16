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
  assert.equal(result[0]?.promptsSource,"verified");
  assert.equal(result[0]?.suggestedTasks[0],"Check Bunna lunch paid receipts");
  assert.equal(result[0]?.pendingApprovalCount,2);
  assert.equal(result[0]?.urgentApprovalCount,1);
  assert.equal(calls.length,1);
  assert.equal((await svc.listForUser(bob)).length,0);
  await assert.rejects(svc.authorize(bob,project,true),WorkspaceForbidden);
  await assert.rejects(svc.authorize(alice,foreign),WorkspaceForbidden);
});
test("accept reviewed operator templates without pretending they are verified historical tasks",async()=>{
  const record={...row,promptsSource:"operator_template" as const};
  const svc=createClientWorkspaceService(config,true,adapter(()=>[record]).request);
  const rows=await svc.listForUser(alice);
  assert.equal(rows[0]?.promptsSource,"operator_template");
  assert.deepEqual(rows[0]?.suggestedTasks,record.suggestedTasks);
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
      // Match the management SQL: successful restore returns status, not state.
      if(phase===4) { phase++; return {status:"restored",projectId:project}; }
      const state=["requested","confirmed_one","confirmed_two","archived"][phase]??"requested";
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
  const restored=await svc.archiveStep(alice,project,"restore",requestId);
  assert.deepEqual(restored,{status:"restored",projectId:project});
  assert.equal(calls.filter(x=>x.name==="maxx_service_archive_client_step").length,5);
  await assert.rejects(svc.archiveStep(alice,project,"archive","not-a-uuid"),WorkspaceInvalid);
});
test("restore rejects mismatched or unsuccessful RPC responses",async()=>{
  const archived={...row,role:"owner",status:"archived",archiveRequestId:requestId};
  for(const reply of [
    {status:"restored",projectId:foreign},
    {status:"failed",projectId:project},
    {state:"restored",projectId:project},
  ]){
    const svc=createClientWorkspaceService(config,true,adapter((name)=>
      name==="maxx_service_client_workspaces"?[archived]:reply
    ).request);
    await assert.rejects(svc.archiveStep(alice,project,"restore",requestId),WorkspaceUnavailable);
  }
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

test("authorized client chat rejects foreign legacy runId before model routing or event writes",async()=>{
  const {request,calls}=adapter(()=>[row]);
  const app=buildApp({
    config:loadConfig({NODE_ENV:"test",MAXX_CLIENT_WORKSPACES_ENABLED:"true"}),
    authenticate:async()=>({id:alice,email:"authorized@example.com",principal:"human"}),
    clientWorkspaces:createClientWorkspaceService(config,true,request),
  });
  try {
    const response=await app.inject({method:"POST",url:"/v1/chat",
      payload:{workspaceId:project,runId:"foreign-unscoped-run",message:"Append my answer"}});
    assert.equal(response.statusCode,403);
    assert.match(response.json().error,/Legacy run identifiers/);
    assert.equal(calls.length,1,"only membership lookup is permitted");
  } finally {await app.close();}
});

test("verified client history is loaded exclusively through scoped service RPC and can be reloaded",async()=>{
  const createdAt="2026-11-16T12:00:00.000Z";
  const {request,calls}=adapter((name,payload)=>{
    if(name==="maxx_service_client_workspaces") return payload.p_user_id===alice?[row]:[];
    if(name==="maxx_service_client_chat_history"){
      assert.equal(payload.p_actor,alice);
      assert.equal(payload.p_project_id,project);
      return [{id:requestId,role:"stacy",text:"Draft Bunna follow-up",createdAt}];
    }
    throw new Error("Unexpected RPC "+name);
  });
  const svc=createClientWorkspaceService(config,true,request);
  const history=await svc.listChatHistory(alice,project);
  assert.deepEqual(history,[{id:requestId,role:"stacy",text:"Draft Bunna follow-up",createdAt}]);
  assert.deepEqual(calls.map(x=>x.name),["maxx_service_client_workspaces","maxx_service_client_chat_history"]);
  await assert.rejects(svc.listChatHistory(bob,project),WorkspaceForbidden);
  assert.equal(calls.filter(x=>x.name==="maxx_service_client_chat_history").length,1);
});
test("record chat requires role, valid exchange, and two valid durable receipts",async()=>{
  const exchange="99999999-9999-4999-8999-999999999999";
  const {request,calls}=adapter((name,payload)=>{
    if(name==="maxx_service_client_workspaces") return [row];
    if(name==="maxx_service_record_client_chat_exchange"){
      assert.equal(payload.p_actor,alice);
      assert.equal(payload.p_project_id,project);
      assert.equal(payload.p_exchange_id,exchange);
      assert.equal(payload.p_request,"Draft a safe Bunna campaign");
      assert.equal(payload.p_response,"Draft only; no action performed");
      return [{id:requestId,role:"stacy",text:payload.p_request},
        {id:foreign,role:"maxx",text:payload.p_response}];
    }
    throw new Error("Unexpected RPC "+name);
  });
  const svc=createClientWorkspaceService(config,true,request);
  await svc.recordChatExchange(alice,project,exchange,"Draft a safe Bunna campaign","Draft only; no action performed");
  assert.equal(calls.filter(x=>x.name==="maxx_service_record_client_chat_exchange").length,1);
  await assert.rejects(svc.recordChatExchange(alice,project,"not-a-uuid","x","y"),WorkspaceInvalid);
});
test("malformed history never becomes successful verified content",async()=>{
  const svc=createClientWorkspaceService(config,true,adapter(name=>
    name==="maxx_service_client_workspaces"?[row]:
      [{id:requestId,role:"maxx",text:"claimed",createdAt:"not-a-date"}]
  ).request);
  await assert.rejects(svc.listChatHistory(alice,project),WorkspaceUnavailable);
});
test("client history route refuses machine and unavailable identity, without an unscoped fallback",async()=>{
  const {request}=adapter(name=>name==="maxx_service_client_workspaces"?[row]:[]);
  const svc=createClientWorkspaceService(config,true,request);
  const app=buildApp({config:loadConfig({NODE_ENV:"test",MAXX_CLIENT_WORKSPACES_ENABLED:"true"}),
    authenticate:async()=>({id:alice,email:"operator@example.com",principal:"human"}),
    clientWorkspaces:svc});
  try {
    const res=await app.inject({method:"GET",url:`/v1/client-workspaces/${project}/chat-history`});
    assert.equal(res.statusCode,200);
    assert.equal(res.json().projectId,project);
    assert.deepEqual(res.json().messages,[]);
  } finally {await app.close();}
  const machine=buildApp({config:loadConfig({NODE_ENV:"test",MAXX_CLIENT_WORKSPACES_ENABLED:"true"}),
    authenticate:async()=>({id:alice,email:"machine@example.com",principal:"machine"}),
    clientWorkspaces:svc});
  try {
    const res=await machine.inject({method:"GET",url:`/v1/client-workspaces/${project}/chat-history`});
    assert.equal(res.statusCode,403);
  } finally {await machine.close();}
});

test("pending approvals are read only and scoped to the verified project",async()=>{
  const at="2026-11-16T12:00:00.000Z";
  const {request,calls}=adapter((name,payload)=>{
    if(name==="maxx_service_client_workspaces") return payload.p_user_id===alice?[row]:[];
    if(name==="maxx_service_client_pending_approvals"){
      assert.equal(payload.p_actor,alice);
      assert.equal(payload.p_project_id,project);
      return [{id:requestId,actionKey:"review-draft",actionClass:"draft",riskClass:"low",
        requestedAt:at,expiresAt:"2026-11-17T12:00:00.000Z",status:"pending"}];
    }
    throw new Error("Unexpected RPC");
  });
  const svc=createClientWorkspaceService(config,true,request);
  const rows=await svc.listPendingApprovals(alice,project);
  assert.equal(rows.length,1);
  assert.equal(rows[0].actionKey,"review-draft");
  await assert.rejects(svc.listPendingApprovals(bob,project),WorkspaceForbidden);
  assert.equal(calls.filter(x=>x.name==="maxx_service_client_pending_approvals").length,1);
});
test("machine principals cannot inspect private project approval route",async()=>{
  const {request}=adapter(()=>[row]);
  const svc=createClientWorkspaceService(config,true,request);
  const app=buildApp({config:loadConfig({NODE_ENV:"test",MAXX_CLIENT_WORKSPACES_ENABLED:"true"}),
    authenticate:async()=>({id:alice,email:"machine@example.com",principal:"machine"}),
    clientWorkspaces:svc});
  try {
    const resp=await app.inject({method:"GET",url:`/v1/client-workspaces/${project}/pending-approvals`});
    assert.equal(resp.statusCode,403);
  } finally {await app.close();}
});

test("non-admin client member cannot use legacy organization-wide MAXX APIs",async()=>{
  const {request}=adapter(name=>name==="maxx_service_client_workspaces"?[row]:[]);
  const svc=createClientWorkspaceService(config,true,request);
  const app=buildApp({config:loadConfig({NODE_ENV:"test",MAXX_CLIENT_WORKSPACES_ENABLED:"true"}),
    authenticate:async()=>({id:alice,email:"member@example.com",principal:"human"}),
    clientWorkspaces:svc});
  try {
    const denied=[
      {method:"GET" as const,url:"/v1/control-tower/bootstrap"},
      {method:"POST" as const,url:"/v1/missions",payload:{objective:"Legacy unscoped action"}},
      {method:"POST" as const,url:"/v1/chat",payload:{message:"Unscoped data request"}},
    ];
    for(const input of denied) {
      const r=await app.inject(input);
      assert.equal(r.statusCode,403,input.url);
    }
    const ok=await app.inject({method:"GET",url:"/v1/client-workspaces"});
    assert.equal(ok.statusCode,200);
  } finally {await app.close();}
});
test("verified owner can still access legacy dashboard during reviewed migration",async()=>{
  const {request}=adapter(()=>[{...row,role:"owner"}]);
  const app=buildApp({config:loadConfig({NODE_ENV:"test",MAXX_CLIENT_WORKSPACES_ENABLED:"true"}),
    authenticate:async()=>({id:alice,email:"owner@example.com",principal:"human"}),
    clientWorkspaces:createClientWorkspaceService(config,true,request)});
  try {
    assert.equal((await app.inject({method:"GET",url:"/v1/control-tower/bootstrap"})).statusCode,200);
  } finally {await app.close();}
});
