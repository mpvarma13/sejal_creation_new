import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, Edit } from "lucide-react";

const EMPTY = { code: "", type: "percent", value: 10, description: "", min_order: 0, active: true, public: true };

export default function AdminOffers() {
  const [offers, setOffers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = () => api.get("/admin/coupons").then((r) => setOffers(r.data));
  useEffect(() => { load(); }, []);

  const startNew = () => { setForm(EMPTY); setEditing("new"); };
  const startEdit = (c) => { setForm({ ...c }); setEditing(c.coupon_id); };
  const cancel = () => { setEditing(null); setForm(EMPTY); };

  const save = async (e) => {
    e.preventDefault();
    const body = { ...form, value: Number(form.value), min_order: Number(form.min_order || 0) };
    try {
      if (editing === "new") await api.post("/admin/coupons", body);
      else await api.put(`/admin/coupons/${editing}`, body);
      toast.success("Saved"); cancel(); load();
    } catch (err) { toast.error(err.response?.data?.detail || "Save failed"); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this offer?")) return;
    await api.delete(`/admin/coupons/${id}`);
    toast.success("Deleted"); load();
  };

  const toggleActive = async (c) => {
    await api.put(`/admin/coupons/${c.coupon_id}`, { ...c, active: !c.active });
    load();
  };

  return (
    <div data-testid="admin-offers">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-serif text-3xl">Offers & Discounts</h1>
          <p className="text-sm text-text-muted mt-1">Create coupons for festivals, sales, and promotions.</p>
        </div>
        <button onClick={startNew} className="btn-primary !py-2" data-testid="add-offer-btn"><Plus size={16} /> New Offer</button>
      </div>

      {editing && (
        <form onSubmit={save} className="admin-card mb-8 grid sm:grid-cols-2 gap-4" data-testid="offer-form">
          <div>
            <label className="text-xs uppercase tracking-wider">Coupon Code *</label>
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required placeholder="DIWALI20"
              className="w-full border-b border-gold/40 py-2 outline-none uppercase" data-testid="off-code" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider">Discount Type *</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border-b border-gold/40 py-2 bg-transparent" data-testid="off-type">
              <option value="percent">Percent (%)</option>
              <option value="flat">Flat ₹ off</option>
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider">Value *</label>
            <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required
              className="w-full border-b border-gold/40 py-2 outline-none" data-testid="off-value" />
            <p className="text-xs text-text-muted mt-1">{form.type === "percent" ? `${form.value}% off` : `₹${form.value} off`}</p>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider">Minimum Order ₹</label>
            <input type="number" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: e.target.value })}
              className="w-full border-b border-gold/40 py-2 outline-none" data-testid="off-min" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs uppercase tracking-wider">Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Festive Diwali offer"
              className="w-full border-b border-gold/40 py-2 outline-none" data-testid="off-desc" />
          </div>
          <div className="sm:col-span-2 flex gap-6 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.public} onChange={(e) => setForm({ ...form, public: e.target.checked })} /> Show on storefront banner</label>
          </div>
          <div className="sm:col-span-2 flex gap-3">
            <button type="submit" className="btn-primary" data-testid="off-save">Save Offer</button>
            <button type="button" onClick={cancel} className="btn-outline-gold">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {offers.length === 0 ? <p className="text-text-muted text-sm">No offers yet. Create your first offer to start a sale.</p> :
          offers.map((c) => (
            <div key={c.coupon_id} className="admin-card flex flex-wrap items-center gap-3" data-testid={`offer-row-${c.coupon_id}`}>
              <span className="font-mono bg-cream px-3 py-1 text-maroon font-semibold border border-gold/30">{c.code}</span>
              <div className="flex-1 min-w-0">
                <p className="font-serif">{c.type === "percent" ? `${c.value}% off` : `₹${c.value} flat off`}</p>
                <p className="text-xs text-text-muted">{c.description || "—"} {c.min_order ? `• Min ₹${c.min_order}` : ""}</p>
              </div>
              <button onClick={() => toggleActive(c)} className={`text-xs uppercase tracking-wider px-2 py-1 border ${c.active ? "border-green-700 text-green-700" : "border-soft text-text-muted"}`} data-testid={`toggle-${c.coupon_id}`}>
                {c.active ? "Active" : "Inactive"}
              </button>
              <button onClick={() => startEdit(c)} className="p-2 hover:bg-cream" data-testid={`edit-off-${c.coupon_id}`}><Edit size={16} /></button>
              <button onClick={() => del(c.coupon_id)} className="p-2 hover:bg-cream text-maroon" data-testid={`del-off-${c.coupon_id}`}><Trash2 size={16} /></button>
            </div>
          ))}
      </div>
    </div>
  );
}
