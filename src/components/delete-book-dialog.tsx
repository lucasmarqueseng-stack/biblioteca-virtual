"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteBookAction } from "@/actions/books";

export function DeleteBookDialog({
  bookId,
  title,
}: {
  bookId: number;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [pending, start] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="destructive" size="sm">
            <Trash2 className="mr-1 h-4 w-4" />
            Excluir
          </Button>
        }
      />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir livro</DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. Para confirmar, digite o título
            do livro abaixo:
            <br />
            <strong className="mt-2 block text-foreground">{title}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="confirm">Título</Label>
          <Input
            id="confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Digite para confirmar"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending || confirm.trim() !== title.trim()}
            onClick={() =>
              start(async () => {
                try {
                  await deleteBookAction(bookId);
                } catch (err) {
                  toast.error("Erro ao excluir livro.");
                  console.error(err);
                }
              })
            }
          >
            {pending ? "Excluindo..." : "Excluir definitivamente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
