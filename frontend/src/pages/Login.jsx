import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Logo } from "../components/Logo";
import PhoneLogin from "../components/auth/PhoneLogin";
import { EnvelopeSimple, DeviceMobile, Eye, EyeSlash } from "@phosphor-icons/react";

function EmailForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
      if (user.role === "admin") nav("/admin");
      else nav(loc.state?.from || "/");
    } catch (e2) {
      const d = e2?.response?.data?.detail;
      setErr(typeof d === "string" ? d : "Login failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4" data-testid="email-login-form">
      <div>
        <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Email</label>
        <input data-testid="login-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full px-4 py-3 border border-edge rounded-xl focus:outline-none focus:border-forest bg-white" />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Password</label>
        <div className="relative mt-1">
          <input
            data-testid="login-password"
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 pr-12 border border-edge rounded-xl focus:outline-none focus:border-forest bg-white"
          />
          <button
            type="button"
            data-testid="login-password-toggle"
            onClick={() => setShowPassword(v => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-3 flex items-center text-muted2 hover:text-forest"
          >
            {showPassword ? <EyeSlash size={20} weight="duotone" /> : <Eye size={20} weight="duotone" />}
          </button>
        </div>
      </div>
      {err && <p data-testid="login-error" className="text-sm text-terracotta">{err}</p>}
      <button data-testid="login-submit" disabled={loading} className="btn-primary w-full">{loading ? "Signing in..." : "Sign in"}</button>
    </form>
  );
}

export default function Login() {
  const [mode, setMode] = useState("email"); // "email" or "phone"

  return (
    <div className="container mx-auto py-16 max-w-md">
      <div className="flex justify-center mb-6"><Logo /></div>
      <div className="card-earth p-8">
        <div className="chip">Welcome</div>
        <h1 className="font-serif text-4xl text-ink mt-2">Sign in</h1>
        <p className="text-muted2 mt-1 text-sm">Admins get routed straight to the dashboard.</p>

        <div className="mt-6 grid grid-cols-2 gap-2 bg-cream2 p-1 rounded-full">
          <button data-testid="tab-email" onClick={() => setMode("email")} className={`inline-flex items-center justify-center gap-2 py-2 rounded-full text-sm transition-all ${mode === "email" ? "bg-white text-forest shadow-sm font-semibold" : "text-muted2 hover:text-forest"}`}>
            <EnvelopeSimple size={16} weight={mode === "email" ? "fill" : "duotone"} /> Email
          </button>
          <button data-testid="tab-phone" onClick={() => setMode("phone")} className={`inline-flex items-center justify-center gap-2 py-2 rounded-full text-sm transition-all ${mode === "phone" ? "bg-white text-forest shadow-sm font-semibold" : "text-muted2 hover:text-forest"}`}>
            <DeviceMobile size={16} weight={mode === "phone" ? "fill" : "duotone"} /> Phone
          </button>
        </div>

        <div className="mt-6">
          {mode === "email" ? <EmailForm /> : <PhoneLogin />}
        </div>

        <p className="text-sm text-muted2 mt-6 text-center">
          {mode === "email"
            ? <>New to Satthamma? <Link to="/register" data-testid="link-register" className="text-forest font-semibold">Create account</Link></>
            : <>By continuing, you agree to our friendly farm terms.</>
          }
        </p>
      </div>
    </div>
  );
}
