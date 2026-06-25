import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function AdminLogin() {
  const [identifier, setId] = useState("");
  const [password, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const { adminLogin } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await adminLogin(identifier, password);
      toast.success("Welcome Admin");
      nav("/admin");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-[#1A1814] text-ivory flex items-center justify-center px-4" data-testid="admin-login-page">
      <div className="max-w-sm w-full">
        <p className="text-center text-xs uppercase tracking-[0.3em] text-gold">Sejal ✦ Creation</p>
        <h1 className="font-serif text-3xl text-center mt-3">Admin Portal</h1>
        <form onSubmit={submit} className="mt-10 space-y-5">
          <div>
            <label className="text-xs uppercase tracking-wider opacity-70">Username or Email</label>
            <input value={identifier} onChange={(e) => setId(e.target.value)} required className="w-full bg-transparent border-b border-gold/40 focus:border-gold py-2 outline-none text-ivory" data-testid="admin-identifier" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider opacity-70">Password</label>
            <input type="password" value={password} onChange={(e) => setPw(e.target.value)} required className="w-full bg-transparent border-b border-gold/40 focus:border-gold py-2 outline-none text-ivory" data-testid="admin-password" />
          </div>
          <button disabled={busy} className="w-full bg-gold text-[#1A1814] py-3 uppercase tracking-[0.2em] text-xs font-semibold hover:bg-deep-gold transition" data-testid="admin-submit">{busy ? "..." : "Sign In"}</button>
        </form>
      </div>
    </div>
  );
}
