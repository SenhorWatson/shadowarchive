import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Lock, Mail, Loader2, Radio, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Acesso // ShadowArchive AI" },
      { name: "description", content: "Login e cadastro de operadores investigativos." },
    ],
  }),
});

type Mode = "login" | "signup";

const INPUT_CLS =
  "w-full bg-background border border-border px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent transition-colors";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/explorer", replace: true });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate({ to: "/explorer", replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || email.split("@")[0] },
            emailRedirectTo: window.location.origin + "/auth",
          },
        });
        if (error) throw error;
        setInfo("Verifique seu e-mail para confirmar o cadastro antes de entrar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na autenticação.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: "google" | "apple") {
    setError(null);
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin + "/auth",
      });
      if (result.error) {
        setError(result.error.message ?? "Falha no provedor.");
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no provedor.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 noise">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="relative h-10 w-10 rounded-sm bg-primary/10 border border-primary/40 flex items-center justify-center">
            <Radio className="h-5 w-5 text-primary" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-accent animate-pulse" />
          </div>
          <div className="text-left">
            <div className="font-mono text-[10px] text-muted-foreground tracking-widest">
              SHADOW//ARCHIVE
            </div>
            <div className="font-stamp text-xl leading-none text-glow-classified">
              ShadowArchive AI
            </div>
          </div>
        </Link>

        <div className="border border-border bg-card/60 backdrop-blur-sm rounded-sm">
          <div className="border-b border-border px-5 py-3 flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <Lock className="h-3 w-3 text-accent" />
            <span className="uppercase tracking-widest">
              {mode === "login" ? "Autenticação // Operador" : "Registro // Novo Operador"}
            </span>
          </div>

          <div className="px-5 pt-4 grid grid-cols-2 gap-2 font-mono text-xs">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setInfo(null); }}
                className={cn(
                  "py-2 border uppercase tracking-widest transition-colors",
                  mode === m
                    ? "border-accent text-accent bg-accent/10"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "login" ? "Entrar" : "Registrar"}
              </button>
            ))}
          </div>

          <form onSubmit={handleEmail} className="p-5 space-y-3">
            {mode === "signup" && (
              <Field label="CODENAME">
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="ghost.07"
                  className={INPUT_CLS}
                />
              </Field>
            )}
            <Field label="E-MAIL">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operador@arquivo.dev"
                className={INPUT_CLS}
              />
            </Field>
            <Field label="SENHA">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={INPUT_CLS}
              />
            </Field>

            {error && (
              <div className="flex items-start gap-2 border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive font-mono">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {info && (
              <div className="border border-accent/40 bg-accent/10 px-3 py-2 text-xs text-accent font-mono">
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-mono text-sm uppercase tracking-widest py-2.5 hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {mode === "login" ? "Acessar arquivo" : "Solicitar acesso"}
            </button>
          </form>

          <div className="px-5 pb-5 space-y-2">
            <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              <div className="flex-1 h-px bg-border" />
              ou via provedor
              <div className="flex-1 h-px bg-border" />
            </div>
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 border border-border bg-background hover:bg-muted font-mono text-sm py-2.5 transition-colors disabled:opacity-50"
            >
              <GoogleIcon /> Continuar com Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("apple")}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 border border-border bg-background hover:bg-muted font-mono text-sm py-2.5 transition-colors disabled:opacity-50"
            >
              <AppleIcon /> Continuar com Apple
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-[10px] font-mono text-muted-foreground/70 uppercase tracking-widest">
          Sessão monitorada · ID do operador registrado em logs
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/>
      <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.95l3.66-2.84Z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.37 12.5c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.1-2.01-3.77-2.04-1.6-.16-3.13.95-3.94.95-.83 0-2.07-.93-3.4-.9-1.75.03-3.36 1.02-4.26 2.59-1.82 3.15-.47 7.81 1.3 10.37.87 1.25 1.9 2.66 3.24 2.61 1.3-.05 1.8-.84 3.37-.84 1.57 0 2.02.84 3.4.82 1.4-.02 2.29-1.27 3.15-2.53.99-1.45 1.4-2.86 1.42-2.94-.03-.01-2.72-1.04-2.75-4.13ZM13.86 4.86c.71-.86 1.19-2.06.97-3.26-1.02.04-2.27.69-3 1.55-.65.76-1.22 1.98-1.01 3.16 1.14.09 2.32-.58 3.04-1.45Z"/>
    </svg>
  );
}