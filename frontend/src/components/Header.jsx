import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, Heart, User, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { CATEGORIES } from "@/constants/categories";

export default function Header() {
  const { count } = useCart();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [q, setQ] = useState("");
  const [offers, setOffers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/config").then((r) => setOffers(r.data?.offers || [])).catch(() => {});
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/shop?search=${encodeURIComponent(q.trim())}`);
    setShowSearch(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-ivory/95 backdrop-blur-md border-b border-soft" data-testid="site-header">
      {/* Promo bar */}
      <div className="bg-maroon text-white text-xs py-2 overflow-hidden">
        <div className="marquee">
          <div className="marquee-track whitespace-nowrap px-4">
            {offers.length > 0 && offers.map((o, i) => (
              <span key={`o${i}`} className="text-gold">✦ {o.code}: {o.type === "percent" ? `${o.value}% OFF` : `₹${o.value} OFF`}{o.description ? ` — ${o.description}` : ""}</span>
            ))}
            <span>✦ Free Shipping above ₹999</span>
            <span>✦ COD available in PIN 443101</span>
            <span>✦ Bridal Sets on Rent</span>
            <span>✦ Order on WhatsApp +91 72620 80228</span>
            {offers.length > 0 && offers.map((o, i) => (
              <span key={`o2${i}`} className="text-gold">✦ {o.code}: {o.type === "percent" ? `${o.value}% OFF` : `₹${o.value} OFF`}</span>
            ))}
            <span>✦ Free Shipping above ₹999</span>
            <span>✦ COD available in PIN 443101</span>
            <span>✦ Bridal Sets on Rent</span>
            <span>✦ Order on WhatsApp +91 72620 80228</span>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-12 py-4 flex items-center justify-between gap-4">
        <button className="lg:hidden" onClick={() => setOpen(true)} data-testid="mobile-menu-btn"><Menu size={22} /></button>
        <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
          <span className="font-display text-2xl sm:text-3xl text-maroon">Sejal</span>
          <span className="text-gold">✦</span>
          <span className="font-display text-2xl sm:text-3xl text-deep-gold">Creation</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-7 text-sm tracking-wide">
          <Link to="/" className="hover:text-maroon" data-testid="nav-home">Home</Link>
          <Link to="/shop" className="hover:text-maroon" data-testid="nav-shop">Shop</Link>
          <Link to="/shop?category=Bridal%20Sets" className="hover:text-maroon" data-testid="nav-bridal">Bridal</Link>
          <Link to="/rental" className="hover:text-maroon" data-testid="nav-rental">Rentals</Link>
          <Link to="/shop?category=New%20Arrivals" className="hover:text-maroon" data-testid="nav-new">New Arrivals</Link>
          <Link to="/contact" className="hover:text-maroon" data-testid="nav-contact">Contact</Link>
        </nav>

        <div className="flex items-center gap-4">
          <button onClick={() => setShowSearch((s) => !s)} aria-label="search" data-testid="search-toggle"><Search size={20} /></button>
          <Link to="/wishlist" data-testid="wishlist-link"><Heart size={20} /></Link>
          <Link to={user ? (user.role === "admin" ? "/admin" : "/account") : "/login"} data-testid="account-link"><User size={20} /></Link>
          <Link to="/cart" className="relative" data-testid="cart-link">
            <ShoppingBag size={20} />
            {count > 0 && <span className="absolute -top-2 -right-2 bg-maroon text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full" data-testid="cart-count">{count}</span>}
          </Link>
        </div>
      </div>

      {showSearch && (
        <form onSubmit={submitSearch} className="border-t border-soft px-4 sm:px-6 lg:px-12 py-3 bg-cream" data-testid="search-form">
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for jewellery, sets, bangles..." className="w-full bg-transparent border-b border-gold/50 focus:border-gold outline-none py-2" data-testid="search-input" />
        </form>
      )}

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={() => setOpen(false)} data-testid="mobile-drawer">
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-ivory p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <span className="font-display text-2xl text-maroon">Menu</span>
              <button onClick={() => setOpen(false)}><X size={22} /></button>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <Link to="/" onClick={() => setOpen(false)} className="py-2 border-b border-soft">Home</Link>
              <Link to="/shop" onClick={() => setOpen(false)} className="py-2 border-b border-soft">Shop All</Link>
              <Link to="/rental" onClick={() => setOpen(false)} className="py-2 border-b border-soft">Bridal Rentals</Link>
              <div className="py-2 border-b border-soft font-semibold uppercase tracking-wider text-xs text-deep-gold mt-3">Categories</div>
              {CATEGORIES.map((c) => (
                <Link key={c} to={`/shop?category=${encodeURIComponent(c)}`} onClick={() => setOpen(false)} className="py-2 text-sm">{c}</Link>
              ))}
              <Link to="/contact" onClick={() => setOpen(false)} className="py-2 border-t border-soft mt-3">Contact</Link>
              {user ? (
                <>
                  <Link to="/account" onClick={() => setOpen(false)} className="py-2">My Account</Link>
                  <button onClick={() => { logout(); setOpen(false); }} className="py-2 text-left text-maroon">Logout</button>
                </>
              ) : (
                <Link to="/login" onClick={() => setOpen(false)} className="py-2">Login / Register</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
