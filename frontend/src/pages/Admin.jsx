import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Users, ShoppingBag, Package } from "@phosphor-icons/react";
import { ProductForm, ProductList, OrdersTable, UsersTable } from "../components/admin/AdminSections";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const empty = { name: "", category: "grains", price: 0, unit: "kg", description: "", image_url: "", video_url: "", gallery: [], stock: 100, featured: false };

export default function Admin() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = useCallback(async () => {
    const [p, o, u] = await Promise.all([
      axios.get(`${API}/products`),
      axios.get(`${API}/admin/orders`).catch(() => ({ data: [] })),
      axios.get(`${API}/admin/users`).catch(() => ({ data: [] })),
    ]);
    setProducts(p.data); setOrders(o.data); setUsers(u.data);
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

      <div className="flex gap-2 border-b border-edge mb-6">
        {[{ k: "products", label: "Products" }, { k: "orders", label: "Orders" }, { k: "users", label: "Users" }].map(t => (
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
      {tab === "orders" && <OrdersTable orders={orders} />}
      {tab === "users" && <UsersTable users={users} />}
    </div>
  );
}
