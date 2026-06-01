import { createFileRoute } from "@tanstack/react-router";
import { Upload, ShieldAlert, Activity, FileWarning } from "lucide-react";
import { PageHeader } from "@/components/shadow/PageHeader";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — ShadowArchive AI" },
      {
        name: "description",
        content: "Painel administrativo do ShadowArchive.",
      },
      { property: "og:title", content: "Admin Panel — ShadowArchive AI" },
      {
        property: "og:description",
        content: "Gerenciamento, moderação e analytics.",
      },
    ],
  }),
  component: AdminPage,
});

const logs = [
  { id: "log-001", level: "blocked", reason: "Keyword: UFO", time: "há 5 min" },
  { id: "log-002", level: "approved", reason: "Upload aprovado: cia_jfk.pdf", time: "há 22 min" },
  { id: "log-003", level: "flagged", reason: "Revisão manual: discurso ambíguo", time: "há 1 h" },
  { id: "log-004", level: "blocked", reason: "Keyword: religion", time: "há 2 h" },
];

function AdminPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <PageHeader
        code="06 / ADMIN PANEL"
        title="Centro de Controle"
        description="Ingestão documental, moderação automática, logs e analytics básicos."
      />

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Activity, label: "UPLOADS / 24H", value: "32" },
          { icon: ShieldAlert, label: "BLOQUEIOS / 24H", value: "16" },
          { icon: FileWarning, label: "PENDENTES REVISÃO", value: "4" },
        ].map((s) => (
          <div key={s.label} className="border border-border rounded-sm bg-card p-5 flex items-center gap-4">
            <s.icon className="h-6 w-6 text-accent" />
            <div>
              <div className="font-stamp text-3xl text-foreground">{s.value}</div>
              <div className="font-mono text-[10px] tracking-widest text-muted-foreground">
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload */}
        <div className="border border-border rounded-sm bg-card p-6">
          <h2 className="font-stamp text-xl text-foreground mb-1">Ingestão documental</h2>
          <p className="text-xs text-muted-foreground mb-4 font-mono">
            PDF · EPUB · TXT · MD · OCR · transcrições
          </p>
          <label className="block border-2 border-dashed border-border rounded-sm p-10 text-center hover:border-accent transition cursor-pointer">
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <div className="font-mono text-sm text-foreground mb-1">
              arraste arquivos ou clique para selecionar
            </div>
            <div className="font-mono text-[10px] text-muted-foreground">
              max 50MB · pipeline: extract → chunk → embed → index
            </div>
            <input type="file" className="hidden" />
          </label>
        </div>

        {/* Moderation log */}
        <div className="border border-border rounded-sm bg-card">
          <div className="border-b border-border px-5 py-3 flex items-center justify-between">
            <h2 className="font-stamp text-xl text-foreground">Logs de moderação</h2>
            <span className="font-mono text-[10px] text-accent">LIVE</span>
          </div>
          <ul className="divide-y divide-border">
            {logs.map((l) => (
              <li key={l.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`font-mono text-[9px] tracking-widest px-1.5 py-0.5 rounded-sm border uppercase ${
                      l.level === "blocked"
                        ? "border-destructive/40 text-destructive bg-destructive/10"
                        : l.level === "flagged"
                          ? "border-primary/40 text-primary bg-primary/10"
                          : "border-accent/40 text-accent bg-accent/10"
                    }`}
                  >
                    {l.level}
                  </span>
                  <span className="text-sm text-foreground/90 truncate">{l.reason}</span>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                  {l.time}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}