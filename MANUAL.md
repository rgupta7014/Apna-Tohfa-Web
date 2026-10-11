# 🪔 APNA TOHFA — Production Operations Manual & Features Guide
> **Brand Tagline:** *"Apno Ke Liye, Dil Se."*  
> **Platform Version:** `1.0.0 (Production Ready)`  
> **Target Occasion:** Diwali 2026 Festive Gifting & Pan-India Corporate Bulk Delivery

---

## 📑 Table of Contents
1. [Platform Overview & Architecture](#1-platform-overview--architecture)
2. [Quick Start & Installation](#2-quick-start--installation)
3. [Admin Panel Access & Credentials](#3-admin-panel-access--credentials)
4. [Complete Features Catalog](#4-complete-features-catalog)
   - [Customer Storefront Features](#customer-storefront-features)
   - [Executive Admin Portal Features](#executive-admin-portal-features)
   - [Backend REST API & Architecture](#backend-rest-api--architecture)
5. [Step-by-Step Operations Manual](#5-step-by-step-operations-manual)
   - [How to Process & Dispatch Customer Orders](#how-to-process--dispatch-customer-orders)
   - [How to Print GST Packing Slips / Invoices](#how-to-print-gst-packing-slips--invoices)
   - [How to Add or Edit Gift Hampers](#how-to-add-or-edit-gift-hampers)
   - [How to Manage Corporate Bulk B2B Inquiries](#how-to-manage-corporate-bulk-b2b-inquiries)
   - [How to Launch Festive Promo Discount Coupons](#how-to-launch-festive-promo-discount-coupons)
   - [How Customers Track Orders Live](#how-customers-track-orders-live)
6. [Production Deployment Guide](#6-production-deployment-guide)
   - [Deploying with PM2 on VPS (Ubuntu/Debian)](#deploying-with-pm2-on-vps)
   - [Nginx Reverse Proxy & SSL Setup](#nginx-reverse-proxy--ssl-setup)
   - [One-Click Cloud Hosting (Render / Railway / Docker)](#one-click-cloud-hosting)
7. [Environment Variables Reference](#7-environment-variables-reference)
8. [REST API Endpoints Specification](#8-rest-api-endpoints-specification)

---

## 1. Platform Overview & Architecture

**APNA TOHFA** is an enterprise-grade, full-stack festive gifting e-commerce platform designed for retail gifting and high-volume corporate B2B orders.

### 🏛️ Technology Stack:
- **Backend:** Node.js v20+ with Express.js REST API framework.
- **Data Persistence:** Self-contained JSON-backed ACID database store (`data/store.json`) with automated seeding and zero native compilation dependencies (runs identically on Windows, Linux, and macOS).
- **Authentication:** JSON Web Tokens (JWT) + Pure JS `bcryptjs` password hashing with salt rounds.
- **Frontend Storefront:** Modern HTML5, Vanilla CSS3 (curated Royal Maroon `#1b0308` & Gold `#d4af37` festive design system), dynamic ES6 JavaScript with offline fallback resilience.
- **Admin Portal:** Dedicated administrative portal (`/admin`) with KPI cards, real-time status management, and automated printable invoices.

---

## 2. Quick Start & Installation

### Prerequisites:
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### Run Locally:
```bash
# 1. Clone or navigate to the project directory
cd apna_pitara

# 2. Install dependencies
npm install

# 3. Start the production server
npm start
```

### Access URLs:
- **🛍️ Customer Storefront:** [http://localhost:3000](http://localhost:3000)
- **👑 Admin Control Portal:** [http://localhost:3000/admin](http://localhost:3000/admin)
- **🩺 Health Check:** [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

## 3. Admin Panel Access & Credentials

The Admin Portal is protected by JWT authentication and can be accessed at:
👉 **URL:** `http://localhost:3000/admin`

| Role | Email Address | Default Password | Access Level |
|---|---|---|---|
| **Super Admin** | `admin@apnatohfa.in` | `apnaAdmin@2026` | Full Access (Orders, Catalog, Leads, Coupons, Settings, Database) |

> 💡 **Quick Tip:** The login screen includes an **"Auto-Fill Credentials ⚡"** button for immediate one-click testing.

---

## 4. Complete Features Catalog

### Customer Storefront Features:
1. **Curated Festive Hamper Tiers:**
   - **Budget Tier (Under ₹500):** E.g., *Shubh Aarambh* (₹299), *Apna Tohfa* (₹499).
   - **Premium Tier:** E.g., *Khushi Special* (₹799) with silver vark kaju katli & peacock diyas.
   - **Luxury Royal Tier:** E.g., *Shahi Tohfa* (₹1,199), *Royal Celebration* (₹1,999) with brass idols & scented candles.
   - **Corporate Gifting Tier:** Custom volume hampers with company branding.
2. **Dynamic Sliding Cart Drawer:**
   - Real-time subtotal, quantity stepping (+ / -), and item notes.
   - **Free Pan-India Delivery Progress Meter:** Visual indicator showing how much more to add to hit the ₹999 free shipping threshold.
3. **Smart Festive Checkout Modal:**
   - Multi-step validation for Indian 10-digit mobile numbers and 6-digit postal PIN codes.
   - Personalized greeting card message input attached directly to the order.
   - Payment method toggle: UPI (Google Pay / PhonePe / Paytm), Credit/Debit Card, Net Banking, Cash on Delivery.
4. **Live Order Tracking Modal:**
   - Customers can enter any Order ID (e.g. `AT-2026-8492` or newly generated orders) to see:
     - 4-Stage visual timeline: *Order Confirmed* ➔ *Hamper Packed* ➔ *Express Dispatch* ➔ *Delivered*.
     - Assigned express courier (BlueDart, Delhivery, DTDC) with AWB tracking numbers.
     - Expected delivery date.
5. **Real-Time Hamper Search:**
   - Live modal searching across hamper titles, dry fruits, sweets, prices, and tags.
6. **Corporate Bulk Inquiry Desk:**
   - Dedicated lead intake form for HR and leadership gifting (Company Name, Volume Range, Budget, Delivery City).
   - Direct automatic WhatsApp redirection pre-filling corporate inquiry details.
7. **Promo Code Engine:**
   - Preloaded with codes like `DIWALI2026` (10% Off), `SHUBH100` (₹100 Off on ₹800+), `CORP20` (20% Off).

---

### Executive Admin Portal Features:
1. **📊 Executive KPI Dashboard:**
   - **Total Festive Revenue (₹):** Live revenue calculator across all confirmed orders.
   - **Total Orders Placed & Status Counters:** Instant breakdown of Pending, Dispatched, and Delivered orders.
   - **Top 5 Bestselling Hampers:** Visual distribution bars indicating high-demand products.
   - **Recent Orders Quick View:** Instant 1-click status actions directly from the dashboard.
2. **📦 Order & Logistics Fulfillment Center:**
   - Status filters: *All*, *Confirmed*, *Packed*, *Shipped*, *Delivered*, *Cancelled*.
   - Live search by Order ID, Customer Name, Mobile Number, or Delivery City.
   - Order detail modal with full customer address, greeting card note, and itemized hamper list.
   - **1-Click Dispatch Status Updater:** Transition orders between statuses and attach courier name & tracking AWB.
   - **🖨️ Print Packing Slip & Tax Invoice:** Automatically formats and triggers a clean, professional, GST-compliant printable invoice slip.
3. **🪔 Hamper Catalog Manager:**
   - Add new hampers with custom pricing, original MRP, discount badge, image, in-box contents, and tags.
   - Edit any existing hamper details inline.
   - **Instant In-Stock / Sold-Out Toggle:** One click updates customer availability in real time.
   - Delete hampers with safety confirmation.
4. **🏢 B2B Corporate Leads Manager:**
   - Central lead inbox capturing company inquiries.
   - Lead workflow status: *New*, *In Discussion*, *Proposal Sent*, *Won / Closed*, *Declined*.
   - **Quick Action Buttons:**
     - 💬 **WA (WhatsApp):** Opens WhatsApp chat with customer pre-filling their company name and requirements.
     - ✉️ **Mail:** Opens email client with pre-drafted subject and quote template.
5. **🎟️ Coupons & Offers Engine:**
   - Create new promo codes with percentage discounts or flat rupee cuts.
   - Set minimum order values (e.g., ₹800, ₹2,500).
   - Track usage counters for each coupon.
   - Instant activate / deactivate toggle switch.
6. **⚙️ Store Settings & Backups:**
   - Update top announcement bar text, active coupon pill, helpline phone, and corporate email.
   - **Database Backup:** Export entire store database as clean `apna_tohfa_store_backup.json` in 1 click.
   - **Database Reset:** Safe reset back to initial Diwali seed data.

---

## 5. Step-by-Step Operations Manual

### How to Process & Dispatch Customer Orders:
1. Log into `/admin` using your admin credentials.
2. Click **Orders** in the left sidebar.
3. Locate the order marked with the blue **CONFIRMED** badge.
4. Click **Manage 📦** to open the order modal.
5. In the Fulfillment panel:
   - Change Status from `Confirmed` to `Packed` once the physical hamper box is wrapped.
   - When the courier partner picks up the parcel, change Status to `Shipped`.
   - Enter the Courier Partner (e.g. `BlueDart Express`) and the AWB tracking number (e.g. `BD-DEL-984321`).
6. Click **Save Status & Tracking 🚀**. The customer can immediately track this status live on the storefront!

---

### How to Print GST Packing Slips / Invoices:
1. Open the order in the **Orders** tab.
2. Click **🖨️ Print Packing Slip / GST Invoice**.
3. A formatted tax invoice appears with the Apna Tohfa festive letterhead, recipient address, itemized box list, payment status, and authorized signatory.
4. Select your printer or choose "Save as PDF".

---

### How to Add or Edit Gift Hampers:
1. Click **Hamper Catalog** in the left sidebar.
2. Click **+ Add New Hamper** (or click **✏️ Edit** on an existing card).
3. Fill in:
   - Hamper Name (e.g., `Shubh Deepavali Box`)
   - Category (`Budget`, `Premium`, `Luxury`, or `Corporate`)
   - Selling Price and Original MRP
   - Image Path (use built-in presets or upload to `/assets/images/`)
   - Short Description & Full Description
4. Click **Save Hamper ✨**. It will immediately appear on the customer storefront.

---

### How to Manage Corporate Bulk B2B Inquiries:
1. Click **Corporate Leads** in the left sidebar.
2. Review incoming inquiries containing Company Name, Contact Person, Number of Hampers, and Budget.
3. Click **💬 WA** to launch an instant WhatsApp dialogue with the decision-maker.
4. Update the status dropdown from `New` to `Proposal Sent` and subsequently `Won / Closed`.

---

### How to Launch Festive Promo Discount Coupons:
1. Click **Coupons & Offers** in the left sidebar.
2. Click **+ Create New Coupon**.
3. Enter the Code (e.g. `DIWALI15`), discount percentage (e.g. `15%`), and minimum spend (e.g. `₹1,000`).
4. Click **Create Coupon 🎉**. Customers can now apply this coupon during checkout.

---

### How Customers Track Orders Live:
1. On the customer storefront (`/`), click **📦 Track Order** in the top announcement bar or footer.
2. Enter their Order ID (e.g. `AT-2026-8492` or their unique order ID from checkout).
3. Click **Track 🔍**.
4. The system displays their live 4-stage delivery timeline, courier partner, AWB number, and expected delivery date.

---

## 6. Production Deployment Guide

### Deploying with PM2 on VPS (Ubuntu / Debian):
```bash
# 1. Install Node.js 20 & PM2 globally
sudo apt update && sudo apt install -y nodejs npm
sudo npm install -g pm2

# 2. Upload/Clone project to /var/www/apna_pitara
cd /var/www/apna_pitara

# 3. Install production dependencies
npm install --omit=dev

# 4. Start process with PM2
pm2 start server.js --name "apna-tohfa"

# 5. Save PM2 startup list to restart on server reboot
pm2 save
pm2 startup
```

---

### Nginx Reverse Proxy & SSL Setup:
Create an Nginx configuration file: `/etc/nginx/sites-available/apnatohfa.in`:
```nginx
server {
    server_name apnatohfa.in www.apnatohfa.in;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
Enable site and obtain free SSL via Certbot:
```bash
sudo ln -s /etc/nginx/sites-available/apnatohfa.in /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d apnatohfa.in -d www.apnatohfa.in
```

---

### One-Click Cloud Hosting (Render / Railway / Docker):
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment Variables:** Set `PORT=3000`, `NODE_ENV=production`, `JWT_SECRET=your_secure_random_string`.

---

## 7. Environment Variables Reference

| Variable | Default Value | Description |
|---|---|---|
| `PORT` | `3000` | Port for Express web server |
| `NODE_ENV` | `production` | Node execution environment |
| `JWT_SECRET` | `apna_tohfa_festive_secret_key_...` | Secret key used to sign Admin JWT tokens |
| `ADMIN_EMAIL` | `admin@apnatohfa.in` | Default admin email |
| `ADMIN_DEFAULT_PASSWORD` | `apnaAdmin@2026` | Default admin password |
| `STORE_NAME` | `APNA TOHFA` | Brand store name |
| `STORE_CURRENCY` | `INR` | Store currency code |

---

## 8. REST API Endpoints Specification

### Public API Endpoints:
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check & server status |
| `GET` | `/api/products` | Retrieve hamper catalog (supports `?category=`, `?search=`) |
| `GET` | `/api/products/:id` | Retrieve single hamper details |
| `GET` | `/api/categories` | Retrieve hamper categories |
| `POST` | `/api/orders` | Place a retail hamper order |
| `GET` | `/api/orders/:id/track` | Customer order tracking by ID |
| `POST` | `/api/coupons/validate` | Validate coupon code & calculate discount |
| `POST` | `/api/corporate` | Submit B2B corporate bulk inquiry |
| `POST` | `/api/contact` | Submit customer support contact message |
| `GET` | `/api/settings` | Retrieve public store configuration |
| `POST` | `/api/auth/login` | Admin login (returns JWT token) |

### Protected Admin Endpoints (Require `Bearer <token>`):
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/me` | Validate admin session |
| `GET` | `/api/admin/stats` | Executive KPI statistics & top sellers |
| `GET` | `/api/admin/orders` | List all orders with status & search filters |
| `GET` | `/api/admin/orders/:id` | Full order details |
| `PATCH` | `/api/admin/orders/:id/status` | Update order status and courier info |
| `POST` | `/api/admin/products` | Create new hamper in catalog |
| `PUT` | `/api/admin/products/:id` | Update hamper details |
| `PATCH` | `/api/admin/products/:id/stock` | Toggle In-Stock / Out-of-Stock |
| `DELETE` | `/api/admin/products/:id` | Delete hamper |
| `GET` | `/api/admin/corporate` | List corporate B2B leads |
| `PATCH` | `/api/admin/corporate/:id/status`| Update lead status |
| `GET` | `/api/admin/coupons` | List all promo coupons |
| `POST` | `/api/admin/coupons` | Create new promo coupon |
| `PATCH` | `/api/admin/coupons/:code/toggle` | Toggle coupon active/inactive |
| `DELETE` | `/api/admin/coupons/:code` | Delete coupon |
| `PUT` | `/api/admin/settings` | Update store announcements & helpline |
| `GET` | `/api/admin/export` | Download full JSON database backup |
| `POST` | `/api/admin/reset` | Reset store to initial seed data |

---

*Dhanyawad! Designed & Crafted for Apna Tohfa — Apno Ke Liye, Dil Se.* 🪔✨
