import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ShieldAlert,
  Loader2,
  Plus,
  FileText,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Pencil,
  Users,
  X,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shadow/PageHeader";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  getMyRoles,
  createTheory,
  createSource,
  createSignedUpload,
  listModerationLogs,
  deleteTheory,
  deleteSource,
  updateTheory,
  updateSource,
  listUsersAndRoles,
  setUserRole,
  removeUserRole,
} from "@/lib/admin.functions";
import { listTheories, listAllSources } from "@/lib/theories.functions";
import { cn } from "@/lib/utils";

// ---------- 2FA / MFA PANEL ----------
function MfaPanel() {
  const qc = useQueryClient();
  const { data: factors, isLoading } = useQuery({
    queryKey: ["mfa-factors"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      return data;
    },
  });
  const [enrolling, setEnrolling] = useState<null | {
    factorId: string;
    qr: string;
    secret: string;
  }>(null);
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function startEnroll() {
    setErr(null);
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `TOTP ${new Date().toISOString().slice(0, 10)}`,
      });
      if (error) throw error;
      setEnrolling({
        factorId: data.id,
        qr: data.totp.qr_code,
        secret: data.totp.secret,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao iniciar 2FA");
    } finally {
      setBusy(false);
    }
  }

  async function verifyEnroll() {
    if (!enrolling) return;
    setBusy(true);
    setErr(null);
    try {
      const { data: chall, error: cErr } = await supabase.auth.mfa.challenge({
        factorId: enrolling.factorId,
      });
      if (cErr) throw cErr;
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: enrolling.factorId,
        challengeId: chall.id,
        code,
      });
      if (vErr) throw vErr;
      toast.success("2FA ativado.");
      setEnrolling(null);
      setCode("");
      qc.invalidateQueries({ queryKey: ["mfa-factors"] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Código inválido");
    } finally {
      setBusy(false);
    }
  }

  async function unenroll(id: string) {
    if (!confirm("Remover este fator 2FA?")) return;
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (error) toast.error(error.message);
    else {
      toast.success("Fator removido.");
      qc.invalidateQueries({ queryKey: ["mfa-factors"] });
    }
  }

  const allTotp = (factors?.totp ?? []) as Array<{ id: string; friendly_name?: string | null; status: string; created_at: string }>;
  const verified = allTotp.filter((f) => f.status === "verified");
  const pending = allTotp.filter((f) => f.status !== "verified");

  return (
    <section className="border border-border bg-card rounded-sm">
      <header className="border-b border-border px-5 py-3 flex items-center justify-between">
        <h2 className="font-stamp text-xl flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-accent" /> Autenticação em 2 fatores
        </h2>
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
          TOTP · RFC 6238
        </span>
      </header>
      <div className="p-5 space-y-4">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
        ) : verified.length === 0 && !enrolling ? (
          <p className="text-sm text-muted-foreground font-mono">
            Nenhum app autenticador vinculado. Recomendado para admins.
          </p>
        ) : null}

        {verified.length > 0 && (
          <ul className="space-y-2">
            {verified.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between border border-accent/30 bg-accent/5 px-3 py-2"
              >
                <div>
                  <div className="font-mono text-xs text-accent">
                    {f.friendly_name ?? f.id}
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    ativo · {new Date(f.created_at).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <button
                  onClick={() => unenroll(f.id)}
                  className="font-mono text-[10px] uppercase tracking-widest border border-destructive/40 text-destructive px-2 py-1 hover:bg-destructive/10"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}

        {pending.length > 0 && !enrolling && (
          <p className="text-xs font-mono text-muted-foreground">
            Há {pending.length} fator(es) pendente(s). Conclua ou remova.
          </p>
        )}

        {!enrolling ? (
          <button
            onClick={startEnroll}
            disabled={busy}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest px-4 py-2 hover:bg-primary/90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
            Ativar 2FA
          </button>
        ) : (
          <div className="border border-border p-4 space-y-3">
            <p className="text-xs font-mono text-muted-foreground">
              Escaneie o QR code no seu app autenticador (Google Authenticator,
              1Password, Authy, etc.) ou copie o segredo manualmente.
            </p>
            <div className="flex items-start gap-4">
              <img
                src={enrolling.qr}
                alt="QR code 2FA"
                className="h-40 w-40 bg-white p-2 border border-border"
              />
              <div className="flex-1 space-y-2">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Segredo
                  </div>
                  <code className="block font-mono text-[11px] text-accent break-all">
                    {enrolling.secret}
                  </code>
                </div>
                <input
                  className={INPUT}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="código de 6 dígitos"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
                <div className="flex gap-2">
                  <button
                    onClick={verifyEnroll}
                    disabled={busy || code.length !== 6}
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest px-4 py-2 hover:bg-primary/90 disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                    Confirmar
                  </button>
                  <button
                    onClick={async () => {
                      await supabase.auth.mfa.unenroll({ factorId: enrolling.factorId });
                      setEnrolling(null);
                      setCode("");
                      qc.invalidateQueries({ queryKey: ["mfa-factors"] });
                    }}
                    className="font-mono text-[10px] uppercase tracking-widest border border-border px-3 py-2 hover:border-destructive hover:text-destructive"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {err && (
          <p className="text-xs text-destructive font-mono border border-destructive/40 bg-destructive/10 px-3 py-2">
            {err}
          </p>
        )}
      </div>
    </section>
  );
}

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — ShadowArchive AI" },
      { name: "description", content: "Painel administrativo do ShadowArchive." },
    ],
  }),
  component: AdminPage,
});

const INPUT =
  "w-full bg-background border border-border px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent transition-colors";
const LABEL =
  "block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1";

function AdminPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <ShieldAlert className="h-10 w-10 text-accent mx-auto mb-3" />
        <h1 className="font-stamp text-2xl mb-2">Acesso restrito</h1>
        <p className="text-sm text-muted-foreground font-mono">
          Faça login para acessar o painel administrativo.
        </p>
        <a
          href="/auth"
          className="mt-6 inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-primary/90"
        >
          Entrar
        </a>
      </div>
    );
  }

  return <AdminAuthenticated />;
}

function AdminAuthenticated() {
  const fetchRoles = useServerFn(getMyRoles);
  const { data, isLoading } = useQuery({
    queryKey: ["my-roles"],
    queryFn: () => fetchRoles(),
  });

  if (isLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-accent" />
      </div>
    );
  }

  const roles = data?.roles ?? [];
  const isEditor = roles.includes("admin") || roles.includes("editor");

  if (!isEditor) {
    return <NoPrivileges />;
  }

  return <AdminConsole roles={roles} />;
}

function NoPrivileges() {
  return (
    <div className="max-w-xl mx-auto px-6 py-16 text-center">
      <ShieldAlert className="h-10 w-10 text-accent mx-auto mb-3" />
      <h1 className="font-stamp text-2xl mb-2">Sem privilégios</h1>
      <p className="text-sm text-muted-foreground font-mono">
        Sua conta não possui papel <code>admin</code> ou <code>editor</code>.
        <br />
        Apenas o administrador desta instância pode conceder acesso.
      </p>
    </div>
  );
}

function AdminConsole({ roles }: { roles: string[] }) {
  const isAdmin = roles.includes("admin");
  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <PageHeader
        code="06 / ADMIN PANEL"
        title="Centro de Controle"
        description="Catalogação, ingestão documental e moderação editorial."
      />
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest">
        <span className="text-muted-foreground">PAPÉIS:</span>
        {roles.map((r) => (
          <span
            key={r}
            className="border border-accent/40 text-accent px-2 py-0.5 bg-accent/5"
          >
            {r}
          </span>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <TheoryForm />
        <SourceForm />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <TheoryList isAdmin={isAdmin} />
        <SourceList isAdmin={isAdmin} />
      </div>

      {isAdmin && <RolesPanel />}
      {isAdmin && <ModerationLogs />}
      <MfaPanel />
    </div>
  );
}

function TheoryForm() {
  const qc = useQueryClient();
  const create = useServerFn(createTheory);
  const [form, setForm] = useState({
    slug: "",
    title: "",
    codename: "",
    summary: "",
    category: "",
    tags: "",
    entities: "",
    credibility: "unverified" as const,
    classification: "DECLASSIFIED" as const,
    year: "",
  });
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      create({
        data: {
          slug: form.slug,
          title: form.title,
          codename: form.codename,
          summary: form.summary,
          category: form.category,
          tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
          entities: form.entities.split(",").map((s) => s.trim()).filter(Boolean),
          credibility: form.credibility,
          classification: form.classification,
          year: form.year || null,
        },
      }),
    onSuccess: () => {
      setOk(true);
      setErr(null);
      setForm({ ...form, slug: "", title: "", codename: "", summary: "" });
      qc.invalidateQueries({ queryKey: ["theories"] });
    },
    onError: (e) => {
      setOk(false);
      setErr(e instanceof Error ? e.message : "Erro");
    },
  });

  return (
    <section className="border border-border bg-card rounded-sm">
      <header className="border-b border-border px-5 py-3 flex items-center justify-between">
        <h2 className="font-stamp text-xl">Nova teoria</h2>
        <FileText className="h-4 w-4 text-muted-foreground" />
      </header>
      <form
        className="p-5 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>SLUG</label>
            <input
              className={INPUT}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="cointelpro"
              required
            />
          </div>
          <div>
            <label className={LABEL}>CODENAME</label>
            <input
              className={INPUT}
              value={form.codename}
              onChange={(e) => setForm({ ...form, codename: e.target.value })}
              placeholder="OP-COINTEL"
              required
            />
          </div>
        </div>
        <div>
          <label className={LABEL}>TÍTULO</label>
          <input
            className={INPUT}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>
        <div>
          <label className={LABEL}>SUMÁRIO</label>
          <textarea
            className={cn(INPUT, "min-h-[90px]")}
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>CATEGORIA</label>
            <input
              className={INPUT}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="vigilância"
              required
            />
          </div>
          <div>
            <label className={LABEL}>ANO</label>
            <input
              className={INPUT}
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              placeholder="1956-1971"
            />
          </div>
        </div>
        <div>
          <label className={LABEL}>TAGS (vírgula)</label>
          <input
            className={INPUT}
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="fbi, vigilância, contrainteligência"
          />
        </div>
        <div>
          <label className={LABEL}>ENTIDADES (vírgula)</label>
          <input
            className={INPUT}
            value={form.entities}
            onChange={(e) => setForm({ ...form, entities: e.target.value })}
            placeholder="FBI, J. Edgar Hoover"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>CREDIBILIDADE</label>
            <select
              className={INPUT}
              value={form.credibility}
              onChange={(e) => setForm({ ...form, credibility: e.target.value as typeof form.credibility })}
            >
              {["confirmed", "partial", "unverified", "speculative", "narrative"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>CLASSIFICAÇÃO</label>
            <select
              className={INPUT}
              value={form.classification}
              onChange={(e) => setForm({ ...form, classification: e.target.value as typeof form.classification })}
            >
              {["TOP SECRET", "CONFIDENTIAL", "DECLASSIFIED", "RESTRICTED"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <FormFeedback err={err} ok={ok} okMsg="Teoria registrada." />

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-mono text-sm uppercase tracking-widest py-2.5 hover:bg-primary/90 disabled:opacity-50"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Registrar teoria
        </button>
      </form>
    </section>
  );
}

function SourceForm() {
  const qc = useQueryClient();
  const fetchTheories = useServerFn(listTheories);
  const { data: theoriesData } = useQuery({
    queryKey: ["theories"],
    queryFn: () => fetchTheories(),
  });
  const create = useServerFn(createSource);
  const signUpload = useServerFn(createSignedUpload);

  const [form, setForm] = useState({
    theory_id: "",
    title: "",
    source_type: "document",
    agency: "",
    year: "",
    url: "",
    description: "",
    credibility: "unverified" as const,
    file_path: "" as string | null,
  });
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      let file_path: string | null = null;
      if (file) {
        const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
        const { path, token } = await signUpload({
          data: {
            filename: safeName,
            size: file.size,
            mime: file.type || "application/octet-stream",
          },
        });
        const { error: upErr } = await supabase.storage
          .from("documents")
          .uploadToSignedUrl(path, token, file);
        if (upErr) throw new Error(upErr.message);
        file_path = path;
      }
      return create({
        data: {
          theory_id: form.theory_id,
          title: form.title,
          source_type: form.source_type,
          agency: form.agency || null,
          year: form.year || null,
          url: form.url || null,
          description: form.description || null,
          credibility: form.credibility,
          file_path,
        },
      });
    },
    onSuccess: () => {
      setOk(true);
      setErr(null);
      setForm({ ...form, title: "", url: "", description: "" });
      setFile(null);
      qc.invalidateQueries({ queryKey: ["theories"] });
      qc.invalidateQueries({ queryKey: ["sources"] });
    },
    onError: (e) => {
      setOk(false);
      setErr(e instanceof Error ? e.message : "Erro");
    },
  });

  return (
    <section className="border border-border bg-card rounded-sm">
      <header className="border-b border-border px-5 py-3 flex items-center justify-between">
        <h2 className="font-stamp text-xl">Nova fonte / documento</h2>
        <Upload className="h-4 w-4 text-muted-foreground" />
      </header>
      <form
        className="p-5 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div>
          <label className={LABEL}>TEORIA</label>
          <select
            className={INPUT}
            required
            value={form.theory_id}
            onChange={(e) => setForm({ ...form, theory_id: e.target.value })}
          >
            <option value="">— selecione —</option>
            {(theoriesData?.theories ?? []).map((t) => (
              <option key={t.id} value={t.id}>{t.codename} · {t.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL}>TÍTULO</label>
          <input
            className={INPUT}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>TIPO</label>
            <input
              className={INPUT}
              value={form.source_type}
              onChange={(e) => setForm({ ...form, source_type: e.target.value })}
              placeholder="document, foia, report..."
            />
          </div>
          <div>
            <label className={LABEL}>AGÊNCIA</label>
            <input
              className={INPUT}
              value={form.agency}
              onChange={(e) => setForm({ ...form, agency: e.target.value })}
              placeholder="CIA, FBI..."
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>ANO</label>
            <input
              className={INPUT}
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
            />
          </div>
          <div>
            <label className={LABEL}>CREDIBILIDADE</label>
            <select
              className={INPUT}
              value={form.credibility}
              onChange={(e) => setForm({ ...form, credibility: e.target.value as typeof form.credibility })}
            >
              {["confirmed", "partial", "unverified", "speculative", "narrative"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={LABEL}>URL (opcional)</label>
          <input
            className={INPUT}
            type="url"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://..."
          />
        </div>
        <div>
          <label className={LABEL}>DESCRIÇÃO</label>
          <textarea
            className={cn(INPUT, "min-h-[70px]")}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div>
          <label className={LABEL}>ARQUIVO (opcional, máx. 50MB)</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="font-mono text-xs text-muted-foreground file:mr-3 file:py-1 file:px-3 file:border file:border-border file:bg-background file:text-foreground file:font-mono file:text-xs"
          />
          {file && (
            <p className="mt-1 font-mono text-[10px] text-accent">
              {file.name} · {(file.size / 1024).toFixed(0)} KB
            </p>
          )}
        </div>

        <FormFeedback err={err} ok={ok} okMsg="Fonte registrada." />

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-mono text-sm uppercase tracking-widest py-2.5 hover:bg-primary/90 disabled:opacity-50"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Registrar fonte
        </button>
      </form>
    </section>
  );
}

function ModerationLogs() {
  const fetchLogs = useServerFn(listModerationLogs);
  const { data, isLoading } = useQuery({
    queryKey: ["moderation-logs"],
    queryFn: () => fetchLogs(),
    refetchInterval: 15000,
  });

  return (
    <section className="border border-border bg-card rounded-sm">
      <header className="border-b border-border px-5 py-3 flex items-center justify-between">
        <h2 className="font-stamp text-xl">Logs de moderação</h2>
        <span className="font-mono text-[10px] text-accent">LIVE · 15s</span>
      </header>
      {isLoading ? (
        <div className="p-6 flex justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
        </div>
      ) : !data?.logs.length ? (
        <div className="p-6 text-center font-mono text-xs text-muted-foreground">
          nenhum log registrado
        </div>
      ) : (
        <ul className="divide-y divide-border max-h-[400px] overflow-auto">
          {data.logs.map((l: { id: string; level: string; reason: string; created_at: string }) => (
            <li key={l.id} className="px-5 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={cn(
                    "font-mono text-[9px] tracking-widest px-1.5 py-0.5 rounded-sm border uppercase",
                    l.level === "blocked"
                      ? "border-destructive/40 text-destructive bg-destructive/10"
                      : l.level === "flagged"
                        ? "border-primary/40 text-primary bg-primary/10"
                        : "border-accent/40 text-accent bg-accent/10",
                  )}
                >
                  {l.level}
                </span>
                <span className="text-sm text-foreground/90 truncate">{l.reason}</span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                {new Date(l.created_at).toLocaleString("pt-BR")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FormFeedback({ err, ok, okMsg }: { err: string | null; ok: boolean; okMsg: string }) {
  if (err) {
    return (
      <div className="flex items-start gap-2 border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive font-mono">
        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>{err}</span>
      </div>
    );
  }
  if (ok) {
    return (
      <div className="flex items-center gap-2 border border-accent/40 bg-accent/10 px-3 py-2 text-xs text-accent font-mono">
        <CheckCircle2 className="h-3.5 w-3.5" /> {okMsg}
      </div>
    );
  }
  return null;
}

function TheoryList({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const fetchTheories = useServerFn(listTheories);
  const del = useServerFn(deleteTheory);
  const { data, isLoading } = useQuery({
    queryKey: ["theories"],
    queryFn: () => fetchTheories(),
  });
  const mutation = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Teoria removida.");
      qc.invalidateQueries({ queryKey: ["theories"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });
  const [editing, setEditing] = useState<TheoryEditValues | null>(null);

  return (
    <section className="border border-border bg-card rounded-sm">
      <header className="border-b border-border px-5 py-3 flex items-center justify-between">
        <h2 className="font-stamp text-xl">Teorias cadastradas</h2>
        <span className="font-mono text-[10px] text-muted-foreground">
          {data?.theories.length ?? 0} registros
        </span>
      </header>
      {isLoading ? (
        <div className="p-6 flex justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
        </div>
      ) : !data?.theories.length ? (
        <div className="p-6 text-center font-mono text-xs text-muted-foreground">
          nenhuma teoria
        </div>
      ) : (
        <ul className="divide-y divide-border max-h-[420px] overflow-auto">
          {data.theories.map((t) => (
            <li key={t.id} className="px-5 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-mono text-[10px] text-accent uppercase tracking-widest">
                  {t.codename}
                </div>
                <div className="text-sm truncate">{t.title}</div>
                <div className="font-mono text-[10px] text-muted-foreground">
                  {t.document_count} docs · {t.credibility}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() =>
                    setEditing({
                      id: t.id,
                      title: t.title,
                      codename: t.codename,
                      summary: t.summary,
                      credibility: t.credibility,
                      classification: t.classification,
                      year: t.year ?? "",
                      tags: (t.tags ?? []).join(", "),
                    })
                  }
                  className="inline-flex items-center gap-1 border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-widest hover:border-accent hover:text-accent"
                >
                  <Pencil className="h-3 w-3" /> Editar
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      if (confirm(`Remover "${t.codename}"? Fontes vinculadas permanecem.`)) {
                        mutation.mutate(t.id);
                      }
                    }}
                    disabled={mutation.isPending}
                    className="inline-flex items-center gap-1 border border-destructive/40 text-destructive px-2 py-1 font-mono text-[10px] uppercase tracking-widest hover:bg-destructive/10 disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" /> Apagar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {mutation.error && (
        <div className="px-5 py-2 text-xs text-destructive font-mono border-t border-destructive/30">
          {(mutation.error as Error).message}
        </div>
      )}
      {editing && (
        <EditTheoryDialog
          values={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}

function SourceList({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const fetchSources = useServerFn(listAllSources);
  const del = useServerFn(deleteSource);
  const { data, isLoading } = useQuery({
    queryKey: ["sources"],
    queryFn: () => fetchSources(),
  });
  const mutation = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Fonte removida.");
      qc.invalidateQueries({ queryKey: ["sources"] });
      qc.invalidateQueries({ queryKey: ["theories"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });
  const [editing, setEditing] = useState<SourceEditValues | null>(null);

  return (
    <section className="border border-border bg-card rounded-sm">
      <header className="border-b border-border px-5 py-3 flex items-center justify-between">
        <h2 className="font-stamp text-xl">Fontes cadastradas</h2>
        <span className="font-mono text-[10px] text-muted-foreground">
          {data?.sources.length ?? 0} registros
        </span>
      </header>
      {isLoading ? (
        <div className="p-6 flex justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
        </div>
      ) : !data?.sources.length ? (
        <div className="p-6 text-center font-mono text-xs text-muted-foreground">
          nenhuma fonte
        </div>
      ) : (
        <ul className="divide-y divide-border max-h-[420px] overflow-auto">
          {data.sources.map((s: { id: string; title: string; source_type: string; agency: string | null; year: string | null; url: string | null; description: string | null; file_path: string | null; credibility: "confirmed" | "partial" | "unverified" | "speculative" | "narrative"; theories?: { codename: string } | null }) => (
            <li key={s.id} className="px-5 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-mono text-[10px] text-accent uppercase tracking-widest">
                  {s.theories?.codename ?? "—"} · {s.source_type}
                  {s.file_path && <span className="ml-1 text-primary">[file]</span>}
                </div>
                <div className="text-sm truncate">{s.title}</div>
                <div className="font-mono text-[10px] text-muted-foreground">
                  {s.agency ?? "—"} · {s.year ?? "—"}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() =>
                    setEditing({
                      id: s.id,
                      title: s.title,
                      source_type: s.source_type,
                      agency: s.agency ?? "",
                      year: s.year ?? "",
                      url: s.url ?? "",
                      description: s.description ?? "",
                      credibility: s.credibility,
                    })
                  }
                  className="inline-flex items-center gap-1 border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-widest hover:border-accent hover:text-accent"
                >
                  <Pencil className="h-3 w-3" /> Editar
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      if (confirm(`Remover fonte "${s.title}"?`)) {
                        mutation.mutate(s.id);
                      }
                    }}
                    disabled={mutation.isPending}
                    className="inline-flex items-center gap-1 border border-destructive/40 text-destructive px-2 py-1 font-mono text-[10px] uppercase tracking-widest hover:bg-destructive/10 disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" /> Apagar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {mutation.error && (
        <div className="px-5 py-2 text-xs text-destructive font-mono border-t border-destructive/30">
          {(mutation.error as Error).message}
        </div>
      )}
      {editing && (
        <EditSourceDialog values={editing} onClose={() => setEditing(null)} />
      )}
    </section>
  );
}

// ---------- EDIT DIALOGS ----------
type Credibility = "confirmed" | "partial" | "unverified" | "speculative" | "narrative";
type Classification = "TOP SECRET" | "CONFIDENTIAL" | "DECLASSIFIED" | "RESTRICTED";

type TheoryEditValues = {
  id: string;
  title: string;
  codename: string;
  summary: string;
  credibility: Credibility;
  classification: Classification;
  year: string;
  tags: string;
};

type SourceEditValues = {
  id: string;
  title: string;
  source_type: string;
  agency: string;
  year: string;
  url: string;
  description: string;
  credibility: Credibility;
};

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg border border-border bg-card rounded-sm">
        <header className="border-b border-border px-5 py-3 flex items-center justify-between">
          <h3 className="font-stamp text-lg">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="p-5 max-h-[80vh] overflow-auto">{children}</div>
      </div>
    </div>
  );
}

function EditTheoryDialog({ values, onClose }: { values: TheoryEditValues; onClose: () => void }) {
  const qc = useQueryClient();
  const update = useServerFn(updateTheory);
  const [form, setForm] = useState(values);
  const mut = useMutation({
    mutationFn: () =>
      update({
        data: {
          id: form.id,
          title: form.title,
          codename: form.codename,
          summary: form.summary,
          credibility: form.credibility,
          classification: form.classification,
          year: form.year || null,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        },
      }),
    onSuccess: () => {
      toast.success("Teoria atualizada.");
      qc.invalidateQueries({ queryKey: ["theories"] });
      onClose();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });
  return (
    <Modal title={`Editar ${form.codename}`} onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
        <div><label className={LABEL}>CODENAME</label><input className={INPUT} value={form.codename} onChange={(e) => setForm({ ...form, codename: e.target.value })} /></div>
        <div><label className={LABEL}>TÍTULO</label><input className={INPUT} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div><label className={LABEL}>SUMÁRIO</label><textarea className={cn(INPUT, "min-h-[90px]")} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={LABEL}>ANO</label><input className={INPUT} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
          <div><label className={LABEL}>CREDIBILIDADE</label>
            <select className={INPUT} value={form.credibility} onChange={(e) => setForm({ ...form, credibility: e.target.value as Credibility })}>
              {["confirmed", "partial", "unverified", "speculative", "narrative"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div><label className={LABEL}>CLASSIFICAÇÃO</label>
          <select className={INPUT} value={form.classification} onChange={(e) => setForm({ ...form, classification: e.target.value as Classification })}>
            {["TOP SECRET", "CONFIDENTIAL", "DECLASSIFIED", "RESTRICTED"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div><label className={LABEL}>TAGS (vírgula)</label><input className={INPUT} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
        <button disabled={mut.isPending} type="submit" className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-mono text-sm uppercase tracking-widest py-2.5 hover:bg-primary/90 disabled:opacity-50">
          {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Salvar
        </button>
      </form>
    </Modal>
  );
}

function EditSourceDialog({ values, onClose }: { values: SourceEditValues; onClose: () => void }) {
  const qc = useQueryClient();
  const update = useServerFn(updateSource);
  const [form, setForm] = useState(values);
  const mut = useMutation({
    mutationFn: () =>
      update({
        data: {
          id: form.id,
          title: form.title,
          source_type: form.source_type,
          agency: form.agency || null,
          year: form.year || null,
          url: form.url || null,
          description: form.description || null,
          credibility: form.credibility,
        },
      }),
    onSuccess: () => {
      toast.success("Fonte atualizada.");
      qc.invalidateQueries({ queryKey: ["sources"] });
      onClose();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });
  return (
    <Modal title="Editar fonte" onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
        <div><label className={LABEL}>TÍTULO</label><input className={INPUT} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={LABEL}>TIPO</label><input className={INPUT} value={form.source_type} onChange={(e) => setForm({ ...form, source_type: e.target.value })} /></div>
          <div><label className={LABEL}>AGÊNCIA</label><input className={INPUT} value={form.agency} onChange={(e) => setForm({ ...form, agency: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={LABEL}>ANO</label><input className={INPUT} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
          <div><label className={LABEL}>CREDIBILIDADE</label>
            <select className={INPUT} value={form.credibility} onChange={(e) => setForm({ ...form, credibility: e.target.value as Credibility })}>
              {["confirmed", "partial", "unverified", "speculative", "narrative"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div><label className={LABEL}>URL</label><input type="url" className={INPUT} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></div>
        <div><label className={LABEL}>DESCRIÇÃO</label><textarea className={cn(INPUT, "min-h-[80px]")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <button disabled={mut.isPending} type="submit" className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-mono text-sm uppercase tracking-widest py-2.5 hover:bg-primary/90 disabled:opacity-50">
          {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Salvar
        </button>
      </form>
    </Modal>
  );
}

// ---------- ROLES PANEL ----------
function RolesPanel() {
  const qc = useQueryClient();
  const fetchUsers = useServerFn(listUsersAndRoles);
  const setRole = useServerFn(setUserRole);
  const removeRole = useServerFn(removeUserRole);
  const { data, isLoading } = useQuery({
    queryKey: ["users-roles"],
    queryFn: () => fetchUsers(),
  });
  const grant = useMutation({
    mutationFn: (v: { user_id: string; role: "admin" | "editor" | "viewer" }) => setRole({ data: v }),
    onSuccess: () => { toast.success("Papel atribuído."); qc.invalidateQueries({ queryKey: ["users-roles"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });
  const revoke = useMutation({
    mutationFn: (v: { user_id: string; role: "admin" | "editor" | "viewer" }) => removeRole({ data: v }),
    onSuccess: () => { toast.success("Papel removido."); qc.invalidateQueries({ queryKey: ["users-roles"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  return (
    <section className="border border-border bg-card rounded-sm">
      <header className="border-b border-border px-5 py-3 flex items-center justify-between">
        <h2 className="font-stamp text-xl flex items-center gap-2"><Users className="h-4 w-4" /> Usuários e papéis</h2>
        <span className="font-mono text-[10px] text-muted-foreground">{data?.users.length ?? 0} operadores</span>
      </header>
      {isLoading ? (
        <div className="p-6 flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-accent" /></div>
      ) : (
        <ul className="divide-y divide-border max-h-[420px] overflow-auto">
          {data?.users.map((u) => (
            <li key={u.id} className="px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="text-sm truncate">{u.display_name ?? u.email}</div>
                <div className="font-mono text-[10px] text-muted-foreground truncate">{u.email}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {u.roles.length ? u.roles.map((r) => (
                    <span key={r} className="inline-flex items-center gap-1 border border-accent/40 text-accent px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest bg-accent/5">
                      <ShieldCheck className="h-2.5 w-2.5" />{r}
                      <button
                        onClick={() => revoke.mutate({ user_id: u.id, role: r as "admin" | "editor" | "viewer" })}
                        className="ml-1 hover:text-destructive"
                        title="Remover papel"
                      ><X className="h-2.5 w-2.5" /></button>
                    </span>
                  )) : <span className="font-mono text-[10px] text-muted-foreground">sem papéis</span>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {(["viewer", "editor", "admin"] as const).map((r) => (
                  <button
                    key={r}
                    disabled={u.roles.includes(r) || grant.isPending}
                    onClick={() => grant.mutate({ user_id: u.id, role: r })}
                    className="border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-widest hover:border-accent hover:text-accent disabled:opacity-30 disabled:hover:border-border disabled:hover:text-current"
                  >
                    + {r}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}