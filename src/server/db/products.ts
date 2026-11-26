import "server-only";

import { getSupabaseAdmin } from "./supabase";

/**
 * Contrato compartilhado (Fase 0). Não alterar `Product`, `PRODUCT_COLUMNS`,
 * `ProductRow`, `toProduct` nem `findProductById` sem falar com o orquestrador.
 */
export type Product = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  externalLink: string;
  /** Média das avaliações (1.0–5.0); `null` quando ainda não há avaliações. */
  score: number | null;
  /** Resumo das avaliações gerado por IA; `null` enquanto não houver. */
  aiSummary: string | null;
  aiSummaryUpdatedAt: string | null;
  /** Quantas avaliações o resumo considerou. */
  aiSummaryFeedbackCount: number | null;
  createdAt: string;
  updatedAt: string;
};

export const PRODUCT_COLUMNS =
  "id, name, description, image_url, external_link, score, ai_summary, ai_summary_updated_at, ai_summary_feedback_count, created_at, updated_at";

export type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  external_link: string;
  score: number | string | null; // numeric pode vir como string
  ai_summary: string | null;
  ai_summary_updated_at: string | null;
  ai_summary_feedback_count: number | null;
  created_at: string;
  updated_at: string;
};

export function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    externalLink: row.external_link,
    score: row.score === null ? null : Number(row.score),
    aiSummary: row.ai_summary,
    aiSummaryUpdatedAt: row.ai_summary_updated_at,
    aiSummaryFeedbackCount: row.ai_summary_feedback_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findProductById(id: string): Promise<Product | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("id", id)
    .maybeSingle<ProductRow>();

  if (error) {
    throw new Error(`Falha ao buscar produto: ${error.message}`, {
      cause: error,
    });
  }

  return data ? toProduct(data) : null;
}

// ↓ Feature home adiciona listProducts e insertProduct abaixo desta linha.

export type ProductPage = {
  items: Product[];
  /** Último item da página quando há mais resultados; `null` no fim da lista. */
  next: { createdAt: string; id: string } | null;
};

/** PostgREST: aspas protegem `.`, `:`, `,` e `+` dentro do filtro `or`. */
function quoteFilterValue(value: string): string {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

/** Lista por `(created_at desc, id desc)`; busca `limit + 1` para saber se há próxima página. */
export async function listProducts({
  cursor,
  limit,
}: {
  cursor: { createdAt: string; id: string } | null;
  limit: number;
}): Promise<ProductPage> {
  let query = getSupabaseAdmin()
    .from("products")
    .select(PRODUCT_COLUMNS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    const createdAt = quoteFilterValue(cursor.createdAt);
    const id = quoteFilterValue(cursor.id);
    query = query.or(
      `created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`,
    );
  }

  const { data, error } = await query.returns<ProductRow[]>();

  if (error) {
    throw new Error(`Falha ao listar produtos: ${error.message}`, {
      cause: error,
    });
  }

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page.at(-1);

  return {
    items: page.map(toProduct),
    next: hasMore && last ? { createdAt: last.created_at, id: last.id } : null,
  };
}

export type NewProduct = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string;
  externalLink: string;
};

export async function insertProduct(product: NewProduct): Promise<Product> {
  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .insert({
      id: product.id,
      name: product.name,
      description: product.description,
      image_url: product.imageUrl,
      external_link: product.externalLink,
    })
    .select(PRODUCT_COLUMNS)
    .single<ProductRow>();

  if (error) {
    throw new Error(`Falha ao inserir produto: ${error.message}`, {
      cause: error,
    });
  }

  return toProduct(data);
}

/**
 * Grava o resumo de IA. Só sobrescreve se o novo resumo considerou pelo menos
 * tantas avaliações quanto o atual: evita que uma geração mais lenta e antiga
 * substitua uma mais nova quando duas avaliações chegam juntas.
 */
export async function updateProductAiSummary(
  id: string,
  summary: string,
  feedbackCount: number,
): Promise<boolean> {
  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .update({
      ai_summary: summary,
      ai_summary_updated_at: new Date().toISOString(),
      ai_summary_feedback_count: feedbackCount,
    })
    .eq("id", id)
    .or(
      `ai_summary_feedback_count.is.null,ai_summary_feedback_count.lte.${feedbackCount}`,
    )
    .select("id");

  if (error) {
    throw new Error(`Falha ao salvar resumo de IA: ${error.message}`, {
      cause: error,
    });
  }

  return (data?.length ?? 0) > 0;
}
