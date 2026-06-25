import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, Package, ShoppingBag, Sparkles, Users, Tag, LogOut, Home } from "lucide-react";

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) nav("/admin/login");
  }, [user, loading, nav]);

  if (loading || !user || user.role !== "admin") return <div className="text-center py-32 text-text-muted">Loading...</div>;

  const links = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/products", icon: Package, label: "Products" },
    { to: "/admin/orders", icon: ShoppingBag, label: "Orders" },
    { to: "/admin/rentals", icon: Sparkles, label: "Rentals" },
    { to: "/admin/offers", icon: Tag, label: "Offers" },
    { to: "/admin/customers", icon: Users, label: "Customers" },
  ];

  return (
    <div className="min-h-screen flex bg-cream" data-testid="admin-layout">
      <aside className="hidden lg:flex flex-col w-64 bg-[#1A1814] text-ivory p-6">
        <Link to="/admin" className="font-display text-2xl text-gold">Sejal ✦ Creation</Link>
        <p className="text-xs uppercase tracking-wider opacity-70 mt-1">Admin</p>
        <nav className="mt-10 flex-1 space-y-1">
          {links.map(({ to, icon: Icon, label }) => {
            const active = pathname === to || (to !== "/admin" && pathname.startsWith(to));
            return (
              <Link key={to} to={to} className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm ${active ? "bg-gold/10 text-gold border-l-2 border-gold" : "hover:bg-white/5"}`} data-testid={`admin-nav-${label.toLowerCase()}`}>
                <Icon size={16} /> {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6 space-y-2 text-sm">
          <Link to="/" className="flex items-center gap-2 opacity-70 hover:opacity-100"><Home size={14} /> View Store</Link>
          <button onClick={() => { logout(); nav("/admin/login"); }} className="flex items-center gap-2 opacity-70 hover:opacity-100" data-testid="admin-logout"><LogOut size={14} /> Logout</button>
        </div>
      </aside>
      <div className="flex-1 lg:p-8 p-4">
        {/* Mobile admin nav */}
        <div className="lg:hidden flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-2 border-b border-soft">
          {links.map(({ to, label }) => {
            const active = pathname === to || (to !== "/admin" && pathname.startsWith(to));
            return <Link key={to} to={to} className={`text-xs uppercase tracking-wider px-3 py-1.5 border whitespace-nowrap ${active ? "border-gold bg-gold text-white" : "border-soft"}`}>{label}</Link>;
          })}
          <button onClick={() => { logout(); nav("/admin/login"); }} className="text-xs uppercase tracking-wider px-3 py-1.5 border border-soft whitespace-nowrap">Logout</button>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
