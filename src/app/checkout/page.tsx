import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/CheckoutForm";
import { getUser } from "@/lib/auth";
import { getCart } from "@/lib/shop";

export const metadata = { title: "Оформление заказа" };

export default async function CheckoutPage() {
  const user = await getUser();
  const items = user ? getCart(user.id) : [];
  if (items.length === 0) redirect("/cart");
  return (
    <div className="container section">
      <h1>Оформление заказа</h1>
      <CheckoutForm
        items={items}
        defaults={{ name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "" }}
      />
    </div>
  );
}
