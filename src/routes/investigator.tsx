import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, FileText, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/shadow/PageHeader";
import { investigatorChat } from "@/lib/investigator.functions";
import { searchTheoryContext } from "@/lib/theories.functions";

export const Route = createFileRoute("/investigator")({
  head: () => ({
    meta: [
      { title: "AI Investigator — ShadowArchive AI" },
      {
        name: "description",
        content:
          "Assistente investigativo IA contextual baseado apenas em documentos indexados.",
      },
      { property: "og:title", content: "AI Investigator — ShadowArchive AI" },
      {
        property: "og:description",
        content: "Converse com uma IA investigativa documental.",
      },
    ],
  }),
  component: InvestigatorPage,
});

interface Msg {
  role: "user" | "ai";
  content: string;
  refs?: { slug: string; title: string }[];
}

const SUGGESTIONS = [
  "Conecte MKUltra à CIA",
  "Mostre documentos liberados sobre JFK",
  "Quais conexões existem entre Bohemian Grove e política?",
  "Resuma a Unidade 731",
];

function InvestigatorPage() {
  const chatFn = useServerFn(investigatorChat);
  const searchFn = useServerFn(searchTheoryContext);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "ai",
      content:
        "Canal seguro estabelecido. Sou o investigador IA do ShadowArchive. Trabalho exclusivamente com documentos indexados neste arquivo. Não invento, não especulo além das fontes. Qual é a sua consulta?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || loading) return;
    const nextMsgs: Msg[] = [...messages, { role: "user", content: t }];
    setMessages(nextMsgs);
    setInput("");
    setLoading(true);
    try {
      const search = await searchFn({ data: { query: t, limit: 4 } });
      const matches = search.matches ?? [];
      const context = matches.length
        ? matches
            .map(
              (m) =>
                `- ${m.codename} (${m.title}) [${m.credibility}${m.year ? `, ${m.year}` : ""}]: ${m.summary}` +
                (m.sources.length
                  ? `\n  Fontes: ${m.sources.map((s) => `${s.title}${s.agency ? ` (${s.agency})` : ""}${s.year ? ` ${s.year}` : ""}`).join("; ")}`
                  : ""),
            )
            .join("\n")
        : undefined;
      const refs = matches.map((m) => ({ slug: m.slug, title: m.title }));
      const payload = nextMsgs.map((m) => ({
        role: m.role === "ai" ? ("assistant" as const) : ("user" as const),
        content: m.content,
      }));
      const r = await chatFn({ data: { messages: payload, context } });
      setMessages((m) => [
        ...m,
        { role: "ai", content: r.reply, refs: refs.length ? refs : undefined },
      ]);
    } catch (e) {
      console.error(e);
      setMessages((m) => [
        ...m,
        { role: "ai", content: "// FALHA DE TRANSMISSÃO\n\nNão foi possível processar a consulta. Tente novamente." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <PageHeader
        code="02 / AI INVESTIGATOR"
        title="Investigador Contextual"
        description="IA conversacional baseada em RAG vetorial sobre o arquivo. Estilo documental, neutro, investigativo. Temas proibidos são bloqueados na camada de moderação."
      />

      <div className="grid lg:grid-cols-[1fr_240px] gap-6">
        <div className="border border-border rounded-sm bg-card flex flex-col h-[calc(100vh-22rem)] min-h-[480px] overflow-hidden">
          {/* Header */}
          <div className="border-b border-border px-4 py-3 flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2 font-mono text-xs">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span className="text-foreground">SESSION//α-7F-001</span>
              <span className="text-muted-foreground">· RAG · vector_db: pgvector</span>
            </div>
            <span className="flex items-center gap-1 font-mono text-[10px] text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" /> ONLINE
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={
                    m.role === "user" ? "flex justify-end" : "flex justify-start"
                  }
                >
                  <div
                    className={`max-w-[85%] rounded-sm border px-4 py-3 ${
                      m.role === "user"
                        ? "bg-primary/10 border-primary/30 text-foreground"
                        : "bg-background border-border"
                    }`}
                  >
                    <div className="font-mono text-[10px] tracking-widest mb-1.5 text-muted-foreground">
                      {m.role === "user" ? "OPERATOR //" : "SHADOW.AI //"}
                    </div>
                    <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                      {m.content}
                    </div>
                    {m.refs && m.refs.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border space-y-1">
                        <div className="font-mono text-[10px] tracking-widest text-accent">
                          REFERÊNCIAS DOCUMENTAIS
                        </div>
                        {m.refs.map((r) => (
                          <a
                            key={r.slug}
                            href={`/theory/${r.slug}`}
                            className="flex items-center gap-2 font-mono text-xs text-foreground/80 hover:text-accent transition"
                          >
                            <FileText className="h-3 w-3" /> {r.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <div className="flex justify-start">
                <div className="bg-background border border-border rounded-sm px-4 py-3">
                  <div className="font-mono text-[10px] tracking-widest mb-1.5 text-muted-foreground">
                    SHADOW.AI //
                  </div>
                  <div className="flex items-center gap-1 font-mono text-sm text-accent">
                    <span className="animate-pulse">decrypting query</span>
                    <span className="cursor-blink" />
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-border p-3 flex items-end gap-2 bg-muted/20"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="> consulte o arquivo..."
              className="flex-1 resize-none bg-background border border-border rounded-sm px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent transition min-h-[40px] max-h-32"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-sm bg-accent text-accent-foreground px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-accent/90 disabled:opacity-40 transition flex items-center gap-2"
            >
              <Send className="h-3.5 w-3.5" /> SEND
            </button>
          </form>
        </div>

        {/* Side */}
        <aside className="space-y-4">
          <div className="border border-border rounded-sm bg-card p-4">
            <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-3">
              SUGESTÕES
            </div>
            <div className="space-y-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="w-full text-left text-xs font-mono text-foreground/80 hover:text-accent border border-border hover:border-accent/60 rounded-sm px-3 py-2 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-destructive/30 bg-destructive/5 rounded-sm p-4">
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-destructive mb-2">
              <AlertTriangle className="h-3 w-3" /> FILTRO ATIVO
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              Temas bloqueados: alienígenas, UFOs, religiões, extremismo,
              violência, racismo, antissemitismo, desinformação médica.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}