import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getPaste } from "@/lib/pastes.functions";

export const Route = createFileRoute("/vault/$slug")({
  head: () => ({
    meta: [{ title: "Relatório — ShadowArchive AI" }],
  }),
  component: PasteView,
});

function PasteView() {
  const { slug } = useParams({ from: "/vault/$slug" });
  const fetchPaste = useServerFn(getPaste);
  const { data, isLoading, error } = useQuery({
    queryKey: ["paste", slug],
    queryFn: () => fetchPaste({ data: { slug } }),
  });

  if (isLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="font-stamp text-2xl mb-2">Relatório não encontrado</h1>
        <p className="text-sm text-muted-foreground font-mono mb-6">
          {error instanceof Error ? error.message : "—"}
        </p>
        <Link to="/vault" className="inline-flex items-center gap-2 border border-border px-4 py-2 font-mono text-xs uppercase tracking-widest hover:border-accent hover:text-accent">
          <ArrowLeft className="h-3 w-3" /> Voltar
        </Link>
      </div>
    );
  }

  const p = data.paste;

  return (
    <article className="max-w-3xl mx-auto px-6 py-10">
      <Link to="/vault" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-accent mb-6">
        <ArrowLeft className="h-3 w-3" /> Cofre
      </Link>
      <div className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">
        {p.slug} · {p.author}
      </div>
      <h1 className="font-stamp text-3xl md:text-4xl mb-3">{p.title}</h1>
      <div className="font-mono text-[10px] text-muted-foreground mb-6">
        Publicado em {new Date(p.created_at).toLocaleString("pt-BR")}
      </div>
      <p className="text-base text-foreground/90 leading-relaxed mb-8 border-l-2 border-accent pl-4">
        {p.excerpt}
      </p>
      <div className="prose prose-invert max-w-none font-mono text-sm leading-7 whitespace-pre-wrap text-foreground/90">
        {p.body_md}
      </div>
      <div className="mt-10 flex flex-wrap gap-1.5">
        {(p.tags ?? []).map((t: string) => (
          <span key={t} className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground border border-border">
            #{t.toLowerCase().replace(/\s+/g, "_")}
          </span>
        ))}
      </div>
    </article>
  );
}