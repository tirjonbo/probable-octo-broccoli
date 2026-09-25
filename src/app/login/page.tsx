import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "Вход" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  // Разрешаем только относительные пути, чтобы не было открытого редиректа.
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  return (
    <div className="container section" style={{ maxWidth: 440 }}>
      <AuthForm next={safeNext} />
    </div>
  );
}
