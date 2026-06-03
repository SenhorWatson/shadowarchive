import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Redefinir senha // ShadowArchive AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [hasRecovery, setHasRecovery] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setHasRecovery(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setHasRecovery(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (pw.length < 8) return setErr("Use no mínimo 8 caracteres.");
    if (pw !== pw2) return setErr("As senhas não coincidem.");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      setOk(true);
      setTimeout(() => navigate({ to: "/explorer", replace: true }), 1500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha ao atualizar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 noise">
      <div className="w-full max-w-md border border-border bg-card/60 backdrop-blur-sm rounded-sm p-6">
        <h1 className="font-stamp text-2xl mb-1">Nova senha</h1>
        <p className="text-xs text-muted-foreground font-mono mb-5">
          Defina uma senha forte para sua conta.
        </p>
        {!hasRecovery && !ok && (
          <div className="flex items-start gap-2 border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary font-mono mb-4">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>Abra esta página pelo link enviado por e-mail.</span>
          </div>
        )}
        {ok ? (
          <div className="flex items-center gap-2 border border-accent/40 bg-accent/10 px-3 py-3 text-xs text-accent font-mono">
            <CheckCircle2 className="h-4 w-4" /> Senha atualizada. Redirecionando…
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <Field label="NOVA SENHA">
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                minLength={8}
                required
                className="w-full bg-background border border-border px-3 py-2 font-mono text-sm focus:outline-none focus:border-accent"
              />
            </Field>
            <Field label="CONFIRMAR">
              <input
                type="password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                minLength={8}
                required
                className="w-full bg-background border border-border px-3 py-2 font-mono text-sm focus:outline-none focus:border-accent"
              />
            </Field>
            {err && (
              <div className="flex items-start gap-2 border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive font-mono">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{err}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !hasRecovery}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-mono text-sm uppercase tracking-widest py-2.5 hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Atualizar senha
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}