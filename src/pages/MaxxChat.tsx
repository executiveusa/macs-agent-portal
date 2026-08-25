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

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: (event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void;
  onerror: (event?: any) => void;
  onend: () => void;
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
      <span className="font-medium">{response.degraded ? "Done using a backup path" : "Done"}</span>
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
  const { signOut } = useAuth();
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<MaxxChatMode>("normal");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [proofMessageId, setProofMessageId] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    if (
      (typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches) ||
      (typeof navigator !== "undefined" && (navigator as any).standalone === true)
    ) {
      setIsPwaInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
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
    queryKey: ["control-tower"],
    queryFn: controlTowerApi.bootstrap,
    retry: false,
    refetchInterval: 15_000,
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "maxx",
      text: "I’m ready. Tell me the outcome you want, and I’ll figure out the work underneath.",
    },
  ]);
  const [lastResponse, setLastResponse] = useState<ChatResponse>();

  const status = bootstrap.isError
    ? "Offline"
    : bootstrap.isLoading
      ? "Connecting"
      : bootstrap.data?.agent.status === "online"
        ? "Ready"
        : "Limited";
  const statusTone = status === "Ready" ? "bg-[#4f765c]" : status === "Offline" ? "bg-red-500" : "bg-amber-500";
  const pendingApproval = bootstrap.data?.approvals.find((item) => item.status === "pending");

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
    mutationFn: (text: string) => controlTowerApi.chat(text, undefined, undefined, mode),
    onMutate: (text) => {
      stopAudio(); // Barge-in on send
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "stacy", text }]);
      setInput("");
      setLastResponse(undefined);
    },
    onSuccess: async (response) => {
      const id = response.id;
      setMessages((current) => [
        ...current,
        {
          id,
          role: "maxx",
          text: response.text,
          details: {
            routingReason: response.routingReason,
            latencyMs: response.usage.latencyMs,
            degraded: response.degraded,
          },
        },
      ]);
      setLastResponse(response);
      queryClient.invalidateQueries({ queryKey: ["control-tower"] });
      // Speak the response through ElevenLabs
      if (response.text && !isListening) {
        await playResponseAudio(response.text);
      }
    },
  });

  const approval = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "approve" | "reject" }) => controlTowerApi.decideApproval(id, decision),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["control-tower"] }),
  });

  const send = (text = input) => {
    const clean = text.trim();
    if (!clean || chat.isPending) return;
    stopAudio();
    chat.mutate(clean);
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
                setMessages((current) => [
                  ...current,
                  { id: crypto.randomUUID(), role: "maxx", text: "I couldn’t catch that. You can type to me here." },
                ]);
              }
            }
          };
        };

        recorder.start();
        setIsListening(true);
      } catch {
        setMessages((current) => [
          ...current,
          { id: crypto.randomUUID(), role: "maxx", text: "Microphone access was not granted. You can type to me here." },
        ]);
      }
    } else {
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "maxx", text: "Voice input is not available in this browser. You can type to me here." },
      ]);
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

  const recentMissions = useMemo(() => bootstrap.data?.missions.slice(0, 6) ?? [], [bootstrap.data?.missions]);

  return (
    <main className={`min-h-[100dvh] transition-colors duration-300 ${mode === "max" ? "bg-[#efebe5]" : "bg-[#f4f2ed]"} text-[#20201d]`}>
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-4xl flex-col bg-[#fffefa] sm:min-h-[calc(100dvh-32px)] sm:my-4 sm:rounded-[30px] sm:border sm:border-black/10 sm:shadow-[0_24px_80px_rgba(35,31,24,0.08)]">
        <header className="flex min-h-16 items-center justify-between gap-3 border-b border-black/[0.07] px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="text-lg font-bold tracking-[-0.04em]">MAXX</span>
            <span className={`h-2.5 w-2.5 rounded-full ${statusTone}`} aria-hidden="true" />
            <span className="text-sm text-black/50">{status}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {!isPwaInstalled && (
              <button
                onClick={handleInstallClick}
                className="flex h-9 items-center gap-1.5 rounded-full bg-[#24241f] px-3 text-xs font-semibold text-[#f4f2ed] shadow-sm hover:bg-black/80 transition"
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
            <Link to="/control/settings" className="flex h-10 w-10 items-center justify-center rounded-full text-black/50 hover:bg-black/[0.04]" aria-label="Advanced settings">
              <Settings size={17} />
            </Link>
            <button onClick={() => signOut()} className="flex h-10 w-10 items-center justify-center rounded-full text-black/50 hover:bg-black/[0.04]" aria-label="Sign out">
              <LogOut size={17} />
            </button>
          </div>
        </header>

        {showHistory && (
          <section className="border-b border-black/[0.07] bg-[#faf8f3] px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Recent work</p>
              <button onClick={() => setShowHistory(false)} aria-label="Close history" className="rounded-full p-2 text-black/40 hover:bg-black/[0.05]"><X size={15} /></button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {recentMissions.length ? recentMissions.map((mission) => (
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
            <p className="mt-2 text-sm leading-6 text-black/48">Talk or type normally. MAXX handles the work underneath.</p>

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
            {starterPrompts.map((prompt) => (
              <button key={prompt} onClick={() => send(prompt)} disabled={chat.isPending} className="rounded-2xl border border-black/[0.07] bg-[#faf8f3] p-3.5 text-left text-sm leading-5 text-black/66 transition hover:border-black/15 hover:bg-[#f6f3ed] disabled:opacity-50">
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
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all ${
                  isListening ? "bg-red-500 text-white animate-pulse" : "bg-[#efede7] text-black/60 hover:bg-[#e4e1d8]"
                }`}
                aria-label={isListening ? "Listening... click to stop" : "Talk to Max"}
                title={isListening ? "Listening — speak now" : "Talk to Max"}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button onClick={() => send()} disabled={!input.trim() || chat.isPending} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#24241f] text-white disabled:opacity-25" aria-label="Send to MAXX">
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
                    : "Voice and text go through your private MAXX account."}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
