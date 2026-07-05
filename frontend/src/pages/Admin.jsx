import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Users, ShoppingBag, Package } from "@phosphor-icons/react";
import {
  ProductForm, ProductList, OrdersTable, UsersTable, PaymentSettingsPanel,
  CouponsManager, BannersManager,
} from "../components/admin/AdminSections";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const empty = { name: "", category: "grains", price: 0, unit: "kg", description: "", image_url: "", video_url: "", gallery: [], stock: 100, featured: false };

export default function Admin() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [banners, setBanners] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = useCallback(async () => {
    const [p, o, u, s, c, b] = await Promise.all([
      axios.get(`${API}/products`),
      axios.get(`${API}/admin/orders`).catch(() => ({ data: [] })),
      axios.get(`${API}/admin/users`).catch(() => ({ data: [] })),
      axios.get(`${API}/admin/payments/settings`).catch(() => ({ data: null })),
      axios.get(`${API}/admin/coupons`).catch(() => ({ data: [] })),
      axios.get(`${API}/admin/banners`).catch(() => ({ data: [] })),
    ]);
    setProducts(p.data); setOrders(o.data); setUsers(u.data); setSettings(s.data);
    setCoupons(c.data); setBanners(b.data);
  }, []);

  useEffect(() => { if (user?.role === "admin") load(); }, [user, load]);

  if (loading) return <div className="container mx-auto py-20 text-center text-muted2">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  const startEdit = (p) => { setEditing(p.id); setForm({ ...empty, ...p }); };
  const cancel = () => { setEditing(null); setForm(empty); };

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
    if (!window.confirm("Delete this product?")) return;
    await axios.delete(`${API}/products/${id}`);
    toast.success("Deleted");
    load();
  };

  const stats = [
    { icon: Package, label: "Products", n: products.length },
    { icon: ShoppingBag, label: "Orders", n: orders.length },
    { icon: Users, label: "Users", n: users.length },
  ];

  const saveCoupon = async (editingId, payload, done) => {
    try {
      if (editingId) {
        await axios.put(`${API}/admin/coupons/${editingId}`, payload);
        toast.success("Coupon updated");
      } else {
        await axios.post(`${API}/admin/coupons`, payload);
        toast.success("Coupon created");
      }
      done?.(); load();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed to save coupon"); }
  };
  const deleteCoupon = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    try { await axios.delete(`${API}/admin/coupons/${id}`); toast.success("Coupon deleted"); load(); }
    catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
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
      if (editingId) {
        await axios.put(`${API}/admin/banners/${editingId}`, payload);
        toast.success("Banner updated");
      } else {
        await axios.post(`${API}/admin/banners`, payload);
        toast.success("Banner created");
      }
      done?.(); load();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed to save banner"); }
  };
  const deleteBanner = async (id) => {
    if (!window.confirm("Delete this banner?")) return;
    try { await axios.delete(`${API}/admin/banners/${id}`); toast.success("Banner deleted"); load(); }
    catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };
  const toggleBannerActive = async (b) => {
    try {
      await axios.put(`${API}/admin/banners/${b.id}`, { ...b, active: !b.active });
      toast.success(b.active ? "Banner deactivated" : "Banner activated");
      load();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  const tabs = [
    { k: "products", label: "Products" },
    { k: "orders", label: "Orders" },
    { k: "users", label: "Users" },
    { k: "coupons", label: "Coupons" },
    { k: "banners", label: "Banners" },
    { k: "payments", label: "Payments" },
  ];

  return (
    <div className="container mx-auto py-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="chip">Control room</div>
          <h1 className="font-serif text-5xl text-ink mt-2">Admin Dashboard</h1>
          <p className="text-muted2 mt-1">Signed in as {user.email}</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {stats.map(s => (
            <div key={s.label} className="card-earth px-4 py-3 min-w-[110px]">
              <s.icon size={20} className="text-terracotta" weight="duotone" />
              <div className="font-serif text-2xl text-forest">{s.n}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted2">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 border-b border-edge mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t.k} data-testid={`admin-tab-${t.k}`} onClick={() => setTab(t.k)}
            className={`px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${tab === t.k ? "border-forest text-forest font-semibold" : "border-transparent text-muted2 hover:text-forest"}`}>{t.label}</button>
        ))}
      </div>

      {tab === "products" && (
        <div className="grid lg:grid-cols-[420px,1fr] gap-8">
          <ProductForm form={form} setForm={setForm} editing={editing} onSave={save} onCancel={cancel} />
          <ProductList products={products} onEdit={startEdit} onDelete={del} />
        </div>
      )}
      {tab === "orders" && <OrdersTable orders={orders} onUpdateStatus={async (id, status) => {
        try {
          await axios.put(`${API}/admin/orders/${id}/status`, { status });
          toast.success(`Order marked ${status.replace(/_/g, " ")}`);
          load();
        } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
      }} />}
      {tab === "users" && <UsersTable users={users} />}
      {tab === "coupons" && <CouponsManager coupons={coupons} onSave={saveCoupon} onDelete={deleteCoupon} onToggleActive={toggleCouponActive} />}
      {tab === "banners" && <BannersManager banners={banners} onSave={saveBanner} onDelete={deleteBanner} onToggleActive={toggleBannerActive} />}
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
