import { CREDIBILITY_LABEL, type Credibility } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const styles: Record<Credibility, string> = {
  confirmed: "border-accent/50 text-accent bg-accent/10",
  partial: "border-primary/50 text-primary bg-primary/10",
  unverified: "border-muted-foreground/40 text-muted-foreground bg-muted/40",
  speculative: "border-destructive/40 text-destructive bg-destructive/10",
  narrative: "border-chart-5/50 text-chart-5 bg-chart-5/10",
};

export function CredibilityBadge({
  level,
  className,
}: {
  level: Credibility;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        styles[level],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {CREDIBILITY_LABEL[level]}
    </span>
  );
}