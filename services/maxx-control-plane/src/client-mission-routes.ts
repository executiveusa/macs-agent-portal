import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import type { MaxxConfig } from "./config.js";
import { ClientExecutorUnavailable, type createClientMissionController } from "./client-missions.js";
import { verifyInstinctEnvelope } from "./instinct-a2a.js";
import { WorkspaceForbidden,WorkspaceUnavailable,WorkspaceConflict,WorkspaceInvalid } from "./client-workspaces.js";

type Missions = ReturnType<typeof createClientMissionController>;
const project = z.object({ projectId:z.string().uuid() }).strict();
const mission = project.extend({ missionId:z.string().uuid() }).strict();
const propose = z.object({
  missionId:z.string().uuid(),
  objective:z.string().trim().min(3).max(2000),
}).strict();
const decision = z.object({decision:z.enum(["approved","rejected"])}).strict();
const signedEvent = z.object({
  actorId:z.string().uuid(),projectId:z.string().uuid(),
  missionId:z.string().uuid(),deliveryId:z.string().uuid(),
  externalRunId:z.string().trim().min(1).max(150),
  outcome:z.enum(["completed","failed"]),
  summary:z.string().trim().min(1).max(1000),
}).strict();

function human(request:FastifyRequest,reply:FastifyReply):string|null {
  if(request.operator?.principal!=="human"){
    reply.code(403).send({error:"Verified human operator required"});
    return null;
  }
  return request.operator.id;
}
function failed(reply:FastifyReply,error:unknown) {
  const code=error instanceof WorkspaceForbidden ? 403:
    error instanceof WorkspaceInvalid ? 400:
    error instanceof WorkspaceConflict ? 409:
    error instanceof WorkspaceUnavailable || error instanceof ClientExecutorUnavailable ? 503:502;
  return reply.code(code).header("cache-control","no-store").send({
    status:"UNAVAILABLE",
    error:code===403?"Client mission access denied":
      code===400?"Invalid client mission":
      code===409?"Client mission state changed":
      code===503?"Client mission executor is unavailable":
      "Client mission execution requires operator reconciliation",
  });
}

export function registerClientMissionRoutes(app:FastifyInstance,config:MaxxConfig,control:Missions) {
  app.get("/v1/client-workspaces/:projectId/missions",async(request,reply)=>{
    const actor=human(request,reply);if(!actor)return;
    const p=project.safeParse(request.params);
    if(!p.success)return reply.code(400).send({error:"Invalid workspace ID"});
    try{
      const missions=await control.list(actor,p.data.projectId);
      return reply.header("cache-control","private, no-store").send({
        status:"VERIFIED",projectId:p.data.projectId,missions,
        note:"Draft missions require distinct reviewer approval and an enabled no-tools executor.",
      });
    }catch(error){return failed(reply,error);}
  });
  app.post("/v1/client-workspaces/:projectId/missions",async(request,reply)=>{
    const actor=human(request,reply);if(!actor)return;
    const p=project.safeParse(request.params),body=propose.safeParse(request.body);
    if(!p.success||!body.success)return reply.code(400).send({error:"Invalid client mission proposal"});
    try {
      const result=await control.propose(actor,p.data.projectId,body.data.missionId,body.data.objective);
      return reply.code(202).header("cache-control","private, no-store").send({
        ...result,note:"A different authorized reviewer must approve this draft before execution.",
      });
    }catch(error){return failed(reply,error);}
  });
  app.post("/v1/client-workspaces/:projectId/missions/:missionId/decision",async(request,reply)=>{
    const actor=human(request,reply);if(!actor)return;
    const p=mission.safeParse(request.params),body=decision.safeParse(request.body);
    if(!p.success||!body.success)return reply.code(400).send({error:"Invalid client decision"});
    try {
      const result=await control.decide(actor,p.data.projectId,p.data.missionId,body.data.decision);
      return reply.header("cache-control","private, no-store").send(result);
    }catch(error){return failed(reply,error);}
  });
  app.get("/v1/client-workspaces/:projectId/missions/:missionId",async(request,reply)=>{
    const actor=human(request,reply);if(!actor)return;
    const p=mission.safeParse(request.params);
    if(!p.success)return reply.code(400).send({error:"Invalid client mission ID"});
    try {
      const result=await control.get(actor,p.data.projectId,p.data.missionId);
      return reply.header("cache-control","private, no-store").send(result);
    }catch(error){return failed(reply,error);}
  });
  app.post("/v1/client-workspaces/:projectId/missions/:missionId/start",async(request,reply)=>{
    const actor=human(request,reply);if(!actor)return;
    const p=mission.safeParse(request.params);
    if(!p.success)return reply.code(400).send({error:"Invalid client mission ID"});
    try {
      const result=await control.start(actor,p.data.projectId,p.data.missionId);
      return reply.code(202).header("cache-control","private, no-store").send(result);
    }catch(error){return failed(reply,error);}
  });
  app.post("/v1/client-workspaces/:projectId/missions/:missionId/poll",async(request,reply)=>{
    const actor=human(request,reply);if(!actor)return;
    const p=mission.safeParse(request.params);
    if(!p.success)return reply.code(400).send({error:"Invalid client mission ID"});
    try {
      const result=await control.poll(actor,p.data.projectId,p.data.missionId);
      return reply.header("cache-control","private, no-store").send(result);
    }catch(error){return failed(reply,error);}
  });
  // Machine events need BOTH the existing narrow MAXX event-ingest key
  // (preHandler/auth.ts) and an independently verified Instinct HMAC.
  // This callback only finishes an already-approved, acknowledged mission.
  app.post("/v1/client-execution/instinct/events",async(request,reply)=>{
    if(request.operator?.principal!=="machine")
      return reply.code(403).send({error:"Signed machine callback only"});
    const timestamp=request.headers["x-maxx-instinct-timestamp"];
    const deliveryId=request.headers["x-maxx-instinct-delivery-id"];
    const signature=request.headers["x-maxx-instinct-signature"];
    const str=(v:unknown)=>typeof v==="string"?v:undefined;
    if(!verifyInstinctEnvelope(config.MAXX_INSTINCT_INGRESS_KEY,
      str(timestamp),str(deliveryId),request.body,str(signature)))
      return reply.code(401).send({error:"Invalid or expired Instinct signature"});
    const parsed=signedEvent.safeParse(request.body);
    if(!parsed.success || parsed.data.deliveryId!==deliveryId)
      return reply.code(400).send({error:"Invalid signed Instinct receipt"});
    try {
      const result=await control.finishFromInstinct(parsed.data);
      return reply.header("cache-control","no-store").send(result);
    }catch(error){return failed(reply,error);}
  });
}
