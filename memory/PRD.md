# SATTHAMMA FARMS — Product Requirements Document

## Original Problem Statement
Build a sustainable, uniquely designed e-commerce website for **Satthamma Farms** — an organic farm in Medipally, Telangana selling corn, maize, paddy, pickles, sesame seeds, pulses, cotton, gadka, masalas etc. Tagline: **"prathiokkari intaa, nanyamaina panta"**.

## Current mode: **STATIC WhatsApp store (Feb 2026)**
No customer accounts. Checkout is anonymous and finalises over WhatsApp. Admin retains a hidden dashboard with full control over products, banners, coupons, and every editable piece of copy on the site.

## Architecture
- **Backend**: FastAPI + MongoDB (Motor). Admin-only HttpOnly-cookie JWT auth. Public endpoints: `/api/site`, `/api/products`, `/api/banners`, `/api/coupons/validate`, `/api/orders` (anonymous). Admin endpoints: `/api/admin/*` (products, orders, coupons, banners, site, payments, users).
- **Frontend**: React 19 + React Router 7 + Tailwind + shadcn/ui + Framer Motion + Phosphor icons. Cormorant Garamond + Manrope fonts. Custom CSS 3D hero.
- **Contexts**: `SiteProvider` (fetches `/api/site` once), `CartProvider` (localStorage), `AuthProvider` (admin only).
- **Data model**: products, orders (anonymous), coupons, banners, site (single-doc), users (admin only), files.

## User Personas
- **Customer (unauthenticated)**: browses catalog → adds to cart → checkout form (name/phone/pincode/address/notes + coupon) → order created in DB → WhatsApp opened with prefilled order summary to Satthamma team.
- **Admin (Satthamma team)**: 5 rapid clicks on the logo opens the "Secret unlock" modal → dashboard with tabs: Products, Orders, Coupons, Banners, **Site content**, Payments.

## Delivered

### Phase 1 (2026-02) — MVP
Landing page (CSS-3D hero, Telugu tagline, story strip), catalog + product detail, cart, checkout, admin dashboard, Emergent Object Storage for images/videos, mobile responsive.

### Phase 2 (2026-02) — Round 1
Password toggles, **Admin Coupons module** (percent + flat, min-order, expiry, max uses, active toggle) with checkout coupon flow, **Admin Banners manager** (top slider + promo cards) + dynamic Home page banners.

### Phase 3 (2026-02) — Static site conversion (this session)
- Removed customer Login/Register/MyOrders pages entirely.
- Removed UPI checkout flow.
- **Anonymous checkout**: name, phone, pincode, delivery address, notes; coupon input still works; heads-up notice explains WhatsApp redirect.
- **WhatsApp redirect**: `Order via WhatsApp` button POSTs `/api/orders` then opens `https://wa.me/{whatsapp_number}?text=<summary>` in a new tab. Fallback link on confirmation screen.
- **Secret admin unlock**: 5 rapid clicks (within 2s) on the header logo opens an admin login modal (`AdminLoginModal`) → routes to `/admin`.
- **Site content editor**: new admin tab exposes 14 fields (WhatsApp number, contact phone/email/address, IG/YT URLs, hero badge/title/tagline/paragraph, story title/text, checkout notice). Changes reflect for all visitors instantly (SiteProvider re-fetches).
- Admin order table now shows anonymous customer_name + phone + pincode + WhatsApp quick-link.
- Backend: `/api/site` GET (public), `/api/admin/site` PUT (admin), `/api/orders` anonymous, `/api/orders/mine` removed, `_ALLOWED_STATUSES` includes `confirmed`.
- 29/29 backend pytest tests pass. Full frontend flow verified.

## How to use (for the owner)
- **See the storefront**: visit `/`.
- **Edit anything** (WhatsApp number, hero copy, contact info, banners, coupons, products, prices, images):
  1. Go to `/` (home page).
  2. Click the logo (top-left) 5 times fast.
  3. Enter admin credentials (see `/app/memory/test_credentials.md`).
  4. Pick a tab and edit. Save. Changes are live for every visitor.

## Backlog

### P1
- Pincode-based delivery-charge slabs (admin table + auto-calc at checkout).
- Courier tracking link per order + "Track shipment" link the customer sees over WhatsApp.

### P2
- Full mobile/iPad/desktop responsive audit and polish pass.
- Star-rating reviews with admin moderation.
- PDF invoice generator (admin-triggered) sharable via WhatsApp.
- Refactor `server.py` (~980 LOC) into `routers/*.py` + `services/*.py` for maintainability.
- Migrate FastAPI to `lifespan` handlers.
- Remove dead `/api/orders/{id}/confirm-payment` and `/api/auth/otp/*` endpoints (both unused in the static-site flow).
- Backend hardening: enforce `min_length` on `customer_name`, 6-digit `pincode` regex in `OrderIn` (frontend already validates).

## Test Credentials
- Admin: `admin@satthammafarms.com` / `Admin@123`
- No customer login. Anonymous checkout via WhatsApp.
- SAVE10 coupon (10% off) — kept active for testing.
