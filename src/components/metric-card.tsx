import Link from "next/link";
import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning";
  href?: string;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </span>
        {Icon ? (
          <Icon
            className={cn(
              "h-5 w-5",
              tone === "success"
                ? "text-[oklch(0.55_0.1_145)]"
                : tone === "warning"
                  ? "text-[oklch(0.65_0.12_70)]"
                  : "text-primary",
            )}
          />
        ) : null}
      </div>
      <div className="font-heading mt-2.5 text-4xl font-semibold leading-none tracking-tight">
        {value}
      </div>
      {hint ? (
        <div className="mt-2 text-xs leading-snug text-muted-foreground">
          {hint}
        </div>
      ) : null}
    </>
  );

  const classes = cn(
    "rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_2px_rgba(74,40,26,0.04)]",
    tone === "success" && "border-[oklch(0.55_0.1_145)]/35",
    tone === "warning" && "border-[oklch(0.65_0.12_70)]/45",
    href &&
      "transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_4px_12px_-2px_rgba(74,40,26,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
  );

  if (href) {
    return (
      <Link href={href} className={cn(classes, "block")}>
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}
