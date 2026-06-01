import { createFileRoute } from "@tanstack/react-router";
import { FileText, Download, Upload } from "lucide-react";
import { sources } from "@/lib/mock-data";
import { PageHeader } from "@/components/shadow/PageHeader";

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

function SourcesPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <PageHeader
        code="03 / SOURCE LIBRARY"
        title="Biblioteca de Fontes"
        description="Catalogação completa: título, autor, origem, tipo, tags, score de confiabilidade e entidades relacionadas."
        actions={
          <button className="inline-flex items-center gap-2 rounded-sm border border-accent/50 bg-accent/10 text-accent px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-accent/20 transition">
            <Upload className="h-3.5 w-3.5" /> Ingerir nova fonte
          </button>
        }
      />

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
                  {s.id}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    {s.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {s.author}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {s.tags.map((t) => (
                      <span
                        key={t}
                        className="font-mono text-[9px] px-1 py-0.5 rounded-sm bg-muted text-muted-foreground border border-border"
                      >
                        #{t.toLowerCase().replace(/\s+/g, "_")}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell font-mono text-xs text-foreground/80">
                  {s.type}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                  {s.origin}
                </td>
                <td className="px-4 py-3 hidden md:table-cell font-mono text-xs">
                  {s.year}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${s.reliability}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-accent">
                      {s.reliability}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-muted-foreground hover:text-accent transition">
                    <Download className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}