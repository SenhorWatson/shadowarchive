/**
 * Maps Supabase/Postgres errors to safe, generic user-facing messages.
 * Raw error.message values leak constraint names, columns, tables, and
 * internal types — never propagate them to clients.
 */
export function safeDbError(
  error: { code?: string | null; message?: string | null } | null | undefined,
  fallback = "Erro ao processar a operação. Tente novamente.",
): Error {
  if (!error) return new Error(fallback);
  // Log full detail server-side for debugging.
  console.error("[db]", error.code, error.message);
  switch (error.code) {
    case "23505":
      return new Error("Registro duplicado. Use um identificador único.");
    case "23503":
      return new Error("Referência inválida para outro registro.");
    case "23502":
      return new Error("Campo obrigatório ausente.");
    case "23514":
      return new Error("Valor inválido para um dos campos.");
    case "22P02":
      return new Error("Formato de dado inválido.");
    case "42501":
    case "PGRST301":
      return new Error("Acesso negado.");
    default:
      return new Error(fallback);
  }
}