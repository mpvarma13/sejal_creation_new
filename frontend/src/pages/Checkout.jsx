import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { formatINR } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/components/AuthModal";
import { toast } from "sonner";

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { openAuth } = useAuthModal();
  const [address, setAddress] = useState({ full_name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", landmark: "" });
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [payment, setPayment] = useState("qr");
  const [codAvail, setCodAvail] = useState(false);
  const [proof, setProof] = useState("");
  const [notes, setNotes] = useState("");
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [placing, setPlacing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { openAuth(() => {}); return; }
    api.get("/me/addresses").then((r) => {
      setSavedAddresses(r.data);
      if (r.data.length > 0) setAddress({ ...r.data[0], full_name: r.data[0].full_name, phone: r.data[0].phone });
      else if (user) setAddress((a) => ({ ...a, full_name: user.name || "", phone: user.phone || "" }));
    });
  }, [user, openAuth]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (address.pincode.length === 6) {
      api.get("/check-pincode", { params: { pincode: address.pincode } }).then((r) => setCodAvail(r.data.cod_available));
    } else setCodAvail(false);
  }, [address.pincode]);

  useEffect(() => { if (!codAvail && payment === "cod") setPayment("qr"); }, [codAvail, payment]);

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      const { data } = await api.get(`/coupons/${coupon.trim().toUpperCase()}`);
      if (data.min_order && subtotal < data.min_order) {
        toast.error(`Minimum order ₹${data.min_order} required`);
        setDiscount(0); return;
      }
      const d = data.type === "percent" ? (subtotal * data.value / 100) : data.value;
      setDiscount(Math.min(d, subtotal));
      toast.success(`Coupon applied: ${data.code}`);
    } catch { toast.error("Invalid coupon"); setDiscount(0); }
  };

  const shipping = subtotal > 0 && subtotal < 999 ? 80 : 0;
  const total = Math.max(0, subtotal + shipping - discount);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProof(reader.result);
    reader.readAsDataURL(file);
  };

  const place = async (e) => {
    e.preventDefault();
    if (items.length === 0) return toast.error("Cart is empty");
    if (payment === "qr" && !proof) return toast.error("Please upload payment screenshot or use WhatsApp");
    setPlacing(true);
    try {
      const { data } = await api.post("/orders", {
        address, payment_method: payment, payment_proof: proof || null,
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        notes, coupon_code: coupon || null,
      });
      toast.success("Order placed!");
      clearCart();
      navigate(`/track/${data.order_id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) return <div className="text-center py-32" data-testid="checkout-empty">Cart is empty. <button onClick={() => navigate("/shop")} className="link-gold">Shop now</button></div>;

  return (
    <form onSubmit={place} className="px-4 sm:px-6 lg:px-12 py-10 grid lg:grid-cols-3 gap-10" data-testid="checkout-page">
      <div className="lg:col-span-2 space-y-8">
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-serif text-2xl">Shipping Address</h2>
            {user && savedAddresses.length > 0 && (
              <select onChange={(e) => {
                const a = savedAddresses.find((x) => x.address_id === e.target.value);
                if (a) setAddress({ full_name: a.full_name, phone: a.phone, line1: a.line1, line2: a.line2 || "", city: a.city, state: a.state, pincode: a.pincode, landmark: a.landmark || "" });
              }} className="text-xs border-b border-gold/40 py-1 bg-transparent" data-testid="saved-addr-select">
                <option>Use saved address</option>
                {savedAddresses.map((a) => <option key={a.address_id} value={a.address_id}>{a.full_name} — {a.city}</option>)}
              </select>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              ["full_name", "Full Name *", "text"], ["phone", "Phone *", "tel"],
              ["line1", "Address Line 1 *", "text"], ["line2", "Address Line 2", "text"],
              ["city", "City *", "text"], ["state", "State *", "text"],
              ["pincode", "PIN Code *", "text"], ["landmark", "Landmark", "text"],
            ].map(([k, l, t]) => (
              <div key={k}>
                <label className="text-xs uppercase tracking-wider text-text-muted">{l}</label>
                <input type={t} required={l.includes("*")} value={address[k]} onChange={(e) => setAddress({ ...address, [k]: e.target.value })}
                  className="w-full border-b border-gold/40 focus:border-gold py-2 outline-none" data-testid={`addr-${k}`} />
              </div>
            ))}
          </div>
          {address.pincode.length === 6 && (
            <p className={`text-sm mt-3 ${codAvail ? "text-green-700" : "text-text-muted"}`} data-testid="pincode-msg">
              {codAvail ? "✓ Cash on Delivery available" : "COD not available in your area"}
            </p>
          )}
        </section>

        <section>
          <h2 className="font-serif text-2xl mb-4">Payment Method</h2>
          <div className="space-y-3">
            <label className={`block admin-card cursor-pointer ${payment === "qr" ? "border-gold" : ""}`} data-testid="pay-qr">
              <input type="radio" checked={payment === "qr"} onChange={() => setPayment("qr")} className="mr-2" />
              <span className="font-semibold">UPI / QR Payment</span>
              <p className="text-sm text-text-muted mt-1">Scan QR, pay, upload screenshot. Manual verification by admin.</p>
              {payment === "qr" && (
                <div className="mt-4 grid sm:grid-cols-2 gap-4 items-start">
                  <div className="bg-white p-3 border border-soft text-center">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=upi://pay?pa=sejalcreation@upi&pn=Sejal%20Creation&am=" alt="QR" className="mx-auto" />
                    <p className="text-xs mt-2 text-text-muted">Scan & pay to UPI: sejalcreation@upi</p>
                    <p className="text-xs text-text-muted">(Replace via admin panel)</p>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider">Upload Payment Screenshot</label>
                    <input type="file" accept="image/*" onChange={handleFile} className="block mt-2 text-sm" data-testid="proof-upload" />
                    {proof && <img src={proof} alt="proof" className="mt-3 max-h-40 border border-soft" />}
                    <p className="text-xs text-text-muted mt-2">Or send screenshot to WhatsApp +91 72620 80228</p>
                  </div>
                </div>
              )}
            </label>
            <label className={`block admin-card cursor-pointer ${!codAvail ? "opacity-50" : ""} ${payment === "cod" ? "border-gold" : ""}`} data-testid="pay-cod">
              <input type="radio" disabled={!codAvail} checked={payment === "cod"} onChange={() => setPayment("cod")} className="mr-2" />
              <span className="font-semibold">Cash on Delivery</span>
              <p className="text-sm text-text-muted mt-1">{codAvail ? "Available for your area (PIN 443101)." : "Available only for PIN 443101."}</p>
            </label>
          </div>
        </section>

        <section>
          <label className="text-xs uppercase tracking-wider">Order Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full border border-soft p-3 mt-2" data-testid="notes-input" />
        </section>
      </div>

      <aside className="admin-card h-fit lg:sticky lg:top-32">
        <h3 className="font-serif text-xl">Your Order</h3>
        <div className="mt-4 space-y-3 max-h-60 overflow-auto">
          {items.map((i) => (
            <div key={i.product_id} className="flex gap-3 text-sm">
              <img src={i.image} alt="" className="w-12 h-12 object-cover" />
              <div className="flex-1">
                <p className="line-clamp-1">{i.name}</p>
                <p className="text-text-muted">Qty {i.quantity}</p>
              </div>
              <p>{formatINR(i.price * i.quantity)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-soft space-y-1 text-sm">
          <div className="flex gap-2 mb-3" data-testid="coupon-area">
            <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Coupon code" className="flex-1 border-b border-gold/40 py-1 outline-none" data-testid="coupon-input" />
            <button type="button" onClick={applyCoupon} className="text-xs uppercase tracking-wider px-3 py-1 border border-gold hover:bg-gold hover:text-white" data-testid="coupon-apply">Apply</button>
          </div>
          <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
          {discount > 0 && <div className="flex justify-between text-green-700"><span>Discount</span><span>-{formatINR(discount)}</span></div>}
          <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? "Free" : formatINR(shipping)}</span></div>
          <div className="flex justify-between text-base font-semibold pt-2 border-t border-soft mt-2"><span>Total</span><span>{formatINR(total)}</span></div>
        </div>
        <button type="submit" disabled={placing} className="btn-primary w-full mt-6" data-testid="place-order-btn">{placing ? "Placing..." : "Place Order"}</button>
      </aside>
    </form>
  );
}
