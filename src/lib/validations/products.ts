import { z } from "zod";

export const PRODUCTS_PAGE_SIZE = 12;
export const PRODUCTS_MAX_PAGE_SIZE = 50;

/** Posição na listagem `(created_at desc, id desc)`. */
export type ProductCursor = { createdAt: string; id: string };

// Formato aceito para evitar injeção no filtro do PostgREST.
const TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}(:?\d{2})?)$/;
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/** Cursor opaco: base64url de `created_at|id`. */
export function encodeProductCursor(cursor: ProductCursor): string {
  return Buffer.from(`${cursor.createdAt}|${cursor.id}`, "utf8").toString(
    "base64url",
  );
}

export function decodeProductCursor(value: string): ProductCursor | null {
  let decoded: string;
  try {
    decoded = Buffer.from(value, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const separator = decoded.lastIndexOf("|");
  if (separator === -1) return null;

  const createdAt = decoded.slice(0, separator);
  const id = decoded.slice(separator + 1);
  if (!TIMESTAMP_PATTERN.test(createdAt) || !ID_PATTERN.test(id)) return null;

  return { createdAt, id };
}

export const listProductsSchema = z.object({
  /** Cursor opaco devolvido em `nextCursor`; ausente/nulo = primeira página. */
  cursor: z.string().trim().max(200).nullish(),
  limit: z.coerce
    .number({ error: "Informe um número" })
    .int("Use um número inteiro")
    .min(1, "Use no mínimo 1")
    .max(PRODUCTS_MAX_PAGE_SIZE, `Use no máximo ${PRODUCTS_MAX_PAGE_SIZE}`)
    .default(PRODUCTS_PAGE_SIZE),
});

const httpUrl = (label: string) =>
  z
    .string({ error: `Informe ${label}` })
    .trim()
    .min(1, `Informe ${label}`)
    .max(2048, "Use no máximo 2048 caracteres")
    .pipe(
      z.url({
        protocol: /^https?$/,
        error: `Informe ${label} válido (http ou https)`,
      }),
    );

/** Link usado quando o produto chega sem um link externo completo (ambiente de teste). */
export const DEFAULT_EXTERNAL_LINK = "https://www.amazon.com.br/blackfriday";

/**
 * Link externo flexível: URL completa http(s) é mantida; qualquer outro valor
 * (vazio, ausente ou caminho como "/shampoo") vira `DEFAULT_EXTERNAL_LINK`.
 */
const externalLink = z
  .string()
  .trim()
  .max(2048, "Use no máximo 2048 caracteres")
  .nullish()
  .transform((value) => {
    if (!value) return DEFAULT_EXTERNAL_LINK;
    try {
      const url = new URL(value);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return url.toString();
      }
    } catch {
      // não é URL absoluta (ex.: "/shampoo")
    }
    return DEFAULT_EXTERNAL_LINK;
  });

export const createProductSchema = z.object({
  name: z
    .string({ error: "Informe o nome do produto" })
    .trim()
    .min(1, "Informe o nome do produto")
    .max(200, "Use no máximo 200 caracteres"),
  description: z
    .string()
    .trim()
    .max(1000, "Use no máximo 1000 caracteres")
    .nullish()
    .transform((value) => (value ? value : null)),
  externalLink,
  imageUrl: httpUrl("um link de imagem"),
});

export type ListProductsInput = z.input<typeof listProductsSchema>;
export type CreateProductInput = z.input<typeof createProductSchema>;
export type CreateProductData = z.output<typeof createProductSchema>;
