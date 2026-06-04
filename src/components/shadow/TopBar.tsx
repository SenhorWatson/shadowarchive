import { Lock, LogIn, LogOut, Search, UserCog } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export function TopBar() {
  const [now, setNow] = useState("");
  const { user, loading } = useAuth();
  useEffect(() => {
    const tick = () =>
      setNow(new Date().toISOString().replace("T", " ").slice(0, 19) + "Z");
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="flex h-12 items-center justify-between gap-4 px-4 md:px-6 font-mono text-[11px] text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Lock className="h-3 w-3 text-accent" />
            <span className="uppercase tracking-widest">classification:</span>
            <span className="text-primary">RESTRICTED // INVESTIGATIVE</span>
          </span>
          <span className="hidden lg:inline" suppressHydrationWarning>
            SESSION//{now || "----------  --:--:--Z"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <kbd className="hidden md:inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5">
            <Search className="h-3 w-3" /> ⌘K
          </kbd>
          {!loading && !user && (
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 border border-border px-2 py-1 hover:border-accent hover:text-accent transition-colors"
            >
              <LogIn className="h-3 w-3" />
              <span className="uppercase tracking-widest">Entrar</span>
            </Link>
          )}
          {!loading && user && (
            <>
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 border border-border px-2 py-1 hover:border-accent hover:text-accent transition-colors"
              >
                <UserCog className="h-3 w-3" />
                <span className="uppercase tracking-widest">Admin</span>
              </Link>
              <button
                onClick={() => supabase.auth.signOut()}
                className="inline-flex items-center gap-1.5 border border-border px-2 py-1 hover:border-destructive hover:text-destructive transition-colors"
              >
                <LogOut className="h-3 w-3" />
                <span className="uppercase tracking-widest">Sair</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}