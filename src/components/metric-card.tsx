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
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        {Icon ? (
          <Icon
            className={cn(
              "h-5 w-5",
              tone === "success"
                ? "text-emerald-500"
                : tone === "warning"
                  ? "text-amber-500"
                  : "text-primary",
            )}
          />
        ) : null}
      </div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
      {hint ? (
        <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
      ) : null}
    </>
  );

  const classes = cn(
    "rounded-2xl border border-border bg-card p-5 shadow-sm",
    tone === "success" && "border-emerald-500/40",
    tone === "warning" && "border-amber-500/40",
    href &&
      "transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
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
