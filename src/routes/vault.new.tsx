import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Loader2, Plus, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { createPaste } from "@/lib/pastes.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/vault/new")({
  head: () => ({ meta: [{ title: "Novo paste — ShadowArchive AI" }] }),
  component: NewPastePage,
});

const INPUT =
  "w-full bg-background border border-border px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent transition-colors";
const LABEL =
  "block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1";

function NewPastePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const create = useServerFn(createPaste);
  const [form, setForm] = useState({
    slug: "",
    title: "",
    excerpt: "",
    body_md: "",
    tags: "",
    author: "shadow_archive",
  });
  const [err, setErr] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      create({
        data: {
          slug: form.slug,
          title: form.title,
          excerpt: form.excerpt,
          body_md: form.body_md,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          author: form.author,
          published: true,
        },
      }),
    onSuccess: (res) => navigate({ to: "/vault/$slug", params: { slug: res.paste.slug } }),
    onError: (e) => setErr(e instanceof Error ? e.message : "Erro"),
  });

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <ShieldAlert className="h-10 w-10 text-accent mx-auto mb-3" />
        <h1 className="font-stamp text-2xl mb-2">Acesso restrito</h1>
        <p className="text-sm text-muted-foreground font-mono mb-6">
          Faça login para criar relatórios.
        </p>
        <Link to="/auth" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-primary/90">
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Link to="/vault" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-accent mb-6">
        <ArrowLeft className="h-3 w-3" /> Cofre
      </Link>
      <h1 className="font-stamp text-3xl mb-6">Novo relatório investigativo</h1>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setErr(null);
          mutation.mutate();
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>SLUG (URL)</label>
            <input
              className={INPUT}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="operacao-condor"
              required
            />
          </div>
          <div>
            <label className={LABEL}>AUTOR</label>
            <input
              className={INPUT}
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              required
            />
          </div>
        </div>
        <div>
          <label className={LABEL}>TÍTULO</label>
          <input
            className={INPUT}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>
        <div>
          <label className={LABEL}>RESUMO</label>
          <textarea
            className={cn(INPUT, "min-h-[80px]")}
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            maxLength={500}
          />
        </div>
        <div>
          <label className={LABEL}>CORPO (Markdown)</label>
          <textarea
            className={cn(INPUT, "min-h-[320px] leading-6")}
            value={form.body_md}
            onChange={(e) => setForm({ ...form, body_md: e.target.value })}
            placeholder="# Título&#10;&#10;Texto da investigação..."
            required
          />
        </div>
        <div>
          <label className={LABEL}>TAGS (separadas por vírgula)</label>
          <input
            className={INPUT}
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="cia, operação, 1975"
          />
        </div>
        {err && (
          <p className="text-xs text-destructive font-mono border border-destructive/40 bg-destructive/10 px-3 py-2">
            {err}
          </p>
        )}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-mono text-sm uppercase tracking-widest px-6 py-2.5 hover:bg-primary/90 disabled:opacity-50"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Publicar relatório
        </button>
      </form>
    </div>
  );
}