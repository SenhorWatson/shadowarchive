import { createFileRoute } from "@tanstack/react-router";
import { Network } from "lucide-react";
import { PageHeader } from "@/components/shadow/PageHeader";
import { theories } from "@/lib/mock-data";

export const Route = createFileRoute("/graph")({
  head: () => ({
    meta: [
      { title: "Graph View — ShadowArchive AI" },
      {
        name: "description",
        content: "Visualização relacional de entidades e operações.",
      },
      { property: "og:title", content: "Graph View — ShadowArchive AI" },
      {
        property: "og:description",
        content: "Mapa investigativo de conexões.",
      },
    ],
  }),
  component: GraphPage,
});

function GraphPage() {
  const entities = Array.from(new Set(theories.flatMap((t) => t.entities))).slice(0, 14);
  const cx = 400;
  const cy = 260;
  const r = 200;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <PageHeader
        code="05 / GRAPH VIEW"
        title="Mapa Relacional"
        description="Versão preliminar (MVP). A V2 trará grafo dinâmico com Cytoscape/D3 conectando pessoas, organizações, eventos e operações."
      />

      <div className="relative border border-border rounded-sm bg-card overflow-hidden grid-bg scanlines">
        <div className="scan-line" />
        <div className="absolute top-3 left-4 font-mono text-[10px] tracking-widest text-accent z-10">
          NODE GRAPH · PREVIEW · {entities.length} entidades
        </div>
        <svg viewBox="0 0 800 520" className="w-full h-[520px]">
          {entities.map((_, i) => {
            const a = (i / entities.length) * Math.PI * 2;
            const x = cx + Math.cos(a) * r;
            const y = cy + Math.sin(a) * r;
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                stroke="oklch(0.78 0.18 145 / 0.25)"
                strokeWidth="1"
              />
            );
          })}
          <circle
            cx={cx}
            cy={cy}
            r="36"
            fill="oklch(0.82 0.16 85 / 0.15)"
            stroke="oklch(0.82 0.16 85)"
            strokeWidth="1.5"
          />
          <text
            x={cx}
            y={cy + 4}
            textAnchor="middle"
            className="fill-primary font-mono text-[11px]"
          >
            SHADOW//AI
          </text>
          {entities.map((e, i) => {
            const a = (i / entities.length) * Math.PI * 2;
            const x = cx + Math.cos(a) * r;
            const y = cy + Math.sin(a) * r;
            return (
              <g key={e}>
                <circle
                  cx={x}
                  cy={y}
                  r="18"
                  fill="oklch(0.17 0.014 240)"
                  stroke="oklch(0.78 0.18 145)"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={y + 32}
                  textAnchor="middle"
                  className="fill-foreground font-mono text-[10px]"
                >
                  {e.length > 18 ? e.slice(0, 16) + "…" : e}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <p className="font-mono text-[11px] text-muted-foreground mt-4">
        [ placeholder visual · grafo dinâmico interativo programado para V2 ]
      </p>
    </div>
  );
}