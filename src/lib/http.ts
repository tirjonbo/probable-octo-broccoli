import "server-only";
import { NextResponse } from "next/server";
import { AuthError } from "./auth";
import { ShopError } from "./shop";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Превращает ожидаемые ошибки в 400, остальные — в 500 без утечки деталей. */
export async function handle(fn: () => Promise<Response> | Response): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof AuthError || e instanceof ShopError) return fail(e.message);
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
