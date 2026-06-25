import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/lib/api";

export default function Wishlist() {
  const { wishlist, toggleWishlist } = useCart();
  return (
    <div className="px-4 sm:px-6 lg:px-12 py-10" data-testid="wishlist-page">
      <h1 className="font-serif text-3xl mb-8">My Wishlist</h1>
      {wishlist.length === 0 ? (
        <div className="text-center py-20"><p className="text-text-muted">Your wishlist is empty.</p>
          <Link to="/shop" className="btn-primary mt-6 inline-flex">Shop Collection</Link></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {wishlist.map((w) => (
            <div key={w.product_id} className="product-card relative">
              <Link to={`/product/${w.product_id}`} className="product-card-image">
                <img src={w.image} alt={w.name} />
              </Link>
              <div className="p-3">
                <p className="font-serif text-sm line-clamp-2">{w.name}</p>
                <p className="text-maroon mt-1">{formatINR(w.price)}</p>
                <button onClick={() => toggleWishlist(w)} className="mt-2 text-xs link-gold" data-testid={`remove-wish-${w.product_id}`}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
