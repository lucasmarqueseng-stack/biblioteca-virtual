"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RatingStars } from "@/components/rating-stars";
import { addReviewAction } from "@/actions/reviews";

type ActionResult = { ok: true } | { ok: false; error: string };

export function ReviewForm({ bookId }: { bookId: number }) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    addReviewAction.bind(null, bookId),
    null,
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success("Avaliação salva.");
      formRef.current?.reset();
    } else {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Sua nota:</span>
        <RatingStars name="rating" />
      </div>
      <Textarea
        name="comment"
        rows={3}
        placeholder="Deixe um comentário (opcional)"
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Enviando..." : "Publicar avaliação"}
        </Button>
      </div>
    </form>
  );
}
