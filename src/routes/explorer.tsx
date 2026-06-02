import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter } from "lucide-react";
import { CREDIBILITY_LABEL, type Credibility } from "@/lib/mock-data";
import { listTheories } from "@/lib/theories.functions";
import { TheoryCard } from "@/components/shadow/TheoryCard";
import { PageHeader } from "@/components/shadow/PageHeader";

export const Route = createFileRoute("/explorer")({
  head: () => ({
    meta: [
      { title: "Explorer — ShadowArchive AI" },
      {
        name: "description",
        content: "Navegue por teorias catalogadas, filtros e tags investigativos.",
      },
      { property: "og:title", content: "Explorer — ShadowArchive AI" },
      {
        property: "og:description",
        content: "Catálogo investigativo de teorias e operações documentadas.",
      },
    ],
  }),
  component: ExplorerPage,
});

function ExplorerPage() {
  const fetchTheories = useServerFn(listTheories);
  const { data, isLoading, error } = useQuery({
    queryKey: ["theories"],
    queryFn: () => fetchTheories(),
  });
  const theories = data?.theories ?? [];

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [cred, setCred] = useState<Credibility | "all">("all");

  const categories = useMemo(
    () => Array.from(new Set(theories.map((t) => t.category))),
    [theories],
  );

  const filtered = theories.filter((t) => {
    const q = query.toLowerCase();
    const matchQ =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.summary.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q));
    const matchCat = category === "all" || t.category === category;
    const matchCred = cred === "all" || t.credibility === cred;
    return matchQ && matchCat && matchCred;
  });

  const mapped = filtered.map((t) => ({
    slug: t.slug,
    title: t.title,
    codename: t.codename,
    summary: t.summary,
    tags: t.tags,
    entities: t.entities,
    credibility: t.credibility,
    classification: t.classification,
    documents: t.document_count,
    year: t.year,
  }));

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <PageHeader
        code="01 / EXPLORER"
        title="Catálogo Investigativo"
        description="Lista completa de teorias e operações catalogadas. Filtre por categoria, credibilidade ou tag."
      />

      <div className="grid md:grid-cols-[280px_1fr] gap-8">
        {/* Filters */}
        <aside className="space-y-6">
          <div className="border border-border rounded-sm bg-card p-4 space-y-2">
            <label className="font-mono text-[10px] tracking-widest text-muted-foreground flex items-center gap-2">
              <Search className="h-3 w-3" /> BUSCA
            </label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="palavra-chave..."
              className="w-full bg-input/40 border border-border rounded-sm px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent transition"
            />
          </div>

          <div className="border border-border rounded-sm bg-card p-4 space-y-3">
            <div className="font-mono text-[10px] tracking-widest text-muted-foreground flex items-center gap-2">
              <Filter className="h-3 w-3" /> CATEGORIA
            </div>
            <div className="space-y-1">
              {[{ k: "all", l: "Todas" }, ...categories.map((c) => ({ k: c, l: c }))].map(
                (c) => (
                  <button
                    key={c.k}
                    onClick={() => setCategory(c.k)}
                    className={`block w-full text-left font-mono text-xs px-2 py-1.5 rounded-sm transition ${
                      category === c.k
                        ? "bg-accent/10 text-accent border-l-2 border-accent"
                        : "text-muted-foreground hover:text-foreground border-l-2 border-transparent"
                    }`}
                  >
                    {c.l}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="border border-border rounded-sm bg-card p-4 space-y-3">
            <div className="font-mono text-[10px] tracking-widest text-muted-foreground">
              CREDIBILIDADE
            </div>
            <div className="space-y-1">
              {(
                [
                  ["all", "Todos os níveis"],
                  ...Object.entries(CREDIBILITY_LABEL),
                ] as [string, string][]
              ).map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setCred(k as Credibility | "all")}
                  className={`block w-full text-left font-mono text-xs px-2 py-1.5 rounded-sm transition ${
                    cred === k
                      ? "bg-primary/10 text-primary border-l-2 border-primary"
                      : "text-muted-foreground hover:text-foreground border-l-2 border-transparent"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-4 font-mono text-[11px] text-muted-foreground">
            <span>
              {isLoading
                ? "carregando arquivo..."
                : `${mapped.length} ${mapped.length === 1 ? "resultado" : "resultados"} encontrado${mapped.length === 1 ? "" : "s"}`}
            </span>
            <span>SORT: relevância · DESC</span>
          </div>

          {error ? (
            <div className="border border-destructive/40 rounded-sm p-6 text-center font-mono text-sm text-destructive">
              [ falha ao consultar o arquivo ]
            </div>
          ) : isLoading ? (
            <div className="border border-dashed border-border rounded-sm p-12 text-center font-mono text-sm text-muted-foreground">
              [ decriptando índice... ]
            </div>
          ) : mapped.length === 0 ? (
            <div className="border border-dashed border-border rounded-sm p-12 text-center font-mono text-sm text-muted-foreground">
              [ nenhum registro corresponde à query ]
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {mapped.map((t, i) => (
                <TheoryCard key={t.slug} theory={t} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}