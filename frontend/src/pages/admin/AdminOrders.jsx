import { useEffect, useState } from "react";
import api, { formatINR } from "@/lib/api";
import { toast } from "sonner";

const STATUSES = ["Payment Verification Pending", "Payment Verified", "Order Confirmed", "Processing", "Packed", "Shipped", "Out For Delivery", "Delivered", "Cancelled"];

export default function AdminOrders({ type = "purchase" }) {
  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState("");

  const load = () => api.get("/admin/orders", { params: { type } }).then((r) => setOrders(r.data));
  useEffect(() => { load(); }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateStatus = async (oid, status) => {
    await api.put(`/admin/orders/${oid}/status`, { status });
    toast.success("Status updated"); load();
  };

  const list = filter ? orders.filter((o) => o.status === filter) : orders;

  return (
    <div data-testid={`admin-${type}-orders`}>
      <h1 className="font-serif text-3xl mb-6">{type === "rental" ? "Rental Bookings" : "Orders"}</h1>
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setFilter("")} className={`text-xs uppercase tracking-wider px-3 py-1.5 border ${!filter ? "bg-gold text-white border-gold" : "border-soft"}`}>All ({orders.length})</button>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`text-xs uppercase tracking-wider px-3 py-1.5 border ${filter === s ? "bg-gold text-white border-gold" : "border-soft"}`}>{s}</button>
        ))}
      </div>
      <div className="space-y-2">
        {list.length === 0 ? <p className="text-text-muted text-sm">No orders.</p> :
          list.map((o) => (
            <div key={o.order_id} className="admin-card" data-testid={`order-row-${o.order_id}`}>
              <div className="flex flex-wrap items-center gap-3 cursor-pointer" onClick={() => setExpanded(expanded === o.order_id ? null : o.order_id)}>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm">{o.order_id}</p>
                  <p className="text-xs text-text-muted">{o.customer_name} • {o.customer_phone}</p>
                  <p className="text-xs text-text-muted">{new Date(o.created_at).toLocaleString()}</p>
                </div>
                <span className="text-xs uppercase tracking-wider px-2 py-1 bg-cream border border-soft">{o.status}</span>
                <span className="text-maroon font-semibold">{formatINR(o.total)}</span>
              </div>
              {expanded === o.order_id && (
                <div className="mt-4 pt-4 border-t border-soft grid lg:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs uppercase tracking-wider mb-2">Items</h4>
                    {(o.items || (o.product ? [o.product] : [])).map((i, idx) => (
                      <div key={idx} className="text-sm">{i.name} {i.quantity ? `× ${i.quantity}` : ""} {i.price ? `— ${formatINR(i.price * (i.quantity || 1))}` : ""}</div>
                    ))}
                    <h4 className="text-xs uppercase tracking-wider mt-4 mb-1">Address</h4>
                    <p className="text-sm">{o.address?.full_name}, {o.address?.line1}, {o.address?.city}, {o.address?.state} - {o.address?.pincode}</p>
                    <h4 className="text-xs uppercase tracking-wider mt-3 mb-1">Payment</h4>
                    <p className="text-sm">{o.payment_method?.toUpperCase() || "Rental"}</p>
                    {o.payment_proof && <a href={o.payment_proof} target="_blank" rel="noreferrer" className="text-xs link-gold mt-2 inline-block">View Payment Proof</a>}
                  </div>
                  <div>
                    <h4 className="text-xs uppercase tracking-wider mb-2">Update Status</h4>
                    <div className="flex flex-wrap gap-2">
                      {STATUSES.map((s) => (
                        <button key={s} onClick={() => updateStatus(o.order_id, s)}
                          className={`text-xs px-2 py-1 border ${o.status === s ? "bg-maroon text-white border-maroon" : "border-soft hover:border-gold"}`}
                          data-testid={`status-${o.order_id}-${s}`}>{s}</button>
                      ))}
                    </div>
                    <h4 className="text-xs uppercase tracking-wider mt-4 mb-2">Tracking History</h4>
                    <ol className="text-xs space-y-1 text-text-muted">
                      {(o.tracking || []).map((t, i) => <li key={i}>{new Date(t.at).toLocaleString()} — {t.status}</li>)}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
