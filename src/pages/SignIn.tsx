import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ArrowRight, CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const SignIn = () => {
  const { session, devBypass } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  if (session || devBypass) {
    const destination = (location.state as { from?: string } | null)?.from ?? "/dashboard";
    return <Navigate to={destination} replace />;
  }

  const sendMagicLink = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setPending(false);
    if (authError) setError(authError.message);
    else setNotice("Check your inbox. Your private MAXX link is ready.");
  };

  const signInWithGoogle = async () => {
    setPending(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (authError) {
      setPending(false);
      setError(authError.message);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-[#f4f2ed] px-4 py-6 text-[#20201d] sm:flex sm:items-center sm:justify-center sm:px-6">
      <section className="mx-auto w-full max-w-md rounded-[30px] border border-black/[0.08] bg-[#fffefa] p-6 shadow-[0_24px_80px_rgba(35,31,24,0.08)] sm:p-8">
        <div className="flex flex-col items-center text-center">
          <img
            src="/maxx/maxx-avatar.webp"
            alt="Agent MAXX 006"
            className="h-28 w-28 rounded-[28%] border border-black/10 object-cover"
          />
          <div className="mt-5 flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-[-0.04em]">MAXX</h1>
            <span className="h-2.5 w-2.5 rounded-full bg-[#4f765c]" aria-hidden="true" />
          </div>
          <p className="mt-2 text-sm leading-6 text-black/48">Sign in to your private MAXX.</p>
        </div>

        <div className="mt-8 space-y-3">
          <button
            onClick={signInWithGoogle}
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-sm font-semibold transition hover:bg-black/[0.025] disabled:opacity-50"
          >
            <ShieldCheck size={17} />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 py-2 text-[11px] text-black/32">
            <span className="h-px flex-1 bg-black/10" />
            or use email
            <span className="h-px flex-1 bg-black/10" />
          </div>

          <form onSubmit={sendMagicLink} className="space-y-3">
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-black/55">Approved email</span>
              <div className="flex items-center rounded-2xl border border-black/10 bg-white px-4 focus-within:border-black/30">
                <Mail size={17} className="text-black/30" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  className="w-full bg-transparent px-3 py-3.5 text-[16px] outline-none placeholder:text-black/25"
                />
              </div>
            </label>
            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#24241f] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-50"
            >
              {pending ? "Sending…" : "Send private sign-in link"}
              {!pending && <ArrowRight size={16} />}
            </button>
          </form>
        </div>

        {notice && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-emerald-50 p-3 text-sm leading-5 text-emerald-800">
            <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
            {notice}
          </div>
        )}
        {error && <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <p className="mt-6 text-center text-xs leading-5 text-black/35">Only approved accounts can enter. Your work stays private to your MAXX account.</p>
      </section>
    </main>
  );
};

export default SignIn;
