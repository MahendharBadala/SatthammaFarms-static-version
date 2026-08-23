import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { X, Eye, EyeSlash, Lock } from "@phosphor-icons/react";

export default function AdminLoginModal({ open, onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  if (!open) return null;

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role !== "admin") {
        setErr("This account does not have admin access.");
        return;
      }
      toast.success(`Welcome, ${user.name.split(" ")[0]}!`);
      onClose();
      nav("/admin");
    } catch (e2) {
      const d = e2?.response?.data?.detail;
      setErr(typeof d === "string" ? d : "Login failed. Please check your credentials.");
    } finally { setLoading(false); }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 backdrop-blur-sm"
      data-testid="admin-login-modal"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-sm mx-4 card-earth p-8">
        <button
          type="button"
          data-testid="admin-modal-close"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 rounded-full p-2 text-muted2 hover:text-forest hover:bg-cream2"
        >
          <X size={18} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-forest/10 flex items-center justify-center text-forest">
            <Lock size={20} weight="duotone" />
          </div>
          <div>
            <div className="chip">Admin only</div>
            <h2 className="font-serif text-2xl text-ink mt-1">Secret unlock</h2>
          </div>
        </div>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Email</label>
            <input
              data-testid="admin-modal-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              className="mt-1 w-full px-4 py-3 border border-edge rounded-xl focus:outline-none focus:border-forest bg-white"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Password</label>
            <div className="relative mt-1">
              <input
                data-testid="admin-modal-password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-edge rounded-xl focus:outline-none focus:border-forest bg-white"
              />
              <button
                type="button"
                data-testid="admin-modal-password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-3 flex items-center text-muted2 hover:text-forest"
              >
                {showPassword ? <EyeSlash size={20} weight="duotone" /> : <Eye size={20} weight="duotone" />}
              </button>
            </div>
          </div>
          {err && <p data-testid="admin-modal-error" className="text-sm text-terracotta">{err}</p>}
          <button
            data-testid="admin-modal-submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Signing in..." : "Enter dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
