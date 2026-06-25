import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sc_cart") || "[]"); } catch { return []; }
  });
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sc_wish") || "[]"); } catch { return []; }
  });

  useEffect(() => { localStorage.setItem("sc_cart", JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem("sc_wish", JSON.stringify(wishlist)); }, [wishlist]);

  const addToCart = (product, quantity = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.product_id === product.product_id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + quantity };
        return copy;
      }
      return [...prev, {
        product_id: product.product_id, name: product.name, price: product.price,
        image: product.images?.[0] || "", quantity,
      }];
    });
    toast.success(`${product.name} added to cart`);
  };

  const updateQty = (product_id, quantity) => {
    if (quantity <= 0) return removeItem(product_id);
    setItems((p) => p.map((x) => x.product_id === product_id ? { ...x, quantity } : x));
  };

  const removeItem = (product_id) => setItems((p) => p.filter((x) => x.product_id !== product_id));
  const clearCart = () => setItems([]);

  const toggleWishlist = (product) => {
    setWishlist((prev) => {
      if (prev.find((x) => x.product_id === product.product_id)) {
        toast.message("Removed from wishlist");
        return prev.filter((x) => x.product_id !== product.product_id);
      }
      toast.success("Added to wishlist");
      return [...prev, { product_id: product.product_id, name: product.name, price: product.price, image: product.images?.[0] || "" }];
    });
  };

  const isWishlisted = (pid) => !!wishlist.find((x) => x.product_id === pid);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, wishlist, addToCart, updateQty, removeItem, clearCart, toggleWishlist, isWishlisted, subtotal, count }}>
      {children}
    </CartContext.Provider>
  );
}
