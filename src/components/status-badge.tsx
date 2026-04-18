import { cn } from "@/lib/utils";
import {
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
  type BookStatus,
} from "@/lib/constants";

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const key = (status as BookStatus) in STATUS_LABELS
    ? (status as BookStatus)
    : "NAO_LIDO";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_BADGE_CLASSES[key],
        className,
      )}
    >
      {STATUS_LABELS[key]}
    </span>
  );
}
