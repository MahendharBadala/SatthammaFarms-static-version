import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Logo } from "../components/Logo";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
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
    } catch (e) {
      const d = e?.response?.data?.detail;
      setErr(typeof d === "string" ? d : "Registration failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="container mx-auto py-16 max-w-md">
      <div className="flex justify-center mb-6"><Logo /></div>
      <div className="card-earth p-8">
        <div className="chip">Join the harvest</div>
        <h1 className="font-serif text-4xl text-ink mt-2">Create account</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {[
            { k: "name", label: "Full name", type: "text" },
            { k: "email", label: "Email", type: "email" },
            { k: "phone", label: "Phone", type: "tel" },
            { k: "password", label: "Password", type: "password" },
          ].map(f => (
            <div key={f.k}>
              <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">{f.label}</label>
              <input data-testid={`register-${f.k}`} required={f.k !== "phone"} type={f.type} value={form[f.k]} onChange={upd(f.k)} className="mt-1 w-full px-4 py-3 border border-edge rounded-xl focus:outline-none focus:border-forest bg-white" />
            </div>
          ))}
          {err && <p data-testid="register-error" className="text-sm text-terracotta">{err}</p>}
          <button data-testid="register-submit" disabled={loading} className="btn-primary w-full">{loading ? "Creating..." : "Create account"}</button>
        </form>
        <p className="text-sm text-muted2 mt-6 text-center">Have an account? <Link to="/login" data-testid="link-login" className="text-forest font-semibold">Sign in</Link></p>
      </div>
    </div>
  );
}
