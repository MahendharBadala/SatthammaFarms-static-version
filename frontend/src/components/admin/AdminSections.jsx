import React from "react";
import { PencilSimple, Trash, Plus } from "@phosphor-icons/react";

export function ProductForm({ form, setForm, editing, onSave, onCancel }) {
  const fields = [
    ["name", "Name", "text"], ["price", "Price (₹)", "number"], ["unit", "Unit (kg, 500g...)", "text"],
    ["image_url", "Image URL", "url"], ["video_url", "Video URL (optional)", "url"], ["stock", "Stock", "number"],
  ];
  return (
    <form onSubmit={onSave} className="card-earth p-6 h-fit sticky top-24 space-y-3" data-testid="product-form">
      <h3 className="font-serif text-2xl text-ink">{editing ? "Edit product" : "Add product"}</h3>
      {fields.map(([k, l, t]) => (
        <div key={k}>
          <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">{l}</label>
          <input data-testid={`product-form-${k}`} type={t} required={k !== "video_url"} value={form[k]}
            onChange={e => setForm({ ...form, [k]: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-edge rounded-lg bg-white focus:outline-none focus:border-forest" />
        </div>
      ))}
      <div>
        <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Category</label>
        <select data-testid="product-form-category" value={form.category}
          onChange={e => setForm({ ...form, category: e.target.value })}
          className="mt-1 w-full px-3 py-2 border border-edge rounded-lg bg-white focus:outline-none focus:border-forest">
          {["grains", "pulses", "pickles", "spices", "seeds", "cotton", "other"].map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Description</label>
        <textarea data-testid="product-form-description" rows="3" value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          className="mt-1 w-full px-3 py-2 border border-edge rounded-lg bg-white focus:outline-none focus:border-forest" />
      </div>
      <label className="inline-flex items-center gap-2 text-sm">
        <input data-testid="product-form-featured" type="checkbox" checked={form.featured}
          onChange={e => setForm({ ...form, featured: e.target.checked })} /> Featured on home page
      </label>
      <div className="flex gap-2 pt-2">
        <button data-testid="product-form-save" className="btn-primary flex-1 inline-flex items-center justify-center gap-2">
          <Plus size={16} /> {editing ? "Update" : "Add"}
        </button>
        {editing && <button type="button" onClick={onCancel} className="btn-outline">Cancel</button>}
      </div>
    </form>
  );
}

export function ProductList({ products, onEdit, onDelete }) {
  return (
    <div className="space-y-3" data-testid="admin-product-list">
      {products.map(p => (
        <div key={p.id} className="card-earth p-4 flex gap-4 items-center">
          <img src={p.image_url} alt={p.name} className="w-20 h-20 object-cover rounded-lg" />
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-widest text-terracotta">{p.category}</div>
            <h4 className="font-serif text-xl text-ink">{p.name}</h4>
            <div className="text-sm text-muted2">₹{p.price} / {p.unit} · stock {p.stock} {p.featured && "· ★ featured"}</div>
          </div>
          <button data-testid={`admin-edit-${p.id}`} onClick={() => onEdit(p)} className="rounded-full border border-edge p-2 hover:bg-cream2"><PencilSimple size={16} /></button>
          <button data-testid={`admin-delete-${p.id}`} onClick={() => onDelete(p.id)} className="rounded-full border border-edge p-2 hover:bg-cream2 text-terracotta"><Trash size={16} /></button>
        </div>
      ))}
    </div>
  );
}

export function OrdersTable({ orders }) {
  if (orders.length === 0) return <div className="text-muted2 text-center py-16" data-testid="admin-orders">No orders yet.</div>;
  return (
    <div className="space-y-3" data-testid="admin-orders">
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
  );
}

export function UsersTable({ users }) {
  return (
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
  );
}
