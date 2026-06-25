import { useEffect, useState } from "react";
import api, { formatINR, buildWhatsAppOrderLink } from "@/lib/api";
import { Link, useSearchParams } from "react-router-dom";

export default function Rental() {
  const [params] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  useEffect(() => {
    api.get("/products", { params: { is_rental: true } }).then((r) => {
      setProducts(r.data);
      const pid = params.get("product");
      if (pid) setSelected(r.data.find((x) => x.product_id === pid) || r.data[0]);
      else setSelected(r.data[0]);
    });
  }, [params]);

  const days = (() => {
    if (!start || !end) return 0;
    const d = (new Date(end) - new Date(start)) / 86400000;
    return d > 0 ? d : 0;
  })();

  return (
    <div className="px-4 sm:px-6 lg:px-12 py-10" data-testid="rental-page">
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-deep-gold">Try On Royalty</p>
        <h1 className="font-serif text-3xl sm:text-5xl mt-2">Bridal Jewellery on Rent</h1>
        <p className="mt-4 text-text-secondary max-w-xl mx-auto">Wear heirloom-style sets without the heirloom price. Refundable security deposit. Book via WhatsApp or below.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Listing */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.map((p) => (
            <button key={p.product_id} onClick={() => setSelected(p)} className={`text-left product-card ${selected?.product_id === p.product_id ? "!border-gold ring-2 ring-gold/20" : ""}`} data-testid={`rental-card-${p.product_id}`}>
              <div className="product-card-image"><img src={p.images?.[0]} alt={p.name} /></div>
              <div className="p-4">
                <p className="font-serif text-lg">{p.name}</p>
                <p className="text-sm text-text-muted">{p.category}</p>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-maroon font-semibold">Rent {formatINR(p.rental_price)}</span>
                  <span className="text-text-muted">Deposit {formatINR(p.security_deposit)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Booking panel */}
        {selected && (
          <div className="admin-card lg:sticky lg:top-32 h-fit" data-testid="rental-booking-panel">
            <h3 className="font-serif text-xl">Book this set</h3>
            <p className="text-sm text-text-muted">{selected.name}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs uppercase tracking-wider">Start date</label>
                <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-full border-b border-gold/50 py-1 focus:outline-none" data-testid="rental-start-date" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider">End date</label>
                <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full border-b border-gold/50 py-1 focus:outline-none" data-testid="rental-end-date" />
              </div>
            </div>
            <div className="mt-5 text-sm space-y-1 border-t border-soft pt-4">
              <div className="flex justify-between"><span>Rental charge</span><span>{formatINR(selected.rental_price)}</span></div>
              <div className="flex justify-between"><span>Security deposit (refundable)</span><span>{formatINR(selected.security_deposit)}</span></div>
              <div className="flex justify-between"><span>Duration</span><span>{days} day(s)</span></div>
              <div className="flex justify-between text-base font-semibold mt-2 pt-2 border-t border-soft"><span>Total payable</span><span>{formatINR((selected.rental_price || 0) + (selected.security_deposit || 0))}</span></div>
            </div>
            <a href={buildWhatsAppOrderLink({ productName: `[RENTAL] ${selected.name}`, productId: selected.product_id, price: selected.rental_price, productUrl: `${window.location.origin}/product/${selected.product_id}` })}
               target="_blank" rel="noreferrer" className="btn-whatsapp mt-5 w-full justify-center" data-testid="rental-whatsapp-btn">
              <i className="fa-brands fa-whatsapp" /> Book on WhatsApp
            </a>
            <Link to={`/product/${selected.product_id}`} className="btn-outline-gold mt-3 w-full !py-2" data-testid="rental-view-btn">View Details</Link>
            <p className="text-xs text-text-muted mt-4">Security deposit is fully refundable upon safe return. See <Link to="/policies/rental" className="link-gold">Rental Policy</Link>.</p>
          </div>
        )}
      </div>
    </div>
  );
}
