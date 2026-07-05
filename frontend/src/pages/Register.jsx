import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Logo } from "../components/Logo";
import { Eye, EyeSlash } from "@phosphor-icons/react";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const nav = useNavigate();

  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await register(form);
      toast.success("Account created successfully!");
      nav("/");
    } catch (e2) {
      const d = e2?.response?.data?.detail;
      setErr(typeof d === "string" ? d : "Registration failed. Please try again.");
    } finally { setLoading(false); }
  };

  const plainFields = [
    { k: "name", label: "Full name", type: "text", required: true },
    { k: "email", label: "Email", type: "email", required: true },
    { k: "phone", label: "Phone", type: "tel", required: false },
  ];

  return (
    <div className="container mx-auto py-16 max-w-md">
      <div className="flex justify-center mb-6"><Logo /></div>
      <div className="card-earth p-8">
        <div className="chip">Join the harvest</div>
        <h1 className="font-serif text-4xl text-ink mt-2">Create account</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {plainFields.map(f => (
            <div key={f.k}>
              <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">{f.label}</label>
              <input data-testid={`register-${f.k}`} required={f.required} type={f.type} value={form[f.k]} onChange={upd(f.k)} className="mt-1 w-full px-4 py-3 border border-edge rounded-xl focus:outline-none focus:border-forest bg-white" />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Password</label>
            <div className="relative mt-1">
              <input
                data-testid="register-password"
                type={showPassword ? "text" : "password"}
                required
                value={form.password}
                onChange={upd("password")}
                className="w-full px-4 py-3 pr-12 border border-edge rounded-xl focus:outline-none focus:border-forest bg-white"
              />
              <button
                type="button"
                data-testid="register-password-toggle"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-3 flex items-center text-muted2 hover:text-forest"
              >
                {showPassword ? <EyeSlash size={20} weight="duotone" /> : <Eye size={20} weight="duotone" />}
              </button>
            </div>
          </div>
          {err && <p data-testid="register-error" className="text-sm text-terracotta">{err}</p>}
          <button data-testid="register-submit" disabled={loading} className="btn-primary w-full">{loading ? "Creating..." : "Create account"}</button>
        </form>
        <p className="text-sm text-muted2 mt-6 text-center">Have an account? <Link to="/login" data-testid="link-login" className="text-forest font-semibold">Sign in</Link></p>
      </div>
    </div>
  );
}
