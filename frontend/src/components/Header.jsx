import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { ShoppingBag, UserCircle, SignOut, ShieldCheck } from "@phosphor-icons/react";

export default function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const nav = useNavigate();
  const loc = useLocation();

  const link = (to, label, id) => (
    <Link
      to={to}
      data-testid={id}
      className={`text-sm tracking-wide transition-colors ${loc.pathname === to ? "text-forest font-semibold" : "text-muted2 hover:text-forest"}`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-cream/75 border-b border-edge">
      <div className="container mx-auto flex items-center justify-between py-4">
        <Link to="/" data-testid="nav-home-logo"><Logo /></Link>
        <nav className="hidden md:flex items-center gap-8">
          {link("/", "Home", "nav-home")}
          {link("/products", "Our Products", "nav-products")}
          {link("/about", "Our Story", "nav-about")}
          {link("/contact", "Contact", "nav-contact")}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/cart" data-testid="nav-cart" className="relative rounded-full border border-edge px-3 py-2 hover:bg-cream2 transition-colors">
            <ShoppingBag size={20} weight="duotone" />
            {count > 0 && (
              <span data-testid="cart-count-badge" className="absolute -top-1 -right-1 bg-terracotta text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">{count}</span>
            )}
          </Link>
          {user?.role === "admin" && (
            <button data-testid="nav-admin-panel" onClick={() => nav("/admin")} className="btn-outline hidden sm:inline-flex items-center gap-2 !py-2 !px-3 text-xs">
              <ShieldCheck size={16} weight="duotone" /> Admin
            </button>
          )}
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs text-muted2">Hi, {user.name.split(" ")[0]}</span>
              <button data-testid="nav-logout" onClick={() => { logout(); nav("/"); }} className="rounded-full border border-edge p-2 hover:bg-cream2 transition-colors" aria-label="Logout"><SignOut size={18} /></button>
            </div>
          ) : (
            <Link to="/login" data-testid="nav-login" className="btn-primary !py-2 !px-4 text-sm inline-flex items-center gap-2"><UserCircle size={18} weight="duotone" /> Sign in</Link>
          )}
        </div>
      </div>
    </header>
  );
}
