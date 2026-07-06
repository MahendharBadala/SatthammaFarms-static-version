import React, { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import AdminLoginModal from "./AdminLoginModal";
import { ShoppingBag, SignOut, ShieldCheck } from "@phosphor-icons/react";

export default function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const nav = useNavigate();
  const loc = useLocation();
  const [modalOpen, setModalOpen] = useState(false);

  // Secret unlock: 5 rapid clicks on logo within 2 seconds opens admin modal.
  const clicks = useRef({ n: 0, last: 0 });
  const onLogoClick = (e) => {
    const now = Date.now();
    if (now - clicks.current.last > 2000) clicks.current.n = 0;
    clicks.current.last = now;
    clicks.current.n += 1;
    if (clicks.current.n >= 5) {
      e.preventDefault();
      clicks.current.n = 0;
      if (user?.role === "admin") nav("/admin");
      else setModalOpen(true);
    }
  };

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
    <>
      <header className="sticky top-0 z-50 backdrop-blur-md bg-cream/75 border-b border-edge">
        <div className="container mx-auto flex items-center justify-between py-4">
          <Link to="/" data-testid="nav-home-logo" onClick={onLogoClick} className="select-none">
            <Logo />
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {link("/", "Home", "nav-home")}
            {link("/products", "Our Products", "nav-products")}
            {link("/about", "Our Story", "nav-about")}
            {link("/contact", "Contact", "nav-contact")}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/cart"
              data-testid="nav-cart"
              className="relative rounded-full border border-edge px-3 py-2 hover:bg-cream2 transition-colors"
              aria-label="Cart"
            >
              <ShoppingBag size={20} weight="duotone" />
              {count > 0 && (
                <span
                  data-testid="cart-count-badge"
                  className="absolute -top-1 -right-1 bg-terracotta text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center"
                >
                  {count}
                </span>
              )}
            </Link>
            {user?.role === "admin" && (
              <>
                <button
                  data-testid="nav-admin-panel"
                  onClick={() => nav("/admin")}
                  className="btn-outline hidden sm:inline-flex items-center gap-2 !py-2 !px-3 text-xs"
                >
                  <ShieldCheck size={16} weight="duotone" /> Admin
                </button>
                <button
                  data-testid="nav-logout"
                  onClick={() => { logout(); nav("/"); }}
                  className="rounded-full border border-edge p-2 hover:bg-cream2 transition-colors"
                  aria-label="Logout"
                >
                  <SignOut size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <AdminLoginModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
