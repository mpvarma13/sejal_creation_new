import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const handleGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/account";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await login(phone, password);
      toast.success("Welcome back!");
      nav(u.role === "admin" ? "/admin" : "/account");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="px-4 py-16 max-w-md mx-auto" data-testid="login-page">
      <h1 className="font-serif text-3xl text-center">Welcome Back</h1>
      <p className="text-center text-text-muted text-sm mt-2">Sign in with your mobile number.</p>

      <button onClick={handleGoogle} className="w-full mt-8 admin-card text-center hover:border-gold flex items-center justify-center gap-3" data-testid="google-login-btn">
        <i className="fa-brands fa-google text-lg" /> <span className="text-sm font-medium">Continue with Google</span>
      </button>

      <div className="divider-ornament my-6 text-xs">OR</div>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="text-xs uppercase tracking-wider">Mobile Number</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} required inputMode="numeric" className="w-full border-b border-gold/40 focus:border-gold py-2 outline-none" data-testid="login-identifier" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider">Password</label>
          <input type="password" value={password} onChange={(e) => setPw(e.target.value)} required className="w-full border-b border-gold/40 focus:border-gold py-2 outline-none" data-testid="login-password" />
        </div>
        <button disabled={busy} type="submit" className="btn-primary w-full" data-testid="login-submit">{busy ? "Signing in..." : "Sign In"}</button>
      </form>
      <p className="text-center text-sm mt-6">No account? <Link to="/register" className="link-gold">Register</Link></p>
      <p className="text-center text-xs mt-4 text-text-muted"><Link to="/admin/login" data-testid="admin-login-link">Admin Login</Link></p>
    </div>
  );
}
