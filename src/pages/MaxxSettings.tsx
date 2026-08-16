import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Brain, CheckCircle2, FileArchive, Loader2, UploadCloud } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const BUCKET = "maxx-second-brain";
const CHUNK_BYTES = 5 * 1024 * 1024;
const API_URL = import.meta.env.VITE_SUPABASE_URL as string;
const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type ImportRow = {
  id: string;
  original_name: string;
  total_bytes: number;
  status: "queued" | "processing" | "ready" | "failed";
  manifest_path: string | null;
  error: string | null;
  created_at: string;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function fetchImports(token: string): Promise<ImportRow[]> {
  const response = await fetch(
    `${API_URL}/rest/v1/maxx_second_brain_imports?select=id,original_name,total_bytes,status,manifest_path,error,created_at&order=created_at.desc&limit=20`,
    {
      headers: {
        apikey: PUBLISHABLE_KEY,
        Authorization: `Bearer ${token}`,
      },
    },
  );
  if (!response.ok) throw new Error(`Second-brain status returned ${response.status}`);
  return response.json();
}

async function createImport(token: string, row: Record<string, unknown>) {
  const response = await fetch(`${API_URL}/rest/v1/maxx_second_brain_imports`, {
    method: "POST",
    headers: {
      apikey: PUBLISHABLE_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(row),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Second-brain queue returned ${response.status}`);
  }
  return response.json() as Promise<ImportRow[]>;
}

export default function MaxxSettings() {
  const { session } = useAuth();
  const [imports, setImports] = useState<ImportRow[]>([]);
  const [loadingImports, setLoadingImports] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const active = useMemo(() => imports.some((item) => item.status === "queued" || item.status === "processing"), [imports]);

  useEffect(() => {
    if (!session?.access_token) return;
    let disposed = false;
    const refresh = async () => {
      try {
        const rows = await fetchImports(session.access_token);
        if (!disposed) setImports(rows);
      } catch (cause) {
        if (!disposed) setError(cause instanceof Error ? cause.message : "Could not load second-brain imports.");
      } finally {
        if (!disposed) setLoadingImports(false);
      }
    };
    refresh();
    const timer = window.setInterval(refresh, active ? 3000 : 15000);
    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [session?.access_token, active]);

  const upload = async (file: File) => {
    if (!session?.user.id || !session.access_token) return;
    setUploading(true);
    setProgress(0);
    setError("");
    setNotice("");

    const uploadId = crypto.randomUUID();
    const prefix = `${session.user.id}/${uploadId}`;
    const chunkCount = Math.max(1, Math.ceil(file.size / CHUNK_BYTES));
    const uploadedPaths: string[] = [];

    try {
      for (let index = 0; index < chunkCount; index += 1) {
        const start = index * CHUNK_BYTES;
        const end = Math.min(file.size, start + CHUNK_BYTES);
        const chunk = file.slice(start, end);
        const path = `${prefix}/${String(index).padStart(6, "0")}.part`;
        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, chunk, {
          contentType: "application/octet-stream",
          cacheControl: "3600",
          upsert: false,
        });
        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
        setProgress(Math.round(((index + 1) / chunkCount) * 100));
      }

      const rows = await createImport(session.access_token, {
        user_id: session.user.id,
        original_name: file.name,
        mime_type: file.type || null,
        total_bytes: file.size,
        chunk_count: chunkCount,
        storage_prefix: prefix,
      });
      setImports((current) => [...rows, ...current]);
      setNotice("Upload complete. MAXX is organizing it into your private second brain now.");
    } catch (cause) {
      if (uploadedPaths.length) await supabase.storage.from(BUCKET).remove(uploadedPaths).catch(() => undefined);
      setError(cause instanceof Error ? cause.message : "The upload did not finish.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-[#f4f2ed] px-4 py-5 text-[#20201d] sm:py-8">
      <div className="mx-auto w-full max-w-2xl rounded-[28px] border border-black/[0.08] bg-[#fffefa] p-5 shadow-[0_24px_80px_rgba(35,31,24,0.07)] sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <Link to="/dashboard" className="flex h-10 items-center gap-2 rounded-full px-2 text-sm text-black/55 hover:bg-black/[0.04]">
            <ArrowLeft size={17} />
            Back to MAXX
          </Link>
          <Link to="/control/command" className="text-xs text-black/30 hover:text-black/55">Advanced</Link>
        </div>

        <section className="mt-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#ece9e1] text-[#536458]">
              <Brain size={23} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.04em]">Your second brain</h1>
              <p className="mt-2 text-sm leading-6 text-black/48">Give MAXX exports, notes, documents, and old AI conversations. MAXX organizes them privately so you can ask about them later.</p>
            </div>
          </div>

          <label className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-black/15 bg-[#faf8f3] px-5 py-9 text-center transition hover:border-black/30 ${uploading ? "pointer-events-none opacity-60" : ""}`}>
            <input
              type="file"
              className="sr-only"
              disabled={uploading}
              accept=".zip,.json,.jsonl,.txt,.md,.markdown,.csv,.html,.htm,.xml,.yaml,.yml"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) upload(file);
                event.currentTarget.value = "";
              }}
            />
            {uploading ? <Loader2 className="animate-spin text-[#536458]" size={26} /> : <UploadCloud className="text-[#536458]" size={26} />}
            <p className="mt-3 text-sm font-semibold">{uploading ? `Uploading ${progress}%` : "Add an export or folder archive"}</p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-black/40">Large files are split into small private pieces and rebuilt in the backend. ZIP exports from ChatGPT or other tools are okay.</p>
            {uploading && (
              <div className="mt-4 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-black/[0.07]">
                <div className="h-full rounded-full bg-[#536458] transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
          </label>

          {notice && <div className="mt-4 flex items-start gap-2 rounded-2xl bg-emerald-50 p-3 text-sm leading-5 text-emerald-800"><CheckCircle2 size={17} className="mt-0.5 shrink-0" />{notice}</div>}
          {error && <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm leading-5 text-red-700">{error}</div>}
        </section>

        <section className="mt-8 border-t border-black/[0.07] pt-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Your imports</h2>
              <p className="mt-1 text-xs text-black/38">MAXX only loads the pieces relevant to the conversation.</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {loadingImports ? (
              <div className="flex items-center gap-2 py-5 text-sm text-black/40"><Loader2 size={16} className="animate-spin" />Loading…</div>
            ) : imports.length ? imports.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-black/[0.07] bg-[#faf8f3] p-3.5">
                <FileArchive size={19} className="shrink-0 text-black/35" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.original_name}</p>
                  <p className="mt-0.5 text-xs text-black/38">{formatBytes(item.total_bytes)} · {item.status === "ready" ? "Ready for MAXX" : item.status === "processing" ? "Organizing" : item.status === "queued" ? "Waiting" : "Needs attention"}</p>
                  {item.error && <p className="mt-1 text-xs text-red-600">{item.error}</p>}
                </div>
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.status === "ready" ? "bg-emerald-500" : item.status === "failed" ? "bg-red-500" : "animate-pulse bg-amber-500"}`} aria-label={item.status} />
              </div>
            )) : (
              <p className="rounded-2xl bg-[#faf8f3] px-4 py-5 text-sm text-black/40">Nothing imported yet.</p>
            )}
          </div>
        </section>

        <p className="mt-8 text-xs leading-5 text-black/35">Imported material stays source material until it is verified. MAXX keeps provenance so important answers can be traced back to the original file.</p>
      </div>
    </main>
  );
}
