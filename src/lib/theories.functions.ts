import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
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
  if (error) throw new Error(error.message);
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
    if (error) throw new Error(error.message);
    if (!theory) return { theory: null, sources: [] as SourceRow[] };

    const { data: sources, error: srcErr } = await supabaseAdmin
      .from("sources")
      .select("*")
      .eq("theory_id", theory.id)
      .order("year", { ascending: false });
    if (srcErr) throw new Error(srcErr.message);

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
  if (error) throw new Error(error.message);
  return { sources: data ?? [] };
});