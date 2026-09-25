import "server-only";
import { NextResponse } from "next/server";
import { AuthError, type User, getUser } from "./auth";
import { ContentError } from "./content-store";
import { ShopError } from "./shop";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Защита от CSRF: изменяющие запросы принимаем только со своего сайта.
 * Браузер всегда присылает Origin для POST/PUT/PATCH/DELETE из fetch и форм.
 */
function sameOrigin(req: Request): boolean {
  if (req.method === "GET" || req.method === "HEAD") return true;
  const origin = req.headers.get("origin");
  if (!origin) return true; // не браузер (curl, мониторинг) — cookie сессии у него нет
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Превращает ожидаемые ошибки в 400, остальные — в 500 без утечки деталей. */
export async function handle(fn: () => Promise<Response> | Response, req?: Request): Promise<Response> {
  if (req && !sameOrigin(req)) return fail("Запрос отклонён", 403);
  try {
    return await fn();
  } catch (e) {
    if (e instanceof AuthError || e instanceof ShopError || e instanceof ContentError) return fail(e.message);
    if (e instanceof SyntaxError) return fail("Некорректный запрос");
    console.error(e);
    return fail("Внутренняя ошибка сервера", 500);
  }
}

export async function body<T = Record<string, unknown>>(req: Request): Promise<T> {
  return (await req.json()) as T;
}

export function str(v: unknown, max = 500): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

/** Для админских API: возвращает администратора или null. */
export async function adminUser(): Promise<User | null> {
  const u = await getUser();
  return u?.role === "admin" ? u : null;
}

/** Обёртка для админских обработчиков: проверка источника, прав и ошибок. */
export function adminHandle(req: Request, fn: (admin: User) => Promise<Response> | Response) {
  return handle(async () => {
    const admin = await adminUser();
    if (!admin) return fail("Нет доступа", 403);
    return fn(admin);
  }, req);
}

export const authorName = (u: User) => u.name || u.email || "Администратор";
