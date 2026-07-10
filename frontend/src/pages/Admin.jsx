import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useSite } from "../context/SiteContext";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ShoppingBag, Package, Tag, Plus, SignOut } from "@phosphor-icons/react";
import {
  ProductForm, ProductList, OrdersTable, PaymentSettingsPanel,
  CouponsManager, BannersManager, SiteSettingsPanel,
} from "../components/admin/AdminSections";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const empty = { name: "", category: "grains", price: 0, unit: "kg", description: "", image_url: "", video_url: "", gallery: [], stock: 100, featured: false };

export default function Admin() {
  const { user, loading, logout } = useAuth();
  const { refresh: refreshSite } = useSite();
  const nav = useNavigate();
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState(null);
  const [siteSettings, setSiteSettings] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [banners, setBanners] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [form, setForm] = useState(empty);
  // Tracks ids currently mid-delete so a second click can't fire a duplicate
  // request against an item that's already gone (was the source of the
  // "delete sometimes does nothing" glitch).
  const [deletingIds, setDeletingIds] = useState(new Set());
  const markDeleting = (id, on) => setDeletingIds(prev => {
    const next = new Set(prev);
    on ? next.add(id) : next.delete(id);
    return next;
  });

  const load = useCallback(async () => {
    const [p, o, s, c, b, si] = await Promise.all([
      axios.get(`${API}/products`),
      axios.get(`${API}/admin/orders`).catch(() => ({ data: [] })),
      axios.get(`${API}/admin/payments/settings`).catch(() => ({ data: null })),
      axios.get(`${API}/admin/coupons`).catch(() => ({ data: [] })),
      axios.get(`${API}/admin/banners`).catch(() => ({ data: [] })),
      axios.get(`${API}/site`).catch(() => ({ data: null })),
    ]);
    setProducts(p.data); setOrders(o.data); setSettings(s.data);
    setCoupons(c.data); setBanners(b.data); setSiteSettings(si.data);
  }, []);

  useEffect(() => { if (user?.role === "admin") load(); }, [user, load]);

  if (loading) return <div className="container mx-auto py-20 text-center text-muted2">Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  const startEdit = (p) => { setEditing(p.id); setForm({ ...empty, ...p }); setShowProductForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const cancel = () => { setEditing(null); setForm(empty); setShowProductForm(false); };
  const openAdd = () => { setEditing(null); setForm(empty); setShowProductForm(true); };

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, price: Number(form.price), stock: Number(form.stock) };
    try {
      if (editing) {
        await axios.put(`${API}/products/${editing}`, payload);
        toast.success("Product updated");
      } else {
        await axios.post(`${API}/products`, payload);
        toast.success("Product added");
      }
      cancel(); load();
    } catch (err) { toast.error(err?.response?.data?.detail || "Failed to save"); }
  };

  const del = async (id) => {
    if (deletingIds.has(id)) return; // already in flight — ignore extra clicks
    if (!window.confirm("Delete this product?")) return;
    markDeleting(id, true);
    // Optimistic removal so the row disappears immediately, even if the
    // reload that follows is slow or the request fails silently.
    const prev = products;
    setProducts(products.filter(p => p.id !== id));
    try {
      await axios.delete(`${API}/products/${id}`);
      toast.success("Deleted");
      load();
    } catch (err) {
      setProducts(prev); // roll back on failure
      toast.error(err?.response?.data?.detail || "Failed to delete product");
    } finally {
      markDeleting(id, false);
    }
  };

  const stats = [
    { icon: Package, label: "Products", n: products.length },
    { icon: ShoppingBag, label: "Orders", n: orders.length },
    { icon: Tag, label: "Coupons", n: coupons.length },
  ];

  const saveCoupon = async (editingId, payload, done) => {
    try {
      if (editingId) { await axios.put(`${API}/admin/coupons/${editingId}`, payload); toast.success("Coupon updated"); }
      else { await axios.post(`${API}/admin/coupons`, payload); toast.success("Coupon created"); }
      done?.(); load();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed to save coupon"); }
  };
  const deleteCoupon = async (id) => {
    if (deletingIds.has(id)) return;
    if (!window.confirm("Delete this coupon?")) return;
    markDeleting(id, true);
    const prev = coupons;
    setCoupons(coupons.filter(c => c.id !== id)); // optimistic
    try { await axios.delete(`${API}/admin/coupons/${id}`); toast.success("Coupon deleted"); load(); }
    catch (e) { setCoupons(prev); toast.error(e?.response?.data?.detail || "Failed to delete coupon"); }
    finally { markDeleting(id, false); }
  };
  const toggleCouponActive = async (c) => {
    try {
      await axios.put(`${API}/admin/coupons/${c.id}`, {
        code: c.code, type: c.type, value: c.value, min_order: c.min_order,
        max_uses: c.max_uses, expires_at: c.expires_at, active: !c.active,
      });
      toast.success(c.active ? "Coupon deactivated" : "Coupon activated");
      load();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  const saveBanner = async (editingId, payload, done) => {
    try {
      if (editingId) { await axios.put(`${API}/admin/banners/${editingId}`, payload); toast.success("Banner updated"); }
      else { await axios.post(`${API}/admin/banners`, payload); toast.success("Banner created"); }
      done?.(); load();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed to save banner"); }
  };
  const deleteBanner = async (id) => {
    if (deletingIds.has(id)) return;
    if (!window.confirm("Delete this banner?")) return;
    markDeleting(id, true);
    const prev = banners;
    setBanners(banners.filter(b => b.id !== id)); // optimistic
    try { await axios.delete(`${API}/admin/banners/${id}`); toast.success("Banner deleted"); load(); }
    catch (e) { setBanners(prev); toast.error(e?.response?.data?.detail || "Failed to delete banner"); }
    finally { markDeleting(id, false); }
  };
  const toggleBannerActive = async (b) => {
    try {
      await axios.put(`${API}/admin/banners/${b.id}`, { ...b, active: !b.active });
      toast.success(b.active ? "Banner deactivated" : "Banner activated");
      load();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  const saveSite = async (payload) => {
    try {
      await axios.put(`${API}/admin/site`, payload);
      toast.success("Site content updated — live for everyone.");
      load();
      refreshSite();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed to save"); }
  };

  const tabs = [
    { k: "products", label: "Products" },
    { k: "orders", label: "Orders" },
    { k: "coupons", label: "Coupons" },
    { k: "banners", label: "Banners" },
    { k: "site", label: "Site content" },
    { k: "payments", label: "Payments" },
  ];

  return (
    <div className="container mx-auto py-12">
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="chip">Control room</div>
          <h1 className="font-serif text-5xl text-ink mt-2">Admin Dashboard</h1>
          <p className="text-muted2 mt-1">Signed in as {user.email}</p>
        </div>
        <div className="flex items-start gap-3">
          <div className="grid grid-cols-3 gap-3">
            {stats.map(s => (
              <div key={s.label} className="card-earth px-4 py-3 min-w-[110px]">
                <s.icon size={20} className="text-terracotta" weight="duotone" />
                <div className="font-serif text-2xl text-forest">{s.n}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted2">{s.label}</div>
              </div>
            ))}
          </div>
          <button
            data-testid="admin-logout"
            onClick={async () => { await logout(); toast.success("Signed out"); nav("/"); }}
            className="btn-outline inline-flex items-center gap-2 !py-2 !px-4"
          >
            <SignOut size={16} weight="duotone" /> Logout
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-edge mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t.k} data-testid={`admin-tab-${t.k}`} onClick={() => { setTab(t.k); cancel(); }}
            className={`px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${tab === t.k ? "border-forest text-forest font-semibold" : "border-transparent text-muted2 hover:text-forest"}`}>{t.label}</button>
        ))}
      </div>

      {tab === "products" && (
        <div className="space-y-6">
          <div className="flex gap-3 items-center flex-wrap">
            <input
              data-testid="admin-product-search"
              type="text"
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              placeholder="Search products by name or category…"
              className="flex-1 min-w-[220px] px-4 py-2.5 border border-edge rounded-full bg-white focus:outline-none focus:border-forest text-sm"
            />
            {!showProductForm && (
              <button data-testid="admin-add-product-btn" onClick={openAdd} className="btn-primary inline-flex items-center gap-2 shrink-0">
                <Plus size={18} weight="bold" /> Add product
              </button>
            )}
          </div>
          {showProductForm && (
            <ProductForm form={form} setForm={setForm} editing={editing} onSave={save} onCancel={cancel} />
          )}
          <ProductList products={products} onEdit={startEdit} onDelete={del} deletingIds={deletingIds} search={productSearch} />
        </div>
      )}
      {tab === "orders" && <OrdersTable orders={orders} onUpdateStatus={async (id, status) => {
        try {
          await axios.put(`${API}/admin/orders/${id}/status`, { status });
          toast.success(`Order marked ${status.replace(/_/g, " ")}`);
          load();
        } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
      }} />}
      {tab === "coupons" && <CouponsManager coupons={coupons} onSave={saveCoupon} onDelete={deleteCoupon} onToggleActive={toggleCouponActive} deletingIds={deletingIds} />}
      {tab === "banners" && <BannersManager banners={banners} onSave={saveBanner} onDelete={deleteBanner} onToggleActive={toggleBannerActive} deletingIds={deletingIds} />}
      {tab === "site" && <SiteSettingsPanel site={siteSettings} onSave={saveSite} />}
      {tab === "payments" && <PaymentSettingsPanel settings={settings} onSave={async (payload) => {
        try {
          await axios.put(`${API}/admin/payments/settings`, payload);
          toast.success("Payment settings updated");
          load();
        } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
      }} />}
    </div>
  );
}
