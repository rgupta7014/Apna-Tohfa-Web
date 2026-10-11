# 🪔 APNA TOHFA — Premium Diwali & Corporate Gifting Platform

> *"Apno Ke Liye, Dil Se."*  
> Complete Production Full-Stack Application with Customer Storefront, Node.js REST API Backend, Executive Admin Portal, Order Fulfillment & Logistics Tracking.

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the production server
npm start
```

Open your browser:
- 🛍️ **Customer Storefront:** [http://localhost:3000](http://localhost:3000)
- 👑 **Admin Portal:** [http://localhost:3000/admin](http://localhost:3000/admin)
- 📖 **Full Operations Manual:** [`MANUAL.md`](./MANUAL.md)

---

## 🔐 Admin Login Credentials

- **Email:** `admin@apnatohfa.in`
- **Password:** `apnaAdmin@2026`
- **Auto-Fill:** An instant 1-click auto-fill button is available on the login screen.

---

## 🌟 Key Features

1. **🛍️ Customer Storefront:**
   - Multi-tier gift hampers (Budget under ₹500, Premium, Luxury, Corporate).
   - Dynamic sliding cart drawer with free Pan-India delivery threshold meter (₹999).
   - Checkout with Indian 10-digit mobile and 6-digit PIN code validation.
   - Live Order Tracking Modal with real-time dispatch progress.
   - Live Hamper Search & Category filters.
   - Corporate bulk inquiry submission with instant WhatsApp redirection.
   - Festive discount coupon redemption (`DIWALI2026`, `SHUBH100`, `CORP20`).

2. **👑 Executive Admin Portal (`/admin`):**
   - **Executive Dashboard:** Live revenue stats, pending orders counter, corporate leads counter, top 5 selling hampers visualizer.
   - **Order Fulfillment Desk:** Filter orders (All, Confirmed, Packed, Shipped, Delivered, Cancelled), manage courier allocation (BlueDart, Delhivery, DTDC), enter AWB numbers.
   - **🖨️ 1-Click Invoice & Packing Slip Printer:** Generates and prints clean GST-compliant dispatch slips.
   - **Hamper Catalog CRUD:** Add new hampers, edit prices, toggle In-Stock / Sold-Out, delete hampers.
   - **B2B Corporate Leads Manager:** View inquiries, update statuses, direct 1-click WhatsApp & Email buttons.
   - **Coupons Engine:** Add, toggle, and delete promo codes.
   - **Settings & Backups:** Live announcement bar editor, 1-click JSON database export and restore.

3. **⚙️ Robust Backend (`server.js` & `backend/db.js`):**
   - Express REST API with security headers, CORS, and JWT authentication.
   - Self-contained file-based persistent database (`data/store.json`) with auto-seeding.
   - Zero external database daemon needed; runs instantly across Windows, Linux, and macOS.

---

For complete step-by-step instructions and production deployment guidelines, refer to [**MANUAL.md**](./MANUAL.md).
