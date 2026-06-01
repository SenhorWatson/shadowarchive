import { createFileRoute } from "@tanstack/react-router";
import { FileText, Plus } from "lucide-react";
import { pastes } from "@/lib/mock-data";
import { PageHeader } from "@/components/shadow/PageHeader";

export const Route = createFileRoute("/vault")({
  head: () => ({
    meta: [
      { title: "Paste Vault — ShadowArchive AI" },
      {
        name: "description",
        content: "Arquivos investigativos publicados em formato markdown.",
      },
      { property: "og:title", content: "Paste Vault — ShadowArchive AI" },
      {
        property: "og:description",
        content: "Relatórios e análises investigativas.",
      },
    ],
  }),
  component: VaultPage,
});

function VaultPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <PageHeader
        code="04 / PASTE VAULT"
        title="Cofre de Publicações"
        description="Relatórios investigativos em markdown. Versionamento, drafts e exportação."
        actions={
          <button className="inline-flex items-center gap-2 rounded-sm bg-primary text-primary-foreground px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-primary/90 transition">
            <Plus className="h-3.5 w-3.5" /> Novo paste
          </button>
        }
      />

      <div className="space-y-3">
        {pastes.map((p) => (
          <article
            key={p.id}
            className="border border-border rounded-sm bg-card p-5 hover:border-accent/50 transition group cursor-pointer"
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-4 w-4 text-accent shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-stamp text-lg text-foreground group-hover:text-accent transition truncate">
                    {p.title}
                  </h3>
                  <div className="font-mono text-[10px] tracking-widest text-muted-foreground mt-0.5">
                    {p.id} · {p.author} · {p.date}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">
              {p.excerpt}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {p.tags.map((t) => (
                <span
                  key={t}
                  className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground border border-border"
                >
                  #{t.toLowerCase().replace(/\s+/g, "_")}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}