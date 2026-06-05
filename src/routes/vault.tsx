import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { FileText, Plus, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shadow/PageHeader";
import { useAuth } from "@/hooks/use-auth";
import { listPastes } from "@/lib/pastes.functions";

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
  const { user } = useAuth();
  const fetchPastes = useServerFn(listPastes);
  const { data, isLoading } = useQuery({
    queryKey: ["pastes"],
    queryFn: () => fetchPastes(),
  });
  const pastes = data?.pastes ?? [];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <PageHeader
        code="04 / PASTE VAULT"
        title="Cofre de Publicações"
        description="Relatórios investigativos em markdown. Versionamento, drafts e exportação."
        actions={
          user ? (
            <Link
              to="/vault/new"
              className="inline-flex items-center gap-2 rounded-sm bg-primary text-primary-foreground px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-primary/90 transition"
            >
              <Plus className="h-3.5 w-3.5" /> Novo paste
            </Link>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-sm border border-border px-4 py-2 font-mono text-xs uppercase tracking-widest hover:border-accent hover:text-accent transition"
            >
              <Plus className="h-3.5 w-3.5" /> Entrar para publicar
            </Link>
          )
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
        </div>
      ) : pastes.length === 0 ? (
        <div className="border border-dashed border-border rounded-sm p-10 text-center font-mono text-xs text-muted-foreground">
          Nenhum relatório publicado ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {pastes.map((p) => (
            <Link
              key={p.id}
              to="/vault/$slug"
              params={{ slug: p.slug }}
              className="block border border-border rounded-sm bg-card p-5 hover:border-accent/50 transition group"
            >
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-4 w-4 text-accent shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-stamp text-lg text-foreground group-hover:text-accent transition truncate">
                    {p.title}
                  </h3>
                  <div className="font-mono text-[10px] tracking-widest text-muted-foreground mt-0.5">
                    {p.slug} · {p.author} · {new Date(p.created_at).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">
              {p.excerpt}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(p.tags ?? []).map((t: string) => (
                <span
                  key={t}
                  className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground border border-border"
                >
                  #{t.toLowerCase().replace(/\s+/g, "_")}
                </span>
              ))}
            </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}