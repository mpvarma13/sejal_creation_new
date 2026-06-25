# Sejal Creation — PRD

## Original Problem Statement
Production-ready e-commerce site for Artificial (Imitation) Jewellery + Bridal Jewellery Rental Services. Premium royal theme (ivory + gold + maroon). WhatsApp ordering (+91 7262080228, email sejalcreation@gmail.com), QR + manual payment verification, COD only for PIN 443101, admin panel, 14 categories, customer accounts, rental booking with security deposit.

## Architecture
- **Backend**: FastAPI + Motor (async MongoDB). All routes under `/api`. JWT (Bearer) auth. Emergent Google OAuth via `/api/auth/google-session`. Auto-seeds admin + 17 demo products + homepage content on startup.
- **Frontend**: React 19 + React Router + Tailwind + shadcn components + Recharts. Cart & wishlist in localStorage. JWT token in `localStorage.sc_token`. Sonner toasts.
- **DB**: `sejal_creation` Mongo DB. Collections: `users`, `products`, `orders` (purchases + rentals via `type` field), `reviews`, `wishlists`, `coupons`, `content`.

## User Personas
- **Customer**: browses jewellery, adds to cart, checkouts (QR proof upload or COD if PIN=443101), rents bridal sets, orders via WhatsApp one-click.
- **Admin**: manages products (CRUD), verifies payments, updates order status, views dashboard KPIs + charts, manages rentals & customers.

## Static Core Requirements
- 14 categories with filtering, sort by price/newest/rating, search.
- Product detail with image gallery + hover zoom + WhatsApp order link with auto-filled message.
- Cart, checkout with PIN-code-based COD logic (443101 only).
- QR payment + base64 screenshot upload.
- Order tracking timeline (8 statuses).
- Rental booking with start/end dates + refundable security deposit + WhatsApp book button.
- Admin: sidebar nav, dashboard with KPIs + 7-day sales chart + best-selling chart + low-stock alerts; product CRUD; order status updates; rental management; customers list.
- Sticky WhatsApp floating button + mobile bottom-nav.
- 7 policy pages (About / Privacy / Terms / Shipping / Refund / Rental / FAQ).

## What's Implemented (Feb 26, 2026)
✅ JWT email/password auth (register/login/admin-login/me) + Emergent Google OAuth (`/auth/google-session` + `/AuthCallback`).
✅ Admin seeded (sejal2402 / Adishakti) + 17 demo products across all categories.
✅ Full storefront (Home, Shop, Product Detail, Rental, Cart, Checkout, Order Track, Wishlist, Account, Contact, Policies).
✅ Admin panel (Dashboard with Recharts, Products CRUD, Orders + Rentals with status timeline, Customers).
✅ WhatsApp ordering button on every product card + detail page with pre-filled message.
✅ COD validation backend + frontend (PIN 443101 only).
✅ QR payment + screenshot upload + manual verification flow.
✅ Mobile bottom nav + floating WhatsApp button.
✅ Royal palette (ivory/gold/maroon) with Cinzel + Italiana + Outfit fonts.

## Backlog (P1/P2)
- P1: Replace placeholder QR with real UPI QR via admin → Content management page.
- P1: Forgot-password flow (currently stubbed).
- P2: Coupon code admin UI (backend supports it).
- P2: Recently viewed products.
- P2: Email/SMS notifications on order status changes.
- P2: Bulk product CSV import.
- P2: Hindi/Marathi translation toggle.
