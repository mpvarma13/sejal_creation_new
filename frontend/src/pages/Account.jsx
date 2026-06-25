import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { formatINR } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

const EMPTY_ADDR = { full_name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", landmark: "" };

export default function Account() {
  const { user, loading, logout } = useAuth();
  const { wishlist } = useCart();
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [addForm, setAddForm] = useState(null);
  const [tab, setTab] = useState("orders");
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav("/login");
    if (user) {
      api.get("/orders/my").then((r) => setOrders(r.data));
      api.get("/me/addresses").then((r) => setAddresses(r.data));
    }
  }, [user, loading, nav]);

  if (loading || !user) return <div className="text-center py-32 text-text-muted">Loading...</div>;

  const saveAddress = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/me/addresses", addForm);
      setAddresses([...addresses, data]);
      setAddForm(null);
      toast.success("Address saved");
    } catch { toast.error("Could not save address"); }
  };

  const delAddress = async (id) => {
    await api.delete(`/me/addresses/${id}`);
    setAddresses(addresses.filter((a) => a.address_id !== id));
  };

  return (
    <div className="px-4 sm:px-6 lg:px-12 py-10" data-testid="account-page">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-deep-gold">My Account</p>
          <h1 className="font-serif text-3xl mt-2">Hello, {user.name}</h1>
          <p className="text-text-muted text-sm mt-1">{user.phone || user.email}</p>
        </div>
        <button onClick={() => { logout(); nav("/"); }} className="btn-outline-gold" data-testid="logout-btn">Logout</button>
      </div>

      <div className="flex border-b border-soft mb-8 text-sm overflow-x-auto no-scrollbar">
        {["orders", "rentals", "addresses", "wishlist"].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-5 py-3 uppercase tracking-wider text-xs whitespace-nowrap ${tab === t ? "border-b-2 border-gold text-maroon" : "text-text-muted"}`} data-testid={`tab-${t}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "orders" && (
        <div className="space-y-4" data-testid="orders-list">
          {orders.filter((o) => o.type !== "rental").length === 0 ? <p className="text-text-muted">No orders yet.</p> :
            orders.filter((o) => o.type !== "rental").map((o) => (
              <Link to={`/track/${o.order_id}`} key={o.order_id} className="admin-card flex flex-wrap justify-between gap-3" data-testid={`order-${o.order_id}`}>
                <div>
                  <p className="font-mono text-sm">{o.order_id}</p>
                  <p className="text-xs text-text-muted">{new Date(o.created_at).toLocaleDateString()}</p>
                  <p className="text-xs mt-1">{o.items?.length} item(s)</p>
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase tracking-wider px-2 py-1 bg-cream border border-soft">{o.status}</span>
                  <p className="text-maroon font-semibold mt-2">{formatINR(o.total)}</p>
                </div>
              </Link>
            ))}
        </div>
      )}

      {tab === "rentals" && (
        <div className="space-y-4" data-testid="rentals-list">
          {orders.filter((o) => o.type === "rental").length === 0 ? <p className="text-text-muted">No rentals yet.</p> :
            orders.filter((o) => o.type === "rental").map((o) => (
              <div key={o.order_id} className="admin-card flex justify-between" data-testid={`rental-${o.order_id}`}>
                <div>
                  <p className="font-mono text-sm">{o.order_id}</p>
                  <p className="font-serif">{o.product?.name}</p>
                  <p className="text-xs text-text-muted">{o.start_date} → {o.end_date}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase px-2 py-1 bg-cream border border-soft">{o.status}</span>
                  <p className="mt-2">{formatINR(o.total)}</p>
                </div>
              </div>
            ))}
        </div>
      )}

      {tab === "addresses" && (
        <div className="space-y-4" data-testid="addresses-list">
          <div className="flex justify-between items-center">
            <p className="text-text-muted text-sm">Save addresses for faster checkout.</p>
            <button onClick={() => setAddForm(EMPTY_ADDR)} className="btn-outline-gold !py-2" data-testid="add-address-btn"><Plus size={14} /> New Address</button>
          </div>
          {addForm && (
            <form onSubmit={saveAddress} className="admin-card grid sm:grid-cols-2 gap-3" data-testid="address-form">
              {[
                ["full_name", "Full Name *"], ["phone", "Phone *"],
                ["line1", "Address Line 1 *"], ["line2", "Address Line 2"],
                ["city", "City *"], ["state", "State *"],
                ["pincode", "PIN Code *"], ["landmark", "Landmark"],
              ].map(([k, l]) => (
                <div key={k}>
                  <label className="text-xs uppercase tracking-wider">{l}</label>
                  <input required={l.includes("*")} value={addForm[k]} onChange={(e) => setAddForm({ ...addForm, [k]: e.target.value })}
                    className="w-full border-b border-gold/40 py-2 outline-none" data-testid={`addr-form-${k}`} />
                </div>
              ))}
              <div className="sm:col-span-2 flex gap-3">
                <button type="submit" className="btn-primary" data-testid="addr-save-btn">Save</button>
                <button type="button" onClick={() => setAddForm(null)} className="btn-outline-gold">Cancel</button>
              </div>
            </form>
          )}
          {addresses.length === 0 ? <p className="text-text-muted text-sm">No saved addresses.</p> :
            <div className="grid sm:grid-cols-2 gap-4">
              {addresses.map((a) => (
                <div key={a.address_id} className="admin-card relative" data-testid={`addr-card-${a.address_id}`}>
                  <button onClick={() => delAddress(a.address_id)} className="absolute top-3 right-3 text-text-muted hover:text-maroon" data-testid={`del-addr-${a.address_id}`}><Trash2 size={14} /></button>
                  <p className="font-serif">{a.full_name}</p>
                  <p className="text-sm text-text-muted">{a.phone}</p>
                  <p className="text-sm mt-2">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
                  <p className="text-sm">{a.city}, {a.state} - {a.pincode}</p>
                  {a.landmark && <p className="text-xs text-text-muted">Landmark: {a.landmark}</p>}
                </div>
              ))}
            </div>}
        </div>
      )}

      {tab === "wishlist" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="wishlist-list">
          {wishlist.length === 0 ? <p className="text-text-muted">Your wishlist is empty.</p> :
            wishlist.map((w) => (
              <Link to={`/product/${w.product_id}`} key={w.product_id} className="product-card">
                <img src={w.image} alt={w.name} className="aspect-square object-cover w-full" />
                <div className="p-3">
                  <p className="font-serif text-sm line-clamp-2">{w.name}</p>
                  <p className="text-maroon mt-1">{formatINR(w.price)}</p>
                </div>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
