import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Loader2, LogIn, ShieldCheck, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { bootstrapOwner, ownerExists } from "@/lib/owner.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Acesso — ShadowArchive AI" }],
  }),
  component: AuthPage,
});

const INPUT =
  "w-full bg-background border border-border px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent transition-colors";

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState<"signin" | "signup">("signin");

  const ownerCheck = useServerFn(ownerExists);
  const bootstrap = useServerFn(bootstrapOwner);
  const { data: ownerData, isLoading: ownerLoading, refetch } = useQuery({
    queryKey: ["owner-exists"],
    queryFn: () => ownerCheck({}),
  });
  const mode: "signin" | "signup" | "bootstrap" = ownerData?.exists ? action : "bootstrap";

  useEffect(() => {
    if (!loading && user) navigate({ to: "/admin" });
  }, [user, loading, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/admin" });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        navigate({ to: "/admin" });
      } else {
        await bootstrap({ data: { email, password, displayName: email.split("@")[0] } });
        await refetch();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/admin" });
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha na autenticação.");
    } finally {
      setBusy(false);
    }
  }

  if (ownerLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <h1 className="font-stamp text-3xl mb-2">
        {mode === "bootstrap"
          ? "Reivindicar proprietário"
          : action === "signup"
            ? "Cadastro"
            : "Acesso restrito"}
      </h1>
      <p className="text-sm text-muted-foreground font-mono mb-8">
        {mode === "bootstrap"
          ? "Nenhum proprietário cadastrado. Crie a conta-mestre (esta opção desaparece após o primeiro cadastro)."
          : action === "signup"
            ? "Cadastro público ativado temporariamente. Crie sua conta."
            : "Apenas usuários cadastrados podem entrar."}
      </p>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className={INPUT}
          type="email"
          placeholder="email@dominio.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className={INPUT}
          type="password"
          placeholder={mode === "bootstrap" || action === "signup" ? "senha (mín. 12 caracteres)" : "senha"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={mode === "bootstrap" || action === "signup" ? 12 : 8}
          required
        />
        {err && <p className="text-xs text-destructive font-mono">{err}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-mono text-sm uppercase tracking-widest py-2.5 hover:bg-primary/90 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : mode === "bootstrap" ? (
            <ShieldCheck className="h-4 w-4" />
          ) : action === "signup" ? (
            <UserPlus className="h-4 w-4" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          {mode === "bootstrap"
            ? "Criar proprietário"
            : action === "signup"
              ? "Cadastrar"
              : "Entrar"}
        </button>
      </form>
      {ownerData?.exists && (
        <div className="mt-4 flex gap-3 justify-center">
          <button
            type="button"
            onClick={() => { setAction("signin"); setErr(null); }}
            className={`text-[10px] font-mono uppercase tracking-widest ${action === "signin" ? "text-accent underline" : "text-muted-foreground hover:text-foreground"}`}
          >
            Entrar
          </button>
          <span className="text-muted-foreground text-[10px]">|</span>
          <button
            type="button"
            onClick={() => { setAction("signup"); setErr(null); }}
            className={`text-[10px] font-mono uppercase tracking-widest ${action === "signup" ? "text-accent underline" : "text-muted-foreground hover:text-foreground"}`}
          >
            Cadastrar
          </button>
        </div>
      )}
      <p className="mt-6 text-[10px] font-mono uppercase tracking-widest text-muted-foreground text-center">
        {mode === "bootstrap"
          ? "Use uma senha forte — verificada contra vazamentos (HIBP)."
          : action === "signup"
            ? "Cadastro público temporário ativo."
            : "Sem opção de cadastro público."}
      </p>
    </div>
  );
}
