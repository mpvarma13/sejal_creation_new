import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/components/AuthModal";
import { buildWhatsAppOrderLink, formatINR } from "@/lib/api";

export const ProductCard = ({ product }) => {
  const { addToCart, toggleWishlist, isWishlisted } = useCart();
  const { user } = useAuth();
  const { openAuth } = useAuthModal();
  const link = `${window.location.origin}/product/${product.product_id}`;

  const handleAdd = () => {
    if (!user) { openAuth(() => addToCart(product)); return; }
    addToCart(product);
  };
  const handleWish = () => {
    if (!user) { openAuth(() => toggleWishlist(product)); return; }
    toggleWishlist(product);
  };
  return (
    <div className="product-card relative flex flex-col" data-testid={`product-card-${product.product_id}`}>
      <Link to={`/product/${product.product_id}`} className="product-card-image block">
        <img src={product.images?.[0]} alt={product.name} loading="lazy" />
      </Link>
      <div className="absolute top-3 left-3 flex flex-col gap-1">
        {product.is_new && <span className="bg-maroon text-white text-[10px] uppercase tracking-wider px-2 py-0.5">New</span>}
        {product.is_rental && <span className="bg-gold text-white text-[10px] uppercase tracking-wider px-2 py-0.5">On Rent</span>}
      </div>
      <button onClick={handleWish} className="absolute top-3 right-3 bg-white/90 p-2 rounded-full shadow-sm" data-testid={`wish-${product.product_id}`}>
        <Heart size={16} className={isWishlisted(product.product_id) ? "fill-maroon text-maroon" : "text-text-secondary"} />
      </button>
      <div className="p-4 flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-deep-gold">{product.category}</span>
        <Link to={`/product/${product.product_id}`} className="font-serif text-base text-text-primary line-clamp-2 leading-tight">{product.name}</Link>
        <div className="flex items-baseline gap-3 mt-1">
          <span className="text-lg text-maroon font-semibold">{formatINR(product.price)}</span>
          {product.rental_price && <span className="text-xs text-text-muted">Rent {formatINR(product.rental_price)}</span>}
        </div>
        <div className="flex gap-2 mt-2">
          <button onClick={handleAdd} className="flex-1 btn-outline-gold !py-2 !text-[10px]" data-testid={`add-cart-${product.product_id}`}>
            <ShoppingBag size={14} /> Add
          </button>
          <a href={buildWhatsAppOrderLink({ productName: product.name, productId: product.product_id, price: product.price, productUrl: link })}
             target="_blank" rel="noreferrer" className="flex-1 btn-whatsapp !py-2 !px-2 text-[10px] justify-center" data-testid={`wa-${product.product_id}`}>
            <i className="fa-brands fa-whatsapp" /> WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
