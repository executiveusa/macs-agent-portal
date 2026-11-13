import assert from "node:assert/strict";
import test from "node:test";
import { createClientWorkspaceService, WorkspaceForbidden, WorkspaceUnavailable } from "../src/client-workspaces.js";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";

const alice = "11111111-1111-4111-8111-111111111111";
const bob = "22222222-2222-4222-8222-222222222222";
const org = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const foreignOrg = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const project = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const forbiddenProject = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

function providerMock() {
  const paths: string[] = [];
  const request = (async (input: URL | RequestInfo, init?: RequestInit) => {
    const url = new URL(String(input));
    paths.push(url.pathname);
    assert.equal(init?.method, "GET");
    assert.equal(new Headers(init?.headers).get("Accept-Profile"), "maxx");
    assert.equal(url.origin, "https://example.supabase.co");
    const userId = url.searchParams.get("user_id");
    if (url.pathname.endsWith("/memberships"))
      return Response.json(userId === "eq." + alice ? [{organization_id:org}] : []);
    if (url.pathname.endsWith("/project_memberships")) return Response.json(userId === "eq." + alice ? [
      {organization_id:org,project_id:project,role:"operator"},
      {organization_id:foreignOrg,project_id:forbiddenProject,role:"admin"},
    ] : []);
    if (url.pathname.endsWith("/projects")) return Response.json([
      {id:project,organization_id:org,slug:"bunna-restaurant",name:"BUNNA RESTAURANT",status:"active"},
      {id:forbiddenProject,organization_id:foreignOrg,slug:"hidden-client",name:"FOREIGN CLIENT",status:"active"},
    ]);
    return Response.json([], {status:404});
  }) as typeof fetch;
  return {request,paths};
}
const config = {SUPABASE_URL:"https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY:"test-only"};
test("default-off project access never calls Supabase or leaks catalog as authorization", async () => {
  const {request,paths} = providerMock();
  const svc = createClientWorkspaceService(config,false,request);
  await assert.rejects(svc.listForUser(alice), WorkspaceUnavailable);
  assert.deepEqual(paths, []);
});
test("requires org AND project membership and preserves unknown approvals", async () => {
  const {request,paths} = providerMock();
  const svc = createClientWorkspaceService(config,true,request);
  const workspaces = await svc.listForUser(alice);
  assert.equal(workspaces.length,1);
  assert.equal(workspaces[0]?.slug,"bunna-restaurant");
  assert.equal(workspaces[0]?.pendingApprovalCount,null);
  assert.ok(paths.some(p=>p.endsWith("/project_memberships")));
  await assert.rejects(svc.authorize(alice,forbiddenProject,true),WorkspaceForbidden);
  await assert.rejects(svc.authorize(bob,project,true),WorkspaceForbidden);
  await assert.rejects(svc.authorize(alice,"not-a-uuid"),WorkspaceForbidden);
  await assert.rejects(svc.listForUser("local-stacy"),WorkspaceForbidden);
});
test("upstream errors fail closed with no fallback clients", async () => {
  const failedFetch = (async () => Response.json({error:"forbidden"}, {status:403})) as typeof fetch;
  const svc = createClientWorkspaceService(config,true,failedFetch);
  await assert.rejects(svc.listForUser(alice),WorkspaceUnavailable);
});
test("workspace routes deny machine credentials and don't show demo project records", async () => {
  const app = buildApp({
    config:loadConfig({NODE_ENV:"test",MAXX_CLIENT_WORKSPACES_ENABLED:"false"}),
    authenticate:async()=>({id:alice,email:"operator@example.com",principal:"human"}),
  });
  const list = await app.inject({method:"GET",url:"/v1/client-workspaces"});
  assert.equal(list.statusCode,503);
  assert.equal(list.json().status,"UNAVAILABLE");
  const chat = await app.inject({method:"POST",url:"/v1/chat",
    payload:{message:"Find client records",workspaceId:project}});
  assert.equal(chat.statusCode,503);
  await app.close();
});
test("machine principal cannot use client endpoints even when feature flag exists", async () => {
  const app = buildApp({
    config:loadConfig({NODE_ENV:"test",MAXX_CLIENT_WORKSPACES_ENABLED:"true"}),
    authenticate:async()=>({id:alice,email:"machine@example.com",principal:"machine"}),
  });
  const list = await app.inject({method:"GET",url:"/v1/client-workspaces"});
  assert.equal(list.statusCode,403);
  const chat = await app.inject({method:"POST",url:"/v1/chat",
    payload:{message:"Access THP client data",workspaceId:project}});
  assert.equal(chat.statusCode,403);
  await app.close();
});
test("anonymous users cannot access the client registry", async () => {
  const app = buildApp({authenticate:async()=>null});
  const res = await app.inject({method:"GET",url:"/v1/client-workspaces"});
  assert.equal(res.statusCode,401);
  await app.close();
});

test("only a matching project proposal can increment attention counts", async () => {
  const proposal = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
  const unrelated = "ffffffff-ffff-4fff-8fff-ffffffffffff";
  const request = (async (input: URL | RequestInfo) => {
    const url = new URL(String(input));
    if(url.pathname.endsWith("/memberships")) return Response.json([{organization_id:org}]);
    if(url.pathname.endsWith("/project_memberships")) return Response.json([
      {organization_id:org,project_id:project,role:"operator"},
    ]);
    if(url.pathname.endsWith("/projects")) return Response.json([
      {id:project,organization_id:org,slug:"bunna-restaurant",name:"BUNNA RESTAURANT",status:"active"},
    ]);
    if(url.pathname.endsWith("/approvals")) return Response.json([
      {action_proposal_id:proposal,organization_id:org,expires_at:new Date(Date.now()+3_600_000).toISOString()},
      {action_proposal_id:unrelated,organization_id:foreignOrg,expires_at:new Date(Date.now()+3_600_000).toISOString()},
    ]);
    if(url.pathname.endsWith("/action_proposals")) return Response.json([
      {id:proposal,organization_id:org,project_id:project},
      {id:unrelated,organization_id:foreignOrg,project_id:forbiddenProject},
    ]);
    return Response.json([], {status:404});
  }) as typeof fetch;
  const svc = createClientWorkspaceService(config,true,request);
  const onlyClient = await svc.listForUser(alice);
  assert.equal(onlyClient.length,1);
  assert.equal(onlyClient[0]?.pendingApprovalCount,1);
  assert.equal(onlyClient[0]?.urgentApprovalCount,1);
});
test("verified zero pending is distinct from an unavailable approvals source", async () => {
  const {request:base} = providerMock();
  const request = (async(input: URL | RequestInfo,init?: RequestInit) => {
    const url = new URL(String(input));
    if(url.pathname.endsWith("/approvals")) return Response.json([]);
    return base(input,init);
  }) as typeof fetch;
  const svc = createClientWorkspaceService(config,true,request);
  const list = await svc.listForUser(alice);
  assert.equal(list[0]?.pendingApprovalCount,0);
  assert.equal(list[0]?.urgentApprovalCount,0);
});

test("stored prompt templates are project scoped and cannot leak other clients", async () => {
  const request = (async(input: URL | RequestInfo, init?: RequestInit) => {
    const u = new URL(String(input));
    if (u.pathname.endsWith("/memberships")) return Response.json([{ organization_id: org }]);
    if (u.pathname.endsWith("/project_memberships")) return Response.json([
      { organization_id: org, project_id: project, role: "operator" },
    ]);
    if (u.pathname.endsWith("/projects")) return Response.json([
      { id: project, organization_id: org, slug: "bunna-restaurant", name: "BUNNA RESTAURANT", status: "active" },
    ]);
    if (u.pathname.endsWith("/project_prompt_templates")) return Response.json([
      { project_id: project, organization_id: org, title: "Review Bunna group lunch receipts", position: 1 },
      { project_id: forbiddenProject, organization_id: foreignOrg, title: "SECRET FOREIGN COMPANY", position: 2 },
    ]);
    if (u.pathname.endsWith("/approvals")) return Response.json([]);
    return Response.json([], { status: 404 });
  }) as typeof fetch;
  const svc = createClientWorkspaceService(config, true, request);
  const workspaces = await svc.listForUser(alice);
  assert.equal(workspaces[0]?.promptsSource, "verified");
  assert.deepEqual(workspaces[0]?.suggestedTasks, ["Review Bunna group lunch receipts"]);
  assert.equal(JSON.stringify(workspaces).includes("SECRET FOREIGN"), false);
});
