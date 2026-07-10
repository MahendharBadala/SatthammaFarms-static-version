import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { SiteProvider } from "./context/SiteContext";
import { Toaster } from "sonner";
import SplashScreen from "./components/SplashScreen";

import Header from "./components/Header";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Admin from "./pages/Admin";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "instant" in window ? "instant" : "auto" }); }, [pathname]);
  return null;
}

function Shell({ children }) {
  const loc = useLocation();
  const hideChrome = loc.pathname.startsWith("/admin");
  return (
    <>
      {!hideChrome && <Header />}
      <main className="min-h-[70vh]">{children}</main>
      {!hideChrome && <Footer />}
    </>
  );
}

function App() {
  // Only show the splash on a genuine fresh load of the site (first mount),
  // never again while the user navigates between pages in the same visit.
  return (
    <BrowserRouter>
      <AuthProvider>
        <SiteProvider>
          <CartProvider>
            <SplashScreen />
            <Toaster position="top-right" richColors />
            <ScrollToTop />
            <Shell>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/admin" element={<Admin />} />
              </Routes>
            </Shell>
          </CartProvider>
        </SiteProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
