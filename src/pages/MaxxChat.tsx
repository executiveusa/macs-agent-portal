import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUp,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  History,
  LogOut,
  Mic,
  MicOff,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { controlTowerApi, type MaxxChatMode } from "@/services/controlTowerApi";
import { useAuth } from "@/hooks/useAuth";
import { ClientWorkspaceSwitcher } from "@/components/maxx/ClientWorkspaceSwitcher";
import { ClientMissionPanel } from "@/components/maxx/ClientMissionPanel";
import { MaxxSettingsDrawer } from "@/components/maxx/MaxxSettingsDrawer";
import { canSendClientTask, catalogItem } from "@/lib/maxx-client-workspaces";
import type { Approval, ChatResponse } from "@/types/controlTower";

type Message = {
  id: string;
  role: "stacy" | "maxx";
  text: string;
  audioBase64?: string;
  details?: {
    routingReason?: string;
    latencyMs?: number;
    degraded?: boolean;
  };
};

type SpeechRecognitionErrorLike = {
  error?: string;
  message?: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: (event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void;
  onerror: (event?: SpeechRecognitionErrorLike) => void;
  onend: () => void;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform?: string;
  }>;
};

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

const starterPrompts = [
  "Build me a 30-day Instagram campaign and interview me for what you need first.",
  "Get this website live safely and show me proof that it works.",
  "Turn this video into a week of useful content for my business.",
  "Find the leads and follow-ups we are missing, then recommend what to do first.",
];

function MaxxAvatar({ maxMode, size = "large", isSpeaking = false }: { maxMode: boolean; size?: "small" | "large"; isSpeaking?: boolean }) {
  const dimension = size === "large" ? "h-28 w-28 sm:h-32 sm:w-32" : "h-11 w-11";
  return (
    <div className={`relative ${dimension} shrink-0 overflow-hidden rounded-[28%] border border-black/10 bg-[#ece9e1]`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.img
          key={maxMode ? "max" : "normal"}
          src={maxMode ? "/maxx/maxx-mode.webp" : "/maxx/maxx-avatar.webp"}
          alt={maxMode ? "Agent MAXX in MAXX Mode" : "Agent MAXX"}
          className="h-full w-full object-cover"
          initial={{ opacity: 0, scale: maxMode ? 0.88 : 1.04, rotate: maxMode ? -3 : 0 }}
          animate={{ opacity: 1, scale: isSpeaking ? [1, 1.03, 1] : 1, rotate: 0 }}
          exit={{ opacity: 0, scale: maxMode ? 1.05 : 0.94 }}
          transition={{ duration: 0.28, ease: "easeOut", repeat: isSpeaking ? Infinity : 0, repeatDelay: 0.5 }}
        />
      </AnimatePresence>
      {isSpeaking && (
        <div className="absolute inset-0 bg-[#546b5a]/10 ring-2 ring-[#546b5a]/40 ring-inset rounded-[28%] animate-pulse" />
      )}
      {maxMode && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-[#6f5a93]" />}
    </div>
  );
}

function WorkState({ pending, response, isSpeaking, onStopAudio }: { pending: boolean; response?: ChatResponse; isSpeaking: boolean; onStopAudio: () => void }) {
  if (pending) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-black/[0.07] bg-[#f7f5ef] px-4 py-3 text-sm text-black/65">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#546b5a]" />
        <span className="font-medium">Working…</span>
      </div>
    );
  }
  if (isSpeaking) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-[#546b5a]/20 bg-[#f4f7f4] px-4 py-3 text-sm text-[#2e4735]">
        <div className="flex items-center gap-2">
          <Volume2 size={16} className="animate-pulse text-[#4a6b52]" />
          <span className="font-medium">MAXX is speaking…</span>
        </div>
        <button
          onClick={onStopAudio}
          className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold shadow-sm border border-black/10 hover:bg-black/[0.03]"
        >
          <VolumeX size={12} />
          Stop audio
        </button>
      </div>
    );
  }
  if (!response) return null;
  return (
    <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm ${response.degraded ? "border-amber-200 bg-amber-50 text-amber-900" : "border-black/[0.07] bg-[#f7f5ef] text-[#34463a]"}`}>
      <Check size={15} />
      <span className="font-medium">{response.degraded ? "Response ready via backup path" : "Response ready"}</span>
    </div>
  );
}

function ApprovalCard({ approval, onDecision, pending }: { approval: Approval; onDecision: (value: "approve" | "reject") => void; pending: boolean }) {
  return (
    <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 shrink-0 text-amber-700" size={19} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-950">MAXX needs you</p>
          <p className="mt-1 text-sm leading-6 text-amber-900/80">{approval.summary}</p>
          <div className="mt-4 flex gap-2">
            <button disabled={pending} onClick={() => onDecision("reject")} className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-amber-950 disabled:opacity-40">
              Not yet
            </button>
            <button disabled={pending} onClick={() => onDecision("approve")} className="rounded-xl bg-[#24241f] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MaxxChat() {
  const queryClient = useQueryClient();
  const { signOut, session } = useAuth();
  const authSubject = session?.user.id ?? "no-auth-session";
  const [input, setInput] = useState("");
  const [selectedClientSlug,setSelectedClientSlug] = useState<string|null>(null);
  const [settingsOpen,setSettingsOpen] = useState(false);
  const [clientNotice,setClientNotice] = useState("");
  const workspaceKey = authSubject + ":" + (selectedClientSlug ?? "general");
  const workspaceKeyRef = useRef(workspaceKey);
  useEffect(() => {
    workspaceKeyRef.current = workspaceKey;
  }, [workspaceKey]);
  const workspaceQuery = useQuery({
    queryKey: ["maxx-client-workspaces",authSubject],
    queryFn: controlTowerApi.listClientWorkspaces,
    enabled: Boolean(session?.user.id),
    retry:false, refetchInterval:30_000,
  });
  const verifiedWorkspaces = workspaceQuery.data?.workspaces ?? [];
  const verifiedWorkspace = selectedClientSlug
    ? verifiedWorkspaces.find(x=>x.slug===selectedClientSlug) : undefined;
  const clientPrompts = selectedClientSlug
    ? ((verifiedWorkspace?.promptsSource === "verified" || verifiedWorkspace?.promptsSource === "operator_template") && verifiedWorkspace.suggestedTasks.length > 0
        ? verifiedWorkspace.suggestedTasks
        : catalogItem(selectedClientSlug)?.suggestedTasks ??
          ["Review client decisions waiting for approval.",
           "Draft a campaign using verified company information.",
           "Summarize real progress and outstanding work.",
           "Prepare the next action for owner approval."])
    : starterPrompts;
  const chatHistoryQuery = useQuery({
    queryKey:["maxx-client-chat-history",authSubject,verifiedWorkspace?.id],
    queryFn:()=>controlTowerApi.getClientChatHistory(verifiedWorkspace!.id),
    enabled:Boolean(session?.user.id && verifiedWorkspace?.id && verifiedWorkspace.status==="active"),
    retry:false,
  });
  const clientApprovalsQuery = useQuery({
    queryKey:["maxx-client-approvals",authSubject,verifiedWorkspace?.id],
    queryFn:()=>controlTowerApi.getClientPendingApprovals(verifiedWorkspace!.id),
    enabled:Boolean(session?.user.id && verifiedWorkspace?.id && verifiedWorkspace.status==="active"),
    retry:false,refetchInterval:30_000,
  });
  const [mode, setMode] = useState<MaxxChatMode>("normal");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [proofMessageId, setProofMessageId] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    const nav = navigator as NavigatorWithStandalone;
    return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
  });

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsPwaInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert("To install MAXX on iOS: tap Share (⎋) then select 'Add to Home Screen'. On Android: tap Chrome menu (⋮) then 'Install app'.");
    }
  };

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const bootstrap = useQuery({
    queryKey: ["control-tower", authSubject],
    queryFn: controlTowerApi.bootstrap,
    enabled: Boolean(session?.user.id),
    retry: false,
    refetchInterval: 15_000,
  });

  const [messagesByWorkspace,setMessagesByWorkspace] = useState<Record<string,Message[]>>({});
  const [responsesByWorkspace,setResponsesByWorkspace] = useState<Record<string,ChatResponse>>({});
  // Session transitions cannot reuse a previous operator's selected client.
  const priorSubjectRef = useRef(authSubject);
  useEffect(() => {
    if (priorSubjectRef.current !== authSubject) {
      priorSubjectRef.current = authSubject;
      setSelectedClientSlug(null);
      setMessagesByWorkspace({});
      setResponsesByWorkspace({});
      setClientNotice("");
      queryClient.removeQueries({queryKey:["maxx-client-workspaces"]});
      queryClient.removeQueries({queryKey:["control-tower"]});
      queryClient.removeQueries({queryKey:["maxx-client-chat-history"]});
      queryClient.removeQueries({queryKey:["maxx-client-approvals"]});
    }
  }, [authSubject,queryClient]);
  const persistedMessages: Message[] | undefined =
    selectedClientSlug && verifiedWorkspace && chatHistoryQuery.data?.projectId===verifiedWorkspace.id
      ? chatHistoryQuery.data.messages.map(({id,role,text})=>({id,role,text}))
      : undefined;
  const messages: Message[] = messagesByWorkspace[workspaceKey] ??
    (persistedMessages?.length ? persistedMessages : [{
      id:"welcome-"+workspaceKey,role:"maxx",
      text:selectedClientSlug ? "Select an outcome. Client records and actions require verified access." : "I’m ready. Tell me the outcome you want.",
    }]);
  const lastResponse = responsesByWorkspace[workspaceKey];
  function appendWorkspaceMessage(key:string,message:Message) {
    // Preserve the server history while optimistic work is displayed. Never
    // let a new local message replace a previously loaded client transcript.
    const baseline = key===workspaceKey ? (persistedMessages??[]) : [];
    setMessagesByWorkspace(current=>({
      ...current,[key]:[...(current[key]??baseline),message],
    }));
  }

  const status = selectedClientSlug
    ? workspaceQuery.isError ? "Unavailable" :
      verifiedWorkspace ? "Draft only" : "Setup needed"
    : bootstrap.isError
    ? "Offline"
    : bootstrap.isLoading
      ? "Connecting"
      : bootstrap.data?.agent.status === "online"
        ? "Ready"
        : "Limited";
  const statusTone = status === "Ready" ? "bg-[#4f765c]" : status === "Offline" ? "bg-red-500" : "bg-amber-500";
  const pendingApproval = selectedClientSlug ? undefined : bootstrap.data?.approvals.find((item) => item.status === "pending");

  // Barge-in: Stop playing audio immediately without disrupting backend tasks
  const stopAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = "";
      currentAudioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Synthesize and play response with ElevenLabs / Voice Gateway
  const playResponseAudio = async (text: string) => {
    try {
      stopAudio();
      const synthesis = await controlTowerApi.synthesizeVoice(text);
      if (synthesis?.audioBase64) {
        const audioUrl = `data:${synthesis.format || "audio/mpeg"};base64,${synthesis.audioBase64}`;
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;
        setIsSpeaking(true);
        audio.onended = () => {
          setIsSpeaking(false);
          currentAudioRef.current = null;
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          currentAudioRef.current = null;
        };
        await audio.play();
      } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setIsSpeaking(false);
      }
    }
  };

  const chat = useMutation({
    mutationFn: ({text,workspaceId,exchangeId}:{text:string;key:string;workspaceId?:string;exchangeId:string}) =>
      controlTowerApi.chat(text,undefined,undefined,mode,workspaceId,exchangeId),
    onMutate: ({text,key}) => {
      stopAudio();
      appendWorkspaceMessage(key,{id:crypto.randomUUID(),role:"stacy",text});
      setInput("");
      setClientNotice("");
    },
    onError: (_error,{key}) => {
      appendWorkspaceMessage(key,{id:crypto.randomUUID(),role:"maxx",
        text:"That request was not completed. Please verify client access and the MAXX connection before retrying."});
    },
    onSuccess: async (response,{key,workspaceId}) => {
      appendWorkspaceMessage(key,{id:response.id,role:"maxx",text:response.text,details:{
        routingReason:response.routingReason,
        latencyMs:response.usage.latencyMs,
        degraded:response.degraded,
      }});
      setResponsesByWorkspace(current=>({...current,[key]:response}));
      queryClient.invalidateQueries({queryKey:["control-tower"]});
      queryClient.invalidateQueries({queryKey:["maxx-client-workspaces",authSubject]});
      if(workspaceId) {
        const keyForHistory=["maxx-client-chat-history",authSubject,workspaceId];
        await queryClient.invalidateQueries({queryKey:keyForHistory});
        const fetched=queryClient.getQueryData<{messages:Array<{text:string}>}>(keyForHistory);
        if(fetched?.messages.some(item=>item.text===response.text)){
          setMessagesByWorkspace(current=>{
            if(!current[key]) return current;
            const next={...current};
            delete next[key];
            return next;
          });
        }
      }
      if(response.text && !isListening && workspaceKeyRef.current===key) await playResponseAudio(response.text);
    },
  });

  const approval = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "approve" | "reject" }) => controlTowerApi.decideApproval(id, decision),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["control-tower"] }),
  });

  const send = (text = input) => {
    const clean = text.trim();
    if(!clean || chat.isPending) return;
    if(selectedClientSlug && !canSendClientTask(verifiedWorkspace)){
      setClientNotice("Client tasks are locked until your project membership and data connection are verified.");
      return;
    }
    stopAudio();
    chat.mutate({text:clean,key:workspaceKey,workspaceId:verifiedWorkspace?.id,exchangeId:crypto.randomUUID()});
  };

  // Voice handler: Tap mic -> Listening -> Stacy speaks -> Utterance commits automatically -> Working
  const startVoice = async () => {
    stopAudio(); // Barge-in: user began speaking / tapped mic
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcriptText = event.results[0][0].transcript;
        setIsListening(false);
        if (transcriptText.trim()) {
          // Automatic utterance commit directly to MAXX
          send(transcriptText);
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      try {
        recognition.start();
        recognitionRef.current = recognition;
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
      return;
    }

    // MediaRecorder Fallback if Web Speech is absent
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        recorder.onstop = async () => {
          setIsListening(false);
          stream.getTracks().forEach((track) => track.stop());
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Data = (reader.result as string)?.split(",")[1];
            if (base64Data) {
              try {
                const res = await controlTowerApi.transcribeVoice(base64Data, "audio/wav");
                if (res?.text?.trim()) {
                  send(res.text);
                }
              } catch {
                appendWorkspaceMessage(workspaceKey,{ id: crypto.randomUUID(), role: "maxx", text: "I couldn’t catch that. You can type to me here." });
              }
            }
          };
        };

        recorder.start();
        setIsListening(true);
      } catch {
        appendWorkspaceMessage(workspaceKey,{ id: crypto.randomUUID(), role: "maxx", text: "Microphone access was not granted. You can type to me here." });
      }
    } else {
      appendWorkspaceMessage(workspaceKey,{ id: crypto.randomUUID(), role: "maxx", text: "Voice input is not available in this browser. You can type to me here." });
    }
  };

  const stopVoice = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setIsListening(false);
  };

  useEffect(() => {
    return () => {
      stopAudio();
      stopVoice();
    };
  }, []);

  const recentMissions = useMemo(() => selectedClientSlug ? [] : (bootstrap.data?.missions.slice(0, 6) ?? []), [bootstrap.data?.missions,selectedClientSlug]);

  return (
    <main className={`min-h-[100dvh] transition-colors duration-300 ${mode === "max" ? "bg-[#efebe5]" : "bg-[#f4f2ed]"} text-[#20201d]`}>
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-4xl flex-col bg-[#fffefa] sm:min-h-[calc(100dvh-32px)] sm:my-4 sm:rounded-[30px] sm:border sm:border-black/10 sm:shadow-[0_24px_80px_rgba(35,31,24,0.08)]">
        <header className="flex min-h-16 items-center justify-between gap-3 border-b border-black/[0.07] px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="text-lg font-bold tracking-[-0.04em]">MAXX</span>
            <span className={`h-2.5 w-2.5 rounded-full ${statusTone}`} aria-hidden="true" />
            <span className="hidden text-sm text-black/50 sm:inline">{status}</span>
            <ClientWorkspaceSwitcher
              selectedSlug={selectedClientSlug}
              onSelect={(slug) => {setSelectedClientSlug(slug);setClientNotice("");stopAudio();}}
              verifiedWorkspaces={verifiedWorkspaces}
              connectionState={workspaceQuery.isLoading?"loading":workspaceQuery.isSuccess?"verified":"unavailable"}
            />
          </div>
          <div className="flex items-center gap-1.5">
            {!isPwaInstalled && (
              <button
                onClick={handleInstallClick}
                className="hidden sm:flex h-9 items-center gap-1.5 rounded-full bg-[#24241f] px-3 text-xs font-semibold text-[#f4f2ed] shadow-sm hover:bg-black/80 transition"
                title="Install MAXX on your phone"
              >
                <Smartphone size={13} />
                <span className="inline">Install App</span>
              </button>
            )}
            <button onClick={() => setShowHistory((value) => !value)} className="flex h-10 items-center gap-2 rounded-full px-3 text-sm text-black/55 hover:bg-black/[0.04]" aria-expanded={showHistory}>
              <History size={16} />
              <span className="hidden sm:inline">History</span>
            </button>
            <button type="button" onClick={()=>setSettingsOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-black/50 hover:bg-black/[0.04]"
              aria-label="Open MAXX settings and navigation" aria-haspopup="dialog" aria-expanded={settingsOpen}>
              <Settings size={17} />
            </button>
            <button onClick={() => signOut()} className="flex h-10 w-10 items-center justify-center rounded-full text-black/50 hover:bg-black/[0.04]" aria-label="Sign out">
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <MaxxSettingsDrawer
          open={settingsOpen} onOpenChange={setSettingsOpen}
          onOpenHistory={()=>setShowHistory(true)}
        />

        {showHistory && (
          <section className="border-b border-black/[0.07] bg-[#faf8f3] px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Recent work</p>
              <button onClick={() => setShowHistory(false)} aria-label="Close history" className="rounded-full p-2 text-black/40 hover:bg-black/[0.05]"><X size={15} /></button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {selectedClientSlug ? (
                chatHistoryQuery.isError
                  ? <p role="alert" className="text-sm text-red-700">Saved client history is unavailable. This is not an empty history.</p>
                  : chatHistoryQuery.isLoading
                    ? <p className="text-sm text-black/40">Loading verified client history…</p>
                    : chatHistoryQuery.data?.messages.length
                      ? chatHistoryQuery.data.messages.slice(-8).map(item=>(
                          <div key={item.id} className="rounded-xl border border-black/[0.07] bg-white px-3 py-2.5">
                            <p className="text-xs font-semibold">{item.role==="stacy"?"You":"MAXX"}</p>
                            <p className="mt-1 line-clamp-2 text-sm">{item.text}</p>
                          </div>
                        ))
                      : <p className="text-sm text-black/40">No persisted client messages yet.</p>
              ) : recentMissions.length ? recentMissions.map((mission) => (
                <div key={mission.id} className="rounded-xl border border-black/[0.07] bg-white px-3 py-2.5">
                  <p className="line-clamp-2 text-sm font-medium">{mission.objective}</p>
                  <p className="mt-1 text-xs text-black/40">{mission.status === "needs_operator" ? "Needs you" : mission.status === "working" ? "Working" : mission.status === "completed" ? "Done" : mission.status}</p>
                </div>
              )) : <p className="text-sm text-black/40">No saved missions yet.</p>}
            </div>
          </section>
        )}

        <section className="flex flex-1 flex-col px-4 pb-3 pt-6 sm:px-8 sm:pt-8">
          <div className="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
            <MaxxAvatar maxMode={mode === "max"} isSpeaking={isSpeaking} />
            <h1 className="mt-4 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">What do you need done?</h1>
            <p className="mt-2 text-sm leading-6 text-black/48">
              {selectedClientSlug ? `Working context: ${catalogItem(selectedClientSlug)?.name}.` :
                "Talk or type normally. MAXX handles the work underneath."}
            </p>
            {selectedClientSlug && !canSendClientTask(verifiedWorkspace) && (
              <p role="status" className="mt-3 rounded-xl bg-amber-50 px-4 py-2 text-xs text-amber-900">
                Client-specific execution is locked pending verified project membership.
              </p>
            )}
            {selectedClientSlug && verifiedWorkspace && (
              <p role="status" className="mt-2 text-xs text-amber-800">
                Verified workspace · chat remains advisory. Separately approved internal draft missions use the gated ICM executor; no external client actions are authorized.
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setMode((current) => current === "max" ? "normal" : "max")}
                className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${mode === "max" ? "border-[#6f5a93]/35 bg-[#6f5a93]/10 text-[#4f3d69]" : "border-black/10 bg-white text-black/60 hover:bg-black/[0.03]"}`}
                aria-pressed={mode === "max"}
              >
                <Sparkles size={14} />
                {mode === "max" ? "MAXX Mode on" : "Activate MAXX Mode"}
              </button>
              <div className="flex items-center gap-2 rounded-full border border-black/[0.07] bg-[#f7f5ef] px-3.5 py-2 text-xs text-black/45" title="Sensory camera and glasses input boundary ready">
                <Camera size={14} />
                MAXX Eyes · coming soon
              </div>
            </div>
            {mode === "max" && <p className="mt-2 text-xs text-[#5f4d78]">For hard decisions and deep reasoning. Safety and approvals stay the same.</p>}
          </div>

          <div className="mx-auto mt-6 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
            {clientPrompts.map((prompt) => (
              <button key={prompt} onClick={() => send(prompt)} disabled={chat.isPending || (Boolean(selectedClientSlug) && !canSendClientTask(verifiedWorkspace))} className="rounded-2xl border border-black/[0.07] bg-[#faf8f3] p-3.5 text-left text-sm leading-5 text-black/66 transition hover:border-black/15 hover:bg-[#f6f3ed] disabled:opacity-50">
                {prompt}
              </button>
            ))}
          </div>

          <div className="mx-auto mt-6 w-full max-w-2xl space-y-4 pb-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "stacy" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[90%] rounded-[20px] px-4 py-3 text-sm leading-6 sm:max-w-[82%] ${message.role === "stacy" ? "rounded-br-md bg-[#dde4e2] text-[#252724]" : "rounded-bl-md bg-[#f0ede6] text-[#2a2925]"}`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-black/45">{message.role === "stacy" ? "Stacy" : "MAXX"}</p>
                    {message.role === "maxx" && (
                      <button
                        onClick={() => playResponseAudio(message.text)}
                        className="text-black/40 hover:text-black/70 p-1"
                        aria-label="Play response audio"
                        title="Listen to MAXX"
                      >
                        <Volume2 size={13} />
                      </button>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  {message.role === "maxx" && message.details && (
                    <div className="mt-2 border-t border-black/[0.06] pt-2">
                      <button onClick={() => setProofMessageId((current) => current === message.id ? null : message.id)} className="flex items-center gap-1 text-xs font-semibold text-[#415548]">
                        View proof {proofMessageId === message.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                      {proofMessageId === message.id && (
                        <div className="mt-2 rounded-xl bg-white/70 p-3 text-xs leading-5 text-black/55">
                          <p>{message.details.degraded ? "The primary path was unavailable, so MAXX returned this through a fallback." : "The request completed through the configured MAXX runtime path."}</p>
                          {typeof message.details.latencyMs === "number" && <p className="mt-1">Runtime response: {(message.details.latencyMs / 1000).toFixed(1)}s</p>}
                          {message.details.routingReason && <p className="mt-1">{message.details.routingReason}</p>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {selectedClientSlug && chatHistoryQuery.isError && verifiedWorkspace && (
              <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                Saved history could not be verified. Refresh or contact the operator; never assume there are zero records.
              </p>
            )}
            {verifiedWorkspace && selectedClientSlug && verifiedWorkspace.status==="active" && (
              <ClientMissionPanel key={verifiedWorkspace.id+":"+authSubject}
                workspace={verifiedWorkspace} userId={authSubject}
                suggestedObjective={messages.filter(m=>m.role==="stacy").slice(-1)[0]?.text}/>
            )}
            {verifiedWorkspace && selectedClientSlug && (
              <section className="rounded-2xl border border-black/[0.07] bg-[#faf8f3] p-3" aria-label="Client approvals">
                <p className="text-xs font-semibold text-black/70">Client approvals · review only</p>
                {clientApprovalsQuery.isError
                  ? <p role="alert" className="mt-1 text-xs text-amber-900">Approval status is unavailable, not zero.</p>
                  : clientApprovalsQuery.isLoading
                    ? <p className="mt-1 text-xs text-black/45">Checking authorized approvals…</p>
                    : clientApprovalsQuery.data?.approvals.length
                      ? <div className="mt-2 space-y-2">
                          {clientApprovalsQuery.data.approvals.slice(0,3).map(item=>(
                            <div key={item.id} className="rounded-lg border border-black/[0.06] bg-white p-2 text-xs">
                              <p className="font-semibold">{item.actionKey}</p>
                              <p className="mt-1 text-black/55">Risk: {item.riskClass}. Approval or execution requires separate authorized review.</p>
                            </div>
                          ))}
                          {clientApprovalsQuery.data.approvals.length>3 && (
                            <p className="text-xs text-black/55">Additional verified approvals: {clientApprovalsQuery.data.approvals.length-3}</p>
                          )}
                        </div>
                      : <p className="mt-1 text-xs text-black/50">No pending approvals in the scoped MAXX ledger. Other systems are not included.</p>}
              </section>
            )}
            {clientNotice && <p role="alert" className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{clientNotice}</p>}
            <WorkState pending={chat.isPending} response={lastResponse} isSpeaking={isSpeaking} onStopAudio={stopAudio} />
            {chat.isError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">
                MAXX could not complete that request yet. Nothing should be treated as done. {chat.error instanceof Error ? chat.error.message : "The private service is unavailable."}
              </div>
            )}
            {pendingApproval && (
              <ApprovalCard
                approval={pendingApproval}
                pending={approval.isPending}
                onDecision={(decision) => approval.mutate({ id: pendingApproval.id, decision })}
              />
            )}
          </div>

          <div className="sticky bottom-0 mx-auto mt-auto w-full max-w-2xl bg-gradient-to-t from-[#fffefa] via-[#fffefa] to-transparent pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
            <div className="flex items-end gap-2 rounded-[24px] border border-black/12 bg-white p-2 shadow-[0_12px_35px_rgba(35,31,24,0.08)]">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="Tell MAXX what you need…"
                disabled={Boolean(selectedClientSlug) && !canSendClientTask(verifiedWorkspace)}
                className="min-h-11 max-h-32 flex-1 resize-none bg-transparent px-3 py-3 text-[16px] leading-5 outline-none placeholder:text-black/30"
              />
              <button
                onClick={() => {
                  if (isListening) {
                    stopVoice();
                  } else {
                    startVoice();
                  }
                }}
                disabled={Boolean(selectedClientSlug) && !canSendClientTask(verifiedWorkspace)}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all ${
                  isListening ? "bg-red-500 text-white animate-pulse" : "bg-[#efede7] text-black/60 hover:bg-[#e4e1d8]"
                }`}
                aria-label={isListening ? "Listening... click to stop" : "Talk to Max"}
                title={isListening ? "Listening — speak now" : "Talk to Max"}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button onClick={() => send()} disabled={!input.trim() || chat.isPending || (Boolean(selectedClientSlug) && !canSendClientTask(verifiedWorkspace))} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#24241f] text-white disabled:opacity-25" aria-label="Send to MAXX">
                <ArrowUp size={18} />
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-black/32">
              {isListening
                ? "Listening… speak naturally and MAXX will answer."
                : isSpeaking
                  ? "Speaking… tap mic or type to interrupt."
                  : mode === "max"
                    ? "MAXX Mode active"
                    : selectedClientSlug ? "Client data and tools remain gated until project membership is verified." : "Voice and text go through your private MAXX account."}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
