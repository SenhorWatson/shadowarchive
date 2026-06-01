import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Search, ArrowRight, Activity, FileText, AlertTriangle, Database } from "lucide-react";
import { feed, theories } from "@/lib/mock-data";
import { TheoryCard } from "@/components/shadow/TheoryCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ShadowArchive AI — Arquivo Investigativo" },
      {
        name: "description",
        content:
          "Arquivo investigativo cyberpunk com IA contextual. Catalogue, explore e contextualize documentos classificados.",
      },
      { property: "og:title", content: "ShadowArchive AI" },
      {
        property: "og:description",
        content: "Arquivo investigativo cyberpunk com IA contextual.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const featured = theories.slice(0, 3);
  const recent = theories.slice(3, 9);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border grid-bg scanlines">
        <div className="scan-line" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-sm border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-[11px] tracking-widest text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              ARQUIVO ATIVO · 1.347 DOCUMENTOS · 9 OPERAÇÕES ABERTAS
            </div>
            <h1 className="font-stamp text-5xl md:text-7xl leading-[1.05] text-foreground max-w-4xl text-glow-classified">
              O arquivo que <span className="text-primary">eles</span>
              <br />não queriam <span className="text-accent cursor-blink">indexar</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl text-base md:text-lg leading-relaxed">
              ShadowArchive AI é uma central investigativa documental. Catalogue
              fontes, conecte entidades e consulte uma IA treinada apenas no que
              foi indexado — sem alucinação, sem ficção, apenas o registro.
            </p>

            {/* Search */}
            <Link
              to="/investigator"
              className="group flex items-center gap-3 max-w-2xl rounded-sm border border-border bg-card/80 backdrop-blur px-4 py-3 hover:border-accent transition-colors"
            >
              <Search className="h-4 w-4 text-accent" />
              <span className="flex-1 font-mono text-sm text-muted-foreground">
                ex: "Conecte MKUltra à Operação Midnight Climax"
              </span>
              <kbd className="font-mono text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
                ENTER
              </kbd>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
            </Link>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/explorer"
                className="inline-flex items-center gap-2 rounded-sm bg-primary text-primary-foreground px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-primary/90 transition glitch-hover"
              >
                Acessar Explorer
                <ArrowRight className="h-3 w-3" />
              </Link>
              <Link
                to="/sources"
                className="inline-flex items-center gap-2 rounded-sm border border-border bg-transparent px-4 py-2 font-mono text-xs uppercase tracking-widest text-foreground hover:border-accent hover:text-accent transition"
              >
                Biblioteca de Fontes
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-b border-border">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {[
            { icon: Database, label: "DOCUMENTOS INDEXADOS", value: "1.347" },
            { icon: FileText, label: "TEORIAS CATALOGADAS", value: "287" },
            { icon: Activity, label: "QUERIES IA / 24H", value: "4.812" },
            { icon: AlertTriangle, label: "BLOQUEIOS MODERAÇÃO", value: "16" },
          ].map((s) => (
            <div key={s.label} className="p-6 flex items-center gap-3">
              <s.icon className="h-5 w-5 text-accent" />
              <div>
                <div className="font-stamp text-2xl text-foreground">{s.value}</div>
                <div className="font-mono text-[10px] tracking-widest text-muted-foreground">
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MAIN GRID */}
      <section className="max-w-6xl mx-auto px-6 py-12 grid lg:grid-cols-[1fr_320px] gap-10">
        {/* Featured */}
        <div className="space-y-10">
          <div>
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="font-stamp text-2xl text-foreground">
                Operações em destaque
              </h2>
              <Link
                to="/explorer"
                className="font-mono text-[11px] text-accent hover:underline"
              >
                Ver todas →
              </Link>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {featured.map((t, i) => (
                <TheoryCard key={t.slug} theory={t} index={i} />
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-stamp text-2xl text-foreground mb-5">
              Artigos recentes
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {recent.map((t, i) => (
                <TheoryCard key={t.slug} theory={t} index={i} />
              ))}
            </div>
          </div>
        </div>

        {/* Feed sidebar */}
        <aside className="space-y-4">
          <div className="border border-border rounded-sm bg-card">
            <div className="border-b border-border px-4 py-3 flex items-center justify-between">
              <h3 className="font-mono text-xs tracking-widest text-foreground">
                FEED // TICKER
              </h3>
              <span className="flex items-center gap-1 font-mono text-[10px] text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                LIVE
              </span>
            </div>
            <ul className="divide-y divide-border">
              {feed.map((f) => (
                <li key={f.id} className="px-4 py-3 hover:bg-muted/40 transition">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border ${
                        f.type === "alert"
                          ? "border-destructive/40 text-destructive bg-destructive/10"
                          : f.type === "ingestion"
                            ? "border-accent/40 text-accent bg-accent/10"
                            : "border-primary/40 text-primary bg-primary/10"
                      }`}
                    >
                      {f.type}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {f.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    {f.message}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-primary/30 bg-primary/5 rounded-sm p-4 font-mono text-[11px] text-foreground/80 leading-relaxed">
            <div className="text-primary mb-1 tracking-widest">// AVISO</div>
            Todo conteúdo aqui é tratado como investigação documental. Teorias
            não são apresentadas como fatos absolutos. Leia com pensamento
            crítico.
          </div>
        </aside>
      </section>
    </div>
  );
}
