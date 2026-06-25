import { useEffect, useState } from "react";
import api, { formatINR } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";

const Stat = ({ label, value, sub }) => (
  <div className="admin-card" data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}>
    <p className="text-xs uppercase tracking-wider text-text-muted">{label}</p>
    <p className="font-serif text-2xl mt-2 text-maroon">{value}</p>
    {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
  </div>
);

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/admin/dashboard").then((r) => setData(r.data));
  }, []);

  if (!data) return <div className="text-center py-20 text-text-muted">Loading...</div>;

  return (
    <div data-testid="admin-dashboard">
      <h1 className="font-serif text-3xl mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total Sales" value={formatINR(data.total_sales)} />
        <Stat label="Today's Sales" value={formatINR(data.today_sales)} />
        <Stat label="This Month" value={formatINR(data.month_sales)} />
        <Stat label="Rental Revenue" value={formatINR(data.rental_revenue)} />
        <Stat label="Total Orders" value={data.total_orders} />
        <Stat label="Pending Payments" value={data.pending_orders} />
        <Stat label="Customers" value={data.total_customers} />
        <Stat label="Products" value={data.total_products} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        <div className="admin-card">
          <h3 className="font-serif text-lg mb-4">Sales — Last 7 days</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.sales_7d}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D8" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#6E0D25" strokeWidth={2} dot={{ fill: "#D4AF37" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="admin-card">
          <h3 className="font-serif text-lg mb-4">Best Selling</h3>
          {data.best_selling.length === 0 ? <p className="text-sm text-text-muted">No sales yet.</p> :
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.best_selling}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D8" />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="qty" fill="#D4AF37" />
              </BarChart>
            </ResponsiveContainer>}
        </div>
      </div>

      <div className="admin-card mt-6">
        <h3 className="font-serif text-lg mb-4">Low Stock Alerts</h3>
        {data.low_stock.length === 0 ? <p className="text-sm text-text-muted">All products well-stocked.</p> :
          <div className="space-y-2">
            {data.low_stock.map((p) => (
              <div key={p.product_id} className="flex justify-between text-sm border-b border-soft pb-2">
                <span>{p.name}</span><span className="text-maroon">Stock: {p.stock}</span>
              </div>
            ))}
          </div>}
      </div>
    </div>
  );
}
