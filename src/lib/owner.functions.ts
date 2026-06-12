import { createServerFn } from "@tanstack/react-start";
import { safeDbError } from "./db-errors";
import { z } from "zod";

/**
 * Owner-only auth.
 * - ownerExists: true once any user is registered.
 * - bootstrapOwner: only callable while no user exists; creates the first
 *   user (auto-confirmed) and grants the `admin` role.
 *
 * Subsequent sign-ups are blocked at the Supabase project level
 * (disable_signup=true) and at the UI.
 */
export const ownerExists = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (error) throw safeDbError(error);
  return { exists: (data?.users?.length ?? 0) > 0 };
});

const bootstrapSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(12).max(128),
  displayName: z.string().min(1).max(60).default("owner"),
});

export const bootstrapOwner = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => bootstrapSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const existing = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (existing.error) throw safeDbError(existing.error);
    if ((existing.data?.users?.length ?? 0) > 0) {
      throw new Error("Proprietário já existe. Cadastro bloqueado.");
    }

    const created = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { display_name: data.displayName },
    });
    if (created.error || !created.data?.user) {
      throw new Error(created.error?.message ?? "Falha ao criar proprietário.");
    }
    const userId = created.data.user.id;

    // handle_new_user trigger already inserts profile + viewer role.
    // Upgrade this account to admin.
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    if (roleErr) throw safeDbError(roleErr);

    return { ok: true };
  });