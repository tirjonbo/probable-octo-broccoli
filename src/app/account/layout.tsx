import { redirect } from "next/navigation";
import { AccountTabs } from "@/components/AccountTabs";
import { getUser } from "@/lib/auth";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user?.email) redirect("/login?next=/account");
  return (
    <div className="container section">
      <h1>Здравствуйте{user.name ? `, ${user.name}` : ""}!</h1>
      <AccountTabs />
      {children}
    </div>
  );
}
