import { createServerFn } from "@tanstack/react-start";
import { safeDbError } from "./db-errors";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { notifyTelegram } from "./telegram.server";

const credibility = z.enum([
  "confirmed",
  "partial",
  "unverified",
  "speculative",
  "narrative",
]);
const classification = z.enum([
  "TOP SECRET",
  "CONFIDENTIAL",
  "DECLASSIFIED",
  "RESTRICTED",
]);

const FORBIDDEN = [
  "alien", "alienígena", "alienigena", "ufo", "óvni", "ovni",
  "bíblia", "biblia", "religião", "religiao", "religion",
  "racism", "racismo", "antisemit", "antissemit",
  "extremism", "extremismo", "violence", "violência", "violencia",
];

function rejectForbidden(text: string) {
  const lower = text.toLowerCase();
  for (const term of FORBIDDEN) {
    if (lower.includes(term)) {
      throw new Error(`Conteúdo bloqueado pela política editorial: termo "${term}".`);
    }
  }
}

async function assertEditor(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw safeDbError(error);
  const roles = (data ?? []).map((r) => r.role);
  if (!roles.includes("admin") && !roles.includes("editor")) {
    throw new Error("Acesso negado: requer papel admin ou editor.");
  }
  return roles;
}

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (error) throw safeDbError(error);
    const roles = (data ?? []).map((r) => r.role as string);
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");
    return { roles, anyAdminExists: (count ?? 0) > 0 };
  });

const theorySchema = z.object({
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/, "use kebab-case"),
  title: z.string().min(3).max(160),
  codename: z.string().min(2).max(60),
  summary: z.string().min(10).max(2000),
  category: z.string().min(2).max(60),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
  entities: z.array(z.string().min(1).max(60)).max(30).default([]),
  credibility,
  classification,
  year: z.string().max(20).optional().nullable(),
});

export const createTheory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => theorySchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertEditor(context.userId);
    rejectForbidden(`${data.title} ${data.summary} ${data.tags.join(" ")}`);
    const { data: row, error } = await supabaseAdmin
      .from("theories")
      .insert({ ...data, created_by: context.userId })
      .select("*")
      .single();
    if (error) throw safeDbError(error);
    await supabaseAdmin.from("moderation_logs").insert({
      level: "approved",
      reason: `Teoria criada: ${data.codename}`,
      user_id: context.userId,
      context: { theory_id: row.id, slug: data.slug },
    });
    await notifyTelegram("theory.create", data.title, {
      codename: data.codename,
      slug: data.slug,
      category: data.category,
      credibilidade: data.credibility,
      classificação: data.classification,
    });
    await syncTheoryPaste(row.id, context.userId);
    return { theory: row };
  });

export const deleteTheory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const roles = await assertEditor(context.userId);
    if (!roles.includes("admin")) throw new Error("Apenas admin pode remover teorias.");
    const { error } = await supabaseAdmin.from("theories").delete().eq("id", data.id);
    if (error) throw safeDbError(error);
    await notifyTelegram("theory.delete", "Teoria removida", { id: data.id });
    return { ok: true };
  });

export const deleteSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const roles = await assertEditor(context.userId);
    if (!roles.includes("admin")) throw new Error("Apenas admin pode remover fontes.");
    const { data: src } = await supabaseAdmin
      .from("sources")
      .select("theory_id, file_path")
      .eq("id", data.id)
      .maybeSingle();
    if (src?.file_path) {
      await supabaseAdmin.storage.from("documents").remove([src.file_path]);
    }
    const { error } = await supabaseAdmin.from("sources").delete().eq("id", data.id);
    if (error) throw safeDbError(error);
    if (src?.theory_id) {
      await supabaseAdmin
        .from("theories")
        .update({ document_count: await sourceCount(src.theory_id) })
        .eq("id", src.theory_id);
      await syncTheoryPaste(src.theory_id, context.userId);
    }
    await supabaseAdmin.from("moderation_logs").insert({
      level: "approved",
      reason: `Fonte removida: ${data.id}`,
      user_id: context.userId,
      context: { source_id: data.id },
    });
    await notifyTelegram("source.delete", "Fonte removida", { id: data.id });
    return { ok: true };
  });

const sourceSchema = z.object({
  theory_id: z.string().uuid(),
  title: z.string().min(3).max(200),
  source_type: z.string().min(2).max(40),
  agency: z.string().max(80).optional().nullable(),
  year: z.string().max(20).optional().nullable(),
  url: z
    .string()
    .url()
    .max(500)
    .regex(/^https?:\/\//i, "Apenas URLs http(s) são permitidas")
    .optional()
    .nullable(),
  description: z.string().max(2000).optional().nullable(),
  credibility,
  file_path: z.string().max(300).optional().nullable(),
});

export const createSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => sourceSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertEditor(context.userId);
    rejectForbidden(`${data.title} ${data.description ?? ""}`);
    const { data: row, error } = await supabaseAdmin
      .from("sources")
      .insert(data)
      .select("*")
      .single();
    if (error) throw safeDbError(error);
    await supabaseAdmin
      .from("theories")
      .update({ document_count: (await sourceCount(data.theory_id)) })
      .eq("id", data.theory_id);
    await notifyTelegram("source.create", data.title, {
      tipo: data.source_type,
      agência: data.agency ?? undefined,
      ano: data.year ?? undefined,
      credibilidade: data.credibility,
    });
    await syncTheoryPaste(data.theory_id, context.userId);
    return { source: row };
  });

async function sourceCount(theoryId: string) {
  const { count } = await supabaseAdmin
    .from("sources")
    .select("*", { count: "exact", head: true })
    .eq("theory_id", theoryId);
  return count ?? 0;
}

// ---------- SINCRONIZAÇÃO AUTOMÁTICA: 1 paste por teoria ----------
function buildTheoryPasteBody(
  theory: {
    title: string;
    codename: string;
    summary: string;
    category: string;
    classification: string;
    credibility: string;
    year?: string | null;
    tags?: string[] | null;
    entities?: string[] | null;
  },
  sources: Array<{
    title: string;
    source_type?: string | null;
    agency?: string | null;
    year?: string | null;
    url?: string | null;
    description?: string | null;
  }>,
) {
  const lines: string[] = [];
  lines.push(`# ${theory.title}`);
  lines.push("");
  lines.push(
    `**Codename:** ${theory.codename} · **Categoria:** ${theory.category} · **Classificação:** ${theory.classification} · **Credibilidade:** ${theory.credibility}${theory.year ? ` · **Período:** ${theory.year}` : ""}`,
  );
  lines.push("");
  lines.push("## Sumário");
  lines.push(theory.summary);
  if (theory.entities?.length) {
    lines.push("");
    lines.push("## Entidades relacionadas");
    for (const e of theory.entities) lines.push(`- ${e}`);
  }
  lines.push("");
  lines.push("## Fontes primárias");
  if (!sources.length) {
    lines.push("_Nenhuma fonte indexada até o momento._");
  } else {
    for (const s of sources) {
      const meta = [s.source_type, s.agency, s.year].filter(Boolean).join(" · ");
      const link = s.url ? ` — [link](${s.url})` : "";
      lines.push(`- **${s.title}**${meta ? ` (${meta})` : ""}${link}`);
      if (s.description) lines.push(`  - ${s.description}`);
    }
  }
  lines.push("");
  lines.push("---");
  lines.push(
    "_Relatório gerado automaticamente a partir do registro da teoria. Atualizações refletem mudanças no arquivo._",
  );
  return lines.join("\n");
}

export async function syncTheoryPaste(theoryId: string, userId: string) {
  const { data: theory, error: tErr } = await supabaseAdmin
    .from("theories")
    .select("*")
    .eq("id", theoryId)
    .maybeSingle();
  if (tErr) throw safeDbError(tErr);
  if (!theory) return;
  const { data: sources } = await supabaseAdmin
    .from("sources")
    .select("title, source_type, agency, year, url, description")
    .eq("theory_id", theoryId)
    .order("year", { ascending: false });
  const body_md = buildTheoryPasteBody(theory as any, (sources ?? []) as any);
  const slug = `teoria-${theory.slug}`.slice(0, 120);
  const excerpt = (theory.summary ?? "").slice(0, 480);
  const tags = Array.from(
    new Set([
      ...(theory.tags ?? []),
      theory.category,
      theory.codename,
    ].filter(Boolean) as string[]),
  ).slice(0, 20);
  const payload = {
    theory_id: theoryId,
    slug,
    title: theory.title,
    excerpt,
    body_md,
    tags,
    author: "shadow_archive",
    published: true,
    created_by: userId,
  };
  const { error } = await supabaseAdmin
    .from("pastes")
    .upsert(payload, { onConflict: "theory_id" });
  if (error) console.error("[syncTheoryPaste]", error);
}

export const listModerationLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await assertEditor(context.userId);
    if (!roles.includes("admin")) throw new Error("Apenas admin pode ver logs.");
    const { data, error } = await supabaseAdmin
      .from("moderation_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw safeDbError(error);
    return { logs: data ?? [] };
  });

export const createSignedUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      filename: z.string().min(1).max(200).regex(/^[A-Za-z0-9._-]+$/),
      size: z.number().int().positive().max(20 * 1024 * 1024),
      mime: z.string().min(1).max(120),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertEditor(context.userId);
    const ALLOWED_MIME = [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "image/png",
      "image/jpeg",
      "image/webp",
      "application/json",
    ];
    if (!ALLOWED_MIME.includes(data.mime)) {
      throw new Error(`Tipo de arquivo não permitido (${data.mime}).`);
    }
    const ALLOWED_EXT = /\.(pdf|txt|md|png|jpe?g|webp|json)$/i;
    if (!ALLOWED_EXT.test(data.filename)) {
      throw new Error("Extensão de arquivo não permitida.");
    }
    const path = `${context.userId}/${Date.now()}-${data.filename}`;
    const { data: signed, error } = await supabaseAdmin.storage
      .from("documents")
      .createSignedUploadUrl(path);
    if (error) throw safeDbError(error);
    return { path, token: signed.token };
  });

// ---------- UPDATE TEORIA / FONTE ----------
const theoryUpdateSchema = theorySchema.partial().extend({
  id: z.string().uuid(),
});

export const updateTheory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => theoryUpdateSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertEditor(context.userId);
    const { id, ...rest } = data;
    if (rest.title || rest.summary) {
      rejectForbidden(`${rest.title ?? ""} ${rest.summary ?? ""}`);
    }
    const { data: row, error } = await supabaseAdmin
      .from("theories")
      .update(rest)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw safeDbError(error);
    await notifyTelegram("theory.update", row.title ?? "Teoria atualizada", {
      slug: row.slug,
      campos: Object.keys(rest).join(", "),
    });
    await syncTheoryPaste(id, context.userId);
    return { theory: row };
  });

const sourceUpdateSchema = sourceSchema.partial().extend({
  id: z.string().uuid(),
});

export const updateSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => sourceUpdateSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertEditor(context.userId);
    const { id, ...rest } = data;
    if (rest.title || rest.description) {
      rejectForbidden(`${rest.title ?? ""} ${rest.description ?? ""}`);
    }
    const { data: row, error } = await supabaseAdmin
      .from("sources")
      .update(rest)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw safeDbError(error);
    if (row?.theory_id) await syncTheoryPaste(row.theory_id, context.userId);
    return { source: row };
  });

// ---------- GESTÃO DE PAPÉIS ----------
export const listUsersAndRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await assertEditor(context.userId);
    if (!roles.includes("admin")) throw new Error("Apenas admin pode listar usuários.");
    const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (error) throw safeDbError(error);
    const { data: roleRows } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    const rolesByUser = new Map<string, string[]>();
    for (const r of roleRows ?? []) {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    }
    return {
      users: list.users.map((u) => ({
        id: u.id,
        email: u.email ?? "",
        display_name: (u.user_metadata?.display_name as string) ?? null,
        created_at: u.created_at,
        roles: rolesByUser.get(u.id) ?? [],
      })),
    };
  });

const roleEnum = z.enum(["admin", "editor", "viewer"]);

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      user_id: z.string().uuid(),
      role: roleEnum,
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const roles = await assertEditor(context.userId);
    if (!roles.includes("admin")) throw new Error("Apenas admin pode atribuir papéis.");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: data.user_id, role: data.role }, { onConflict: "user_id,role" });
    if (error) throw safeDbError(error);
    await supabaseAdmin.from("moderation_logs").insert({
      level: "approved",
      reason: `Papel ${data.role} atribuído a ${data.user_id}`,
      user_id: context.userId,
      context: { target: data.user_id, role: data.role },
    });
    await notifyTelegram("role.assign", `Papel ${data.role} atribuído`, {
      user_id: data.user_id,
    });
    return { ok: true };
  });

export const removeUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      user_id: z.string().uuid(),
      role: roleEnum,
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const roles = await assertEditor(context.userId);
    if (!roles.includes("admin")) throw new Error("Apenas admin pode remover papéis.");
    if (data.user_id === context.userId && data.role === "admin") {
      const { count } = await supabaseAdmin
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");
      if ((count ?? 0) <= 1) {
        throw new Error("Não é possível remover o último admin do sistema.");
      }
    }
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.user_id)
      .eq("role", data.role);
    if (error) throw safeDbError(error);
    await notifyTelegram("role.remove", `Papel ${data.role} removido`, {
      user_id: data.user_id,
    });
    return { ok: true };
  });