import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingBag, Sparkles, Heart, User } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function MobileNav() {
  const { pathname } = useLocation();
  const { count } = useCart();
  const items = [
    { to: "/", icon: Home, label: "Home", test: "mnav-home" },
    { to: "/shop", icon: ShoppingBag, label: "Shop", test: "mnav-shop" },
    { to: "/rental", icon: Sparkles, label: "Rental", test: "mnav-rental" },
    { to: "/cart", icon: Heart, label: "Cart", test: "mnav-cart", badge: count },
    { to: "/account", icon: User, label: "Account", test: "mnav-account" },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-ivory border-t border-soft z-40" data-testid="mobile-bottom-nav">
      <div className="grid grid-cols-5">
        {items.map(({ to, icon: Icon, label, test, badge }) => {
          const active = pathname === to || (to !== "/" && pathname.startsWith(to));
          return (
            <Link key={to} to={to} className={`flex flex-col items-center py-2 text-[10px] tracking-wider uppercase relative ${active ? "text-maroon" : "text-text-secondary"}`} data-testid={test}>
              <Icon size={20} />
              <span className="mt-1">{label}</span>
              {badge > 0 && <span className="absolute top-1 right-6 bg-maroon text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">{badge}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
