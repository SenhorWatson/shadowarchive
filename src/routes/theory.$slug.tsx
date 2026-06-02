import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Clock, FileText, Network, Tag, Users } from "lucide-react";
import { CredibilityBadge } from "@/components/shadow/CredibilityBadge";
import { getTheoryBySlug } from "@/lib/theories.functions";

export const Route = createFileRoute("/theory/$slug")({
  loader: async ({ params }) => {
    const { theory, sources } = await getTheoryBySlug({ data: { slug: params.slug } });
    if (!theory) throw notFound();
    return { theory, sources };
  },
  head: ({ loaderData }) => {
    const t = loaderData?.theory;
    if (!t) return { meta: [{ title: "Não encontrado" }] };
    return {
      meta: [
        { title: `${t.title} — ShadowArchive AI` },
        { name: "description", content: t.summary.slice(0, 155) },
        { property: "og:title", content: t.title },
        { property: "og:description", content: t.summary.slice(0, 155) },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="max-w-3xl mx-auto px-6 py-20 text-center font-mono text-muted-foreground">
      [ arquivo inexistente ou redirecionado ]
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="max-w-3xl mx-auto px-6 py-20 text-center">
      <div className="font-mono text-destructive">ERRO_LEITURA: {error.message}</div>
    </div>
  ),
  component: TheoryPage,
});

function TheoryPage() {
  const { theory, sources } = Route.useLoaderData();

  return (
    <article className="max-w-5xl mx-auto px-6 py-10">
      <Link
        to="/explorer"
        className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-accent mb-6 transition"
      >
        <ArrowLeft className="h-3 w-3" /> voltar ao catálogo
      </Link>

      <header className="relative border border-border rounded-sm bg-card p-6 md:p-8 mb-8 overflow-hidden">
        <div className="absolute top-0 right-0 px-3 py-1.5 font-stamp text-xs tracking-widest text-primary bg-primary/10 border-l border-b border-primary/40">
          {theory.classification}
        </div>
        <div className="font-mono text-[10px] tracking-widest text-accent mb-2">
          FILE//{theory.codename} · {theory.year}
        </div>
        <h1 className="font-stamp text-4xl md:text-5xl text-foreground mb-3 text-glow-classified">
          {theory.title}
        </h1>
        <p className="text-muted-foreground leading-relaxed max-w-3xl">
          {theory.summary}
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-5">
          <CredibilityBadge level={theory.credibility} />
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
            CATEGORIA · {theory.category}
          </span>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_280px] gap-8">
        {/* Main */}
        <div className="space-y-10">
          <section>
            <h2 className="font-stamp text-xl text-foreground mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" /> Timeline
            </h2>
            <ol className="relative border-l border-border pl-6 space-y-5">
              {[
                { d: "1953", e: "Autorização formal pelo diretor da agência." },
                { d: "1961", e: "Primeiros relatórios internos liberados." },
                { d: "1973", e: "Diretor ordena destruição de arquivos." },
                { d: "1977", e: "FOIA recupera 20.000 documentos remanescentes." },
              ].map((step) => (
                <li key={step.d} className="relative">
                  <span className="absolute -left-[27px] top-1.5 h-2 w-2 rounded-full bg-accent" />
                  <div className="font-mono text-xs text-accent">{step.d}</div>
                  <div className="text-sm text-foreground/90">{step.e}</div>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="font-stamp text-xl text-foreground mb-3">
              Análise documental
            </h2>
            <div className="prose-invert max-w-none space-y-3 text-sm text-foreground/90 leading-relaxed">
              <p>
                A documentação indexada — composta por {theory.documents}{" "}
                arquivos catalogados ({theory.document_count} chunks indexados) — sugere padrões investigativos
                consistentes. Os <span className="text-accent">memos internos</span>{" "}
                recuperados via solicitação FOIA apresentam correspondência entre
                operadores identificados na cadeia de comando.
              </p>
              <p>
                Trechos sensíveis foram parcialmente{" "}
                <span className="redacted">REDACTED</span> nos documentos
                originais — o arquivo preserva a marcação para fins históricos.
                A IA contextual deste sistema responde com base apenas nestes
                trechos legíveis.
              </p>
              <p>
                Esta análise <strong className="text-primary">não constitui</strong>{" "}
                afirmação de fato. Trata-se de catalogação documental para
                exploração investigativa.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-stamp text-xl text-foreground mb-3 flex items-center gap-2">
              <Network className="h-4 w-4 text-accent" /> Entidades relacionadas
            </h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {theory.entities.map((e: string) => (
                <div
                  key={e}
                  className="border border-border rounded-sm bg-card px-3 py-2 font-mono text-sm flex items-center gap-2"
                >
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  {e}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Aside */}
        <aside className="space-y-4">
          <div className="border border-border rounded-sm bg-card p-4 space-y-3">
            <div className="font-mono text-[10px] tracking-widest text-muted-foreground">
              METADADOS
            </div>
            <Row k="codename" v={theory.codename} />
            <Row k="período" v={theory.year ?? "—"} />
            <Row k="documentos" v={String(theory.document_count)} />
            <Row k="entidades" v={String(theory.entities.length)} />
            <Row k="classificação" v={theory.classification} />
          </div>

          <div className="border border-border rounded-sm bg-card p-4">
            <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <Tag className="h-3 w-3" /> TAGS
            </div>
            <div className="flex flex-wrap gap-1.5">
              {theory.tags.map((t: string) => (
                <span
                  key={t}
                  className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground border border-border"
                >
                  #{t.toLowerCase().replace(/\s+/g, "_")}
                </span>
              ))}
            </div>
          </div>

          <div className="border border-border rounded-sm bg-card p-4">
            <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <FileText className="h-3 w-3" /> FONTES PRIMÁRIAS
            </div>
            {sources.length === 0 ? (
              <p className="font-mono text-xs text-muted-foreground">
                [ sem fontes indexadas ]
              </p>
            ) : (
              <ul className="space-y-2 text-xs text-foreground/80">
                {sources.map((s) => (
                  <li key={s.id}>
                    · {s.title}
                    {s.year ? ` (${s.year})` : ""}
                    {s.agency ? ` — ${s.agency}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link
            to="/investigator"
            className="block text-center rounded-sm bg-accent text-accent-foreground px-4 py-2.5 font-mono text-xs uppercase tracking-widest hover:bg-accent/90 transition"
          >
            Consultar IA sobre isto
          </Link>
        </aside>
      </div>
    </article>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 font-mono text-xs">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-foreground text-right">{v}</span>
    </div>
  );
}