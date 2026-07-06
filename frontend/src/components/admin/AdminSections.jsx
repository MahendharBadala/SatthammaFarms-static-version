import React from "react";
import { PencilSimple, Trash, Plus } from "@phosphor-icons/react";
import MediaUploader, { resolveMediaUrl } from "../MediaUploader";

export function ProductForm({ form, setForm, editing, onSave, onCancel }) {
  const textFields = [
    ["name", "Name", "text"], ["price", "Price (₹)", "number"], ["unit", "Unit (kg, 500g...)", "text"],
    ["stock", "Stock", "number"],
  ];
  return (
    <form onSubmit={onSave} className="card-earth p-6 h-fit sticky top-24 space-y-3 max-h-[calc(100vh-8rem)] overflow-y-auto" data-testid="product-form">
      <h3 className="font-serif text-2xl text-ink">{editing ? "Edit product" : "Add product"}</h3>
      {textFields.map(([k, l, t]) => (
        <div key={k}>
          <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">{l}</label>
          <input data-testid={`product-form-${k}`} type={t} required value={form[k]}
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

      <MediaUploader
        kind="image"
        label="Main product image"
        value={form.image_url}
        onChange={(url) => setForm({ ...form, image_url: url })}
        testId="upload-main-image"
        compact
      />
      <MediaUploader
        kind="video"
        label="Product video (optional)"
        value={form.video_url}
        onChange={(url) => setForm({ ...form, video_url: url })}
        testId="upload-video"
        compact
      />
      <MediaUploader
        kind="image"
        label="Gallery — extra photos"
        values={form.gallery || []}
        onChangeMulti={(urls) => setForm({ ...form, gallery: urls })}
        testId="upload-gallery"
        compact
      />

      <label className="inline-flex items-center gap-2 text-sm pt-2">
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
          <img src={resolveMediaUrl(p.image_url)} alt={p.name} className="w-20 h-20 object-cover rounded-lg" />
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-widest text-terracotta">{p.category}</div>
            <h4 className="font-serif text-xl text-ink">{p.name}</h4>
            <div className="text-sm text-muted2">₹{p.price} / {p.unit} · stock {p.stock} {p.featured && "· ★ featured"} {p.gallery?.length ? `· ${p.gallery.length} extra photo${p.gallery.length > 1 ? "s" : ""}` : ""}</div>
          </div>
          <button data-testid={`admin-edit-${p.id}`} onClick={() => onEdit(p)} className="rounded-full border border-edge p-2 hover:bg-cream2"><PencilSimple size={16} /></button>
          <button data-testid={`admin-delete-${p.id}`} onClick={() => onDelete(p.id)} className="rounded-full border border-edge p-2 hover:bg-cream2 text-terracotta"><Trash size={16} /></button>
        </div>
      ))}
    </div>
  );
}

export function OrdersTable({ orders, onUpdateStatus }) {
  if (orders.length === 0) return <div className="text-muted2 text-center py-16" data-testid="admin-orders">No orders yet.</div>;
  const STATUSES = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"];
  const waLink = (o) => {
    const num = (o.phone || "").replace(/[^0-9]/g, "");
    return num ? `https://wa.me/${num.length === 10 ? "91" + num : num}` : null;
  };
  return (
    <div className="space-y-3" data-testid="admin-orders">
      {orders.map(o => (
        <div key={o.id} className="card-earth p-5">
          <div className="flex justify-between items-start flex-wrap gap-3">
            <div>
              <div className="text-xs text-muted2">{new Date(o.created_at).toLocaleString()} · Order {o.id.slice(-8).toUpperCase()}</div>
              <div className="font-serif text-xl text-ink">{o.customer_name || o.user_email || o.phone}</div>
              <div className="text-sm text-muted2">
                {o.phone}
                {waLink(o) && <> · <a href={waLink(o)} target="_blank" rel="noreferrer" className="text-forest hover:underline">WhatsApp</a></>}
              </div>
              <div className="text-sm text-muted2">{o.pincode ? `${o.pincode} · ` : ""}{o.address}</div>
              {o.coupon && <div className="text-xs text-forest mt-1">Coupon {o.coupon.code} · − ₹{o.coupon.discount_amount}</div>}
              {o.notes && <div className="text-xs text-muted2 mt-1">Notes: {o.notes}</div>}
            </div>
            <div className="text-right">
              <div className="font-serif text-2xl text-forest">₹{o.total}</div>
              <select
                data-testid={`admin-order-status-${o.id}`}
                value={o.status || "pending"}
                onChange={e => onUpdateStatus(o.id, e.target.value)}
                className="mt-1 px-3 py-1 rounded-full border border-edge bg-white text-sm focus:outline-none focus:border-forest"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3 text-sm text-muted2">{o.items.map(i => `${i.name} × ${i.quantity}`).join(" · ")}</div>
        </div>
      ))}
    </div>
  );
}

export function PaymentSettingsPanel({ settings, onSave }) {
  const [form, setForm] = React.useState(settings || {});
  React.useEffect(() => { setForm(settings || {}); }, [settings]);
  if (!settings) return null;
  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="card-earth p-6 max-w-2xl space-y-4" data-testid="payment-settings-form">
      <h3 className="font-serif text-2xl text-ink">Payment settings</h3>
      <p className="text-sm text-muted2">These control the UPI checkout customers see. Every change is live instantly.</p>

      <div>
        <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Provider</label>
        <select data-testid="settings-provider" value={form.provider} onChange={update("provider")} className="mt-1 w-full px-3 py-2 border border-edge rounded-lg bg-white focus:outline-none focus:border-forest">
          <option value="upi_manual">UPI Manual (customer pays, admin verifies)</option>
          <option value="razorpay">Razorpay (auto — needs API keys below)</option>
          <option value="disabled">Disabled (Cash on delivery only)</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Receiving UPI ID (VPA)</label>
        <input data-testid="settings-vpa" value={form.upi_vpa || ""} onChange={update("upi_vpa")} className="mt-1 w-full px-3 py-2 border border-edge rounded-lg bg-white focus:outline-none focus:border-forest" />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Payee name (shown in UPI apps)</label>
        <input data-testid="settings-payee" value={form.payee_name || ""} onChange={update("payee_name")} className="mt-1 w-full px-3 py-2 border border-edge rounded-lg bg-white focus:outline-none focus:border-forest" />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Instructions to customer</label>
        <textarea data-testid="settings-instructions" rows="2" value={form.instructions || ""} onChange={update("instructions")} className="mt-1 w-full px-3 py-2 border border-edge rounded-lg bg-white focus:outline-none focus:border-forest" />
      </div>
      <div className="border-t border-edge pt-4">
        <div className="text-xs font-semibold text-terracotta uppercase tracking-widest mb-2">Razorpay (optional — for automated confirmation)</div>
        <div className="grid md:grid-cols-2 gap-3">
          <input data-testid="settings-rzp-key" placeholder="Key ID (rzp_live_xxx)" value={form.razorpay_key_id || ""} onChange={update("razorpay_key_id")} className="px-3 py-2 border border-edge rounded-lg bg-white focus:outline-none focus:border-forest" />
          <input data-testid="settings-rzp-secret" placeholder="Key Secret" type="password" value={form.razorpay_key_secret || ""} onChange={update("razorpay_key_secret")} className="px-3 py-2 border border-edge rounded-lg bg-white focus:outline-none focus:border-forest" />
        </div>
        <p className="text-xs text-muted2 mt-2">When you paste real Razorpay keys and switch provider to "Razorpay", the checkout will automatically use the Razorpay-hosted flow with webhook confirmation. No code change needed.</p>
      </div>
      <button data-testid="settings-save" className="btn-primary">Save settings</button>
    </form>
  );
}

// ---------------- Site settings ----------------
const SITE_FIELDS = [
  { key: "whatsapp_number", label: "WhatsApp number (with country code, no +)", placeholder: "918500812044", type: "text" },
  { key: "contact_phone", label: "Contact phone (display)", type: "text" },
  { key: "contact_email", label: "Contact email", type: "email" },
  { key: "contact_address", label: "Contact address (multiline)", type: "textarea" },
  { key: "instagram_url", label: "Instagram URL", type: "text" },
  { key: "youtube_url", label: "YouTube URL", type: "text" },
  { key: "hero_badge", label: "Hero badge (small pill on top)", type: "text" },
  { key: "hero_title_line1", label: "Hero title — line 1", type: "text" },
  { key: "hero_title_line2", label: "Hero title — line 2", type: "text" },
  { key: "hero_tagline", label: "Hero tagline (Telugu quote)", type: "text" },
  { key: "hero_paragraph", label: "Hero paragraph", type: "textarea" },
  { key: "story_title", label: "Story section title", type: "text" },
  { key: "story_text", label: "Story section text", type: "textarea" },
  { key: "checkout_whatsapp_note", label: "Checkout WhatsApp notice (shown before Order button)", type: "textarea" },
];

export function SiteSettingsPanel({ site, onSave }) {
  const [form, setForm] = React.useState(site || {});
  React.useEffect(() => { setForm(site || {}); }, [site]);
  if (!site) return null;
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="card-earth p-6 max-w-3xl space-y-4" data-testid="site-settings-form">
      <h3 className="font-serif text-2xl text-ink">Site content</h3>
      <p className="text-sm text-muted2">Everything below is live across the site the moment you save. This is the fastest way to update prices-free content, contact numbers, and homepage copy.</p>
      <div className="grid md:grid-cols-2 gap-4">
        {SITE_FIELDS.map(f => (
          <div key={f.key} className={f.type === "textarea" ? "md:col-span-2" : ""}>
            <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">{f.label}</label>
            {f.type === "textarea" ? (
              <textarea
                data-testid={`site-${f.key}`}
                rows="3"
                value={form[f.key] || ""}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-edge rounded-lg bg-white focus:outline-none focus:border-forest"
              />
            ) : (
              <input
                data-testid={`site-${f.key}`}
                type={f.type}
                placeholder={f.placeholder || ""}
                value={form[f.key] || ""}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-edge rounded-lg bg-white focus:outline-none focus:border-forest"
              />
            )}
          </div>
        ))}
      </div>
      <button data-testid="site-save" className="btn-primary">Save site settings</button>
    </form>
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
              <td className="p-3">{u.email || "—"}</td>
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

// ---------------- Coupons ----------------
const EMPTY_COUPON = { code: "", type: "percent", value: 10, min_order: 0, max_uses: "", expires_at: "", active: true };

export function CouponsManager({ coupons, onSave, onDelete, onToggleActive }) {
  const [form, setForm] = React.useState(EMPTY_COUPON);
  const [editing, setEditing] = React.useState(null);

  const startEdit = (c) => {
    setEditing(c.id);
    setForm({
      code: c.code,
      type: c.type,
      value: c.value,
      min_order: c.min_order || 0,
      max_uses: c.max_uses ?? "",
      expires_at: c.expires_at ? c.expires_at.slice(0, 10) : "",
      active: c.active,
    });
  };
  const cancel = () => { setEditing(null); setForm(EMPTY_COUPON); };

  const submit = (e) => {
    e.preventDefault();
    const payload = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      min_order: Number(form.min_order) || 0,
      max_uses: form.max_uses === "" || form.max_uses === null ? null : Number(form.max_uses),
      expires_at: form.expires_at ? new Date(form.expires_at + "T23:59:59Z").toISOString() : null,
      active: !!form.active,
    };
    onSave(editing, payload, () => { cancel(); });
  };

  return (
    <div className="grid lg:grid-cols-[420px,1fr] gap-8" data-testid="admin-coupons">
      <form onSubmit={submit} className="card-earth p-6 h-fit sticky top-24 space-y-3" data-testid="coupon-form">
        <h3 className="font-serif text-2xl text-ink">{editing ? "Edit coupon" : "Add coupon"}</h3>
        <div>
          <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Code</label>
          <input data-testid="coupon-code" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })}
            placeholder="HARVEST10" className="mt-1 w-full px-3 py-2 border border-edge rounded-lg bg-white focus:outline-none focus:border-forest uppercase" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Type</label>
            <select data-testid="coupon-type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-edge rounded-lg bg-white focus:outline-none focus:border-forest">
              <option value="percent">Percent (%)</option>
              <option value="flat">Flat (₹)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">
              Value {form.type === "percent" ? "(%)" : "(₹)"}
            </label>
            <input data-testid="coupon-value" required type="number" min="0" step="0.01" value={form.value}
              onChange={e => setForm({ ...form, value: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-edge rounded-lg bg-white focus:outline-none focus:border-forest" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Min order (₹)</label>
          <input data-testid="coupon-min-order" type="number" min="0" value={form.min_order}
            onChange={e => setForm({ ...form, min_order: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-edge rounded-lg bg-white focus:outline-none focus:border-forest" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Max uses</label>
            <input data-testid="coupon-max-uses" type="number" min="0" placeholder="unlimited" value={form.max_uses}
              onChange={e => setForm({ ...form, max_uses: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-edge rounded-lg bg-white focus:outline-none focus:border-forest" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Expires</label>
            <input data-testid="coupon-expires" type="date" value={form.expires_at}
              onChange={e => setForm({ ...form, expires_at: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-edge rounded-lg bg-white focus:outline-none focus:border-forest" />
          </div>
        </div>
        <label className="inline-flex items-center gap-2 text-sm pt-2">
          <input data-testid="coupon-active" type="checkbox" checked={form.active}
            onChange={e => setForm({ ...form, active: e.target.checked })} /> Active
        </label>
        <div className="flex gap-2 pt-2">
          <button data-testid="coupon-save" className="btn-primary flex-1">{editing ? "Update" : "Add coupon"}</button>
          {editing && <button type="button" onClick={cancel} className="btn-outline">Cancel</button>}
        </div>
      </form>
      <div className="space-y-3" data-testid="coupon-list">
        {coupons.length === 0 && <div className="text-muted2 text-center py-16">No coupons yet. Create one to run a promo.</div>}
        {coupons.map(c => (
          <div key={c.id} className="card-earth p-5 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[220px]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg text-ink" data-testid={`coupon-row-code-${c.id}`}>{c.code}</span>
                <span className={`chip ${c.active ? "!bg-forest/10 !text-forest" : "!bg-muted2/10 !text-muted2"}`}>{c.active ? "Active" : "Inactive"}</span>
              </div>
              <div className="text-sm text-muted2 mt-1">
                {c.type === "percent" ? `${c.value}% off` : `₹${c.value} off`}
                {c.min_order > 0 && ` · min ₹${c.min_order}`}
                {c.max_uses ? ` · ${c.uses}/${c.max_uses} used` : ` · ${c.uses} used`}
                {c.expires_at && ` · expires ${new Date(c.expires_at).toLocaleDateString()}`}
              </div>
            </div>
            <button data-testid={`coupon-toggle-${c.id}`} onClick={() => onToggleActive(c)}
              className="text-sm rounded-full border border-edge px-3 py-1 hover:bg-cream2">
              {c.active ? "Deactivate" : "Activate"}
            </button>
            <button data-testid={`coupon-edit-${c.id}`} onClick={() => startEdit(c)}
              className="rounded-full border border-edge p-2 hover:bg-cream2"><PencilSimple size={16} /></button>
            <button data-testid={`coupon-delete-${c.id}`} onClick={() => onDelete(c.id)}
              className="rounded-full border border-edge p-2 hover:bg-cream2 text-terracotta"><Trash size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Banners ----------------
const EMPTY_BANNER = { kind: "slider", title: "", subtitle: "", image_url: "", cta_label: "", cta_link: "", active: true, sort_order: 0 };

export function BannersManager({ banners, onSave, onDelete, onToggleActive }) {
  const [form, setForm] = React.useState(EMPTY_BANNER);
  const [editing, setEditing] = React.useState(null);

  const startEdit = (b) => {
    setEditing(b.id);
    setForm({ kind: b.kind, title: b.title, subtitle: b.subtitle, image_url: b.image_url, cta_label: b.cta_label, cta_link: b.cta_link, active: b.active, sort_order: b.sort_order || 0 });
  };
  const cancel = () => { setEditing(null); setForm(EMPTY_BANNER); };

  const submit = (e) => {
    e.preventDefault();
    onSave(editing, { ...form, sort_order: Number(form.sort_order) || 0 }, () => { cancel(); });
  };

  return (
    <div className="grid lg:grid-cols-[420px,1fr] gap-8" data-testid="admin-banners">
      <form onSubmit={submit} className="card-earth p-6 h-fit sticky top-24 space-y-3" data-testid="banner-form">
        <h3 className="font-serif text-2xl text-ink">{editing ? "Edit banner" : "Add banner"}</h3>
        <div>
          <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Placement</label>
          <select data-testid="banner-kind" value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-edge rounded-lg bg-white focus:outline-none focus:border-forest">
            <option value="slider">Top slider (above hero)</option>
            <option value="promo">Promo card (below hero)</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Title</label>
          <input data-testid="banner-title" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-edge rounded-lg bg-white focus:outline-none focus:border-forest" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Subtitle</label>
          <input data-testid="banner-subtitle" value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-edge rounded-lg bg-white focus:outline-none focus:border-forest" />
        </div>
        <MediaUploader
          kind="image"
          label="Banner image"
          value={form.image_url}
          onChange={(url) => setForm({ ...form, image_url: url })}
          testId="upload-banner-image"
          compact
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">CTA label</label>
            <input data-testid="banner-cta-label" value={form.cta_label} onChange={e => setForm({ ...form, cta_label: e.target.value })}
              placeholder="Shop now" className="mt-1 w-full px-3 py-2 border border-edge rounded-lg bg-white focus:outline-none focus:border-forest" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">CTA link</label>
            <input data-testid="banner-cta-link" value={form.cta_link} onChange={e => setForm({ ...form, cta_link: e.target.value })}
              placeholder="/products" className="mt-1 w-full px-3 py-2 border border-edge rounded-lg bg-white focus:outline-none focus:border-forest" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">Sort order</label>
          <input data-testid="banner-sort" type="number" value={form.sort_order}
            onChange={e => setForm({ ...form, sort_order: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-edge rounded-lg bg-white focus:outline-none focus:border-forest" />
        </div>
        <label className="inline-flex items-center gap-2 text-sm pt-2">
          <input data-testid="banner-active" type="checkbox" checked={form.active}
            onChange={e => setForm({ ...form, active: e.target.checked })} /> Active
        </label>
        <div className="flex gap-2 pt-2">
          <button data-testid="banner-save" className="btn-primary flex-1">{editing ? "Update" : "Add banner"}</button>
          {editing && <button type="button" onClick={cancel} className="btn-outline">Cancel</button>}
        </div>
      </form>
      <div className="space-y-3" data-testid="banner-list">
        {banners.length === 0 && <div className="text-muted2 text-center py-16">No banners yet. Create a slider or promo card for your Home page.</div>}
        {banners.map(b => (
          <div key={b.id} className="card-earth p-4 flex flex-wrap items-center gap-4">
            {b.image_url ? (
              <img src={resolveMediaUrl(b.image_url)} alt="" className="w-24 h-16 object-cover rounded-lg" />
            ) : (
              <div className="w-24 h-16 bg-cream2 rounded-lg" />
            )}
            <div className="flex-1 min-w-[220px]">
              <div className="text-[10px] uppercase tracking-widest text-terracotta">{b.kind === "slider" ? "Top slider" : "Promo card"} · order {b.sort_order}</div>
              <div className="font-serif text-xl text-ink" data-testid={`banner-row-title-${b.id}`}>{b.title}</div>
              <div className="text-sm text-muted2">{b.subtitle}</div>
              {b.cta_link && <div className="text-xs text-forest mt-1">{b.cta_label || "CTA"} → {b.cta_link}</div>}
            </div>
            <span className={`chip ${b.active ? "!bg-forest/10 !text-forest" : "!bg-muted2/10 !text-muted2"}`}>{b.active ? "Active" : "Inactive"}</span>
            <button data-testid={`banner-toggle-${b.id}`} onClick={() => onToggleActive(b)}
              className="text-sm rounded-full border border-edge px-3 py-1 hover:bg-cream2">
              {b.active ? "Deactivate" : "Activate"}
            </button>
            <button data-testid={`banner-edit-${b.id}`} onClick={() => startEdit(b)}
              className="rounded-full border border-edge p-2 hover:bg-cream2"><PencilSimple size={16} /></button>
            <button data-testid={`banner-delete-${b.id}`} onClick={() => onDelete(b.id)}
              className="rounded-full border border-edge p-2 hover:bg-cream2 text-terracotta"><Trash size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
