import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function Register() {
  const [form, setForm] = useState({ name: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false);
  const { register } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await register(form);
      toast.success("Account created!");
      nav("/account");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="px-4 py-16 max-w-md mx-auto" data-testid="register-page">
      <h1 className="font-serif text-3xl text-center">Create Account</h1>
      <p className="text-center text-text-muted text-sm mt-2">Join the Sejal Creation family.</p>
      <form onSubmit={submit} className="space-y-5 mt-8">
        <div>
          <label className="text-xs uppercase tracking-wider">Full Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full border-b border-gold/40 focus:border-gold py-2 outline-none" data-testid="reg-name" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider">Mobile Number</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required inputMode="numeric" className="w-full border-b border-gold/40 focus:border-gold py-2 outline-none" data-testid="reg-phone" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider">Password</label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="w-full border-b border-gold/40 focus:border-gold py-2 outline-none" data-testid="reg-password" />
        </div>
        <button disabled={busy} className="btn-primary w-full" data-testid="register-submit">{busy ? "Creating..." : "Create Account"}</button>
      </form>
      <p className="text-center text-sm mt-6">Already have an account? <Link to="/login" className="link-gold">Sign in</Link></p>
    </div>
  );
}
