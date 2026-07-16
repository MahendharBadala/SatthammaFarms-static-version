import React, { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import AdminLoginModal from "./AdminLoginModal";
import {
  ShoppingBag,
  SignOut,
  ShieldCheck,
  List,
  X,
} from "@phosphor-icons/react";

export default function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const nav = useNavigate();
  const loc = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
        <div className="container mx-auto px-4 py-3">
        {/* Top Row */}
        <div className="flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center gap-3">
        <button
          className="md:hidden rounded-full p-1"
          onClick={() => setMenuOpen(true)}
        >
        <List size={26} />
      </button>

      <Link
        to="/"
        data-testid="nav-home-logo"
        onClick={onLogoClick}
        className="select-none"
      >
        <Logo />
      </Link>

    </div>

    {/* Right Side */}
    <div className="flex items-center gap-2">

      <Link
        to="/cart"
        data-testid="nav-cart"
        className="relative rounded-full border border-edge px-3 py-2 hover:bg-cream2 transition-colors"
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

      {/* Desktop Admin Buttons */}
      {user?.role === "admin" && (
        <>
          <button
            onClick={() => nav("/admin")}
            className="btn-outline hidden md:inline-flex items-center gap-2 !py-2 !px-3 text-xs"
          >
            <ShieldCheck size={16} />
            Admin
          </button>

          <button
            onClick={() => {
              logout();
              nav("/");
            }}
            className="hidden md:flex rounded-full border border-edge p-2"
          >
            <SignOut size={18} />
          </button>
        </>
      )}

    </div>

  </div>

  {/* Desktop Navigation */}
  <nav className="hidden md:flex items-center justify-center gap-8 mt-4">
    {link("/", "Home", "nav-home")}
    {link("/products", "Our Products", "nav-products")}
    {link("/about", "Our Story", "nav-about")}
    {link("/contact", "Contact", "nav-contact")}
  </nav>

  {/* Mobile Navigation */}
  <div className="md:hidden mt-3 border-t border-edge">

    <div className="grid grid-cols-2">

      <Link
        to="/"
        className={`py-3 text-center font-medium transition-all ${
          loc.pathname === "/"
            ? "text-forest border-b-[3px] border-forest"
            : "text-muted2"
        }`}
      >
        Home
      </Link>

      <Link
        to="/products"
        className={`py-3 text-center font-medium transition-all ${
          loc.pathname.startsWith("/products")
            ? "text-forest border-b-[3px] border-forest"
            : "text-muted2"
        }`}
      >
        Our Products
      </Link>

    </div>

  </div>

</div>
        </div>
      </header>
      <AdminLoginModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
