import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminCustomers() {
  const [users, setUsers] = useState([]);
  useEffect(() => { api.get("/admin/customers").then((r) => setUsers(r.data)); }, []);
  return (
    <div data-testid="admin-customers">
      <h1 className="font-serif text-3xl mb-6">Customers</h1>
      <div className="admin-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-text-muted border-b border-soft">
            <tr><th className="text-left py-2">Name</th><th className="text-left">Email</th><th className="text-left">Phone</th><th className="text-right">Orders</th><th className="text-right">Joined</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id} className="border-b border-soft" data-testid={`cust-${u.user_id}`}>
                <td className="py-3">{u.name}</td>
                <td>{u.email}</td>
                <td>{u.phone || "—"}</td>
                <td className="text-right">{u.order_count}</td>
                <td className="text-right text-text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="text-text-muted text-sm py-4">No customers yet.</p>}
      </div>
    </div>
  );
}
