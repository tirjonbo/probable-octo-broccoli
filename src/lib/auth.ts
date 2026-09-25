import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { db, newId, tx } from "./db";
import { hashPassword, verifyPassword } from "./password";

const COOKIE = "sid";
const SESSION_DAYS = 60;

export type User = {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  role: "customer" | "admin";
};

function createSession(userId: string): string {
  const token = crypto.randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5).toISOString();
  db().prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(token, userId, expires);
  return token;
}

async function setSessionCookie(token: string) {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

/** Текущий пользователь (гость или зарегистрированный) или null. Можно вызывать где угодно на сервере. */
export async function getUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const row = db()
    .prepare(
      `SELECT u.id, u.email, u.name, u.phone, u.role FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > ?`,
    )
    .get(token, new Date().toISOString()) as User | undefined;
  return row ?? null;
}

/** Возвращает пользователя, создавая гостевого при необходимости. Только в route handlers / server actions. */
export async function ensureUser(): Promise<User> {
  const existing = await getUser();
  if (existing) return existing;
  const id = newId();
  db().prepare("INSERT INTO users (id) VALUES (?)").run(id);
  await setSessionCookie(createSession(id));
  return { id, email: null, name: null, phone: null, role: "customer" };
}

export function isRegistered(u: User | null): u is User & { email: string } {
  return !!u?.email;
}

/** Переносит проекты, фото и корзину гостя в аккаунт. */
function mergeGuest(guestId: string, userId: string) {
  if (guestId === userId) return;
  const d = db();
  const guest = d.prepare("SELECT email FROM users WHERE id = ?").get(guestId) as { email: string | null } | undefined;
  if (!guest || guest.email) return;
  for (const table of ["projects", "uploads", "cart_items"]) {
    d.prepare(`UPDATE ${table} SET user_id = ? WHERE user_id = ?`).run(userId, guestId);
  }
}

export class AuthError extends Error {}

export async function register(input: { email: string; password: string; name: string }): Promise<User> {
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AuthError("Проверьте e-mail");
  if (input.password.length < 8) throw new AuthError("Пароль — минимум 8 символов");
  const d = db();
  if (d.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) throw new AuthError("Такой e-mail уже зарегистрирован");
  const current = await getUser();
  const hash = hashPassword(input.password);
  let userId: string;
  if (current && !current.email) {
    // Гость становится полноценным пользователем — все его проекты остаются на месте.
    d.prepare("UPDATE users SET email = ?, name = ?, password_hash = ? WHERE id = ?").run(
      email,
      input.name.trim(),
      hash,
      current.id,
    );
    userId = current.id;
  } else {
    userId = newId();
    d.prepare("INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)").run(
      userId,
      email,
      input.name.trim(),
      hash,
    );
  }
  await setSessionCookie(createSession(userId));
  return (await getUserById(userId))!;
}

// Ограничение подбора пароля: не больше 10 неудачных попыток на e-mail за 15 минут.
const failures = new Map<string, { count: number; until: number }>();
const WINDOW = 15 * 60 * 1000;

function checkRate(key: string) {
  const f = failures.get(key);
  if (f && f.until > Date.now() && f.count >= 10) throw new AuthError("Слишком много попыток. Попробуйте через 15 минут");
}
function recordFailure(key: string) {
  const f = failures.get(key);
  if (!f || f.until < Date.now()) failures.set(key, { count: 1, until: Date.now() + WINDOW });
  else f.count++;
  if (failures.size > 10_000) failures.clear();
}

export async function changePassword(userId: string, current: string, next: string) {
  if (next.length < 8) throw new AuthError("Новый пароль — минимум 8 символов");
  const row = db().prepare("SELECT password_hash FROM users WHERE id = ?").get(userId) as { password_hash: string } | undefined;
  if (!row || !verifyPassword(current, row.password_hash)) throw new AuthError("Текущий пароль неверный");
  db().prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(next), userId);
  // Остальные устройства выходят из аккаунта, текущая сессия остаётся.
  const token = (await cookies()).get(COOKIE)?.value ?? "";
  db().prepare("DELETE FROM sessions WHERE user_id = ? AND token != ?").run(userId, token);
}

export async function login(emailRaw: string, password: string): Promise<User> {
  const email = emailRaw.trim().toLowerCase();
  checkRate(email);
  const row = db().prepare("SELECT id, password_hash FROM users WHERE email = ?").get(email) as
    | { id: string; password_hash: string }
    | undefined;
  if (!row || !verifyPassword(password, row.password_hash)) {
    recordFailure(email);
    throw new AuthError("Неверный e-mail или пароль");
  }
  failures.delete(email);
  const current = await getUser();
  if (current && !current.email) tx(() => mergeGuest(current.id, row.id));
  await setSessionCookie(createSession(row.id));
  return (await getUserById(row.id))!;
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) db().prepare("DELETE FROM sessions WHERE token = ?").run(token);
  jar.delete(COOKIE);
}

export async function getUserById(id: string): Promise<User | null> {
  return (
    (db().prepare("SELECT id, email, name, phone, role FROM users WHERE id = ?").get(id) as User | undefined) ?? null
  );
}
