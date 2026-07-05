# SATTHAMMA FARMS — Product Requirements Document

## Original Problem Statement
Build a sustainable, uniquely designed e-commerce website for **Satthamma Farms** — an organic farm in Medipally, Telangana selling corn, maize, paddy, pickles, sesame seeds, pulses, cotton, gadka, masalas etc. Tagline: **"prathiokkari intaa, nanyamaina panta"**. Requirements: 3D design, admin panel with photo/video uploads, customer storefront with search & cart, email + contact OTP auth, automated email/SMS system, payment gateway, PDF invoice generator, customer reviews, elegant custom logo, contact & social links.

## Architecture
- **Backend**: FastAPI + MongoDB (Motor). HttpOnly-cookie JWT auth. Admin role guard. Product/Order/Coupon/Banner CRUD. Emergent Object Storage for images/videos. SendGrid emails (mock mode if no key). Admin auto-seeded on startup.
- **Frontend**: React 19 + React Router 7 + Tailwind + shadcn/ui + Framer Motion + Phosphor icons. Cormorant Garamond + Manrope fonts. Custom CSS 3D hero (React-19 safe).
- **Data model**: users, products, orders, coupons, banners, otp_codes, files, settings (all Mongo collections).

## User Personas
- **Customer**: browses catalog, adds to cart, applies coupon, checks out with UPI (QR/deep-link), tracks orders.
- **Admin (Satthamma team)**: manages products, orders (status flow), users, coupons, banners, payment settings.

## Phase 1 — DELIVERED (2026-02)
- Landing page with CSS-3D orb hero, Telugu tagline, story strip, category tiles, featured products, IG/YT CTAs.
- Custom SVG logo (S monogram + terracotta leaf).
- 12 seeded products across grains, pulses, pickles, spices, seeds, cotton.
- Catalog with search, category filters, product-detail page (image + optional video + gallery + qty).
- Cart (localStorage), Checkout with delivery form + UPI payment (QR + apps + UTR entry).
- Auth: HttpOnly-cookie JWT register/login, admin auto-routes to `/admin`.
- Admin dashboard: stats, Products CRUD, Orders w/ status, Users, Payment settings.
- Fully mobile responsive.
- Phone OTP login (mock mode via server console).
- Emergent Object Storage for image + video uploads.
- SendGrid emails for welcome + order confirmation + status transitions (mock mode).

## Phase 2 — DELIVERED (2026-02, Round 1)
- **Password show/hide toggle** on Login and Register with eye icon (`login-password-toggle`, `register-password-toggle`).
- **Admin Coupons module**: percent + flat off, min-order, expiry date, max uses, active toggle. Backend endpoints: `/api/admin/coupons` CRUD, `/api/coupons/validate` public, usage tracked (`uses` field).
- **Checkout coupon input**: apply/remove chip, red-error state, discount line in summary, reduced total. Order stores applied coupon and increments coupon usage.
- **Admin Banners & Offers manager**: slider banners (top of Home) + promo cards (below hero). Active toggle, sort order, CTA label/link, image upload.
- **Home page dynamic banners**: BannerSlider (auto-rotate every 6s with prev/next/dots) + PromoCards grid.

## Backlog

### P1 — Round 2 (Delivery upgrades)
- Pincode-first field on Checkout with admin-managed pincode → delivery-charge slab table.
- Courier tracking link field on each order; customer sees "Track shipment" in My Orders.

### P1 — Round 3 (Editable Home + WhatsApp)
- All Home sections editable from Admin (hero copy, categories, story strip).
- WhatsApp Business link integration for order status updates.

### P2 — Round 4 (Polish)
- Full mobile/iPad/desktop responsive audit and bug pass.

### P2 — Backlog
- Customer reviews (star rating + comment) with admin moderation.
- PDF invoice attached to order confirmation email.
- Auto Razorpay checkout when admin pastes real keys.
- Refactor `server.py` into feature routers (`routers/coupons.py`, `routers/banners.py`, `services/email.py`, `services/storage.py`).
- Migrate to FastAPI lifespan handlers (replace `@app.on_event`).
- Harden coupon expiry parsing (normalize to UTC; do not silently swallow parse errors).
- Reject order creation when all product IDs are invalid (currently silently creates an empty order).

## Test Credentials
- Admin: `admin@satthammafarms.com` / `Admin@123`
- Customer: create via `/register`
- SAVE10 coupon (10% off, active) seeded by testing agent — safe to keep.
