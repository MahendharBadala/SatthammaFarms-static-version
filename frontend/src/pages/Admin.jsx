import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { PencilSimple, Trash, Plus, Users, ShoppingBag, Package } from "@phosphor-icons/react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const empty = { name: "", category: "grains", price: 0, unit: "kg", description: "", image_url: "", video_url: "", stock: 100, featured: false };

export default function Admin() {
  const { user, loading, authHeaders } = useAuth();
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = async () => {
    const [p, o, u] = await Promise.all([
      axios.get(`${API}/products`),
      axios.get(`${API}/admin/orders`, { headers: authHeaders() }).catch(() => ({ data: [] })),
      axios.get(`${API}/admin/users`, { headers: authHeaders() }).catch(() => ({ data: [] })),
    ]);
    setProducts(p.data); setOrders(o.data); setUsers(u.data);
  };

  useEffect(() => { if (user?.role === "admin") load(); /* eslint-disable-next-line */ }, [user]);

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
        await axios.put(`${API}/products/${editing}`, payload, { headers: authHeaders() });
        toast.success("Product updated");
      } else {
        await axios.post(`${API}/products`, payload, { headers: authHeaders() });
        toast.success("Product added");
      }
      cancel(); load();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed to save"); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await axios.delete(`${API}/products/${id}`, { headers: authHeaders() });
    toast.success("Deleted");
    load();
  };

  return (
    <div className="container mx-auto py-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="chip">Control room</div>
          <h1 className="font-serif text-5xl text-ink mt-2">Admin Dashboard</h1>
          <p className="text-muted2 mt-1">Signed in as {user.email}</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Package, label: "Products", n: products.length },
            { icon: ShoppingBag, label: "Orders", n: orders.length },
            { icon: Users, label: "Users", n: users.length },
          ].map(s => (
            <div key={s.label} className="card-earth px-4 py-3 min-w-[110px]">
              <s.icon size={20} className="text-terracotta" weight="duotone" />
              <div className="font-serif text-2xl text-forest">{s.n}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted2">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 border-b border-edge mb-6">
        {[
          { k: "products", label: "Products" },
          { k: "orders", label: "Orders" },
          { k: "users", label: "Users" },
        ].map(t => (
          <button key={t.k} data-testid={`admin-tab-${t.k}`} onClick={() => setTab(t.k)}
            className={`px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${tab === t.k ? "border-forest text-forest font-semibold" : "border-transparent text-muted2 hover:text-forest"}`}>{t.label}</button>
        ))}
      </div>

      {tab === "products" && (
        <div className="grid lg:grid-cols-[420px,1fr] gap-8">
          <form onSubmit={save} className="card-earth p-6 h-fit sticky top-24 space-y-3" data-testid="product-form">
            <h3 className="font-serif text-2xl text-ink">{editing ? "Edit product" : "Add product"}</h3>
            {[
              ["name", "Name", "text"], ["price", "Price (₹)", "number"], ["unit", "Unit (kg, 500g...)", "text"],
              ["image_url", "Image URL", "url"], ["video_url", "Video URL (optional)", "url"], ["stock", "Stock", "number"],
            ].map(([k, l, t]) => (
              <div key={k}>
                <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">{l}</label>
                <input data-testid={`product-form-${k}`} type={t} required={k !== "video_url"} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} className="mt-1 w-full px-3 py-2 border border-edge rounded-lg bg-white focus:outline-none focus:border-forest" />
              </div>
            ))}
            <div>
              <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Category</label>
              <select data-testid="product-form-category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="mt-1 w-full px-3 py-2 border border-edge rounded-lg bg-white focus:outline-none focus:border-forest">
                {["grains", "pulses", "pickles", "spices", "seeds", "cotton", "other"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Description</label>
              <textarea data-testid="product-form-description" rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 w-full px-3 py-2 border border-edge rounded-lg bg-white focus:outline-none focus:border-forest" />
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input data-testid="product-form-featured" type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} /> Featured on home page
            </label>
            <div className="flex gap-2 pt-2">
              <button data-testid="product-form-save" className="btn-primary flex-1 inline-flex items-center justify-center gap-2"><Plus size={16} /> {editing ? "Update" : "Add"}</button>
              {editing && <button type="button" onClick={cancel} className="btn-outline">Cancel</button>}
            </div>
          </form>

          <div className="space-y-3" data-testid="admin-product-list">
            {products.map(p => (
              <div key={p.id} className="card-earth p-4 flex gap-4 items-center">
                <img src={p.image_url} alt={p.name} className="w-20 h-20 object-cover rounded-lg" />
                <div className="flex-1">
                  <div className="text-[10px] uppercase tracking-widest text-terracotta">{p.category}</div>
                  <h4 className="font-serif text-xl text-ink">{p.name}</h4>
                  <div className="text-sm text-muted2">₹{p.price} / {p.unit} · stock {p.stock} {p.featured && "· ★ featured"}</div>
                </div>
                <button data-testid={`admin-edit-${p.id}`} onClick={() => startEdit(p)} className="rounded-full border border-edge p-2 hover:bg-cream2"><PencilSimple size={16} /></button>
                <button data-testid={`admin-delete-${p.id}`} onClick={() => del(p.id)} className="rounded-full border border-edge p-2 hover:bg-cream2 text-terracotta"><Trash size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="space-y-3" data-testid="admin-orders">
          {orders.length === 0 && <div className="text-muted2 text-center py-16">No orders yet.</div>}
          {orders.map(o => (
            <div key={o.id} className="card-earth p-5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs text-muted2">{new Date(o.created_at).toLocaleString()}</div>
                  <div className="font-serif text-xl text-ink">{o.user_email}</div>
                  <div className="text-sm text-muted2">{o.address} · {o.phone}</div>
                </div>
                <div className="text-right">
                  <div className="font-serif text-2xl text-forest">₹{o.total}</div>
                  <div className="chip">{o.status}</div>
                </div>
              </div>
              <div className="mt-3 text-sm text-muted2">{o.items.map(i => `${i.name} × ${i.quantity}`).join(" · ")}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "users" && (
        <div className="card-earth overflow-hidden" data-testid="admin-users">
          <table className="w-full text-sm">
            <thead className="bg-cream2 text-muted2 uppercase text-xs">
              <tr><th className="text-left p-3">Name</th><th className="text-left p-3">Email</th><th className="text-left p-3">Phone</th><th className="text-left p-3">Role</th><th className="text-left p-3">Joined</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t border-edge">
                  <td className="p-3 font-serif text-ink">{u.name}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.phone || "—"}</td>
                  <td className="p-3"><span className={`chip ${u.role === "admin" ? "!bg-forest/10 !text-forest" : ""}`}>{u.role}</span></td>
                  <td className="p-3 text-muted2">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
