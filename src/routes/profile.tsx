import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, ShieldAlert, User, LogOut, Save, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shadow/PageHeader";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";
import { getMyRoles } from "@/lib/admin.functions";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Perfil // ShadowArchive AI" },
      { name: "description", content: "Configurações do operador." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function ProfilePage() {
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
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 border border-accent text-accent px-4 py-2 font-mono text-sm uppercase tracking-widest hover:bg-accent/10"
        >
          Acessar // operador
        </Link>
      </div>
    );
  }
  return <ProfileAuthenticated />;
}

function ProfileAuthenticated() {
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const fetchRoles = useServerFn(getMyRoles);
  const update = useServerFn(updateMyProfile);
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile(),
  });
  const { data: rolesData } = useQuery({
    queryKey: ["my-roles"],
    queryFn: () => fetchRoles(),
  });

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    if (data?.profile) {
      setName(data.profile.display_name ?? "");
      setAvatar(data.profile.avatar_url ?? "");
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      update({ data: { display_name: name, avatar_url: avatar || null } }),
    onSuccess: () => {
      toast.success("Perfil atualizado.");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  async function requestReset() {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) toast.error(error.message);
    else toast.success("Link de redefinição enviado para seu e-mail.");
  }

  async function signOut() {
    await supabase.auth.signOut();
    toast.message("Sessão encerrada.");
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      <PageHeader
        code="07 / OPERATOR PROFILE"
        title="Perfil do Operador"
        description="Identidade, papéis e segurança da sua sessão."
      />

      <section className="border border-border bg-card rounded-sm">
        <header className="border-b border-border px-5 py-3 flex items-center justify-between">
          <h2 className="font-stamp text-xl flex items-center gap-2">
            <User className="h-4 w-4" /> Identidade
          </h2>
          {rolesData?.roles?.length ? (
            <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest">
              {rolesData.roles.map((r) => (
                <span key={r} className="border border-accent/40 text-accent px-2 py-0.5 bg-accent/5">
                  {r}
                </span>
              ))}
            </div>
          ) : null}
        </header>
        {isLoading ? (
          <div className="p-6 flex justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
          </div>
        ) : (
          <form
            className="p-5 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                E-MAIL
              </label>
              <input
                disabled
                value={user?.email ?? ""}
                className="w-full bg-muted/30 border border-border px-3 py-2 font-mono text-sm text-muted-foreground"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                CODENAME
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                required
                className="w-full bg-background border border-border px-3 py-2 font-mono text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                AVATAR URL (opcional)
              </label>
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://..."
                className="w-full bg-background border border-border px-3 py-2 font-mono text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <button
              type="submit"
              disabled={save.isPending}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-mono text-sm uppercase tracking-widest px-4 py-2 hover:bg-primary/90 disabled:opacity-50"
            >
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar
            </button>
          </form>
        )}
      </section>

      <section className="border border-border bg-card rounded-sm p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-stamp text-xl flex items-center gap-2">
            <KeyRound className="h-4 w-4" /> Segurança
          </h2>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Solicitar redefinição de senha por e-mail.
          </p>
        </div>
        <button
          onClick={requestReset}
          className="border border-accent text-accent px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-accent/10"
        >
          Redefinir senha
        </button>
      </section>

      <section className="border border-destructive/40 bg-destructive/5 rounded-sm p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-stamp text-xl text-destructive">Encerrar sessão</h2>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Limpa tokens locais e desconecta este operador.
          </p>
        </div>
        <button
          onClick={signOut}
          className="inline-flex items-center gap-2 border border-destructive text-destructive px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-destructive/10"
        >
          <LogOut className="h-3 w-3" /> Sair
        </button>
      </section>
    </div>
  );
}