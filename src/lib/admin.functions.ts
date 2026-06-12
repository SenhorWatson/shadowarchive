import { createServerFn } from "@tanstack/react-start";
import { safeDbError } from "./db-errors";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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
    }
    await supabaseAdmin.from("moderation_logs").insert({
      level: "approved",
      reason: `Fonte removida: ${data.id}`,
      user_id: context.userId,
      context: { source_id: data.id },
    });
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
    return { source: row };
  });

async function sourceCount(theoryId: string) {
  const { count } = await supabaseAdmin
    .from("sources")
    .select("*", { count: "exact", head: true })
    .eq("theory_id", theoryId);
  return count ?? 0;
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
    return { ok: true };
  });