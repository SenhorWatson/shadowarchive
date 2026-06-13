/**
 * Telegram notifier (server-only).
 *
 * Sends notifications to the project's private Telegram channel using the
 * Bot API directly. Designed to NEVER throw — notification failures must
 * not break the underlying admin action. Errors are logged server-side.
 */

type NotifyKind =
  | "theory.create"
  | "theory.update"
  | "theory.delete"
  | "source.create"
  | "source.delete"
  | "paste.create"
  | "paste.delete"
  | "role.assign"
  | "role.remove"
  | "security"
  | "system";

const KIND_LABEL: Record<NotifyKind, string> = {
  "theory.create": "🆕 Teoria criada",
  "theory.update": "✏️ Teoria atualizada",
  "theory.delete": "🗑️ Teoria removida",
  "source.create": "📎 Fonte adicionada",
  "source.delete": "🗑️ Fonte removida",
  "paste.create": "📝 Relatório publicado",
  "paste.delete": "🗑️ Relatório removido",
  "role.assign": "👤 Papel atribuído",
  "role.remove": "👤 Papel removido",
  security: "🛡️ Segurança",
  system: "⚙️ Sistema",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function notifyTelegram(
  kind: NotifyKind,
  title: string,
  details?: Record<string, string | number | null | undefined>,
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return; // soft-disable when not configured

  const lines: string[] = [`<b>${escapeHtml(KIND_LABEL[kind])}</b>`];
  lines.push(escapeHtml(title));
  if (details) {
    for (const [k, v] of Object.entries(details)) {
      if (v === undefined || v === null || v === "") continue;
      lines.push(`• <i>${escapeHtml(k)}</i>: ${escapeHtml(String(v))}`);
    }
  }
  const text = lines.join("\n").slice(0, 3800);

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[telegram] sendMessage failed", res.status, body);
    }
  } catch (err) {
    console.error("[telegram] sendMessage error", err);
  }
}