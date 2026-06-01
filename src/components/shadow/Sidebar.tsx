import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Compass,
  Brain,
  Library,
  FileText,
  Network,
  ShieldAlert,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Home", code: "00", icon: Home },
  { to: "/explorer", label: "Explorer", code: "01", icon: Compass },
  { to: "/investigator", label: "AI Investigator", code: "02", icon: Brain },
  { to: "/sources", label: "Source Library", code: "03", icon: Library },
  { to: "/vault", label: "Paste Vault", code: "04", icon: FileText },
  { to: "/graph", label: "Graph View", code: "05", icon: Network },
  { to: "/admin", label: "Admin Panel", code: "06", icon: ShieldAlert },
] as const;

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative h-9 w-9 rounded-sm bg-primary/10 border border-primary/40 flex items-center justify-center">
            <Radio className="h-4 w-4 text-primary" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-accent animate-pulse" />
          </div>
          <div>
            <div className="font-mono text-xs text-muted-foreground tracking-widest">
              SHADOW//ARCHIVE
            </div>
            <div className="font-stamp text-lg leading-none text-foreground text-glow-classified">
              ShadowArchive AI
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {nav.map((item) => {
          const active =
            item.to === "/"
              ? pathname === "/"
              : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-sm px-3 py-2 font-mono text-sm transition-colors group",
                active
                  ? "bg-sidebar-accent text-accent border-l-2 border-accent"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground border-l-2 border-transparent",
              )}
            >
              <span className="text-[10px] text-muted-foreground/70 font-mono w-5">
                /{item.code}
              </span>
              <Icon className="h-4 w-4" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-sidebar-border space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          UPLINK · SECURE · TLS 1.3
        </div>
        <div className="text-[10px] font-mono text-muted-foreground/70">
          NODE-α/7F · v0.1.0-mvp
        </div>
      </div>
    </aside>
  );
}