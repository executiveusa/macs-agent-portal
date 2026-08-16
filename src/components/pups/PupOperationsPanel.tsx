import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowRight, CheckCircle2, Clock3, Link2, Loader2, Repeat2 } from "lucide-react";
import { pupsApi, type Pup } from "@/services/pupsApi";

const triggerOptions = [
  { label: "Only when I run it", type: "manual" as const, value: null },
  { label: "Every hour", type: "interval" as const, value: "60" },
  { label: "Every day", type: "interval" as const, value: "1440" },
];

export function PupOperationsPanel({ pups }: { pups: Pup[] }) {
  const queryClient = useQueryClient();
  const [showTeach, setShowTeach] = useState(false);
  const [pupId, setPupId] = useState(pups[0]?.id ?? "");
  const [objective, setObjective] = useState("");
  const [proof, setProof] = useState("");
  const [triggerIndex, setTriggerIndex] = useState(0);

  const inbox = useQuery({ queryKey: ["pups", "review-inbox"], queryFn: pupsApi.operations.reviewInbox, retry: false, refetchInterval: 15_000 });
  const handoffs = useQuery({ queryKey: ["pups", "handoffs"], queryFn: () => pupsApi.handoffs.list(12), retry: false, refetchInterval: 15_000 });
  const workflows = useQuery({ queryKey: ["pups", "workflows"], queryFn: pupsApi.operations.workflows, retry: false });
  const connections = useQuery({ queryKey: ["pups", "connections"], queryFn: pupsApi.operations.connections, retry: false });

  const teach = useMutation({
    mutationFn: async () => {
      const trigger = triggerOptions[triggerIndex];
      return pupsApi.operations.teach({
        name: objective.slice(0, 72),
        pupId,
        objective,
        expectedProof: proof,
        triggerType: trigger.type,
        triggerValue: trigger.value,
      });
    },
    onSuccess: () => {
      setObjective("");
      setProof("");
      setShowTeach(false);
      void queryClient.invalidateQueries({ queryKey: ["pups"] });
    },
  });

  const names = useMemo(() => new Map(pups.map((pup) => [pup.id, pup.name])), [pups]);
  const reviewItems = inbox.data?.items ?? [];
  const recentHandoffs = handoffs.data?.handoffs ?? [];

  return (
    <section className="mt-7 grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
      <div className="rounded-[26px] border border-black/[0.08] bg-white p-5 shadow-[0_12px_36px_rgba(34,31,27,0.04)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/35">Needs you</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em]">Review inbox</h2>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${reviewItems.length ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
            {reviewItems.length}
          </span>
        </div>

        {inbox.isLoading && <div className="flex justify-center py-8 text-black/35"><Loader2 className="animate-spin" size={18} /></div>}
        {!inbox.isLoading && reviewItems.length === 0 && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#f5f7f2] p-4">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-650" />
            <div>
              <p className="text-sm font-semibold text-black/65">Nothing is blocked on you</p>
              <p className="mt-1 text-xs leading-5 text-black/43">Pups can keep preparing safe work. Consequential actions will appear here.</p>
            </div>
          </div>
        )}
        {reviewItems.length > 0 && (
          <div className="mt-4 space-y-2">
            {reviewItems.slice(0, 6).map((item) => (
              <div key={`${item.kind}-${item.id}`} className="rounded-2xl border border-black/[0.07] p-3.5">
                <div className="flex items-start gap-2.5">
                  <AlertCircle size={15} className={`mt-0.5 shrink-0 ${item.priority === "high" ? "text-amber-650" : "text-black/38"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-black/65">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-black/43">{item.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[26px] border border-black/[0.08] bg-white p-5 shadow-[0_12px_36px_rgba(34,31,27,0.04)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/35">Keep work moving</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em]">Teach my Pup</h2>
          </div>
          <button onClick={() => setShowTeach((value) => !value)} className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-black/58">
            {showTeach ? "Close" : "Teach"}
          </button>
        </div>

        {!showTeach && (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#f6f4ef] p-4">
              <Repeat2 size={16} className="text-black/38" />
              <p className="mt-3 text-2xl font-semibold tracking-[-0.04em]">{workflows.data?.workflows.length ?? 0}</p>
              <p className="mt-1 text-xs text-black/42">saved routines</p>
            </div>
            <div className="rounded-2xl bg-[#f6f4ef] p-4">
              <Link2 size={16} className="text-black/38" />
              <p className="mt-3 text-2xl font-semibold tracking-[-0.04em]">{connections.data?.connections.filter((item) => item.status === "connected").length ?? 0}</p>
              <p className="mt-1 text-xs text-black/42">connected tools</p>
            </div>
          </div>
        )}

        {showTeach && (
          <div className="mt-5 space-y-3">
            <select value={pupId} onChange={(event) => setPupId(event.target.value)} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none">
              {pups.map((pup) => <option key={pup.id} value={pup.id}>{pup.name}</option>)}
            </select>
            <textarea value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="What should this Pup keep doing?" className="min-h-24 w-full resize-none rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-black/28" />
            <input value={proof} onChange={(event) => setProof(event.target.value)} placeholder="What proves the work is done?" className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-black/28" />
            <select value={triggerIndex} onChange={(event) => setTriggerIndex(Number(event.target.value))} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none">
              {triggerOptions.map((option, index) => <option key={option.label} value={index}>{option.label}</option>)}
            </select>
            <button onClick={() => teach.mutate()} disabled={!pupId || objective.trim().length < 3 || proof.trim().length < 3 || teach.isPending} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-black text-sm font-semibold text-white disabled:opacity-30">
              {teach.isPending ? <Loader2 className="animate-spin" size={15} /> : <Clock3 size={15} />}
              Save routine
            </button>
            {teach.isError && <p className="text-xs text-red-600">{teach.error instanceof Error ? teach.error.message : "MAXX could not save that routine."}</p>}
          </div>
        )}
      </div>

      <div className="lg:col-span-2 rounded-[26px] border border-black/[0.08] bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/35">Pup activity</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em]">Work moving between Pups</h2>
          </div>
          <span className="text-xs text-black/35">One hop max</span>
        </div>
        {recentHandoffs.length === 0 ? (
          <p className="mt-4 text-sm text-black/42">No Pup handoffs yet.</p>
        ) : (
          <div className="mt-4 divide-y divide-black/[0.06]">
            {recentHandoffs.slice(0, 8).map((handoff) => (
              <div key={handoff.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eef1eb] text-[#4f6656]"><ArrowRight size={13} /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-black/63">{names.get(handoff.sourcePupId) ?? "Pup"} → {names.get(handoff.targetPupId) ?? "Pup"}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-black/42">{handoff.instruction}</p>
                </div>
                <span className="shrink-0 rounded-full bg-black/[0.045] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-black/45">{handoff.status.replaceAll("_", " ")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
