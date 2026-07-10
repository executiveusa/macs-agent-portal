import { useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  ArrowUp,
  Bot,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  Globe2,
  Loader2,
  Mic,
  MicOff,
  Pause,
  Play,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Square,
  Users,
  X,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { controlTowerApi } from "@/services/controlTowerApi";
import { formatTokenCount, summarizeDependencyHealth } from "@/lib/controlTower";
import type { Approval, ControlTowerBootstrap, Mission, Skill } from "@/types/controlTower";

type ChatMessage = {
  id: string;
  role: "operator" | "assistant";
  content: string;
  metadata?: string;
};

const emptyBootstrap: ControlTowerBootstrap = {
  agent: { name: "MAXX", status: "offline", currentIntent: "Control plane unavailable" },
  dependencies: {},
  missions: [],
  approvals: [],
  skills: [],
  usage: { promptTokens: 0, completionTokens: 0, estimatedCostUsd: 0, requests: 0 },
  browser: { state: "unavailable", currentUrl: null, recentActions: [] },
  featureFlags: {
    MAXX_HERMES_ENABLED: false,
    MAXX_VOICE_ENABLED: false,
    MAXX_BROWSER_ENABLED: false,
    MAXX_BROWSER_MUTATIONS_ENABLED: false,
    MAXX_MEMORY_ENABLED: false,
    MAXX_SCHEDULER_ENABLED: false,
    MAXX_PRODUCTION_MUTATIONS_ENABLED: false,
  },
  emergencyDisabled: false,
};

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[24px] border border-black/[0.065] bg-white/80 shadow-[0_18px_55px_rgba(0,0,0,0.055)] ${className}`}>
      {children}
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-black/35">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-black/48">{description}</p>
      </div>
      {action}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const color =
    status === "ready" || status === "online" || status === "completed"
      ? "bg-emerald-50 text-emerald-700"
      : status === "degraded" || status === "working" || status === "pending"
        ? "bg-amber-50 text-amber-700"
        : "bg-red-50 text-red-700";
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${color}`}>{status}</span>;
}

function CommandView({
  data,
  onRefresh,
}: {
  data: ControlTowerBootstrap;
  onRefresh: () => void;
}) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [model, setModel] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "I’m MAXX. Give me an outcome and I’ll turn it into an observable mission, select the smallest skill chain, and stop for approval before anything consequential leaves the system.",
      metadata: data.agent.status === "online" ? "Control plane ready" : "Control plane is in degraded mode",
    },
  ]);

  const chat = useMutation({
    mutationFn: () => controlTowerApi.chat(input, model || undefined, data.missions[0]?.runId),
    onMutate: () => {
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "operator", content: input }]);
    },
    onSuccess: (response) => {
      setMessages((current) => [
        ...current,
        {
          id: response.id,
          role: "assistant",
          content: response.text,
          metadata: `${response.model} · ${response.routingReason} · ${response.usage.latencyMs}ms`,
        },
      ]);
      setInput("");
      queryClient.invalidateQueries({ queryKey: ["control-tower"] });
    },
  });

  const startVoice = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", content: "Voice recognition is not available in this browser." },
      ]);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      setInput(event.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  return (
    <>
      <SectionHeading
        eyebrow="Command"
        title="Talk to MAXX"
        description="One conversation for company operations, CRM work, browser missions, research, content, and software execution."
        action={
          <button onClick={onRefresh} className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-medium">
            <RefreshCw size={14} />
            Refresh state
          </button>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_330px]">
        <Panel className="flex min-h-[690px] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4 sm:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white">
                <Bot size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold">MAXX</p>
                <p className="text-xs text-black/38">{data.agent.currentIntent}</p>
              </div>
            </div>
            <StatusPill status={data.agent.status} />
          </div>
          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-7 sm:px-8">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "operator" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-[22px] px-4 py-3.5 text-sm leading-6 ${
                    message.role === "operator"
                      ? "rounded-br-md bg-black text-white"
                      : "rounded-bl-md border border-black/[0.06] bg-[#f4f4f2] text-black/78"
                  }`}
                >
                  <p>{message.content}</p>
                  {message.metadata && <p className={`mt-2 text-[10px] ${message.role === "operator" ? "text-white/40" : "text-black/32"}`}>{message.metadata}</p>}
                </div>
              </div>
            ))}
            {chat.isPending && (
              <div className="flex items-center gap-2 text-xs text-black/40">
                <Loader2 size={14} className="animate-spin" />
                MAXX is routing the mission
              </div>
            )}
            {chat.isError && (
              <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                {chat.error instanceof Error ? chat.error.message : "MAXX could not reach the control plane."}
              </div>
            )}
          </div>
          <div className="border-t border-black/[0.06] p-4 sm:p-5">
            <div className="rounded-[22px] border border-black/10 bg-white p-2 shadow-[0_12px_35px_rgba(0,0,0,0.07)]">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && input.trim() && !chat.isPending) {
                    event.preventDefault();
                    chat.mutate();
                  }
                }}
                placeholder="Ask MAXX to research, plan, build, follow up, or operate the browser..."
                rows={3}
                className="w-full resize-none bg-transparent px-3 py-2 text-sm leading-6 outline-none placeholder:text-black/28"
              />
              <div className="flex items-center justify-between gap-3 px-1 pb-1">
                <select
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  className="max-w-[190px] rounded-full border border-black/10 bg-[#f7f7f5] px-3 py-2 text-xs text-black/55 outline-none"
                >
                  <option value="">Smart auto routing</option>
                  <option value="openai/gpt-4.1">GPT-4.1</option>
                  <option value="anthropic/claude-sonnet-4">Claude Sonnet 4</option>
                  <option value="google/gemini-2.5-pro">Gemini 2.5 Pro</option>
                </select>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (isListening) {
                        recognitionRef.current?.stop();
                        setIsListening(false);
                      } else {
                        startVoice();
                      }
                    }}
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition ${isListening ? "bg-red-100 text-red-700" : "bg-black/[0.055] text-black/55 hover:bg-black/10"}`}
                    aria-label={isListening ? "Stop listening" : "Start voice input"}
                  >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                  <button
                    onClick={() => input.trim() && chat.mutate()}
                    disabled={!input.trim() || chat.isPending}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition hover:scale-[1.03] disabled:opacity-25"
                    aria-label="Send message"
                  >
                    <ArrowUp size={17} />
                  </button>
                </div>
              </div>
            </div>
            {isListening && <p className="mt-2 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-red-600">Listening · transcript will appear before execution</p>}
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel className="p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-black/35">Now</p>
            <p className="mt-3 text-lg font-semibold tracking-[-0.025em]">{data.agent.currentIntent}</p>
            <div className="mt-5 space-y-3">
              <MiniMetric label="Active missions" value={String(data.missions.filter((mission) => mission.status === "working").length)} />
              <MiniMetric label="Waiting approvals" value={String(data.approvals.filter((approval) => approval.status === "pending").length)} />
              <MiniMetric label="Trusted skills" value={String(data.skills.length)} />
            </div>
          </Panel>
          <Panel className="p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-black/35">Model telemetry</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
              {formatTokenCount(data.usage.promptTokens + data.usage.completionTokens)}
            </p>
            <p className="mt-1 text-xs text-black/38">tokens across {data.usage.requests} requests</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
              <div className="h-full w-[38%] rounded-full bg-[#6d9fff]" />
            </div>
          </Panel>
          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-black/35">Approval policy</p>
              <ShieldAlert size={16} className="text-amber-600" />
            </div>
            <p className="mt-3 text-sm font-medium">Risk-based control is active.</p>
            <p className="mt-2 text-xs leading-5 text-black/42">
              MAXX may inspect and draft. Sending, publishing, paying, uploading, deleting, and permissions stop for Stacy.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: (event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void;
  onerror: () => void;
  onend: () => void;
};

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-black/[0.055] pb-3 last:border-0 last:pb-0">
      <span className="text-xs text-black/42">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function LiveView({ data }: { data: ControlTowerBootstrap }) {
  const dependencyHealth = summarizeDependencyHealth(data.dependencies);
  const browserAction = useMutation({
    mutationFn: (input: { action: string; target?: string }) => controlTowerApi.startBrowserAction(input.action, input.target),
  });
  const [target, setTarget] = useState("https://");

  return (
    <>
      <SectionHeading
        eyebrow="Live observation"
        title="Watch MAXX work"
        description="Runtime health, current intent, browser state, and ICM activity without pretending unavailable providers are online."
      />
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-black/[0.06] p-5">
            <div>
              <p className="text-sm font-semibold">Browser session</p>
              <p className="mt-1 text-xs text-black/38">{data.browser.currentUrl ?? "No active browser target"}</p>
            </div>
            <StatusPill status={data.browser.state} />
          </div>
          <div className="flex min-h-[410px] items-center justify-center bg-[#111214] p-8 text-center text-white">
            {data.browser.state === "unavailable" ? (
              <div className="max-w-sm">
                <Globe2 className="mx-auto h-10 w-10 text-white/35" />
                <p className="mt-4 text-lg font-medium">Remote browser not configured</p>
                <p className="mt-2 text-sm leading-6 text-white/42">
                  Add MAXX_BROWSER_WS_ENDPOINT to the VPS vault. The dashboard will never fabricate a screenshot or session.
                </p>
              </div>
            ) : (
              <div className="max-w-sm">
                <Activity className="mx-auto h-10 w-10 text-[#8cbcff]" />
                <p className="mt-4 text-lg font-medium">Browser bridge ready</p>
                <p className="mt-2 text-sm text-white/42">Start a read-only navigation mission below.</p>
              </div>
            )}
          </div>
          <div className="border-t border-black/[0.06] bg-white p-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={target}
                onChange={(event) => setTarget(event.target.value)}
                className="flex-1 rounded-xl border border-black/10 bg-[#f7f7f5] px-3 py-2.5 text-sm outline-none"
              />
              <button
                onClick={() => browserAction.mutate({ action: "navigate", target })}
                className="flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-xs font-semibold text-white"
              >
                <Play size={14} />
                Navigate
              </button>
              <button className="flex items-center justify-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-xs font-semibold">
                <Square size={13} />
                Stop
              </button>
            </div>
            {browserAction.isError && <p className="mt-2 text-xs text-red-600">{browserAction.error.message}</p>}
            {browserAction.isSuccess && <p className="mt-2 text-xs text-emerald-700">Browser action accepted by policy.</p>}
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Execution plane</p>
                <p className="mt-1 text-xs text-black/38">{dependencyHealth.ready} of {dependencyHealth.total} dependencies ready</p>
              </div>
              <StatusPill status={dependencyHealth.status} />
            </div>
            <div className="mt-5 space-y-3">
              {Object.entries(data.dependencies).map(([name, dependency]) => (
                <div key={name} className="rounded-2xl border border-black/[0.06] bg-[#f7f7f5] p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold capitalize">{name}</span>
                    <StatusPill status={dependency.status} />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-black/42">{dependency.detail}</p>
                </div>
              ))}
            </div>
          </Panel>
          <Panel className="p-5">
            <p className="text-sm font-semibold">ICM stage activity</p>
            <div className="mt-4 space-y-3">
              {["Intake", "Research", "Plan", "Execute", "Verify", "Approval", "Deliver", "Learn"].map((stage, index) => (
                <div key={stage} className="flex items-center gap-3">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold ${index === 0 && data.missions.length ? "bg-black text-white" : "bg-black/[0.055] text-black/35"}`}>
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <span className="text-xs text-black/55">{stage}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

function MissionsView({ missions }: { missions: Mission[] }) {
  const queryClient = useQueryClient();
  const [objective, setObjective] = useState("");
  const createMission = useMutation({
    mutationFn: () => controlTowerApi.createMission(objective),
    onSuccess: () => {
      setObjective("");
      queryClient.invalidateQueries({ queryKey: ["control-tower"] });
    },
  });
  const columns: Array<{ id: Mission["status"]; title: string }> = [
    { id: "needs_operator", title: "Needs Stacy" },
    { id: "working", title: "MAXX Working" },
    { id: "ready", title: "Ready" },
    { id: "completed", title: "Completed" },
  ];

  return (
    <>
      <SectionHeading
        eyebrow="Missions"
        title="Company work, made visible"
        description="Each card maps to an isolated ICM workspace with a stage history, artifacts, events, and approval gates."
      />
      <Panel className="mb-5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={objective}
            onChange={(event) => setObjective(event.target.value)}
            placeholder="Give MAXX one outcome to own..."
            className="flex-1 rounded-2xl border border-black/10 bg-[#f7f7f5] px-4 py-3 text-sm outline-none focus:border-black/30"
          />
          <button
            onClick={() => objective.trim() && createMission.mutate()}
            disabled={!objective.trim() || createMission.isPending}
            className="flex items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white disabled:opacity-30"
          >
            {createMission.isPending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Create mission
          </button>
        </div>
        {createMission.isError && <p className="mt-3 text-xs text-red-600">{createMission.error.message}</p>}
      </Panel>
      <div className="grid gap-4 xl:grid-cols-4">
        {columns.map((column) => {
          const items = missions.filter((mission) => mission.status === column.id);
          return (
            <div key={column.id} className="min-h-[430px] rounded-[22px] border border-black/[0.06] bg-black/[0.025] p-3">
              <div className="flex items-center justify-between px-2 py-2">
                <p className="text-xs font-semibold">{column.title}</p>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-black/40">{items.length}</span>
              </div>
              <div className="mt-2 space-y-3">
                {items.map((mission) => (
                  <article key={mission.id} className="rounded-2xl border border-black/[0.065] bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold leading-5">{mission.objective}</p>
                      <ChevronRight size={15} className="mt-0.5 shrink-0 text-black/25" />
                    </div>
                    <p className="mt-3 font-mono text-[10px] text-black/32">{mission.runId}</p>
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-black/38">
                      <Clock3 size={12} />
                      {new Date(mission.updatedAt).toLocaleString()}
                    </div>
                  </article>
                ))}
                {!items.length && (
                  <div className="rounded-2xl border border-dashed border-black/10 p-5 text-center text-xs leading-5 text-black/28">
                    No missions in this stage.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function ApprovalsView({ approvals }: { approvals: Approval[] }) {
  const queryClient = useQueryClient();
  const decision = useMutation({
    mutationFn: ({ id, value }: { id: string; value: "approve" | "reject" }) =>
      controlTowerApi.decideApproval(id, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["control-tower"] }),
  });

  return (
    <>
      <SectionHeading
        eyebrow="Approvals"
        title="Nothing risky leaves silently"
        description="Consequential actions remain pending until Stacy approves or rejects the exact action and evidence."
      />
      <div className="space-y-4">
        {approvals.map((approval) => (
          <Panel key={approval.id} className="p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <StatusPill status={approval.status} />
                  <span className="font-mono text-[10px] text-black/30">{approval.action}</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold tracking-[-0.02em]">{approval.summary}</h3>
                <p className="mt-1 text-xs text-black/38">Run {approval.runId}</p>
              </div>
              {approval.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => decision.mutate({ id: approval.id, value: "reject" })}
                    className="flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-xs font-semibold"
                  >
                    <X size={14} />
                    Reject
                  </button>
                  <button
                    onClick={() => decision.mutate({ id: approval.id, value: "approve" })}
                    className="flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-xs font-semibold text-white"
                  >
                    <Check size={14} />
                    Approve
                  </button>
                </div>
              )}
            </div>
          </Panel>
        ))}
        {!approvals.length && (
          <Panel className="p-12 text-center">
            <Check className="mx-auto h-10 w-10 text-emerald-500" />
            <p className="mt-4 text-lg font-semibold">Approval queue is clear</p>
            <p className="mt-2 text-sm text-black/40">MAXX has no consequential actions waiting for Stacy.</p>
          </Panel>
        )}
      </div>
    </>
  );
}

function SkillsView({ skills, runId }: { skills: Skill[]; runId?: string }) {
  const runSkill = useMutation({ mutationFn: (id: string) => controlTowerApi.runSkill(id, runId) });
  return (
    <>
      <SectionHeading
        eyebrow="Skills"
        title="Trusted capabilities only"
        description="The local MAXX registry is enabled. External catalog entries remain disabled until they are audited and installed deliberately."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {skills.map((skill) => (
          <Panel key={skill.id} className="flex flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white">
                <Sparkles size={17} />
              </div>
              <StatusPill status={skill.health} />
            </div>
            <h3 className="mt-5 text-base font-semibold">{skill.id}</h3>
            <p className="mt-2 flex-1 text-xs leading-5 text-black/42">{skill.purpose}</p>
            <div className="mt-5 flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-wider text-black/30">
                {skill.approvalPolicy === "approval_required" ? "Approval required" : "Automatic"}
              </span>
              <button
                onClick={() => runSkill.mutate(skill.id)}
                disabled={skill.health === "disabled"}
                className="flex items-center gap-2 rounded-xl bg-black px-3 py-2 text-xs font-semibold text-white disabled:opacity-25"
              >
                <Play size={12} />
                Run
              </button>
            </div>
          </Panel>
        ))}
      </div>
      {runSkill.isSuccess && <p className="mt-4 text-sm text-emerald-700">Skill request accepted by the control plane.</p>}
      {runSkill.isError && <p className="mt-4 text-sm text-red-700">{runSkill.error.message}</p>}
    </>
  );
}

function UsageView({ data }: { data: ControlTowerBootstrap }) {
  const totalTokens = data.usage.promptTokens + data.usage.completionTokens;
  const cards = [
    { label: "Total tokens", value: formatTokenCount(totalTokens), icon: Activity },
    { label: "Requests", value: String(data.usage.requests), icon: Bot },
    { label: "Estimated cost", value: `$${data.usage.estimatedCostUsd.toFixed(4)}`, icon: CircleDollarSign },
    { label: "Skills available", value: String(data.skills.length), icon: Sparkles },
  ];
  return (
    <>
      <SectionHeading
        eyebrow="Usage"
        title="Model and cost telemetry"
        description="Every routed response records model choice, tokens, latency, and estimated cost. Zero means no provider-backed requests have completed yet."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Panel key={card.label} className="p-5">
              <Icon size={17} className="text-black/35" />
              <p className="mt-7 text-3xl font-semibold tracking-[-0.045em]">{card.value}</p>
              <p className="mt-1 text-xs text-black/38">{card.label}</p>
            </Panel>
          );
        })}
      </div>
      <Panel className="mt-5 p-6">
        <p className="text-sm font-semibold">Provider distribution</p>
        <div className="mt-8 flex min-h-52 items-center justify-center rounded-2xl bg-[#f7f7f5] text-center">
          <div>
            <Activity className="mx-auto text-black/20" />
            <p className="mt-3 text-sm font-medium">Awaiting live model usage</p>
            <p className="mt-1 text-xs text-black/35">The chart activates after OpenRouter completes the first request.</p>
          </div>
        </div>
      </Panel>
    </>
  );
}

function CrmView() {
  return (
    <>
      <SectionHeading
        eyebrow="CRM"
        title="Company memory"
        description="Contacts, companies, opportunities, and follow-up activities live in the protected Supabase control-tower schema."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Companies", icon: BriefcaseBusiness },
          { label: "Contacts", icon: Users },
          { label: "Opportunities", icon: CircleDollarSign },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Panel key={item.label} className="p-6">
              <Icon size={19} className="text-black/35" />
              <p className="mt-8 text-3xl font-semibold">0</p>
              <p className="mt-1 text-xs text-black/38">{item.label}</p>
            </Panel>
          );
        })}
      </div>
      <Panel className="mt-5 p-10 text-center">
        <BriefcaseBusiness className="mx-auto h-10 w-10 text-black/18" />
        <p className="mt-4 text-lg font-semibold">CRM schema ready for migration</p>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-black/40">
          Apply the Supabase migration and configure the service-role connection before MAXX creates or edits company records.
        </p>
      </Panel>
    </>
  );
}

function OwnerStrategyPanel() {
  const queryClient = useQueryClient();
  const strategyQuery = useQuery({ queryKey: ["owner-strategy"], queryFn: controlTowerApi.getStrategy });
  const [forbiddenInput, setForbiddenInput] = useState("");
  const setStrategy = useMutation({
    mutationFn: (input: Parameters<typeof controlTowerApi.setStrategy>[0]) => controlTowerApi.setStrategy(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-strategy"] }),
  });
  const strategy = strategyQuery.data;

  return (
    <Panel className="mt-5 p-6">
      <p className="text-sm font-semibold">Owner strategy</p>
      <p className="mt-1 text-xs leading-5 text-black/42">
        Operator-level preferences layered on top of MAXX's model routing and browser approval policy. Never bypasses approval gates.
      </p>
      {strategyQuery.isLoading && <p className="mt-4 text-xs text-black/40">Loading strategy...</p>}
      {strategy && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-medium text-black/55">Preferred provider</span>
            <select
              value={strategy.preferredProvider ?? ""}
              onChange={(event) =>
                setStrategy.mutate({ preferredProvider: (event.target.value || undefined) as "groq" | "openrouter" | undefined })
              }
              className="rounded-full border border-black/10 bg-[#f7f7f5] px-3 py-2 text-xs text-black/70 outline-none"
            >
              <option value="">No preference (auto-routed)</option>
              <option value="groq">Groq</option>
              <option value="openrouter">OpenRouter</option>
            </select>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-medium text-black/55">Risk tolerance</span>
            <select
              value={strategy.riskTolerance}
              onChange={(event) =>
                setStrategy.mutate({ riskTolerance: event.target.value as "conservative" | "standard" | "permissive" })
              }
              className="rounded-full border border-black/10 bg-[#f7f7f5] px-3 py-2 text-xs text-black/70 outline-none"
            >
              <option value="conservative">Conservative</option>
              <option value="standard">Standard</option>
              <option value="permissive">Permissive</option>
            </select>
          </div>
          <div>
            <span className="text-xs font-medium text-black/55">Forbidden actions</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {strategy.forbiddenActions.map((action) => (
                <span key={action} className="flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-[10px] font-medium text-red-700">
                  {action}
                  <button
                    onClick={() =>
                      setStrategy.mutate({ forbiddenActions: strategy.forbiddenActions.filter((item) => item !== action) })
                    }
                    aria-label={`Remove ${action}`}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
              {!strategy.forbiddenActions.length && <span className="text-xs text-black/32">None — every classified action follows default policy.</span>}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={forbiddenInput}
                onChange={(event) => setForbiddenInput(event.target.value)}
                placeholder="e.g. browser:purchase"
                className="flex-1 rounded-xl border border-black/10 bg-[#f7f7f5] px-3 py-2 text-xs text-black/70 outline-none placeholder:text-black/28"
              />
              <button
                onClick={() => {
                  if (!forbiddenInput.trim()) return;
                  setStrategy.mutate({ forbiddenActions: [...strategy.forbiddenActions, forbiddenInput.trim()] });
                  setForbiddenInput("");
                }}
                className="rounded-xl border border-black/10 px-4 py-2 text-xs font-semibold"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
      {strategyQuery.isError && <p className="mt-4 text-xs text-red-600">Strategy is unavailable. The control plane may be offline.</p>}
    </Panel>
  );
}

function SettingsView({ data }: { data: ControlTowerBootstrap }) {
  const flagLabels: Record<keyof ControlTowerBootstrap["featureFlags"], string> = {
    MAXX_HERMES_ENABLED: "Hermes agent runtime",
    MAXX_VOICE_ENABLED: "Server voice (STT/TTS)",
    MAXX_BROWSER_ENABLED: "Browser worker",
    MAXX_BROWSER_MUTATIONS_ENABLED: "Browser mutations",
    MAXX_MEMORY_ENABLED: "Memory indexer",
    MAXX_SCHEDULER_ENABLED: "Scheduler",
    MAXX_PRODUCTION_MUTATIONS_ENABLED: "Production mutations",
  };
  return (
    <>
      <SectionHeading
        eyebrow="Settings"
        title="Private system configuration"
        description="Runtime values belong in the VPS or Coolify vault. This page reports configuration state without revealing secret values."
      />
      {data.emergencyDisabled && (
        <Panel className="mb-5 border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-3">
            <ShieldAlert size={18} className="text-red-700" />
            <p className="text-sm font-semibold text-red-700">MAXX_EMERGENCY_DISABLE is active — all mutating routes are blocked.</p>
          </div>
        </Panel>
      )}
      <Panel className="overflow-hidden">
        {Object.entries(data.dependencies).map(([name, dependency], index) => (
          <div key={name} className={`flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between ${index ? "border-t border-black/[0.06]" : ""}`}>
            <div>
              <p className="text-sm font-semibold capitalize">{name}</p>
              <p className="mt-1 text-xs text-black/40">{dependency.detail}</p>
            </div>
            <StatusPill status={dependency.status} />
          </div>
        ))}
      </Panel>
      <Panel className="mt-5 overflow-hidden">
        <div className="p-5 pb-0">
          <p className="text-sm font-semibold">Feature flags</p>
          <p className="mt-1 text-xs text-black/40">Safe-rollout switches. All default to off until explicitly enabled in the control plane's environment.</p>
        </div>
        <div className="mt-4">
          {Object.entries(data.featureFlags).map(([key, enabled], index) => (
            <div key={key} className={`flex items-center justify-between px-5 py-3.5 ${index ? "border-t border-black/[0.06]" : ""}`}>
              <span className="text-xs font-medium text-black/60">{flagLabels[key as keyof ControlTowerBootstrap["featureFlags"]] ?? key}</span>
              <StatusPill status={enabled ? "ready" : "unavailable"} />
            </div>
          ))}
        </div>
      </Panel>
      <OwnerStrategyPanel />
      <Panel className="mt-5 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold">Production deployment remains gated</p>
            <p className="mt-2 text-xs leading-5 text-black/42">
              The service can be built and tested locally. Entering production secrets, changing DNS, or deploying to Coolify requires explicit approval and working VPS access.
            </p>
          </div>
        </div>
      </Panel>
    </>
  );
}

const Dashboard = () => {
  const location = useLocation();
  const query = useQuery({
    queryKey: ["control-tower"],
    queryFn: controlTowerApi.bootstrap,
    retry: false,
    refetchInterval: 10_000,
  });
  const data = query.data ?? emptyBootstrap;
  const section = location.pathname.split("/")[2] || "command";
  const content = useMemo(() => {
    if (section === "live") return <LiveView data={data} />;
    if (section === "missions") return <MissionsView missions={data.missions} />;
    if (section === "crm") return <CrmView />;
    if (section === "approvals") return <ApprovalsView approvals={data.approvals} />;
    if (section === "skills") return <SkillsView skills={data.skills} runId={data.missions[0]?.runId} />;
    if (section === "usage") return <UsageView data={data} />;
    if (section === "settings") return <SettingsView data={data} />;
    return <CommandView data={data} onRefresh={() => query.refetch()} />;
  }, [data, query, section]);

  return (
    <DashboardLayout status={data.agent.status} currentIntent={data.agent.currentIntent}>
      {query.isError && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">MAXX control plane is unreachable</p>
            <p className="mt-1 text-xs leading-5 opacity-80">
              {query.error instanceof Error ? query.error.message : "Start the private VPS service or check its configured origin."}
            </p>
          </div>
        </div>
      )}
      {content}
    </DashboardLayout>
  );
};

export default Dashboard;
