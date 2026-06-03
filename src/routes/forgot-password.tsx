import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Loader2, AlertTriangle, CheckCircle2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
  head: () => ({
    meta: [
      { title: "Recuperar acesso // ShadowArchive AI" },
      { name: "description", content: "Solicitar redefinição de senha do operador." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/reset-password",
      });
      if (error) throw error;
      setSent(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha ao enviar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 noise">
      <div className="w-full max-w-md border border-border bg-card/60 backdrop-blur-sm rounded-sm p-6">
        <h1 className="font-stamp text-2xl mb-1">Recuperar acesso</h1>
        <p className="text-xs text-muted-foreground font-mono mb-5">
          Enviaremos um link seguro para redefinir sua senha.
        </p>
        {sent ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 border border-accent/40 bg-accent/10 px-3 py-3 text-xs text-accent font-mono">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Se uma conta existir para <strong>{email}</strong>, enviamos instruções para redefinir a senha.
              </span>
            </div>
            <Link to="/auth" className="inline-flex items-center gap-1 font-mono text-xs text-accent">
              <ArrowLeft className="h-3 w-3" /> voltar ao login
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                E-MAIL
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-border px-3 py-2 font-mono text-sm focus:outline-none focus:border-accent"
              />
            </label>
            {err && (
              <div className="flex items-start gap-2 border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive font-mono">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{err}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-mono text-sm uppercase tracking-widest py-2.5 hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Enviar link
            </button>
            <Link to="/auth" className="block text-center font-mono text-xs text-muted-foreground hover:text-accent">
              voltar
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}