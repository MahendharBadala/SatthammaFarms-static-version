# SATTHAMMA FARMS — Product Requirements Document

## Original Problem Statement
Build a sustainable, uniquely designed e-commerce website for **Satthamma Farms** — an organic farm in Medipally, Telangana selling corn, maize, paddy, pickles, sesame seeds, pulses, cotton, gadka, masalas etc. Tagline: **"prathiokkari intaa, nanyamaina panta"**. Requirements: 3D design, admin panel with photo/video uploads, customer storefront with search & cart, email + contact OTP auth, automated email/SMS system, payment gateway, PDF invoice generator, customer reviews, elegant custom logo, contact & social links.

## Architecture
- **Backend**: FastAPI + MongoDB + Motor. JWT (Bearer) auth. Admin role guard. Product/Order CRUD. Admin seeded on startup.
- **Frontend**: React 19 + React Router 7 + Tailwind + shadcn/ui + Framer Motion + Phosphor icons. Cormorant Garamond + Manrope fonts. Custom CSS 3D hero (React-19 safe).
- **Data model**: users, products, orders (all Mongo collections).

## User Personas
- **Customer**: browses catalog, adds to cart, checks out with address/phone.
- **Admin (Satthamma team)**: manages products (add/edit/delete with image+video URLs), views all orders and customers.

## Phase 1 — DELIVERED (2026-02)
- Stunning earthy-organic landing page with animated 3D orb hero, Telugu tagline, farmer story strip, category bento grid, featured products, Instagram/YouTube CTAs.
- Custom SVG logo (S monogram with terracotta leaf motifs).
- 12 seeded products across grains, pulses, pickles, spices, seeds, cotton.
- Product catalog with search, category filters, product-detail page (image + optional video + quantity picker + add-to-cart).
- Shopping cart (localStorage persistent), checkout that creates an order document (WhatsApp confirmation flow — no online payment yet).
- Auth: JWT register/login, admin credentials `admin@satthammafarms.com / Admin@123` auto-route to `/admin`, customer creds route to storefront.
- Admin dashboard: stats, product CRUD form, orders viewer, users table.
- Fully mobile responsive.

## Phase 2 — BACKLOG
- **P0** — Stripe or Razorpay payment gateway on checkout.
- **P0** — Email & SMS OTP via Resend + Twilio (login/register + order confirmation).
- **P1** — PDF invoice generator (attach to email post-payment).
- **P1** — Customer reviews on product detail (star rating + comment, admin moderation).
- **P1** — File/video upload directly from admin (currently URL-based) via object storage.
- **P2** — Order status management (pending → packed → shipped → delivered), tracking notifications.
- **P2** — Coupons/discounts, hero video reels from Instagram/YouTube.

## Next Tasks
1. Integrate Resend + Twilio for OTP + order confirmations (integration_playbook_expert_v2).
2. Add object storage playbook so admin can upload product photos/videos directly.
3. Wire Stripe checkout (test-mode → live via claim).
4. Build PDF invoice generation.
5. Add reviews UI + moderation.
