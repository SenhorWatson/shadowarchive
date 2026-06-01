import { Lock, Search } from "lucide-react";
import { useEffect, useState } from "react";

export function TopBar() {
  const [now, setNow] = useState("");
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
          <span className="hidden md:inline">
            OPERATOR: <span className="text-foreground">ghost.07</span>
          </span>
          <kbd className="hidden md:inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5">
            <Search className="h-3 w-3" /> ⌘K
          </kbd>
        </div>
      </div>
    </header>
  );
}