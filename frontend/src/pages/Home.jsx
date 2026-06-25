import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { CATEGORY_TILES } from "@/constants/categories";
import ProductCard from "@/components/ProductCard";
import { Sparkles, Truck, ShieldCheck, MessageCircle } from "lucide-react";

const REVIEWS = [
  { name: "Priya S.", text: "The bridal set I rented was stunning. Got so many compliments on my wedding day!", rating: 5 },
  { name: "Anjali M.", text: "Quality is far better than what I expected for this price. Will order again.", rating: 5 },
  { name: "Kavita R.", text: "WhatsApp order was so smooth — replied within minutes. Loved the chandbalis!", rating: 5 },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [newest, setNewest] = useState([]);
  const [bridal, setBridal] = useState([]);
  const [rentals, setRentals] = useState([]);

  useEffect(() => {
    api.get("/products", { params: { is_featured: true, limit: 8 } }).then((r) => setFeatured(r.data));
    api.get("/products", { params: { is_new: true, limit: 6 } }).then((r) => setNewest(r.data));
    api.get("/products", { params: { category: "Bridal Sets", limit: 4 } }).then((r) => setBridal(r.data));
    api.get("/products", { params: { is_rental: true, limit: 4 } }).then((r) => setRentals(r.data));
  }, []);

  return (
    <div data-testid="home-page">
      {/* HERO */}
      <section className="relative overflow-hidden bg-cream">
        <div className="grid lg:grid-cols-2 items-center gap-0">
          <div className="px-6 lg:px-16 py-16 lg:py-32 fade-up">
            <span className="text-xs uppercase tracking-[0.3em] text-deep-gold">Sejal ✦ Creation</span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-text-primary mt-6 leading-[1.05]">Adorn<br />Your <em className="font-display text-maroon">Story</em></h1>
            <p className="mt-6 max-w-md text-text-secondary">Hand-crafted imitation jewellery and resplendent bridal sets — to own or to rent. From Mangalsutra to Maharani Polki, every piece tells a tale.</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/shop" className="btn-primary" data-testid="hero-shop-btn">Shop Collection</Link>
              <Link to="/rental" className="btn-outline-gold" data-testid="hero-rent-btn">Bridal on Rent</Link>
            </div>
          </div>
          <div className="relative h-[420px] lg:h-[640px]">
            <img src="/bridal-hero.jpg" alt="Bridal" className="w-full h-full object-cover" />
            <div className="absolute bottom-6 right-6 bg-ivory/90 backdrop-blur px-5 py-3 border border-gold/30">
              <p className="text-[10px] uppercase tracking-[0.2em] text-deep-gold">Bridal Edit '26</p>
              <p className="font-serif text-lg">Polki & Pearl</p>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="px-4 sm:px-6 lg:px-12 py-20">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-deep-gold">Shop By</p>
          <h2 className="font-serif text-3xl sm:text-4xl mt-2">Categories</h2>
          <div className="divider-ornament mt-4 max-w-md mx-auto"><Sparkles size={16} /></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-5">
          {CATEGORY_TILES.map((c) => (
            <Link key={c.name} to={`/shop?category=${encodeURIComponent(c.name)}`} className="category-tile group" data-testid={`cat-tile-${c.name}`}>
              <img src={c.img} alt={c.name} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <p className="font-serif text-sm lg:text-base">{c.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 bg-cream">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-deep-gold">Featured</p>
            <h2 className="font-serif text-3xl sm:text-4xl mt-2">Most Loved Pieces</h2>
          </div>
          <Link to="/shop" className="link-gold text-sm hidden sm:block">View all →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {featured.map((p) => <ProductCard key={p.product_id} product={p} />)}
        </div>
      </section>

      {/* BRIDAL SHOWCASE */}
      <section className="px-4 sm:px-6 lg:px-12 py-20 grid lg:grid-cols-2 gap-10 items-center">
        <img src="https://images.pexels.com/photos/35059564/pexels-photo-35059564.jpeg?w=1200" alt="Bridal Collection" className="w-full h-[500px] object-cover" />
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-deep-gold">The Bridal Edit</p>
          <h2 className="font-serif text-3xl sm:text-5xl mt-4 leading-tight">For your<br /><em className="font-display text-maroon">forever moment</em></h2>
          <p className="mt-6 text-text-secondary max-w-md">From Maharani polki sets to delicate maang tikkas, our bridal edit is hand-finished and rentable — because every bride deserves the heirloom look without the heirloom price.</p>
          <Link to="/shop?category=Bridal%20Sets" className="btn-primary mt-8 inline-flex" data-testid="bridal-cta">Explore Bridal Sets</Link>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="px-4 sm:px-6 lg:px-12 py-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-deep-gold">New In</p>
            <h2 className="font-serif text-3xl sm:text-4xl mt-2">New Arrivals</h2>
          </div>
          <Link to="/shop?category=New%20Arrivals" className="link-gold text-sm hidden sm:block">View all →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {newest.map((p) => <ProductCard key={p.product_id} product={p} />)}
        </div>
      </section>

      {/* RENTAL */}
      <section className="bg-[#1A1814] text-ivory px-4 sm:px-6 lg:px-12 py-20">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Try-On Royalty</p>
          <h2 className="font-serif text-3xl sm:text-4xl mt-2 text-gold">Bridal Jewellery on Rent</h2>
          <p className="mt-4 max-w-xl mx-auto opacity-80 text-sm">Get the heirloom look starting at ₹1,299 — security deposit refundable. Book via WhatsApp or website.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
          {rentals.map((p) => <ProductCard key={p.product_id} product={p} />)}
        </div>
        <div className="text-center mt-10">
          <Link to="/rental" className="btn-outline-gold !text-gold !border-gold hover:!bg-gold hover:!text-[#1A1814]" data-testid="rental-cta">All Rental Pieces</Link>
        </div>
      </section>

      {/* WHY US */}
      <section className="px-4 sm:px-6 lg:px-12 py-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: ShieldCheck, t: "Premium Quality", d: "Hand-finished pieces inspected before dispatch." },
          { icon: Truck, t: "Pan-India Shipping", d: "Free above ₹999. COD in PIN 443101." },
          { icon: MessageCircle, t: "WhatsApp Orders", d: "One-tap ordering on +91 72620 80228." },
          { icon: Sparkles, t: "Bridal Rentals", d: "Wear royal, pay smart. Refundable deposit." },
        ].map((x) => (
          <div key={x.t} className="admin-card text-center">
            <x.icon size={28} className="mx-auto text-deep-gold" />
            <h4 className="font-serif text-lg mt-3">{x.t}</h4>
            <p className="text-sm text-text-secondary mt-2">{x.d}</p>
          </div>
        ))}
      </section>

      {/* REVIEWS */}
      <section className="bg-cream px-4 sm:px-6 lg:px-12 py-20">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-deep-gold">Love Letters</p>
          <h2 className="font-serif text-3xl sm:text-4xl mt-2">From Our Customers</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {REVIEWS.map((r, i) => (
            <div key={i} className="admin-card" data-testid={`review-${i}`}>
              <div className="text-gold mb-3">{"★".repeat(r.rating)}</div>
              <p className="text-text-secondary italic">"{r.text}"</p>
              <p className="mt-4 font-serif text-text-primary">— {r.name}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
