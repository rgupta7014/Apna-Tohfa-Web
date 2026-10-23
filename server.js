require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./backend/db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'apna_tohfa_festive_secret_key_2026_diwali_secure';

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Never cache API responses in browsers so Admin changes appear immediately on storefront
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

// Static Files (Serve original storefront assets at root, React on /react if built)
const reactDistPath = path.join(__dirname, 'frontend', 'dist');
if (fs.existsSync(reactDistPath)) {
  app.use('/react', express.static(reactDistPath));
}
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

  // 2. Offline / Local Dev token support
  if (token && token.startsWith('offline-admin-token-')) {
    req.admin = {
      id: 'admin-01',
      email: 'admin@apnatohfa.in',
      name: 'Chief Store Manager',
      role: 'superadmin',
      authProvider: 'offline-local'
    };
    return next();
  }

  // 3. Standard Local JWT Token verification
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
    version: '1.1.0',
    database: db.isMongo ? 'MongoDB Atlas (Cloud)' : 'Local JSON Storage',
    connectionStatus: db.connectionStatus,
    timestamp: new Date().toISOString()
  });
});

// Admin Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const admin = await db.findAdminByEmail(email);
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
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
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
app.get('/api/products', async (req, res) => {
  try {
    const { category, search, inStock } = req.query;
    const products = await db.getProducts({ category, search, inStock });
    res.json({ success: true, count: products.length, products });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch hampers' });
  }
});

// Get Single Product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Hamper not found' });
    }
    res.json({ success: true, product });
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch hamper details' });
  }
});

// Get Categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await db.getCategories();
    res.json({ success: true, categories });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

// Get Official Catalogs & Lookbook Posters
app.get('/api/catalogs', async (req, res) => {
  try {
    const catalogs = await db.getCatalogs();
    res.json({ success: true, catalogs });
  } catch (err) {
    console.error('Error fetching catalogs:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch catalogs' });
  }
});

// Get Customizable Jars and Baskets Items (Public)
app.get('/api/custom-items', async (req, res) => {
  try {
    const { type } = req.query;
    const items = await db.getCustomItems({ type });
    res.json({ success: true, count: items.length, items });
  } catch (err) {
    console.error('Error fetching custom items:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch customizable items' });
  }
});

// Place New Order
app.post('/api/orders', async (req, res) => {
  try {
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

    const newOrder = await db.createOrder({
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
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ success: false, message: 'Failed to process order' });
  }
});

// Customer Live Order Tracking
app.get('/api/orders/:id/track', async (req, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
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
  } catch (err) {
    console.error('Error tracking order:', err);
    res.status(500).json({ success: false, message: 'Failed to track order' });
  }
});

// Validate Coupon
app.post('/api/coupons/validate', async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Please provide a promo code' });
    }

    const coupon = await db.getCouponByCode(code);
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
  } catch (err) {
    console.error('Error validating coupon:', err);
    res.status(500).json({ success: false, message: 'Failed to validate coupon' });
  }
});

// Corporate Inquiry Submission
app.post('/api/corporate', async (req, res) => {
  try {
    const { companyName, contactPerson, phone, email, hampersCount, budget, city, message } = req.body;

    if (!contactPerson || !phone || !email) {
      return res.status(400).json({ success: false, message: 'Please provide contact person name, mobile and email' });
    }

    const lead = await db.createCorporateLead({
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
  } catch (err) {
    console.error('Error submitting corporate lead:', err);
    res.status(500).json({ success: false, message: 'Failed to submit corporate inquiry' });
  }
});

// Contact Us Message
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Please fill name, email and message' });
    }

    const inquiry = await db.createContactInquiry({ name, email, phone, message });
    res.status(201).json({
      success: true,
      message: 'Thank you! Your message has reached our festive care team.',
      inquiryId: inquiry.id
    });
  } catch (err) {
    console.error('Error submitting contact form:', err);
    res.status(500).json({ success: false, message: 'Failed to submit contact message' });
  }
});

// Store Settings (Public)
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await db.getSettings();
    res.json({ success: true, settings });
  } catch (err) {
    console.error('Error getting settings:', err);
    res.status(500).json({ success: false, message: 'Failed to load settings' });
  }
});

// -----------------------------------------------------------------------------
// ADMIN PROTECTED ROUTES
// -----------------------------------------------------------------------------

// Dashboard Stats & Analytics
app.get('/api/admin/stats', requireAdminAuth, async (req, res) => {
  try {
    const stats = await db.getAdminStats();
    res.json({ success: true, stats });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard statistics' });
  }
});

// All Orders
app.get('/api/admin/orders', requireAdminAuth, async (req, res) => {
  try {
    const { status, search } = req.query;
    const orders = await db.getOrders({ status, search });
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    console.error('Error fetching admin orders:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

// Single Order
app.get('/api/admin/orders/:id', requireAdminAuth, async (req, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch order details' });
  }
});

// Update Order Status & Courier
app.patch('/api/admin/orders/:id/status', requireAdminAuth, async (req, res) => {
  try {
    const { status, courier, note } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'New order status is required' });
    }

    const updatedOrder = await db.updateOrderStatus(req.params.id, status, courier, note);
    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({
      success: true,
      message: `Order #${updatedOrder.orderId} marked as ${status}!`,
      order: updatedOrder
    });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
});

// Add Product
app.post('/api/admin/products', requireAdminAuth, async (req, res) => {
  try {
    const { name, category } = req.body;
    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Product name and category are required' });
    }

    if (req.body.price === undefined || req.body.price === null || req.body.price === '' || isNaN(Number(req.body.price))) {
      req.body.price = 0;
      req.body.hidePrice = true;
    }

    const newProduct = await db.addProduct(req.body);
    res.status(201).json({
      success: true,
      message: `Hamper "${newProduct.name}" added successfully!`,
      product: newProduct
    });
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({ success: false, message: 'Failed to add product' });
  }
});

// Update Product
app.put('/api/admin/products/:id', requireAdminAuth, async (req, res) => {
  try {
    const updated = await db.updateProduct(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({
      success: true,
      message: `Hamper "${updated.name}" updated successfully!`,
      product: updated
    });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
});

// Toggle Product In Stock / Out of Stock
app.patch('/api/admin/products/:id/stock', requireAdminAuth, async (req, res) => {
  try {
    const product = await db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const updated = await db.updateProduct(req.params.id, { inStock: !product.inStock });
    res.json({
      success: true,
      message: `Product is now ${updated.inStock ? 'In Stock' : 'Out of Stock'}!`,
      product: updated
    });
  } catch (err) {
    console.error('Error toggling product stock:', err);
    res.status(500).json({ success: false, message: 'Failed to change stock status' });
  }
});

// Delete Product
app.delete('/api/admin/products/:id', requireAdminAuth, async (req, res) => {
  try {
    const success = await db.deleteProduct(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Product not found or already deleted' });
    }
    res.json({ success: true, message: 'Hamper removed from catalog' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
});

// --- Customizable Jars & Baskets Items Admin Endpoints ---

// Add Custom Item (Jar or Basket)
app.post('/api/admin/custom-items', requireAdminAuth, async (req, res) => {
  try {
    const { name, type } = req.body;
    if (!name || !type) {
      return res.status(400).json({ success: false, message: 'Item name and type (jar/basket) are required' });
    }
    const item = await db.addCustomItem(req.body);
    res.status(201).json({
      success: true,
      message: `${item.type === 'basket' ? 'Basket style' : 'Jar item'} "${item.name}" added successfully!`,
      item
    });
  } catch (err) {
    console.error('Error adding custom item:', err);
    res.status(500).json({ success: false, message: 'Failed to add customizable item' });
  }
});

// Update Custom Item
app.put('/api/admin/custom-items/:id', requireAdminAuth, async (req, res) => {
  try {
    const updated = await db.updateCustomItem(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.json({
      success: true,
      message: `Item "${updated.name}" updated successfully!`,
      item: updated
    });
  } catch (err) {
    console.error('Error updating custom item:', err);
    res.status(500).json({ success: false, message: 'Failed to update customizable item' });
  }
});

// Delete Custom Item
app.delete('/api/admin/custom-items/:id', requireAdminAuth, async (req, res) => {
  try {
    const success = await db.deleteCustomItem(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Item not found or already deleted' });
    }
    res.json({ success: true, message: 'Item removed from customizable inventory' });
  } catch (err) {
    console.error('Error deleting custom item:', err);
    res.status(500).json({ success: false, message: 'Failed to delete customizable item' });
  }
});

// Corporate Leads List
app.get('/api/admin/corporate', requireAdminAuth, async (req, res) => {
  try {
    const leads = await db.getCorporateLeads();
    res.json({ success: true, count: leads.length, leads });
  } catch (err) {
    console.error('Error fetching corporate leads:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch corporate leads' });
  }
});

// Update Corporate Lead Status
app.patch('/api/admin/corporate/:id/status', requireAdminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const lead = await db.updateLeadStatus(req.params.id, status);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Corporate lead not found' });
    }
    res.json({ success: true, message: `Lead updated to "${status}"`, lead });
  } catch (err) {
    console.error('Error updating corporate lead status:', err);
    res.status(500).json({ success: false, message: 'Failed to update lead status' });
  }
});

// Contact Inquiries List
app.get('/api/admin/contact', requireAdminAuth, async (req, res) => {
  try {
    const inquiries = await db.getContactInquiries();
    res.json({ success: true, count: inquiries.length, inquiries });
  } catch (err) {
    console.error('Error fetching contact inquiries:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch inquiries' });
  }
});

// Coupons List
app.get('/api/admin/coupons', requireAdminAuth, async (req, res) => {
  try {
    const coupons = await db.getCoupons();
    res.json({ success: true, count: coupons.length, coupons });
  } catch (err) {
    console.error('Error fetching coupons:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch coupons' });
  }
});

// Create Coupon
app.post('/api/admin/coupons', requireAdminAuth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const newCoupon = await db.createCoupon(req.body);
    if (!newCoupon) {
      return res.status(400).json({ success: false, message: `Coupon with code "${code}" already exists` });
    }

    res.status(201).json({
      success: true,
      message: `Coupon "${newCoupon.code}" created!`,
      coupon: newCoupon
    });
  } catch (err) {
    console.error('Error creating coupon:', err);
    res.status(500).json({ success: false, message: 'Failed to create coupon' });
  }
});

// Toggle Coupon
app.patch('/api/admin/coupons/:code/toggle', requireAdminAuth, async (req, res) => {
  try {
    const coupon = await db.toggleCoupon(req.params.code);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.json({
      success: true,
      message: `Coupon "${coupon.code}" is now ${coupon.active ? 'Active' : 'Inactive'}`,
      coupon
    });
  } catch (err) {
    console.error('Error toggling coupon:', err);
    res.status(500).json({ success: false, message: 'Failed to toggle coupon' });
  }
});

// Delete Coupon
app.delete('/api/admin/coupons/:code', requireAdminAuth, async (req, res) => {
  try {
    const deleted = await db.deleteCoupon(req.params.code);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.json({ success: true, message: `Coupon "${req.params.code}" deleted` });
  } catch (err) {
    console.error('Error deleting coupon:', err);
    res.status(500).json({ success: false, message: 'Failed to delete coupon' });
  }
});

// -----------------------------------------------------------------------------
// ADMIN CATALOG POSTER ROUTES
// -----------------------------------------------------------------------------

// Add Catalog Poster
app.post('/api/admin/catalogs', requireAdminAuth, async (req, res) => {
  try {
    const { title, posterImage } = req.body;
    if (!title || !posterImage) {
      return res.status(400).json({ success: false, message: 'Catalog title and poster image are required' });
    }

    const newCatalog = await db.addCatalog(req.body);
    res.status(201).json({
      success: true,
      message: `Catalog poster "${newCatalog.title}" added successfully!`,
      catalog: newCatalog
    });
  } catch (err) {
    console.error('Error adding catalog poster:', err);
    res.status(500).json({ success: false, message: 'Failed to add catalog poster' });
  }
});

// Update Catalog Poster
app.put('/api/admin/catalogs/:id', requireAdminAuth, async (req, res) => {
  try {
    const updated = await db.updateCatalog(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Catalog poster not found' });
    }
    res.json({
      success: true,
      message: `Catalog poster "${updated.title}" updated successfully!`,
      catalog: updated
    });
  } catch (err) {
    console.error('Error updating catalog poster:', err);
    res.status(500).json({ success: false, message: 'Failed to update catalog poster' });
  }
});

// Delete Catalog Poster
app.delete('/api/admin/catalogs/:id', requireAdminAuth, async (req, res) => {
  try {
    const deleted = await db.deleteCatalog(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Catalog poster not found or already deleted' });
    }
    res.json({ success: true, message: 'Catalog poster removed successfully' });
  } catch (err) {
    console.error('Error deleting catalog poster:', err);
    res.status(500).json({ success: false, message: 'Failed to delete catalog poster' });
  }
});

// Update Store Settings
app.put('/api/admin/settings', requireAdminAuth, async (req, res) => {
  try {
    const updatedSettings = await db.updateSettings(req.body);
    res.json({
      success: true,
      message: 'Store configuration updated successfully!',
      settings: updatedSettings
    });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ success: false, message: 'Failed to update store settings' });
  }
});

// Export Database JSON
app.get('/api/admin/export', requireAdminAuth, async (req, res) => {
  try {
    const exportData = await db.exportData();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=apna_tohfa_store_backup.json');
    res.send(JSON.stringify(exportData, null, 2));
  } catch (err) {
    console.error('Error exporting data:', err);
    res.status(500).json({ success: false, message: 'Failed to export backup data' });
  }
});

// Reset Database to Seed
app.post('/api/admin/reset', requireAdminAuth, async (req, res) => {
  try {
    await db.resetData();
    res.json({
      success: true,
      message: 'Store database reset to original Diwali seed data!'
    });
  } catch (err) {
    console.error('Error resetting database:', err);
    res.status(500).json({ success: false, message: 'Failed to reset database' });
  }
});

// Route /admin to admin.html
app.get('/admin', (req, res) => {
  res.sendFile('admin.html', { root: __dirname });
});

// React Storefront Route (Optional preview at /react)
app.get('/react', (req, res) => {
  if (fs.existsSync(path.join(reactDistPath, 'index.html'))) {
    return res.sendFile('index.html', { root: reactDistPath });
  }
  res.redirect('/');
});

// Root Route (Original Premium Storefront)
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
  console.log(`🍃 Database Status:      ${db.isMongo ? 'MongoDB Atlas (Connected)' : 'Local JSON File DB'}`);
  console.log(`=======================================================`);
});
