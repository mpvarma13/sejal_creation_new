import { useEffect, useState } from "react";
import api, { formatINR } from "@/lib/api";
import { CATEGORIES } from "@/constants/categories";
import { toast } from "sonner";
import { Plus, Trash2, Edit } from "lucide-react";

const EMPTY = { name: "", description: "", category: "Necklace Sets", price: 0, rental_price: null, security_deposit: null, stock: 10, is_rental: false, is_featured: false, is_new: false, images: [""], tags: [] };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = () => api.get("/products", { params: { limit: 500 } }).then((r) => setProducts(r.data));
  useEffect(() => { load(); }, []);

  const startNew = () => { setForm(EMPTY); setEditing("new"); };
  const startEdit = (p) => { setForm({ ...EMPTY, ...p, images: p.images?.length ? p.images : [""] }); setEditing(p.product_id); };
  const cancel = () => { setEditing(null); setForm(EMPTY); };

  const save = async (e) => {
    e.preventDefault();
    const body = { ...form, price: Number(form.price), stock: Number(form.stock), images: form.images.filter(Boolean) };
    if (body.rental_price !== null && body.rental_price !== "") body.rental_price = Number(body.rental_price); else body.rental_price = null;
    if (body.security_deposit !== null && body.security_deposit !== "") body.security_deposit = Number(body.security_deposit); else body.security_deposit = null;
    try {
      if (editing === "new") await api.post("/products", body);
      else await api.put(`/products/${editing}`, body);
      toast.success("Saved");
      cancel(); load();
    } catch (err) { toast.error("Save failed"); }
  };

  const del = async (pid) => {
    if (!window.confirm("Delete this product?")) return;
    await api.delete(`/products/${pid}`);
    toast.success("Deleted"); load();
  };

  return (
    <div data-testid="admin-products">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-serif text-3xl">Products</h1>
        <button onClick={startNew} className="btn-primary !py-2" data-testid="add-product-btn"><Plus size={16} /> Add Product</button>
      </div>

      {editing && (
        <form onSubmit={save} className="admin-card mb-8 grid sm:grid-cols-2 gap-4" data-testid="product-form">
          <input className="border-b border-gold/40 py-2 sm:col-span-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required data-testid="pf-name" />
          <textarea className="border border-soft p-2 sm:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="border-b border-gold/40 py-2 bg-transparent" data-testid="pf-category">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input type="number" className="border-b border-gold/40 py-2" placeholder="Price ₹" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required data-testid="pf-price" />
          <input type="number" className="border-b border-gold/40 py-2" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          <input type="number" className="border-b border-gold/40 py-2" placeholder="Rental Price (optional)" value={form.rental_price || ""} onChange={(e) => setForm({ ...form, rental_price: e.target.value })} />
          <input type="number" className="border-b border-gold/40 py-2" placeholder="Security Deposit" value={form.security_deposit || ""} onChange={(e) => setForm({ ...form, security_deposit: e.target.value })} />
          <div className="sm:col-span-2 flex gap-4 flex-wrap text-sm">
            <label><input type="checkbox" checked={form.is_rental} onChange={(e) => setForm({ ...form, is_rental: e.target.checked })} /> Available on Rent</label>
            <label><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Featured</label>
            <label><input type="checkbox" checked={form.is_new} onChange={(e) => setForm({ ...form, is_new: e.target.checked })} /> New Arrival</label>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs uppercase tracking-wider mb-2">Product Images</p>
            <input type="file" accept="image/*" multiple data-testid="pf-image-upload"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (!files.length) return;
                Promise.all(files.map((f) => new Promise((res) => {
                  const r = new FileReader();
                  r.onload = () => res(r.result);
                  r.readAsDataURL(f);
                }))).then((urls) => {
                  const existing = form.images.filter((x) => x);
                  setForm({ ...form, images: [...existing, ...urls] });
                });
                e.target.value = "";
              }}
              className="block text-sm mb-3" />
            <div className="grid grid-cols-4 gap-2">
              {form.images.filter(Boolean).map((img, i) => (
                <div key={i} className="relative border border-soft" data-testid={`pf-img-${i}`}>
                  <img src={img} alt="" className="w-full aspect-square object-cover" />
                  <button type="button" onClick={() => setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) })}
                    className="absolute top-1 right-1 bg-white/90 text-maroon text-xs w-5 h-5 rounded-full">×</button>
                </div>
              ))}
            </div>
            <details className="mt-2 text-xs"><summary className="cursor-pointer text-text-muted">or paste image URL</summary>
              <input className="border-b border-gold/40 py-2 w-full mt-2" placeholder="https://..."
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (e.target.value) { setForm({ ...form, images: [...form.images.filter(Boolean), e.target.value] }); e.target.value = ""; } } }} />
            </details>
          </div>
          <div className="sm:col-span-2 flex gap-3">
            <button type="submit" className="btn-primary" data-testid="pf-save">Save</button>
            <button type="button" onClick={cancel} className="btn-outline-gold">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {products.map((p) => (
          <div key={p.product_id} className="admin-card flex flex-wrap items-center gap-3" data-testid={`prod-row-${p.product_id}`}>
            <img src={p.images?.[0]} alt={p.name} className="w-14 h-14 object-cover" />
            <div className="flex-1 min-w-0">
              <p className="font-serif truncate">{p.name}</p>
              <p className="text-xs text-text-muted">{p.category} • {p.product_id} • Stock: {p.stock}</p>
            </div>
            <span className="text-maroon font-semibold">{formatINR(p.price)}</span>
            <button onClick={() => startEdit(p)} className="p-2 hover:bg-cream" data-testid={`edit-${p.product_id}`}><Edit size={16} /></button>
            <button onClick={() => del(p.product_id)} className="p-2 hover:bg-cream text-maroon" data-testid={`del-${p.product_id}`}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
