import "server-only";

import { getSupabaseAdmin } from "./supabase";

export type NewAccount = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
};

/** Dados públicos da conta: nunca inclui a senha/hash. */
export type PublicAccount = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  active: boolean;
  createdAt: string;
};

type AccountRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  active: boolean;
  created_at: string;
};

const PUBLIC_COLUMNS = "id, first_name, last_name, email, active, created_at";

function toPublicAccount(row: AccountRow): PublicAccount {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    active: row.active,
    createdAt: row.created_at,
  };
}

/** Credenciais para o login. Uso interno do servidor: o hash nunca sai da API. */
export type AccountCredentials = {
  id: string;
  passwordHash: string;
  active: boolean;
};

/**
 * Busca a conta pelo email (já normalizado em minúsculas pelo schema).
 * Como `email` ainda não é UNIQUE, usa o registro mais recente.
 */
export async function findAccountByEmail(
  email: string,
): Promise<AccountCredentials | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("accounts")
    .select("id, password, active")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; password: string; active: boolean }>();

  if (error) {
    throw new Error(`Falha ao buscar conta: ${error.message}`, {
      cause: error,
    });
  }

  return data
    ? { id: data.id, passwordHash: data.password, active: data.active }
    : null;
}

/** Conta pública pelo id (sem senha). `null` se não existir. */
export async function findPublicAccountById(
  id: string,
): Promise<PublicAccount | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("accounts")
    .select(PUBLIC_COLUMNS)
    .eq("id", id)
    .maybeSingle<AccountRow>();

  if (error) {
    throw new Error(`Falha ao buscar conta: ${error.message}`, {
      cause: error,
    });
  }

  return data ? toPublicAccount(data) : null;
}

export async function insertAccount(
  account: NewAccount,
): Promise<PublicAccount> {
  const { data, error } = await getSupabaseAdmin()
    .from("accounts")
    .insert({
      id: account.id,
      first_name: account.firstName,
      last_name: account.lastName,
      email: account.email,
      password: account.passwordHash,
      active: true,
    })
    .select(PUBLIC_COLUMNS)
    .single<AccountRow>();

  if (error) {
    throw new Error(`Falha ao inserir conta: ${error.message}`, {
      cause: error,
    });
  }

  return toPublicAccount(data);
}
