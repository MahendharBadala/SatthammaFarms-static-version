import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";
import { DeviceMobile, ArrowRight } from "@phosphor-icons/react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COUNTRIES = [
  { code: "+91", flag: "🇮🇳", label: "India" },
  { code: "+1", flag: "🇺🇸", label: "USA / Canada" },
  { code: "+44", flag: "🇬🇧", label: "UK" },
  { code: "+61", flag: "🇦🇺", label: "Australia" },
  { code: "+971", flag: "🇦🇪", label: "UAE" },
  { code: "+65", flag: "🇸🇬", label: "Singapore" },
  { code: "+81", flag: "🇯🇵", label: "Japan" },
  { code: "+49", flag: "🇩🇪", label: "Germany" },
  { code: "+33", flag: "🇫🇷", label: "France" },
  { code: "+974", flag: "🇶🇦", label: "Qatar" },
  { code: "+966", flag: "🇸🇦", label: "Saudi Arabia" },
];

const formatErr = (e) => {
  const d = e?.response?.data?.detail;
  return typeof d === "string" ? d : "Something went wrong. Please try again.";
};

export default function PhoneLogin() {
  const [country, setCountry] = useState("+91");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState("phone"); // phone → otp → name
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const loc = useLocation();

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const fullPhone = `${country}${phone.replace(/\D/g, "")}`;

  const sendOtp = async (e) => {
    e?.preventDefault();
    setErr("");
    if (phone.replace(/\D/g, "").length < 6) { setErr("Enter a valid phone number"); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/auth/otp/request`, { phone: fullPhone });
      toast.success("OTP sent (check server console — mock mode)");
      setStep("otp");
      setCooldown(30);
    } catch (e2) { setErr(formatErr(e2)); }
    finally { setLoading(false); }
  };

  const verifyOtp = async (e, withName = false) => {
    e?.preventDefault();
    setErr("");
    if (code.length !== 6) { setErr("Enter the 6-digit OTP"); return; }
    if (withName && !name.trim()) { setErr("Please enter your name"); return; }
    setLoading(true);
    try {
      const body = { phone: fullPhone, code, ...(withName ? { name: name.trim() } : {}) };
      const { data } = await axios.post(`${API}/auth/otp/verify`, body);
      if (data.needs_name) {
        setStep("name");
        setLoading(false);
        return;
      }
      // success — hydrate AuthProvider via full reload
      try {
        const me = await axios.get(`${API}/auth/me`);
        toast.success(`Welcome, ${me.data.name.split(" ")[0]}!`);
        window.location.href = me.data.role === "admin" ? "/admin" : (loc.state?.from || "/");
      } catch {
        window.location.href = "/";
      }
    } catch (e2) { setErr(formatErr(e2)); setLoading(false); }
  };

  if (step === "phone") return (
    <form onSubmit={sendOtp} className="space-y-4" data-testid="phone-login-step-phone">
      <div>
        <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Mobile number</label>
        <div className="mt-1 flex gap-2">
          <select data-testid="phone-country" value={country} onChange={e => setCountry(e.target.value)} className="px-3 py-3 border border-edge rounded-xl bg-white focus:outline-none focus:border-forest">
            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
          </select>
          <input data-testid="phone-input" required inputMode="numeric" pattern="[0-9]{6,15}" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="85008 12044" className="flex-1 px-4 py-3 border border-edge rounded-xl focus:outline-none focus:border-forest bg-white" />
        </div>
        <p className="text-xs text-muted2 mt-2">We'll send a 6-digit OTP. Standard SMS rates apply.</p>
      </div>
      {err && <p data-testid="phone-error" className="text-sm text-terracotta">{err}</p>}
      <button data-testid="phone-send-otp" disabled={loading} className="btn-primary w-full inline-flex items-center justify-center gap-2">
        <DeviceMobile size={18} weight="duotone" /> {loading ? "Sending..." : "Send OTP"}
      </button>
    </form>
  );

  if (step === "otp") return (
    <form onSubmit={verifyOtp} className="space-y-4" data-testid="phone-login-step-otp">
      <div className="text-sm text-muted2">OTP sent to <span className="text-ink font-semibold" data-testid="otp-sent-to">{fullPhone}</span> <button type="button" onClick={() => { setStep("phone"); setCode(""); }} className="text-forest underline ml-2 text-xs">change</button></div>
      <div>
        <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">6-digit OTP</label>
        <input data-testid="otp-input" required inputMode="numeric" maxLength="6" pattern="[0-9]{6}" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" className="mt-1 w-full px-4 py-3 border border-edge rounded-xl focus:outline-none focus:border-forest bg-white tracking-[0.5em] text-center font-mono text-lg" />
      </div>
      {err && <p data-testid="otp-error" className="text-sm text-terracotta">{err}</p>}
      <button data-testid="otp-verify" disabled={loading} className="btn-primary w-full inline-flex items-center justify-center gap-2">{loading ? "Verifying..." : "Verify & continue"} <ArrowRight size={16} weight="bold" /></button>
      <div className="text-xs text-muted2 text-center">
        {cooldown > 0 ? `Resend in ${cooldown}s` : (
          <button type="button" data-testid="otp-resend" onClick={sendOtp} className="text-forest font-semibold hover:underline">Resend OTP</button>
        )}
      </div>
    </form>
  );

  // step === "name" — first-time signup
  return (
    <form onSubmit={(e) => verifyOtp(e, true)} className="space-y-4" data-testid="phone-login-step-name">
      <div className="text-sm text-muted2">Almost there! We just need your name to create your account.</div>
      <div>
        <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Your name</label>
        <input data-testid="phone-name-input" required autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ramesh Kumar" className="mt-1 w-full px-4 py-3 border border-edge rounded-xl focus:outline-none focus:border-forest bg-white" />
      </div>
      {err && <p data-testid="name-error" className="text-sm text-terracotta">{err}</p>}
      <button data-testid="phone-complete-signup" disabled={loading} className="btn-primary w-full">{loading ? "Creating..." : "Create account & sign in"}</button>
    </form>
  );
}
