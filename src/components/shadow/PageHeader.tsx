import type { ReactNode } from "react";

export function PageHeader({
  code,
  title,
  description,
  actions,
}: {
  code: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="border-b border-border pb-6 mb-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="font-mono text-[11px] tracking-widest text-accent mb-2">
            // {code}
          </div>
          <h1 className="font-stamp text-3xl md:text-4xl text-foreground text-glow-classified">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {actions}
      </div>
    </div>
  );
}