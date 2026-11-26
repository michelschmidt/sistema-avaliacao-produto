import "server-only";

import { getSupabaseAdmin } from "./supabase";

/** Autor público da avaliação: nunca inclui email nem sobrenome completo. */
export type FeedbackAuthor = {
  name: string;
  avatarUrl: string;
};

export type Feedback = {
  id: string;
  score: number;
  comment: string;
  createdAt: string;
  author: FeedbackAuthor;
};

export type NewFeedback = {
  id: string;
  productId: string;
  createdBy: string;
  score: number;
  comment: string;
};

type AuthorRow = { first_name: string; last_name: string };

type FeedbackRow = {
  id: string;
  score: number;
  comment: string;
  created_at: string;
  // O PostgREST devolve objeto em relações N:1, mas sem tipos gerados aceitamos os dois formatos.
  author: AuthorRow | AuthorRow[] | null;
};

const FEEDBACK_COLUMNS =
  "id, score, comment, created_at, author:accounts!created_by(first_name, last_name)";

/** "Maria S." a partir do nome e sobrenome. */
function formatAuthorName(firstName = "", lastName = "") {
  const first = firstName.trim().split(/\s+/)[0] ?? "";
  const initial = lastName.trim().charAt(0).toUpperCase();
  if (!first) return "Pessoa da Avalia";
  return initial ? `${first} ${initial}.` : first;
}

function toFeedback(row: FeedbackRow): Feedback {
  const author = Array.isArray(row.author) ? row.author[0] : row.author;
  const name = formatAuthorName(author?.first_name, author?.last_name);
  return {
    id: row.id,
    score: row.score,
    comment: row.comment,
    createdAt: row.created_at,
    author: {
      name,
      avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`,
    },
  };
}

/** Todas as avaliações do produto, mais recentes primeiro. */
export async function listFeedbacksByProduct(
  productId: string,
): Promise<Feedback[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("products_feedbacks")
    .select(FEEDBACK_COLUMNS)
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .overrideTypes<FeedbackRow[], { merge: false }>();

  if (error) {
    throw new Error(`Falha ao listar avaliações: ${error.message}`, {
      cause: error,
    });
  }

  return data.map(toFeedback);
}

/**
 * Recalcula `products.score` como a média das notas, arredondada a 1 casa.
 * Projeto de estudo: sem transação/RPC; duas avaliações simultâneas convergem
 * na próxima gravação.
 */
async function refreshProductScore(productId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("products_feedbacks")
    .select("score")
    .eq("product_id", productId)
    .overrideTypes<{ score: number }[], { merge: false }>();

  if (error) {
    throw new Error(`Falha ao calcular a média: ${error.message}`, {
      cause: error,
    });
  }

  const average =
    data.length === 0
      ? null
      : Math.round(
          (data.reduce((sum, row) => sum + row.score, 0) / data.length) * 10,
        ) / 10;

  const { error: updateError } = await supabase
    .from("products")
    .update({ score: average })
    .eq("id", productId);

  if (updateError) {
    throw new Error(`Falha ao atualizar a média: ${updateError.message}`, {
      cause: updateError,
    });
  }
}

/** Grava a avaliação, atualiza a média do produto e devolve a avaliação com o autor. */
export async function insertFeedback(feedback: NewFeedback): Promise<Feedback> {
  const { data, error } = await getSupabaseAdmin()
    .from("products_feedbacks")
    .insert({
      id: feedback.id,
      product_id: feedback.productId,
      created_by: feedback.createdBy,
      score: feedback.score,
      comment: feedback.comment,
    })
    .select(FEEDBACK_COLUMNS)
    .single<FeedbackRow>();

  if (error) {
    throw new Error(`Falha ao inserir avaliação: ${error.message}`, {
      cause: error,
    });
  }

  await refreshProductScore(feedback.productId);

  return toFeedback(data);
}

/** Tag de cache da página do produto (dados + avaliações). */
export function productCacheTag(productId: string) {
  return `product:${productId}`;
}
