"use client";

import { Star } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

type RatingStarsProps = {
  value?: number | null;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
  name?: string;
  onChange?: (value: number) => void;
  className?: string;
};

const sizeClasses: Record<Required<RatingStarsProps>["size"], string> = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

export function RatingStars({
  value,
  size = "md",
  readOnly = false,
  name,
  onChange,
  className,
}: RatingStarsProps) {
  const [internal, setInternal] = useState<number>(value ?? 0);
  const [hover, setHover] = useState<number>(0);
  const active = hover || internal;

  function setValue(v: number) {
    setInternal(v);
    onChange?.(v);
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= active;
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onMouseEnter={() => !readOnly && setHover(n)}
            onMouseLeave={() => !readOnly && setHover(0)}
            onClick={() => !readOnly && setValue(n === internal ? 0 : n)}
            aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
            className={cn(
              "rounded transition-transform",
              !readOnly && "cursor-pointer hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring",
              readOnly && "pointer-events-none",
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/40",
              )}
            />
          </button>
        );
      })}
      {name ? <input type="hidden" name={name} value={internal} /> : null}
    </div>
  );
}
