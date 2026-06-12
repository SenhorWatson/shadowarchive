import { createServerFn } from "@tanstack/react-start";
import { safeDbError } from "./db-errors";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type TheoryRow = {
  id: string;
  slug: string;
  title: string;
  codename: string;
  summary: string;
  category: string;
  tags: string[];
  entities: string[];
  credibility: "confirmed" | "partial" | "unverified" | "speculative" | "narrative";
  classification: "TOP SECRET" | "CONFIDENTIAL" | "DECLASSIFIED" | "RESTRICTED";
  year: string | null;
  document_count: number;
};

export type SourceRow = {
  id: string;
  theory_id: string;
  title: string;
  source_type: string;
  agency: string | null;
  year: string | null;
  url: string | null;
  description: string | null;
  credibility: TheoryRow["credibility"];
};

export const listTheories = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("theories")
    .select("*")
    .order("title", { ascending: true });
  if (error) throw safeDbError(error);
  return { theories: (data ?? []) as TheoryRow[] };
});

export const getTheoryBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ slug: z.string().min(1).max(120) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { data: theory, error } = await supabaseAdmin
      .from("theories")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw safeDbError(error);
    if (!theory) return { theory: null, sources: [] as SourceRow[] };

    const { data: sources, error: srcErr } = await supabaseAdmin
      .from("sources")
      .select("*")
      .eq("theory_id", theory.id)
      .order("year", { ascending: false });
    if (srcErr) throw safeDbError(srcErr);

    return {
      theory: theory as TheoryRow,
      sources: (sources ?? []) as SourceRow[],
    };
  });

export const listAllSources = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("sources")
    .select("*, theories(slug, title, codename)")
    .order("year", { ascending: false });
  if (error) throw safeDbError(error);
  return { sources: data ?? [] };
});

export const getSignedDocumentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ path: z.string().min(1).max(500) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    // Apenas admin/editor podem baixar documentos privados.
    const { data: roleRows, error: rErr } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (rErr) throw safeDbError(rErr);
    const roles = (roleRows ?? []).map((r) => r.role);
    if (!roles.includes("admin") && !roles.includes("editor")) {
      throw new Error("Acesso negado a documentos restritos.");
    }
    const { data: signed, error } = await supabaseAdmin.storage
      .from("documents")
      .createSignedUrl(data.path, 60 * 10);
    if (error) throw safeDbError(error);
    return { url: signed.signedUrl };
  });

const searchSchema = z.object({
  query: z.string().trim().min(1).max(500),
  limit: z.number().int().min(1).max(8).default(4),
});

export const searchTheoryContext = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => searchSchema.parse(input))
  .handler(async ({ data }) => {
    const q = data.query.toLowerCase();
    const tokens = Array.from(
      new Set(q.split(/[^a-záéíóúâêîôûãõç0-9]+/i).filter((t) => t.length > 3)),
    ).slice(0, 8);

    const { data: rows, error } = await supabaseAdmin
      .from("theories")
      .select("id, slug, title, codename, summary, tags, entities, year, credibility");
    if (error) throw safeDbError(error);

    const scored = (rows ?? []).map((t) => {
      const hay = `${t.title} ${t.codename} ${t.summary} ${(t.tags ?? []).join(" ")} ${(t.entities ?? []).join(" ")}`.toLowerCase();
      let score = 0;
      for (const tk of tokens) {
        if (hay.includes(tk)) score += 2;
      }
      if (hay.includes(q)) score += 5;
      return { theory: t, score };
    });
    const top = scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, data.limit)
      .map((s) => s.theory);

    if (!top.length) return { matches: [] };

    const ids = top.map((t) => t.id);
    const { data: srcs } = await supabaseAdmin
      .from("sources")
      .select("theory_id, title, agency, year, url, credibility")
      .in("theory_id", ids)
      .limit(40);
    const byTheory = new Map<string, typeof srcs>();
    for (const s of srcs ?? []) {
      const arr = byTheory.get(s.theory_id) ?? [];
      arr.push(s);
      byTheory.set(s.theory_id, arr);
    }
    return {
      matches: top.map((t) => ({
        slug: t.slug,
        title: t.title,
        codename: t.codename,
        summary: t.summary,
        year: t.year,
        credibility: t.credibility,
        sources: (byTheory.get(t.id) ?? []).slice(0, 5),
      })),
    };
  });