import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { formatINR, whatsAppChatLink } from "@/lib/api";
import { Check, Clock } from "lucide-react";

const STEPS = ["Payment Verification Pending", "Payment Verified", "Order Confirmed", "Processing", "Packed", "Shipped", "Out For Delivery", "Delivered"];

export default function OrderTrack() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/orders/${id}`).then((r) => setOrder(r.data));
  }, [id]);

  if (!order) return <div className="text-center py-20 text-text-muted">Loading...</div>;
  const isCod = order.payment_method === "cod";
  const verified = order.status !== "Payment Verification Pending";
  const currentIdx = STEPS.findIndex((s) => s === order.status);

  return (
    <div className="px-4 sm:px-6 lg:px-12 py-10 max-w-3xl mx-auto" data-testid="track-page">
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-deep-gold">Order Placed</p>
        <h1 className="font-serif text-3xl sm:text-4xl mt-2">Thank you!</h1>
        <p className="text-text-muted mt-2">Order <span className="font-mono">{order.order_id}</span></p>
      </div>

      {!verified && !isCod ? (
        <div className="admin-card bg-cream border-gold text-center" data-testid="awaiting-verification">
          <Clock className="mx-auto text-deep-gold" />
          <h3 className="font-serif text-xl mt-3">Awaiting Payment Verification</h3>
          <p className="text-sm text-text-muted mt-2">Your payment proof has been received. Our team will verify within a few hours.</p>
          <a href={whatsAppChatLink("917262080228", `Hello, my order ${order.order_id} is awaiting payment verification.`)} target="_blank" rel="noreferrer" className="btn-whatsapp mt-4 inline-flex"><i className="fa-brands fa-whatsapp" /> Send Proof via WhatsApp</a>
        </div>
      ) : (
        <div className="admin-card" data-testid="tracking-timeline">
          <h3 className="font-serif text-xl mb-5">Order Tracking</h3>
          <ol className="space-y-4">
            {STEPS.slice(isCod ? 2 : 1).map((s, i) => {
              const realIdx = STEPS.indexOf(s);
              const reached = realIdx <= currentIdx;
              return (
                <li key={s} className="flex items-start gap-3" data-testid={`step-${s}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${reached ? "bg-gold text-white" : "bg-cream border border-soft text-text-muted"}`}>
                    {reached ? <Check size={14} /> : i + 1}
                  </span>
                  <div>
                    <p className={`text-sm ${reached ? "text-text-primary font-semibold" : "text-text-muted"}`}>{s}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-6 mt-8">
        <div className="admin-card">
          <h4 className="font-serif">Shipping to</h4>
          <p className="text-sm mt-2">{order.address.full_name}</p>
          <p className="text-sm text-text-muted">{order.address.line1}, {order.address.city}, {order.address.state} - {order.address.pincode}</p>
          <p className="text-sm">{order.address.phone}</p>
        </div>
        <div className="admin-card">
          <h4 className="font-serif">Order Summary</h4>
          <p className="text-sm mt-2">Items: {order.items?.length}</p>
          <p className="text-sm">Payment: {order.payment_method?.toUpperCase()}</p>
          <p className="text-sm font-semibold">Total: {formatINR(order.total)}</p>
        </div>
      </div>

      <div className="text-center mt-10">
        <Link to="/shop" className="btn-outline-gold">Continue Shopping</Link>
      </div>
    </div>
  );
}
