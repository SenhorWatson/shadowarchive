import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { FileText, Download, Upload, ExternalLink, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shadow/PageHeader";
import { listAllSources, getSignedDocumentUrl } from "@/lib/theories.functions";
import { useState } from "react";

export const Route = createFileRoute("/sources")({
  head: () => ({
    meta: [
      { title: "Source Library — ShadowArchive AI" },
      {
        name: "description",
        content: "Biblioteca de fontes documentais catalogadas.",
      },
      { property: "og:title", content: "Source Library — ShadowArchive AI" },
      {
        property: "og:description",
        content: "PDFs, e-books, transcrições e documentos liberados.",
      },
    ],
  }),
  component: SourcesPage,
});

type SourceWithTheory = {
  id: string;
  title: string;
  source_type: string;
  agency: string | null;
  year: string | null;
  url: string | null;
  description: string | null;
  credibility: string;
  file_path: string | null;
  theories: { slug: string; title: string; codename: string } | null;
};

function credibilityScore(c: string) {
  return (
    { confirmed: 95, partial: 70, unverified: 45, speculative: 30, narrative: 15 }[
      c
    ] ?? 50
  );
}

function SourcesPage() {
  const fetchSources = useServerFn(listAllSources);
  const { data, isLoading } = useQuery({
    queryKey: ["sources"],
    queryFn: () => fetchSources(),
  });
  const sources = (data?.sources ?? []) as SourceWithTheory[];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <PageHeader
        code="03 / SOURCE LIBRARY"
        title="Biblioteca de Fontes"
        description="Catalogação completa: título, autor, origem, tipo, tags, score de confiabilidade e entidades relacionadas."
        actions={
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 rounded-sm border border-accent/50 bg-accent/10 text-accent px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-accent/20 transition"
          >
            <Upload className="h-3.5 w-3.5" /> Ingerir nova fonte
          </Link>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
        </div>
      ) : sources.length === 0 ? (
        <div className="border border-dashed border-border rounded-sm p-12 text-center font-mono text-sm text-muted-foreground">
          nenhuma fonte catalogada ainda — abra <code>/admin</code> para registrar a primeira.
        </div>
      ) : (
      <div className="border border-border rounded-sm bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border">
            <tr className="font-mono text-[10px] tracking-widest text-muted-foreground">
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-4 py-3">TÍTULO / AUTOR</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">TIPO</th>
              <th className="text-left px-4 py-3 hidden lg:table-cell">ORIGEM</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">ANO</th>
              <th className="text-left px-4 py-3">CONFIAB.</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sources.map((s) => (
              <tr key={s.id} className="hover:bg-muted/30 transition">
                <td className="px-4 py-3 font-mono text-[11px] text-accent align-top">
                  {s.id.slice(0, 8)}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    {s.title}
                  </div>
                  {s.theories && (
                    <Link
                      to="/theory/$slug"
                      params={{ slug: s.theories.slug }}
                      className="text-xs text-muted-foreground mt-0.5 hover:text-accent inline-block"
                    >
                      → {s.theories.codename} · {s.theories.title}
                    </Link>
                  )}
                  {s.description && (
                    <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-2">
                      {s.description}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 hidden md:table-cell font-mono text-xs text-foreground/80">
                  {s.source_type}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                  {s.agency ?? "—"}
                </td>
                <td className="px-4 py-3 hidden md:table-cell font-mono text-xs">
                  {s.year ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${credibilityScore(s.credibility)}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-accent uppercase">
                      {s.credibility}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <SourceActions source={s} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}

function SourceActions({ source }: { source: SourceWithTheory }) {
  const signFn = useServerFn(getSignedDocumentUrl);
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!source.file_path) return;
    setLoading(true);
    try {
      const { url } = await signFn({ data: { path: source.file_path } });
      window.open(url, "_blank", "noopener");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      {source.url && (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-accent transition"
          title="Abrir URL externa"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
      {source.file_path && (
        <button
          onClick={handleDownload}
          disabled={loading}
          className="text-muted-foreground hover:text-accent transition disabled:opacity-50"
          title="Baixar documento"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
}