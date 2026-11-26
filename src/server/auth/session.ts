import "server-only";

import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { connection } from "next/server";

export type Session = { accountId: string };

const COOKIE_NAME = "avalia_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET precisa estar definida no .env.local");
  }
  return new TextEncoder().encode(secret);
}

/** Cria a sessão (JWT HS256) e grava no cookie httpOnly. Só funciona em Route Handlers / Server Actions. */
export async function createSession(accountId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const token = await new SignJWT({ accountId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(getKey());

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Lê e valida a sessão do cookie. Retorna `null` se ausente, inválida ou expirada. */
export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  // `jwtVerify` lê a hora atual (`new Date()`) para checar a expiração. Com
  // cacheComponents isso é proibido durante o prerender; `connection()` faz
  // o restante rodar só na requisição.
  await connection();

  try {
    const { payload } = await jwtVerify(token, getKey(), {
      algorithms: ["HS256"],
    });
    return typeof payload.accountId === "string"
      ? { accountId: payload.accountId }
      : null;
  } catch {
    return null;
  }
}

/** Remove o cookie de sessão (logout). */
export async function deleteSession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}
