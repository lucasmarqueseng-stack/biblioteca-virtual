import { z } from "zod";
import { STATUS_ORDER } from "@/lib/constants";

const currentYear = new Date().getFullYear();

export const bookInputSchema = z.object({
  title: z.string().trim().min(1, "Título é obrigatório.").max(500),
  authors: z
    .array(z.string().trim().min(1))
    .min(1, "Informe ao menos um autor."),
  year: z
    .number()
    .int()
    .min(0)
    .max(currentYear + 1, `O ano deve ser até ${currentYear + 1}.`)
    .nullable()
    .optional(),
  genre: z.string().trim().max(100).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  coverUrl: z
    .string()
    .trim()
    .max(2048)
    .nullable()
    .optional()
    .refine(
      (v) => !v || v === "" || /^https?:\/\//.test(v) || v.startsWith("/"),
      "Informe uma URL http(s) ou caminho local válido.",
    ),
  status: z.enum(STATUS_ORDER as [string, ...string[]]).default("NAO_LIDO"),
  initialRating: z.number().int().min(1).max(5).nullable().optional(),
  pages: z.number().int().min(0).default(0),
  pagesRead: z.number().int().min(0).default(0),
});

export type BookInput = z.infer<typeof bookInputSchema>;

export const reviewInputSchema = z.object({
  bookId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(5000).optional().nullable(),
});

export type ReviewInput = z.infer<typeof reviewInputSchema>;

export const goalInputSchema = z
  .object({
    year: z.number().int().min(1900).max(3000),
    targetBooks: z.number().int().min(0).nullable().optional(),
    targetPages: z.number().int().min(0).nullable().optional(),
  })
  .refine(
    (v) =>
      (v.targetBooks != null && v.targetBooks > 0) ||
      (v.targetPages != null && v.targetPages > 0),
    { message: "Defina ao menos uma meta (livros ou páginas)." },
  );

export type GoalInput = z.infer<typeof goalInputSchema>;

/** Converte uma string com autores separados por vírgula ou nova linha em lista. */
export function parseAuthors(text: string): string[] {
  if (!text) return [];
  const parts: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    for (const chunk of line.split(",")) {
      const v = chunk.trim();
      if (v) parts.push(v);
    }
  }
  // dedupe case-insensitive mantendo a primeira ocorrência
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const k = p.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(p);
    }
  }
  return out;
}
