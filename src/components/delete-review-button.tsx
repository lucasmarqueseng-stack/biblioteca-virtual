"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { deleteReviewAction } from "@/actions/reviews";

export function DeleteReviewButton({
  reviewId,
  bookId,
}: {
  reviewId: number;
  bookId: number;
}) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="text-destructive"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await deleteReviewAction(reviewId, bookId);
          if (!res.ok) toast.error(res.error);
        })
      }
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
