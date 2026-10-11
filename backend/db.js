const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default Seed Data
function getDefaultSeed() {
  const salt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync(process.env.ADMIN_DEFAULT_PASSWORD || 'apnaAdmin@2026', salt);

  return {
    adminUsers: [
      {
        id: 'admin-01',
        name: 'Chief Store Manager',
        email: (process.env.ADMIN_EMAIL || 'admin@apnatohfa.in').toLowerCase(),
        passwordHash: adminPasswordHash,
        role: 'superadmin',
        createdAt: new Date().toISOString()
      }
    ],
    settings: {
      brandName: 'APNA TOHFA',
      tagline: 'Apno Ke Liye, Dil Se.',
      logo: 'assets/images/logo.png',
      phone: '+91 98765 43210',
      email: 'namaste@apnatohfa.in',
      corporateEmail: 'corporate@apnatohfa.in',
      whatsapp: '919876543210',
      address: 'Regal Pavilion, Connaught Place, New Delhi - 110001',
      hours: 'Mon - Sun: 9:00 AM - 9:00 PM IST',
      instagram: 'https://instagram.com',
      instagramHandle: '@apnatohfa',
      announcementText: '🪔 Diwali 2026 Festive Dispatch Active • Use Code DIWALI2026 for 10% Off • Free Pan-India Delivery on ₹999+',
      activeCouponPill: 'DIWALI2026',
      freeShippingThreshold: 999,
      standardShippingFee: 99
    },
    categories: [
      { id: 'small-basket', title: 'Small Basket', subtitle: 'Artisanal woven mini basket with gourmet treats', priceTag: 'Starting from ₹349', minPrice: 349, badge: 'Compact Hamper', icon: '🧺' },
      { id: 'medium-basket', title: 'Medium Basket', subtitle: 'Classic festive wicker basket with sweets & nuts', priceTag: 'Starting from ₹699', minPrice: 699, badge: 'Family Favorite', icon: '🧺' },
      { id: 'large-basket', title: 'Large Basket', subtitle: 'Grand celebration basket with regal brass keepsakes', priceTag: 'Starting from ₹1,299', minPrice: 1299, badge: 'Grand Hamper', icon: '🧺' },
      { id: 'small-basket-jar', title: 'Small Basket Jar', subtitle: 'Mini woven basket with airtight dry fruit jars', priceTag: 'Starting from ₹449', minPrice: 449, badge: 'Jar Duo', icon: '🫙' },
      { id: 'medium-jar-basket', title: 'Medium Jar Basket', subtitle: 'Handcrafted basket with 4 premium glass jars', priceTag: 'Starting from ₹899', minPrice: 899, badge: 'Gourmet Jars', icon: '🫙' },
      { id: 'large-jar-basket', title: 'Large Jar Basket', subtitle: 'Luxury regal basket featuring 6 hexagonal dry fruit jars', priceTag: 'Starting from ₹1,599', minPrice: 1599, badge: 'Royal Jar Suite', icon: '🫙' },
      { id: 'budget', title: 'Budget Hampers', subtitle: 'Thoughtful & pocket-friendly festive joy', priceTag: 'Starting from ₹299', minPrice: 299, badge: 'Festive Value', icon: '✨' },
      { id: 'premium', title: 'Premium Hampers', subtitle: 'Curated dry fruits & gourmet mithai', priceTag: 'Starting from ₹799', minPrice: 799, badge: 'Bestseller Tier', icon: '🪔' },
      { id: 'luxury', title: 'Luxury Hampers', subtitle: 'Velvet boxes, brass keepsakes & gold foils', priceTag: 'Starting from ₹1,199', minPrice: 1199, badge: 'Royal Collection', icon: '👑' },
      { id: 'corporate', title: 'Corporate Gifting', subtitle: 'Bulk orders with company logo & branding', priceTag: 'Bulk & Customized Orders', minPrice: 399, badge: 'B2B Volume Discounts', icon: '🏢' }
    ],
    products: [
      {
        id: 'shubh-aarambh',
        name: 'Shubh Aarambh',
        category: 'budget',
        badge: 'Budget Friendly',
        badgeType: 'accent',
        price: 299,
        originalPrice: 499,
        discount: '40% OFF',
        rating: 4.8,
        reviewsCount: 342,
        shortDescription: 'A beautiful budget-friendly Diwali hamper with artisanal sweets, painted diya & roasted almonds.',
        fullDescription: 'Begin your Diwali festivities on an auspicious note with Shubh Aarambh. Thoughtfully designed to offer a rich festive gesture at an accessible price point, this hamper combines traditional taste, festive light, and wholesome goodness.',
        image: 'assets/images/shubh-aarambh.jpg',
        inStock: true,
        dispatchTime: 'Ships in 24 Hours',
        tags: ['Budget', 'Under ₹500', 'Sweets', 'Diya', 'Almonds'],
        whatsInside: [
          { item: 'Artisanal Kaju Katli (100g)', icon: '🍬' },
          { item: 'Besan Laddoos made with Pure Desi Ghee (4 pcs)', icon: '🥮' },
          { item: 'Hand-painted Terracotta Diya with pure cotton wicks', icon: '🪔' },
          { item: 'Jute Potli with Roasted California Almonds (60g)', icon: '🌰' },
          { item: "Gold Foiled 'Shubh Deepavali' Greeting Card", icon: '📜' },
          { item: 'Rigid Maroon & Gold Festive Keepsake Gift Box', icon: '🎁' }
        ],
        customizationOptions: ['Custom Diwali Card Message', 'Choice of Gold/Red Ribbon'],
        corporateAvailable: true,
        createdAt: '2026-10-01T10:00:00.000Z'
      },
      {
        id: 'apna-tohfa',
        name: 'Apna Tohfa',
        category: 'budget',
        badge: 'Most Popular',
        badgeType: 'bestseller',
        price: 499,
        originalPrice: 799,
        discount: '38% OFF',
        rating: 4.9,
        reviewsCount: 820,
        shortDescription: 'A thoughtfully curated festive gift for your loved ones with pistachio sweets, nuts, brass diyas & royal scroll.',
        fullDescription: 'Our signature flagship hamper that captures the true essence of "Apno Ke Liye, Dil Se". Crafted with love, this hamper brings together gourmet pistachio delights, roasted cashews in a golden tin, handcrafted brass diyas, and an emotional Diwali wish scroll.',
        image: 'assets/images/apna-tohfa.jpg',
        inStock: true,
        dispatchTime: 'Ships in 24 Hours',
        tags: ['Most Popular', 'Under ₹500', 'Bestseller', 'Brass Diya', 'Cashews'],
        whatsInside: [
          { item: 'Gourmet Pistachio Diamond Sweets (150g)', icon: '🍬' },
          { item: 'Premium Roasted Whole Cashews in Reusable Gold Tin (100g)', icon: '🌰' },
          { item: 'Artisanal Dark Belgian Chocolates dusted with edible Gold Dust (6 pcs)', icon: '🍫' },
          { item: 'Pair of Handcrafted Ornate Brass Diyas (Carved Motifs)', icon: '🪔' },
          { item: 'Vintage Wax-Sealed Handwritten Wish Scroll', icon: '📜' },
          { item: 'Signature Magnetic Maroon & Gold Gift Box with Satin Ribbon', icon: '🎁' }
        ],
        customizationOptions: ['Personalized Calligraphy Note', 'Corporate Sleeve Branding (Min 25)', 'Box Color Selection'],
        corporateAvailable: true,
        createdAt: '2026-10-01T10:15:00.000Z'
      },
      {
        id: 'khushi-special',
        name: 'Khushi Special',
        category: 'premium',
        badge: 'Festive Delight',
        badgeType: 'popular',
        price: 799,
        originalPrice: 1199,
        discount: '33% OFF',
        rating: 4.9,
        reviewsCount: 512,
        shortDescription: 'A premium hamper filled with festive favourites, kaju katli, assorted dry fruits & colorful designer diyas.',
        fullDescription: 'Spread unbounded cheer with "Khushi Special". Loaded with festive favorites, this vibrant amber-gold gift box features a triple-tier dry fruit assortment, classic silver vark kaju katli, melt-in-mouth motichoor laddoos, and hand-painted peacock diyas.',
        image: 'assets/images/khushi-special.jpg',
        inStock: true,
        dispatchTime: 'Ships in 24 Hours',
        tags: ['Premium', 'Dry Fruits', 'Kaju Katli', 'Designer Diya', 'Family Gift'],
        whatsInside: [
          { item: 'Classic Silver Vark Kaju Katli (200g)', icon: '🍬' },
          { item: 'Kashmiri Walnuts, Jumbo Green Raisins & Roasted Almonds (180g total)', icon: '🌰' },
          { item: 'Desi Ghee Motichoor Laddoos (5 pcs)', icon: '🥮' },
          { item: 'Handcrafted Almond Brittles Jar (120g)', icon: '🍪' },
          { item: 'Pair of Hand-painted Terracotta Peacock Diyas', icon: '🪔' },
          { item: 'Personalized Peacock Gold-Foil Diwali Card', icon: '📜' },
          { item: 'Festive Amber & Gold Rigid Box with Magnetic Clasp', icon: '🎁' }
        ],
        customizationOptions: ['Custom Family Name on Greeting Card', 'Dry Fruit Selection Options', 'Corporate Branding'],
        corporateAvailable: true,
        createdAt: '2026-10-01T10:30:00.000Z'
      },
      {
        id: 'shahi-tohfa',
        name: 'Shahi Tohfa',
        category: 'luxury',
        badge: 'Luxury Pick',
        badgeType: 'royal',
        price: 1199,
        originalPrice: 1799,
        discount: '33% OFF',
        rating: 5.0,
        reviewsCount: 275,
        shortDescription: 'A luxurious Diwali gifting experience with velvet rigid box, saffron sweets, macadamia & hanging brass diya.',
        fullDescription: 'Fit for royalty, "Shahi Tohfa" brings centuries-old royal Indian gifting traditions to life. Packaged in an opulent velvet-clad rigid chest with golden filigree, it holds saffron-infused sweets, imported macadamias and roasted pistachios, a hanging brass diya, and a luxury soy wax candle.',
        image: 'assets/images/shahi-tohfa.jpg',
        inStock: true,
        dispatchTime: 'Same Day Dispatch',
        tags: ['Luxury', 'Velvet Box', 'Brass Bell Diya', 'Saffron Sweets', 'Candle'],
        whatsInside: [
          { item: 'Royal Saffron Almond Sweets & Silver Vark Gulab Barfi (250g)', icon: '🍬' },
          { item: 'Premium Roasted Salted Pistachios in Glass Jar (120g)', icon: '🌰' },
          { item: 'Slow-Roasted Honey Glazed Macadamia Nuts (100g)', icon: '🍯' },
          { item: 'Carved Antique Brass Hanging Diya with Chain', icon: '🪔' },
          { item: 'Hand-poured Diwali Bliss Mogra & Oud Soy Wax Candle in Crystal Glass', icon: '🕯️' },
          { item: 'Shredded Golden Grass Nesting with Gold Embossed Card', icon: '✨' },
          { item: 'Royal Deep Maroon Velvet Rigid Trunk with Antique Metal Clasp', icon: '🎁' }
        ],
        customizationOptions: ['Engraved Metal Nameplate on Box', 'Custom Corporate Brass Sleeves', 'Handwritten Letter'],
        corporateAvailable: true,
        createdAt: '2026-10-01T10:45:00.000Z'
      },
      {
        id: 'royal-celebration',
        name: 'Royal Celebration',
        category: 'luxury',
        badge: 'Ultra Luxury',
        badgeType: 'royal',
        price: 1999,
        originalPrice: 2999,
        discount: '33% OFF',
        rating: 5.0,
        reviewsCount: 189,
        shortDescription: 'An elegant premium hamper for special occasions with multi-tier presentation, crystal jars, idol & soy candle.',
        fullDescription: 'The zenith of festive luxury. "Royal Celebration" is designed for life\'s most meaningful moments, cherished family patriarchs, and top VIP enterprise leaders. Presented on multiple tiers with navy velvet and brocade accents, featuring an antique brass Ganesha idol, crystal jars of exotic dry fruits, and gold leaf mithai.',
        image: 'assets/images/royal-celebration.jpg',
        inStock: true,
        dispatchTime: 'Same Day Dispatch',
        tags: ['Ultra Luxury', 'VIP Gifting', 'Brass Ganesha', 'Exotic Nuts', 'Multi-Tier'],
        whatsInside: [
          { item: 'Handcrafted Antique Brass Lord Ganesha Idol (Pooja blessed)', icon: '🕉️' },
          { item: '24K Edible Gold Leaf Kaju & Saffron Pedas (300g)', icon: '🍬' },
          { item: 'Exotic Afghan Jumbo Cashews & Persian Roasted Pistachios in Crystal Jars (300g)', icon: '🌰' },
          { item: 'Artisanal Single-Origin Chocolate Truffles with Gold Flakes (8 pcs)', icon: '🍫' },
          { item: 'Carved Heavy Brass Diya with Brass Stand', icon: '🪔' },
          { item: 'Midnight Navy & Gold Scented Luxury Candle (40+ hour burn)', icon: '🕯️' },
          { item: 'Grand 3-Tier Rigid Presentation Box with Silk Brocade & Tassels', icon: '🎁' }
        ],
        customizationOptions: ['Custom Silk Inscription', 'VIP Delivery Courier with Concierge Tracking', 'Bespoke Engraving'],
        corporateAvailable: true,
        createdAt: '2026-10-01T11:00:00.000Z'
      },
      {
        id: 'corporate-tohfa',
        name: 'Corporate Tohfa',
        category: 'corporate',
        badge: 'Custom Branding',
        badgeType: 'corporate',
        price: 599,
        originalPrice: 899,
        discount: 'Bulk Tier Pricing',
        priceSuffix: '+',
        rating: 4.9,
        reviewsCount: 430,
        shortDescription: 'Customizable corporate gifts for employees and clients with custom logo sleeve, notebook, nuts & truffles.',
        fullDescription: 'Make business gifting seamless and memorable. "Corporate Tohfa" is custom-engineered for corporate teams, HR departments, and enterprise clients. Includes company logo foil stamping on rigid matte-black packaging, executive journal, designer brass diya, California almonds, and luxury truffles.',
        image: 'assets/images/corporate-tohfa.jpg',
        inStock: true,
        dispatchTime: 'Bulk Scheduling Available',
        tags: ['Corporate Gifting', 'Custom Logo', 'Employee Gifts', 'Client Gifting', 'Bulk Order'],
        whatsInside: [
          { item: 'Custom Branded Leatherette Executive Journal with Gold Trim Pen', icon: '📓' },
          { item: 'California Almonds in Airtight Glass Jar with Company Logo Sleeve (150g)', icon: '🌰' },
          { item: 'Handcrafted Designer Brass Diya with Floral Petal Rim', icon: '🪔' },
          { item: 'Belgian Dark Chocolate Truffles Box (6 pcs)', icon: '🍫' },
          { item: 'Personalized Leadership Diwali Greeting Card with Digital Signature', icon: '✉️' },
          { item: 'Matte Black Magnetic Clasp Box with Gold Foil Company Logo', icon: '🏢' }
        ],
        customizationOptions: ['Full Company Logo Integration', 'Split Shipping to 100+ Home Addresses', 'Custom Color Ribbon'],
        corporateAvailable: true,
        isCorporateQuote: true,
        createdAt: '2026-10-01T11:15:00.000Z'
      }
    ],
    coupons: [
      {
        code: 'DIWALI2026',
        discountPercent: 10,
        discountFlat: 0,
        minSpend: 0,
        label: '10% Festive Discount',
        active: true,
        usedCount: 142
      },
      {
        code: 'SHUBH100',
        discountPercent: 0,
        discountFlat: 100,
        minSpend: 800,
        label: 'Flat ₹100 OFF on ₹800+',
        active: true,
        usedCount: 89
      },
      {
        code: 'CORP20',
        discountPercent: 20,
        discountFlat: 0,
        minSpend: 2500,
        label: '20% Corporate Volume Discount',
        active: true,
        usedCount: 27
      }
    ],
    orders: [],
    corporateLeads: [],
    contactInquiries: []
  };
}

class StoreDB {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    if (!fs.existsSync(DB_FILE)) {
      this.data = getDefaultSeed();
      this.save();
    } else {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
        // Fallback validation
        if (!this.data.products || !this.data.orders) {
          this.data = getDefaultSeed();
          this.save();
        }
      } catch (err) {
        console.error('Error reading DB, re-initializing seed:', err);
        this.data = getDefaultSeed();
        this.save();
      }
    }
  }

  save() {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tempPath, DB_FILE);
      return true;
    } catch (e) {
      console.error('Error saving DB:', e);
      return false;
    }
  }

  // Admin Auth
  findAdminByEmail(email) {
    if (!email) return null;
    const clean = email.toLowerCase().trim();
    return this.data.adminUsers.find(u => u.email.toLowerCase() === clean);
  }

  // Products
  getProducts(filter = {}) {
    let list = [...this.data.products];
    if (filter.category && filter.category !== 'all') {
      list = list.filter(p => p.category === filter.category);
    }
    if (filter.inStock !== undefined) {
      list = list.filter(p => p.inStock === (filter.inStock === 'true' || filter.inStock === true));
    }
    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    return list;
  }

  getProductById(id) {
    return this.data.products.find(p => p.id === id);
  }

  addProduct(productData) {
    const id = productData.id || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newProduct = {
      ...productData,
      id,
      price: Number(productData.price) || 0,
      originalPrice: Number(productData.originalPrice) || Number(productData.price) || 0,
      rating: Number(productData.rating) || 5.0,
      reviewsCount: Number(productData.reviewsCount) || 1,
      inStock: productData.inStock !== false,
      createdAt: new Date().toISOString()
    };
    this.data.products.push(newProduct);
    this.save();
    return newProduct;
  }

  updateProduct(id, updateData) {
    const index = this.data.products.findIndex(p => p.id === id);
    if (index === -1) return null;

    if (updateData.price) updateData.price = Number(updateData.price);
    if (updateData.originalPrice) updateData.originalPrice = Number(updateData.originalPrice);

    this.data.products[index] = {
      ...this.data.products[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.products[index];
  }

  deleteProduct(id) {
    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter(p => p.id !== id);
    const deleted = this.data.products.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  // Orders
  getOrders(filter = {}) {
    let list = [...this.data.orders];
    if (filter.status && filter.status !== 'all') {
      list = list.filter(o => o.orderStatus.toLowerCase() === filter.status.toLowerCase());
    }
    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(o =>
        o.orderId.toLowerCase().includes(q) ||
        (o.customer && (
          o.customer.name.toLowerCase().includes(q) ||
          o.customer.phone.includes(q) ||
          o.customer.city.toLowerCase().includes(q)
        ))
      );
    }
    // Sort latest first
    list.sort((a, b) => new Date(b.datePlaced || 0) - new Date(a.datePlaced || 0));
    return list;
  }

  getOrderById(id) {
    return this.data.orders.find(o => o.orderId.toUpperCase() === id.toUpperCase());
  }

  createOrder(orderPayload) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderId = orderPayload.orderId || `AT-2026-${randomNum}`;
    const now = new Date();
    const estDeliveryDate = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
    const estDeliveryStr = estDeliveryDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const newOrder = {
      orderId,
      customer: orderPayload.customer,
      paymentMethod: orderPayload.paymentMethod || 'upi',
      paymentStatus: orderPayload.paymentStatus || 'Paid',
      orderStatus: 'Confirmed',
      courier: null,
      items: orderPayload.items || [],
      subtotal: Number(orderPayload.subtotal) || 0,
      shipping: Number(orderPayload.shipping) || 0,
      discount: Number(orderPayload.discount) || 0,
      couponApplied: orderPayload.couponApplied || null,
      grandTotal: Number(orderPayload.grandTotal) || 0,
      datePlaced: now.toISOString(),
      estimatedDelivery: orderPayload.estimatedDelivery || estDeliveryStr,
      timeline: [
        { status: 'Order Placed', timestamp: now.toISOString(), note: 'Order placed via online checkout' },
        { status: 'Confirmed', timestamp: now.toISOString(), note: 'Payment verified and festive order confirmed' }
      ]
    };

    this.data.orders.unshift(newOrder);

    // Increment coupon used count if any
    if (newOrder.couponApplied) {
      const c = this.data.coupons.find(cp => cp.code.toUpperCase() === newOrder.couponApplied.toUpperCase());
      if (c) c.usedCount = (c.usedCount || 0) + 1;
    }

    this.save();
    return newOrder;
  }

  updateOrderStatus(orderId, status, courierInfo = null, note = '') {
    const order = this.getOrderById(orderId);
    if (!order) return null;

    order.orderStatus = status;
    if (courierInfo) {
      order.courier = courierInfo;
    }

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: status,
      timestamp: new Date().toISOString(),
      note: note || `Order status updated to ${status}`
    });

    this.save();
    return order;
  }

  // Corporate Leads
  getCorporateLeads() {
    return [...this.data.corporateLeads].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }

  createCorporateLead(leadPayload) {
    const id = `corp-lead-${Date.now().toString().slice(-5)}`;
    const newLead = {
      id,
      companyName: leadPayload.companyName || 'Corporate Client',
      contactPerson: leadPayload.contactPerson,
      phone: leadPayload.phone,
      email: leadPayload.email,
      hampersCount: leadPayload.hampersCount || '50-99',
      budget: leadPayload.budget || 'Standard',
      city: leadPayload.city || 'India',
      message: leadPayload.message || '',
      status: 'New',
      submittedAt: new Date().toISOString()
    };
    this.data.corporateLeads.unshift(newLead);
    this.save();
    return newLead;
  }

  updateLeadStatus(leadId, status) {
    const lead = this.data.corporateLeads.find(l => l.id === leadId);
    if (!lead) return null;
    lead.status = status;
    lead.updatedAt = new Date().toISOString();
    this.save();
    return lead;
  }

  // Contact
  getContactInquiries() {
    return [...this.data.contactInquiries].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }

  createContactInquiry(inquiry) {
    const id = `cnt-${Date.now().toString().slice(-4)}`;
    const newInquiry = {
      id,
      ...inquiry,
      submittedAt: new Date().toISOString(),
      status: 'New'
    };
    this.data.contactInquiries.unshift(newInquiry);
    this.save();
    return newInquiry;
  }

  // Coupons
  getCoupons() {
    return [...this.data.coupons];
  }

  getCouponByCode(code) {
    if (!code) return null;
    return this.data.coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase());
  }

  createCoupon(couponData) {
    const cleanCode = couponData.code.trim().toUpperCase();
    const existing = this.getCouponByCode(cleanCode);
    if (existing) return null;

    const newCoupon = {
      code: cleanCode,
      discountPercent: Number(couponData.discountPercent) || 0,
      discountFlat: Number(couponData.discountFlat) || 0,
      minSpend: Number(couponData.minSpend) || 0,
      label: couponData.label || `${cleanCode} Promo Code`,
      active: couponData.active !== false,
      usedCount: 0
    };
    this.data.coupons.push(newCoupon);
    this.save();
    return newCoupon;
  }

  toggleCoupon(code) {
    const coupon = this.getCouponByCode(code);
    if (!coupon) return null;
    coupon.active = !coupon.active;
    this.save();
    return coupon;
  }

  deleteCoupon(code) {
    const initialLen = this.data.coupons.length;
    this.data.coupons = this.data.coupons.filter(c => c.code.toUpperCase() !== code.trim().toUpperCase());
    const deleted = this.data.coupons.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  // Settings
  getSettings() {
    return { ...this.data.settings };
  }

  updateSettings(newSettings) {
    this.data.settings = {
      ...this.data.settings,
      ...newSettings
    };
    this.save();
    return this.data.settings;
  }

  // Analytics & Stats for Executive Dashboard
  getAdminStats() {
    const orders = this.data.orders;
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.grandTotal) || 0), 0);
    const pendingOrders = orders.filter(o => ['pending', 'confirmed', 'packed'].includes(o.orderStatus.toLowerCase())).length;
    const shippedOrders = orders.filter(o => o.orderStatus.toLowerCase() === 'shipped').length;
    const deliveredOrders = orders.filter(o => o.orderStatus.toLowerCase() === 'delivered').length;
    const corporateLeadsCount = this.data.corporateLeads.length;
    const productsCount = this.data.products.length;
    const outOfStockCount = this.data.products.filter(p => !p.inStock).length;

    // Calculate product sales distribution
    const salesByProduct = {};
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        salesByProduct[item.name] = (salesByProduct[item.name] || 0) + (item.quantity || 1);
      });
    });

    const topSellingHampers = Object.entries(salesByProduct)
      .map(([name, units]) => ({ name, units }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);

    // Recent orders
    const recentOrders = orders.slice(0, 5).map(o => ({
      orderId: o.orderId,
      customerName: o.customer?.name || 'Customer',
      datePlaced: o.datePlaced,
      grandTotal: o.grandTotal,
      orderStatus: o.orderStatus,
      itemsCount: (o.items || []).reduce((s, i) => s + (i.quantity || 1), 0)
    }));

    return {
      totalRevenue,
      totalOrders,
      pendingOrders,
      shippedOrders,
      deliveredOrders,
      corporateLeadsCount,
      productsCount,
      outOfStockCount,
      topSellingHampers,
      recentOrders
    };
  }

  // Reset to default seed
  resetData() {
    this.data = getDefaultSeed();
    this.save();
    return true;
  }
}

module.exports = new StoreDB();
