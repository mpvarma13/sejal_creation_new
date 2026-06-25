import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/lib/api";
import { Trash2 } from "lucide-react";

export default function Cart() {
  const { items, updateQty, removeItem, subtotal } = useCart();
  const shipping = subtotal > 0 && subtotal < 999 ? 80 : 0;
  const total = subtotal + shipping;

  if (items.length === 0)
    return (
      <div className="text-center py-32 px-4" data-testid="empty-cart">
        <h2 className="font-serif text-3xl">Your cart is empty</h2>
        <p className="text-text-muted mt-3">Browse our collection and add some sparkle.</p>
        <Link to="/shop" className="btn-primary mt-6 inline-flex" data-testid="cart-shop-btn">Shop Collection</Link>
      </div>
    );

  return (
    <div className="px-4 sm:px-6 lg:px-12 py-10 grid lg:grid-cols-3 gap-10" data-testid="cart-page">
      <div className="lg:col-span-2">
        <h1 className="font-serif text-3xl mb-6">Shopping Cart</h1>
        <div className="space-y-4">
          {items.map((it) => (
            <div key={it.product_id} className="flex gap-4 admin-card" data-testid={`cart-item-${it.product_id}`}>
              <img src={it.image} alt={it.name} className="w-24 h-24 object-cover" />
              <div className="flex-1">
                <Link to={`/product/${it.product_id}`} className="font-serif">{it.name}</Link>
                <p className="text-sm text-text-muted">{it.product_id}</p>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex border border-soft">
                    <button onClick={() => updateQty(it.product_id, it.quantity - 1)} className="px-2">−</button>
                    <span className="px-3">{it.quantity}</span>
                    <button onClick={() => updateQty(it.product_id, it.quantity + 1)} className="px-2">+</button>
                  </div>
                  <button onClick={() => removeItem(it.product_id)} className="text-text-muted hover:text-maroon" data-testid={`remove-${it.product_id}`}><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-maroon font-semibold">{formatINR(it.price * it.quantity)}</p>
                <p className="text-xs text-text-muted">{formatINR(it.price)} each</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="admin-card h-fit lg:sticky lg:top-32">
        <h3 className="font-serif text-xl">Order Summary</h3>
        <div className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? "Free" : formatINR(shipping)}</span></div>
          <div className="flex justify-between text-base font-semibold pt-3 border-t border-soft mt-2"><span>Total</span><span>{formatINR(total)}</span></div>
        </div>
        <Link to="/checkout" className="btn-primary mt-6 w-full" data-testid="checkout-btn">Proceed to Checkout</Link>
        <Link to="/shop" className="block text-center mt-3 link-gold text-sm">Continue Shopping</Link>
      </aside>
    </div>
  );
}
