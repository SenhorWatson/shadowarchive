import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const FORBIDDEN = [
  "alien","alienígena","alienigena","ufo","óvni","ovni",
  "bíblia","biblia","religião","religiao","religion",
  "racism","racismo","antisemit","antissemit",
  "extremism","extremismo","violence","violência","violencia",
];
function rejectForbidden(text: string) {
  const lower = text.toLowerCase();
  for (const t of FORBIDDEN) {
    if (lower.includes(t)) throw new Error(`Conteúdo bloqueado: "${t}".`);
  }
}

async function assertEditor(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId);
  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r) => r.role);
  if (!roles.includes("admin") && !roles.includes("editor")) {
    throw new Error("Acesso negado: requer papel admin ou editor.");
  }
  return roles;
}

export const listPastes = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("pastes")
    .select("id, slug, title, excerpt, tags, author, created_at, published")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return { pastes: data ?? [] };
});

export const getPaste = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ slug: z.string().min(1).max(120) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("pastes")
      .select("*")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Paste não encontrado.");
    return { paste: row };
  });

const pasteSchema = z.object({
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/, "use kebab-case"),
  title: z.string().min(3).max(200),
  excerpt: z.string().max(500).default(""),
  body_md: z.string().min(10).max(50000),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
  author: z.string().min(1).max(60).default("shadow_archive"),
  published: z.boolean().default(true),
});

export const createPaste = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => pasteSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertEditor(context.userId);
    rejectForbidden(`${data.title} ${data.excerpt} ${data.body_md} ${data.tags.join(" ")}`);
    const { data: row, error } = await supabaseAdmin
      .from("pastes")
      .insert({ ...data, created_by: context.userId })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("moderation_logs").insert({
      level: "approved",
      reason: `Paste criado: ${data.slug}`,
      user_id: context.userId,
      context: { paste_id: row.id, slug: data.slug },
    });
    return { paste: row };
  });

export const deletePaste = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const roles = await assertEditor(context.userId);
    if (!roles.includes("admin")) throw new Error("Apenas admin pode remover pastes.");
    const { error } = await supabaseAdmin.from("pastes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });