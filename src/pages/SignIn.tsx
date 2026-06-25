import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ArrowRight, Bot, CheckCircle2, KeyRound, Mail, ShieldCheck } from "lucide-react";
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
    const destination = (location.state as { from?: string } | null)?.from ?? "/dashboard/command";
    return <Navigate to={destination} replace />;
  }

  const sendMagicLink = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard/command` },
    });
    setPending(false);
    if (authError) setError(authError.message);
    else setNotice("Check your inbox. The secure access link is ready.");
  };

  const signInWithGoogle = async () => {
    setPending(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard/command` },
    });
    if (authError) {
      setPending(false);
      setError(authError.message);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4f4f2] px-5 py-8 text-[#1d1d1f] sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(255,255,255,0.98),transparent_34%),radial-gradient(circle_at_85%_90%,rgba(187,215,255,0.35),transparent_32%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-black/[0.06] bg-white/65 shadow-[0_40px_120px_rgba(0,0,0,0.12)] backdrop-blur-3xl lg:grid-cols-[1.15fr_0.85fr]">
          <section className="flex min-h-[500px] flex-col justify-between bg-[#111214] p-8 text-white sm:p-12 lg:min-h-[690px] lg:p-16">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black">
                <Bot size={21} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">Agent MAXX</p>
                <p className="text-sm font-medium text-white/80">Private control tower</p>
              </div>
            </div>
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#8cbcff]">Stacy operator access</p>
              <h1 className="mt-5 text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">
                Your company,
                <br />
                under intelligent control.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-white/52 sm:text-lg">
                Talk to MAXX, observe every mission, approve consequential actions, and manage the CRM from one private
                workspace.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Inspectable", "ICM stage history"],
                ["Controlled", "Risk-based approvals"],
                ["Private", "Server-side secrets"],
              ].map(([title, detail]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-1 text-xs text-white/38">{detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="flex items-center p-7 sm:p-12 lg:p-16">
            <div className="w-full">
              <div className="mb-9">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-black/10 bg-white shadow-sm">
                  <KeyRound size={20} />
                </div>
                <h2 className="text-3xl font-semibold tracking-[-0.04em]">Enter the tower</h2>
                <p className="mt-2 text-sm leading-6 text-black/48">
                  Access is restricted to the approved Stacy operator allowlist.
                </p>
              </div>

              <button
                onClick={signInWithGoogle}
                disabled={pending}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-sm font-semibold shadow-sm transition hover:bg-black/[0.025] disabled:opacity-50"
              >
                <ShieldCheck size={17} />
                Continue with Google
              </button>

              <div className="my-6 flex items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-black/28">
                <span className="h-px flex-1 bg-black/10" />
                Secure email link
                <span className="h-px flex-1 bg-black/10" />
              </div>

              <form onSubmit={sendMagicLink} className="space-y-3">
                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-black/55">Approved email</span>
                  <div className="flex items-center rounded-2xl border border-black/10 bg-white px-4 shadow-sm focus-within:border-black/30">
                    <Mail size={17} className="text-black/30" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="stacy@company.com"
                      className="w-full bg-transparent px-3 py-3.5 text-sm outline-none placeholder:text-black/25"
                    />
                  </div>
                </label>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-black/85 disabled:opacity-50"
                >
                  {pending ? "Securing access..." : "Send access link"}
                  {!pending && <ArrowRight size={16} />}
                </button>
              </form>

              {notice && (
                <div className="mt-4 flex items-start gap-2 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-800">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
                  {notice}
                </div>
              )}
              {error && <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}

              <p className="mt-7 text-xs leading-5 text-black/35">
                Authentication is handled by Supabase. Provider keys, Pi controls, browser credentials, and ICM filesystem
                access remain inside the private VPS control plane.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default SignIn;
