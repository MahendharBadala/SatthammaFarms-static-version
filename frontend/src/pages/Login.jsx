import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Logo } from "../components/Logo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      // admin creds -> /admin, others -> /
      if (user.role === "admin") nav("/admin");
      else nav(loc.state?.from || "/");
    } catch (e) {
      const d = e?.response?.data?.detail;
      setErr(typeof d === "string" ? d : "Login failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="container mx-auto py-16 max-w-md">
      <div className="flex justify-center mb-6"><Logo /></div>
      <div className="card-earth p-8">
        <div className="chip">Welcome</div>
        <h1 className="font-serif text-4xl text-ink mt-2">Sign in</h1>
        <p className="text-muted2 mt-1 text-sm">Admin credentials go straight to the admin panel.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Email</label>
            <input data-testid="login-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full px-4 py-3 border border-edge rounded-xl focus:outline-none focus:border-forest bg-white" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Password</label>
            <input data-testid="login-password" type="password" required value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full px-4 py-3 border border-edge rounded-xl focus:outline-none focus:border-forest bg-white" />
          </div>
          {err && <p data-testid="login-error" className="text-sm text-terracotta">{err}</p>}
          <button data-testid="login-submit" disabled={loading} className="btn-primary w-full">{loading ? "Signing in..." : "Sign in"}</button>
        </form>
        <p className="text-sm text-muted2 mt-6 text-center">New to Satthamma? <Link to="/register" data-testid="link-register" className="text-forest font-semibold">Create account</Link></p>
      </div>
    </div>
  );
}
