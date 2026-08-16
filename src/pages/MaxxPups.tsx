import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bot, Check, Clock3, Loader2, MessageCircle, Pause, Play, Plus, Send, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { pupsApi, type Pup, type PupTemplate } from "@/services/pupsApi";

const scheduleOptions = [
  { label: "Only when I ask", value: null },
  { label: "Every 15 minutes", value: 15 },
  { label: "Every hour", value: 60 },
  { label: "Every day", value: 1440 },
];

function statusText(pup: Pup) {
  if (pup.status === "paused") return "Paused";
  if (pup.status === "needs_attention") return "Needs you";
  if (pup.routineEveryMinutes) return "Always on";
  return "Ready";
}

function TemplateCard({ template, onCreate, pending }: { template: PupTemplate; onCreate: () => void; pending: boolean }) {
  return (
    <button
      onClick={onCreate}
      disabled={pending}
      className="group rounded-[24px] border border-black/[0.08] bg-white p-5 text-left shadow-[0_12px_36px_rgba(34,31,27,0.05)] transition hover:-translate-y-0.5 hover:border-black/15 disabled:opacity-50"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf0e9] text-[#34463a]">
          <Bot size={19} />
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-black/45 transition group-hover:bg-black group-hover:text-white">
          <Plus size={15} />
        </span>
      </div>
      <p className="mt-5 text-base font-semibold tracking-[-0.025em]">{template.title}</p>
      <p className="mt-2 text-sm leading-6 text-black/48">{template.description}</p>
    </button>
  );
}

function PupCard({ pup }: { pup: Pup }) {
  const queryClient = useQueryClient();
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["pups"] });
  const patch = useMutation({ mutationFn: (input: Parameters<typeof pupsApi.patch>[1]) => pupsApi.patch(pup.id, input), onSuccess: refresh });
  const run = useMutation({ mutationFn: () => pupsApi.run(pup.id), onSuccess: refresh });
  const chat = useMutation({
    mutationFn: () => pupsApi.chat(pup.id, message),
    onSuccess: (result) => {
      setReply(result.text);
      setMessage("");
      refresh();
    },
  });

  const state = statusText(pup);
  const stateClass =
    state === "Always on" || state === "Ready"
      ? "bg-emerald-50 text-emerald-700"
      : state === "Needs you"
        ? "bg-amber-50 text-amber-700"
        : "bg-black/[0.055] text-black/55";

  return (
    <article className="rounded-[26px] border border-black/[0.08] bg-white p-5 shadow-[0_16px_45px_rgba(34,31,27,0.055)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[#e9ede7] text-[#34463a]">
            <Bot size={20} />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold tracking-[-0.03em]">{pup.name}</h2>
            <p className="mt-0.5 text-xs text-black/42">{pup.kind.replaceAll("_", " ")}</p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${stateClass}`}>{state}</span>
      </div>

      <p className="mt-5 text-sm leading-6 text-black/58">{pup.objective}</p>

      <div className="mt-5 rounded-2xl bg-[#f6f4ef] p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-black/55">
          <Clock3 size={14} />
          Work routine
        </div>
        <select
          value={pup.routineEveryMinutes ?? ""}
          onChange={(event) => patch.mutate({ routineEveryMinutes: event.target.value ? Number(event.target.value) : null })}
          disabled={patch.isPending}
          className="mt-2 w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 text-sm text-black/65 outline-none"
        >
          {scheduleOptions.map((option) => <option key={String(option.value)} value={option.value ?? ""}>{option.label}</option>)}
        </select>
        {pup.nextRunAt && <p className="mt-2 text-[11px] text-black/38">Next wake-up: {new Date(pup.nextRunAt).toLocaleString()}</p>}
      </div>

      {pup.lastRunAt && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-black/[0.06] px-3.5 py-3 text-xs text-black/48">
          <Check size={14} className="mt-0.5 shrink-0 text-emerald-650" />
          <div>
            <p className="font-medium text-black/60">Last work: {pup.lastRunStatus ?? "finished"}</p>
            {pup.lastRunSummary && <p className="mt-1 line-clamp-2 leading-5">{pup.lastRunSummary}</p>}
          </div>
        </div>
      )}

      <div className="mt-5 grid grid-cols-3 gap-2">
        <button
          onClick={() => run.mutate()}
          disabled={run.isPending || pup.status === "paused"}
          className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#252520] px-3 text-xs font-semibold text-white disabled:opacity-35"
        >
          {run.isPending ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          Run now
        </button>
        <button
          onClick={() => setShowChat((value) => !value)}
          className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-black/10 px-3 text-xs font-semibold text-black/65"
        >
          <MessageCircle size={14} />
          Talk
        </button>
        <button
          onClick={() => patch.mutate({ status: pup.status === "paused" ? "active" : "paused" })}
          disabled={patch.isPending}
          className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-black/10 px-3 text-xs font-semibold text-black/65 disabled:opacity-40"
        >
          {pup.status === "paused" ? <Play size={14} /> : <Pause size={14} />}
          {pup.status === "paused" ? "Resume" : "Pause"}
        </button>
      </div>

      {(run.isError || patch.isError) && (
        <p className="mt-3 text-xs text-red-600">{(run.error ?? patch.error) instanceof Error ? (run.error ?? patch.error as Error).message : "MAXX could not update this Pup."}</p>
      )}

      {showChat && (
        <div className="mt-4 rounded-2xl border border-black/[0.08] bg-[#fbfaf7] p-3">
          {reply && <div className="mb-3 rounded-xl bg-white p-3 text-sm leading-6 text-black/65">{reply}</div>}
          <div className="flex gap-2">
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && message.trim() && !chat.isPending) chat.mutate();
              }}
              placeholder={`Tell ${pup.name} what you need...`}
              className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-black/28"
            />
            <button
              onClick={() => message.trim() && chat.mutate()}
              disabled={!message.trim() || chat.isPending}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black text-white disabled:opacity-30"
              aria-label="Send to Pup"
            >
              {chat.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
          {chat.isError && <p className="mt-2 text-xs text-red-600">{chat.error instanceof Error ? chat.error.message : "Pup chat failed."}</p>}
        </div>
      )}
    </article>
  );
}

export default function MaxxPups() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["pups"], queryFn: pupsApi.list, retry: false, refetchInterval: 15_000 });
  const create = useMutation({
    mutationFn: (templateId: PupTemplate["id"]) => pupsApi.create(templateId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pups"] }),
  });
  const data = query.data;

  return (
    <main className="min-h-[100dvh] bg-[#f2f0ea] text-[#20201d]">
      <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-7 sm:py-8">
        <div className="flex items-center justify-between gap-4">
          <Link to="/dashboard" className="flex h-10 items-center gap-2 rounded-full border border-black/10 bg-white px-3.5 text-sm font-medium text-black/60">
            <ArrowLeft size={15} />
            MAXX
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-black/[0.07] bg-white px-3.5 py-2 text-xs text-black/52">
            <span className={`h-2 w-2 rounded-full ${data?.alwaysOn ? "bg-emerald-500" : "bg-amber-500"}`} />
            {data?.alwaysOn ? "Pups stay awake" : "Always-on setup incomplete"}
          </div>
        </div>

        <section className="pt-10 text-center sm:pt-14">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#dde4df] text-[#34463a] shadow-sm">
            <Bot size={27} />
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Your Pups</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-black/48 sm:text-base">
            Give MAXX a specialist teammate for work that should keep moving. Pups can prepare and organize work while you are away; important external actions still wait for you.
          </p>
        </section>

        {query.isError && (
          <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {query.error instanceof Error ? query.error.message : "Pups are unavailable."}
          </div>
        )}

        {data && data.pups.length === 0 && (
          <section className="mt-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-black/36">Start with one</p>
            <div className="grid gap-3 md:grid-cols-3">
              {data.templates.map((template) => (
                <TemplateCard key={template.id} template={template} onCreate={() => create.mutate(template.id)} pending={create.isPending} />
              ))}
            </div>
            {create.isError && <p className="mt-3 text-sm text-red-600">{create.error instanceof Error ? create.error.message : "MAXX could not create that Pup."}</p>}
          </section>
        )}

        {data && data.pups.length > 0 && (
          <>
            <section className="mt-10 grid gap-4 md:grid-cols-2">
              {data.pups.map((pup) => <PupCard key={pup.id} pup={pup} />)}
            </section>
            <section className="mt-7 rounded-[26px] border border-black/[0.07] bg-white/70 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#4f765c]" />
                <div>
                  <p className="text-sm font-semibold">Pups work inside MAXX</p>
                  <p className="mt-1 text-xs leading-5 text-black/45">They reuse the same approvals, missions, memory, browser rules, and owner boundary. A Pup is a teammate, not a new server or a new product.</p>
                </div>
              </div>
            </section>
            <section className="mt-7">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-black/36">Add another Pup</p>
              <div className="grid gap-3 md:grid-cols-3">
                {data.templates.map((template) => (
                  <TemplateCard key={template.id} template={template} onCreate={() => create.mutate(template.id)} pending={create.isPending} />
                ))}
              </div>
            </section>
          </>
        )}

        {query.isLoading && (
          <div className="flex justify-center py-24 text-black/38"><Loader2 className="animate-spin" size={22} /></div>
        )}
      </div>
    </main>
  );
}
