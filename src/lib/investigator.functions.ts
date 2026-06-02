import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(40),
  context: z.string().max(8000).optional(),
});

const BLOCKED = [
  "alien", "ufo", "ovni", "bíblia", "biblia", "religi", "deus",
  "judeu", "racis", "nazi", "matar", "violência", "violencia",
];

const SYSTEM_PROMPT = `Você é o SHADOW.AI — investigador documental do ShadowArchive.
ESTILO: investigativo, analítico, misterioso, objetivo, neutro. Português.
REGRAS:
- Responda APENAS com base em documentação histórica catalogada e fontes públicas verificáveis (FOIA, arquivos liberados, comissões, jornalismo investigativo).
- Diferencie sempre: [DOCUMENTADO], [PARCIAL], [ESPECULAÇÃO].
- Nunca trate teoria como fato. Nunca incite ódio, violência ou perseguição.
- TEMAS PROIBIDOS (recuse educadamente): alienígenas, UFOs, religião, Bíblia, extremismo, racismo, antissemitismo, violência explícita, desinformação médica.
- TEMAS PERMITIDOS: MKUltra, JFK, COINTELPRO, Operação Condor, Unidade 731, Watergate, NSA/Snowden, Bilderberg, Bohemian Grove, vigilância governamental, vazamentos documentais históricos.
- Cite fontes quando possível (ano, agência, número do documento).
- Termine com um bloco "// REFERÊNCIAS" se houver fontes documentais relevantes.`;

export const investigatorChat = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const lastUser = [...data.messages].reverse().find((m) => m.role === "user");
    if (lastUser) {
      const lc = lastUser.content.toLowerCase();
      if (BLOCKED.some((k) => lc.includes(k))) {
        return {
          reply:
            "// FILTRO DE MODERAÇÃO ATIVO\n\nA consulta toca em temas bloqueados pela política editorial do ShadowArchive (alienígenas, religião, extremismo, violência ou similar). Reformule mantendo o foco em documentação histórica catalogada.",
        };
      }
    }

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY não configurada.");
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(data.context
        ? [{ role: "system" as const, content: `CONTEXTO DOCUMENTAL:\n${data.context}` }]
        : []),
      ...data.messages,
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
      }),
    });

    if (res.status === 429) {
      return { reply: "// LIMITE DE TAXA ATINGIDO\n\nMuitas consultas em sequência. Aguarde alguns segundos." };
    }
    if (res.status === 402) {
      return { reply: "// CRÉDITOS ESGOTADOS\n\nAdicione créditos em Settings → Workspace → Usage para reativar o investigador." };
    }
    if (!res.ok) {
      const t = await res.text();
      console.error("AI gateway error:", res.status, t);
      return { reply: "// CANAL INSTÁVEL\n\nFalha temporária na malha de IA. Tente novamente." };
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = json.choices?.[0]?.message?.content?.trim() ?? "// SEM RESPOSTA";
    return { reply };
  });