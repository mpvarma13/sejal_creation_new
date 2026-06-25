import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { CATEGORIES } from "@/constants/categories";

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "All";
  const search = params.get("search") || "";
  const [sort, setSort] = useState("newest");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = { sort };
    if (category !== "All" && category !== "New Arrivals") q.category = category;
    if (category === "New Arrivals") q.is_new = true;
    if (search) q.search = search;
    api.get("/products", { params: q }).then((r) => setProducts(r.data)).finally(() => setLoading(false));
  }, [category, search, sort]);

  const updateCat = (c) => {
    const p = new URLSearchParams(params);
    if (c === "All") p.delete("category"); else p.set("category", c);
    setParams(p);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-12 py-10" data-testid="shop-page">
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-deep-gold">Discover</p>
        <h1 className="font-serif text-3xl sm:text-5xl mt-2">{category === "All" ? "All Jewellery" : category}</h1>
        {search && <p className="mt-2 text-sm text-text-muted">Results for "{search}"</p>}
      </div>

      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        <button onClick={() => updateCat("All")} className={`text-xs uppercase tracking-wider px-3 py-1.5 border ${category === "All" ? "border-gold bg-gold text-white" : "border-soft text-text-secondary hover:border-gold"}`} data-testid="cat-filter-All">All</button>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => updateCat(c)} className={`text-xs uppercase tracking-wider px-3 py-1.5 border ${category === c ? "border-gold bg-gold text-white" : "border-soft text-text-secondary hover:border-gold"}`} data-testid={`cat-filter-${c}`}>{c}</button>
        ))}
      </div>

      <div className="flex justify-between items-center mb-6 border-y border-soft py-3">
        <span className="text-sm text-text-muted">{products.length} products</span>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="text-sm bg-transparent border-b border-gold/40 focus:outline-none focus:border-gold py-1" data-testid="sort-select">
          <option value="newest">Newest</option>
          <option value="price_low">Price: Low → High</option>
          <option value="price_high">Price: High → Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-text-muted">Loading...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-text-muted">No products found.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {products.map((p) => <ProductCard key={p.product_id} product={p} />)}
        </div>
      )}
    </div>
  );
}
