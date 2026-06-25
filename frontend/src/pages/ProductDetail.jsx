import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { buildWhatsAppOrderLink, formatINR } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/components/AuthModal";
import ProductCard from "@/components/ProductCard";
import { Heart, ShoppingBag, Share2, Truck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function ProductDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const { addToCart, toggleWishlist, isWishlisted } = useCart();
  const { user } = useAuth();
  const { openAuth } = useAuthModal();

  const requireAuth = (cb) => { if (!user) { openAuth(cb); return false; } cb(); return true; };

  useEffect(() => {
    api.get(`/products/${id}`).then((r) => { setData(r.data); setActiveImg(0); });
  }, [id]);

  if (!data) return <div className="text-center py-20 text-text-muted">Loading...</div>;
  const p = data.product;
  const link = `${window.location.origin}/product/${p.product_id}`;

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: p.name, url: link });
      else { await navigator.clipboard.writeText(link); toast.success("Link copied!"); }
    } catch {}
  };

  return (
    <div className="px-4 sm:px-6 lg:px-12 py-10" data-testid="product-detail">
      <nav className="text-xs uppercase tracking-wider text-text-muted mb-6">
        <Link to="/shop">Shop</Link> / <Link to={`/shop?category=${encodeURIComponent(p.category)}`}>{p.category}</Link>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10">
        <div>
          <div className="zoom-container aspect-square bg-cream" data-testid="product-main-image">
            <img src={p.images?.[activeImg]} alt={p.name} className="w-full h-full object-cover" />
          </div>
          {p.images?.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
              {p.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`w-20 h-20 flex-shrink-0 border ${i === activeImg ? "border-gold" : "border-soft"}`} data-testid={`thumb-${i}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-deep-gold">{p.category}</p>
          <h1 className="font-serif text-3xl sm:text-4xl mt-2">{p.name}</h1>
          <div className="text-gold text-sm mt-3">★★★★★ <span className="text-text-muted">({p.review_count || 0} reviews)</span></div>
          <div className="flex items-baseline gap-4 mt-5">
            <span className="text-3xl text-maroon font-semibold">{formatINR(p.price)}</span>
            {p.rental_price && <span className="text-sm text-text-muted">or rent at {formatINR(p.rental_price)}</span>}
          </div>
          <p className="mt-2 text-sm text-text-muted">Inclusive of all taxes • Product ID: {p.product_id}</p>

          {p.is_rental && (
            <div className="mt-5 admin-card border-gold/40 bg-cream">
              <p className="text-sm"><span className="font-semibold">Rent:</span> {formatINR(p.rental_price)} for 4 days</p>
              <p className="text-sm mt-1"><span className="font-semibold">Refundable Security Deposit:</span> {formatINR(p.security_deposit || 0)}</p>
              <Link to={`/rental?product=${p.product_id}`} className="btn-outline-gold mt-3 inline-flex !py-2" data-testid="book-rental-btn">Book on Rent</Link>
            </div>
          )}

          <p className="mt-6 text-text-secondary leading-relaxed">{p.description}</p>

          <div className="flex items-center gap-4 mt-6">
            <span className="text-sm">Quantity:</span>
            <div className="flex border border-soft">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-1" data-testid="qty-minus">−</button>
              <span className="px-4 py-1 border-x border-soft" data-testid="qty-value">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="px-3 py-1" data-testid="qty-plus">+</button>
            </div>
            <span className={`text-xs ${p.stock > 0 ? "text-green-700" : "text-red-700"}`}>{p.stock > 0 ? `In Stock (${p.stock})` : "Out of Stock"}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button onClick={() => requireAuth(() => addToCart(p, qty))} className="btn-outline-gold" data-testid="add-to-cart-btn"><ShoppingBag size={16} /> Add to Cart</button>
            <button onClick={() => requireAuth(() => { addToCart(p, qty); window.location.href = "/checkout"; })} className="btn-primary" data-testid="buy-now-btn">Buy Now</button>
          </div>

          <a href={buildWhatsAppOrderLink({ productName: p.name, productId: p.product_id, price: p.price, quantity: qty, productUrl: link })}
             target="_blank" rel="noreferrer" className="btn-whatsapp mt-3 w-full justify-center" data-testid="wa-order-btn">
            <i className="fa-brands fa-whatsapp text-lg" /> Order on WhatsApp
          </a>

          <div className="flex gap-4 mt-4 text-sm">
            <button onClick={() => requireAuth(() => toggleWishlist(p))} className="flex items-center gap-2 link-gold" data-testid="wishlist-btn">
              <Heart size={14} className={isWishlisted(p.product_id) ? "fill-maroon text-maroon" : ""} /> Wishlist
            </button>
            <button onClick={share} className="flex items-center gap-2 link-gold" data-testid="share-btn"><Share2 size={14} /> Share</button>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-soft text-xs text-text-muted">
            <div className="flex items-center gap-2"><Truck size={14} className="text-deep-gold" /> Free shipping above ₹999</div>
            <div className="flex items-center gap-2"><ShieldCheck size={14} className="text-deep-gold" /> 7-day exchange</div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-20">
        <h2 className="font-serif text-2xl mb-6">Customer Reviews</h2>
        {data.reviews?.length === 0 ? <p className="text-text-muted text-sm">No reviews yet. Be the first to review!</p> : (
          <div className="space-y-4">
            {data.reviews.map((r) => (
              <div key={r.review_id} className="admin-card">
                <div className="flex justify-between"><span className="font-serif">{r.user_name}</span><span className="text-gold text-sm">{"★".repeat(r.rating)}</span></div>
                <p className="text-sm text-text-secondary mt-1">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Related */}
      {data.related?.length > 0 && (
        <section className="mt-20">
          <h2 className="font-serif text-2xl mb-6">You may also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {data.related.map((rp) => <ProductCard key={rp.product_id} product={rp} />)}
          </div>
        </section>
      )}
    </div>
  );
}
