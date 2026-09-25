import { CartView } from "@/components/CartView";
import { getUser } from "@/lib/auth";
import { getCart } from "@/lib/shop";

export const metadata = { title: "Корзина" };

export default async function CartPage() {
  const user = await getUser();
  return (
    <div className="container section">
      <h1>Корзина</h1>
      <CartView initial={user ? getCart(user.id) : []} />
    </div>
  );
}
