import { Link } from "@tanstack/react-router";
import { FileText, Users } from "lucide-react";
import { motion } from "framer-motion";
import { CredibilityBadge } from "./CredibilityBadge";
import type { Credibility } from "@/lib/mock-data";

export interface TheoryCardData {
  slug: string;
  title: string;
  codename: string;
  summary: string;
  tags: string[];
  entities: string[];
  credibility: Credibility;
  classification: string;
  documents: number;
  year: string | null;
}

export function TheoryCard({ theory, index = 0 }: { theory: TheoryCardData; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
    >
      <Link
        to="/theory/$slug"
        params={{ slug: theory.slug }}
        className="group block relative overflow-hidden rounded-sm border border-border bg-card hover:border-accent/60 transition-colors"
      >
        <div className="absolute top-0 right-0 px-2 py-1 font-mono text-[9px] tracking-widest text-primary/80 bg-primary/10 border-l border-b border-primary/30">
          {theory.classification}
        </div>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="p-5 space-y-3">
          <div className="space-y-1">
            <div className="font-mono text-[10px] tracking-widest text-muted-foreground">
              FILE//{theory.codename}
            </div>
            <h3 className="font-stamp text-xl text-foreground group-hover:text-accent transition-colors">
              {theory.title}
            </h3>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {theory.summary}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {theory.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground border border-border"
              >
                #{t.toLowerCase().replace(/\s+/g, "_")}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border/60">
            <CredibilityBadge level={theory.credibility} />
            <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" /> {theory.documents}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" /> {theory.entities.length}
              </span>
              <span>{theory.year}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}