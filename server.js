require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./backend/db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'apna_tohfa_festive_secret_key_2026_diwali_secure';

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Files
app.use(express.static(path.join(__dirname)));

// Admin Auth Middleware (Dual support for Local JWT & Firebase ID Tokens)
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in as Admin.' });
  }

  const token = authHeader.split(' ')[1];

  // 1. Check if token is a Firebase ID Token
  try {
    const decodedFb = jwt.decode(token);
    if (decodedFb && (
      (decodedFb.iss && decodedFb.iss.startsWith('https://securetoken.google.com/')) ||
      decodedFb.aud === 'apna-tohfa-web' ||
      (decodedFb.firebase && decodedFb.firebase.sign_in_provider)
    )) {
      const now = Math.floor(Date.now() / 1000);
      if (decodedFb.exp && decodedFb.exp < now) {
        return res.status(401).json({ success: false, message: 'Firebase session expired. Please log in again.' });
      }
      req.admin = {
        id: decodedFb.user_id || decodedFb.sub || 'admin',
        email: decodedFb.email || 'admin@apnatohfa.in',
        name: decodedFb.name || decodedFb.email || 'Chief Admin',
        role: 'superadmin',
        authProvider: 'firebase'
      };
      return next();
    }
  } catch (fbErr) {
    // Proceed to local token verification
  }

  // 2. Standard Local JWT Token verification
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Session expired or invalid token. Please log in again.' });
  }
}

// -----------------------------------------------------------------------------
// PUBLIC API ROUTES
// -----------------------------------------------------------------------------

// Health Check & Uptime Pings (Prevents Render spin-down)
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    store: 'APNA TOHFA',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Admin Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const admin = db.findAdminByEmail(email);
  if (!admin) {
    return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
  }

  const isMatch = bcrypt.compareSync(password, admin.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
  }

  const token = jwt.sign(
    { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    message: 'Welcome back to Apna Tohfa Admin Desk!',
    token,
    user: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    }
  });
});

// Check Admin Session
app.get('/api/auth/me', requireAdminAuth, (req, res) => {
  res.json({ success: true, user: req.admin });
});

// Firebase Session Exchange
app.post('/api/auth/firebase-session', (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ success: false, message: 'Firebase idToken required' });
  }

  try {
    const decodedFb = jwt.decode(idToken);
    if (!decodedFb || (
      !(decodedFb.iss && decodedFb.iss.startsWith('https://securetoken.google.com/')) &&
      decodedFb.aud !== 'apna-tohfa-web' &&
      !decodedFb.firebase
    )) {
      return res.status(401).json({ success: false, message: 'Invalid Firebase token' });
    }

    const adminUser = {
      id: decodedFb.user_id || decodedFb.sub || 'admin',
      email: decodedFb.email || 'admin@apnatohfa.in',
      name: decodedFb.name || decodedFb.email || 'Chief Admin',
      role: 'superadmin',
      authProvider: 'firebase'
    };

    const serverToken = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token: serverToken,
      user: adminUser
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to verify Firebase session' });
  }
});

// Get Products (with search, category, stock filters)
app.get('/api/products', (req, res) => {
  const { category, search, inStock } = req.query;
  const products = db.getProducts({ category, search, inStock });
  res.json({ success: true, count: products.length, products });
});

// Get Single Product
app.get('/api/products/:id', (req, res) => {
  const product = db.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Hamper not found' });
  }
  res.json({ success: true, product });
});

// Get Categories
app.get('/api/categories', (req, res) => {
  res.json({ success: true, categories: db.data.categories });
});

// Place New Order
app.post('/api/orders', (req, res) => {
  const { customer, items, subtotal, shipping, discount, grandTotal, paymentMethod, couponApplied, giftMessage } = req.body;

  if (!customer || !customer.name || !customer.phone || !customer.address || !customer.city || !customer.pincode) {
    return res.status(400).json({ success: false, message: 'Incomplete delivery address details' });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart items cannot be empty' });
  }

  // Preserve customer's gift message
  if (giftMessage && !customer.giftMessage) {
    customer.giftMessage = giftMessage;
  }

  const newOrder = db.createOrder({
    customer,
    items,
    subtotal,
    shipping,
    discount,
    grandTotal,
    paymentMethod,
    couponApplied
  });

  res.status(201).json({
    success: true,
    message: 'Diwali hamper order successfully placed!',
    order: newOrder
  });
});

// Customer Live Order Tracking
app.get('/api/orders/:id/track', (req, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: `No order found with ID "${req.params.id}". Please check your order number.`
    });
  }

  res.json({
    success: true,
    orderId: order.orderId,
    customerName: order.customer?.name,
    city: order.customer?.city,
    state: order.customer?.state,
    orderStatus: order.orderStatus,
    courier: order.courier,
    estimatedDelivery: order.estimatedDelivery,
    items: order.items,
    grandTotal: order.grandTotal,
    datePlaced: order.datePlaced,
    timeline: order.timeline || []
  });
});

// Validate Coupon
app.post('/api/coupons/validate', (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, message: 'Please provide a promo code' });
  }

  const coupon = db.getCouponByCode(code);
  if (!coupon || !coupon.active) {
    return res.status(404).json({ success: false, message: 'Invalid or expired coupon code' });
  }

  const orderSubtotal = Number(subtotal) || 0;
  if (coupon.minSpend && orderSubtotal < coupon.minSpend) {
    return res.status(400).json({
      success: false,
      message: `Minimum order spend of ₹${coupon.minSpend} required for code "${coupon.code}"`
    });
  }

  let discountAmount = 0;
  if (coupon.discountPercent) {
    discountAmount = Math.round((orderSubtotal * coupon.discountPercent) / 100);
  } else if (coupon.discountFlat) {
    discountAmount = Math.min(coupon.discountFlat, orderSubtotal);
  }

  res.json({
    success: true,
    coupon: {
      code: coupon.code,
      label: coupon.label,
      discountAmount,
      discountPercent: coupon.discountPercent,
      discountFlat: coupon.discountFlat
    }
  });
});

// Corporate Inquiry Submission
app.post('/api/corporate', (req, res) => {
  const { companyName, contactPerson, phone, email, hampersCount, budget, city, message } = req.body;

  if (!contactPerson || !phone || !email) {
    return res.status(400).json({ success: false, message: 'Please provide contact person name, mobile and email' });
  }

  const lead = db.createCorporateLead({
    companyName,
    contactPerson,
    phone,
    email,
    hampersCount,
    budget,
    city,
    message
  });

  res.status(201).json({
    success: true,
    message: 'Corporate gifting inquiry received! Our dedicated desk will revert within 2 hours.',
    leadId: lead.id
  });
});

// Contact Us Message
app.post('/api/contact', (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Please fill name, email and message' });
  }

  const inquiry = db.createContactInquiry({ name, email, phone, message });
  res.status(201).json({
    success: true,
    message: 'Thank you! Your message has reached our festive care team.',
    inquiryId: inquiry.id
  });
});

// Store Settings (Public)
app.get('/api/settings', (req, res) => {
  res.json({ success: true, settings: db.getSettings() });
});

// -----------------------------------------------------------------------------
// ADMIN PROTECTED ROUTES
// -----------------------------------------------------------------------------

// Dashboard Stats & Analytics
app.get('/api/admin/stats', requireAdminAuth, (req, res) => {
  const stats = db.getAdminStats();
  res.json({ success: true, stats });
});

// All Orders
app.get('/api/admin/orders', requireAdminAuth, (req, res) => {
  const { status, search } = req.query;
  const orders = db.getOrders({ status, search });
  res.json({ success: true, count: orders.length, orders });
});

// Single Order
app.get('/api/admin/orders/:id', requireAdminAuth, (req, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  res.json({ success: true, order });
});

// Update Order Status & Courier
app.patch('/api/admin/orders/:id/status', requireAdminAuth, (req, res) => {
  const { status, courier, note } = req.body;
  if (!status) {
    return res.status(400).json({ success: false, message: 'New order status is required' });
  }

  const updatedOrder = db.updateOrderStatus(req.params.id, status, courier, note);
  if (!updatedOrder) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  res.json({
    success: true,
    message: `Order #${updatedOrder.orderId} marked as ${status}!`,
    order: updatedOrder
  });
});

// Add Product
app.post('/api/admin/products', requireAdminAuth, (req, res) => {
  const { name, category, price, shortDescription } = req.body;
  if (!name || !category || !price) {
    return res.status(400).json({ success: false, message: 'Product name, category, and price are required' });
  }

  const newProduct = db.addProduct(req.body);
  res.status(201).json({
    success: true,
    message: `Hamper "${newProduct.name}" added successfully!`,
    product: newProduct
  });
});

// Update Product
app.put('/api/admin/products/:id', requireAdminAuth, (req, res) => {
  const updated = db.updateProduct(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  res.json({
    success: true,
    message: `Hamper "${updated.name}" updated successfully!`,
    product: updated
  });
});

// Toggle Product In Stock / Out of Stock
app.patch('/api/admin/products/:id/stock', requireAdminAuth, (req, res) => {
  const product = db.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const updated = db.updateProduct(req.params.id, { inStock: !product.inStock });
  res.json({
    success: true,
    message: `Product is now ${updated.inStock ? 'In Stock' : 'Out of Stock'}!`,
    product: updated
  });
});

// Delete Product
app.delete('/api/admin/products/:id', requireAdminAuth, (req, res) => {
  const success = db.deleteProduct(req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, message: 'Product not found or already deleted' });
  }
  res.json({ success: true, message: 'Hamper removed from catalog' });
});

// Corporate Leads List
app.get('/api/admin/corporate', requireAdminAuth, (req, res) => {
  const leads = db.getCorporateLeads();
  res.json({ success: true, count: leads.length, leads });
});

// Update Corporate Lead Status
app.patch('/api/admin/corporate/:id/status', requireAdminAuth, (req, res) => {
  const { status } = req.body;
  const lead = db.updateLeadStatus(req.params.id, status);
  if (!lead) {
    return res.status(404).json({ success: false, message: 'Corporate lead not found' });
  }
  res.json({ success: true, message: `Lead updated to "${status}"`, lead });
});

// Contact Inquiries List
app.get('/api/admin/contact', requireAdminAuth, (req, res) => {
  const inquiries = db.getContactInquiries();
  res.json({ success: true, count: inquiries.length, inquiries });
});

// Coupons List
app.get('/api/admin/coupons', requireAdminAuth, (req, res) => {
  const coupons = db.getCoupons();
  res.json({ success: true, count: coupons.length, coupons });
});

// Create Coupon
app.post('/api/admin/coupons', requireAdminAuth, (req, res) => {
  const { code, discountPercent, discountFlat, minSpend, label } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, message: 'Coupon code is required' });
  }

  const newCoupon = db.createCoupon(req.body);
  if (!newCoupon) {
    return res.status(400).json({ success: false, message: `Coupon with code "${code}" already exists` });
  }

  res.status(201).json({
    success: true,
    message: `Coupon "${newCoupon.code}" created!`,
    coupon: newCoupon
  });
});

// Toggle Coupon
app.patch('/api/admin/coupons/:code/toggle', requireAdminAuth, (req, res) => {
  const coupon = db.toggleCoupon(req.params.code);
  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Coupon not found' });
  }
  res.json({
    success: true,
    message: `Coupon "${coupon.code}" is now ${coupon.active ? 'Active' : 'Inactive'}`,
    coupon
  });
});

// Delete Coupon
app.delete('/api/admin/coupons/:code', requireAdminAuth, (req, res) => {
  const deleted = db.deleteCoupon(req.params.code);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Coupon not found' });
  }
  res.json({ success: true, message: `Coupon "${req.params.code}" deleted` });
});

// Update Store Settings
app.put('/api/admin/settings', requireAdminAuth, (req, res) => {
  const updatedSettings = db.updateSettings(req.body);
  res.json({
    success: true,
    message: 'Store configuration updated successfully!',
    settings: updatedSettings
  });
});

// Export Database JSON
app.get('/api/admin/export', requireAdminAuth, (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=apna_tohfa_store_backup.json');
  res.send(JSON.stringify(db.data, null, 2));
});

// Reset Database to Seed
app.post('/api/admin/reset', requireAdminAuth, (req, res) => {
  db.resetData();
  res.json({
    success: true,
    message: 'Store database reset to original Diwali seed data!'
  });
});

// Route /admin to admin.html
app.get('/admin', (req, res) => {
  res.sendFile('admin.html', { root: __dirname });
});

// Root Route
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: __dirname });
});

// Fallback 404
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  res.sendFile('index.html', { root: __dirname });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🪔 APNA TOHFA - Festive E-Commerce Platform Online!`);
  console.log(`🚀 Customer Storefront:  http://localhost:${PORT}`);
  console.log(`👑 Admin Control Portal: http://localhost:${PORT}/admin`);
  console.log(`🔑 Admin Login:          admin@apnatohfa.in / apnaAdmin@2026`);
  console.log(`=======================================================`);
});
