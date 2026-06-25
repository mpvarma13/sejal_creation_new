import { createContext, useContext, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { X } from "lucide-react";

const AuthModalContext = createContext(null);
export const useAuthModal = () => useContext(AuthModalContext);

export function AuthModalProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(null);

  const openAuth = (cb) => { setPending(() => cb || (() => undefined)); setOpen(true); };
  const closeAuth = () => { setOpen(false); setPending(null); };
  const onSuccess = () => {
    setOpen(false);
    if (pending) { try { pending(); } catch (e) { /* noop */ } }
    setPending(null);
  };

  return (
    <AuthModalContext.Provider value={{ openAuth, closeAuth }}>
      {children}
      {open && <AuthModal onClose={closeAuth} onSuccess={onSuccess} />}
    </AuthModalContext.Provider>
  );
}

function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState("signup");
  const [form, setForm] = useState({ name: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false);
  const { login, register } = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        await register({ name: form.name, phone: form.phone, password: form.password });
        toast.success("Account created!");
      } else {
        await login(form.phone, form.password);
        toast.success("Welcome back!");
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center px-4" onClick={onClose} data-testid="auth-modal">
      <div className="bg-ivory max-w-sm w-full p-6 sm:p-8 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 p-1 hover:bg-cream" data-testid="auth-modal-close"><X size={18} /></button>
        <p className="text-xs uppercase tracking-[0.3em] text-deep-gold text-center">Sejal ✦ Creation</p>
        <h2 className="font-serif text-2xl text-center mt-2" data-testid="auth-modal-title">{mode === "signup" ? "Create Account" : "Welcome Back"}</h2>
        <p className="text-xs text-center text-text-muted mt-1">{mode === "signup" ? "Sign up to add items & track orders" : "Sign in with your mobile number"}</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <div>
              <label className="text-xs uppercase tracking-wider">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                className="w-full border-b border-gold/40 focus:border-gold py-2 outline-none" data-testid="auth-modal-name" />
            </div>
          )}
          <div>
            <label className="text-xs uppercase tracking-wider">Mobile Number</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required inputMode="numeric"
              className="w-full border-b border-gold/40 focus:border-gold py-2 outline-none" data-testid="auth-modal-phone" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider">Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required
              className="w-full border-b border-gold/40 focus:border-gold py-2 outline-none" data-testid="auth-modal-password" />
          </div>
          <button disabled={busy} className="btn-primary w-full" data-testid="auth-modal-submit">{busy ? "Please wait..." : (mode === "signup" ? "Create Account" : "Sign In")}</button>
        </form>

        <p className="text-center text-sm mt-5">
          {mode === "signup" ? "Already have an account? " : "New here? "}
          <button onClick={() => setMode(mode === "signup" ? "login" : "signup")} className="link-gold" data-testid="auth-modal-switch">
            {mode === "signup" ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}
