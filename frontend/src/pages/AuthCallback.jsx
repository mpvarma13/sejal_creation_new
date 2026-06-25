import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function AuthCallback() {
  const nav = useNavigate();
  const { setTokenAndUser } = useAuth();

  useEffect(() => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const hash = window.location.hash;
    const m = hash.match(/session_id=([^&]+)/);
    if (!m) { nav("/login"); return; }
    const sessionId = m[1];
    api.post("/auth/google-session", { session_id: sessionId })
      .then(({ data }) => {
        setTokenAndUser(data.token, data.user);
        window.history.replaceState(null, "", "/account");
        toast.success("Signed in with Google");
        nav("/account");
      })
      .catch(() => { toast.error("Google sign-in failed"); nav("/login"); });
  }, []); // eslint-disable-line

  return <div className="text-center py-32" data-testid="auth-callback">Signing you in...</div>;
}
