require('dotenv').config();
const fs = require('fs');
const path = require('path');
const dns = require('dns');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const models = require('./models');

// Configure reliable DNS servers for MongoDB SRV lookups on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  // Ignore if custom DNS not allowed in environment
}

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default Seed Data Generator
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
      tagline: 'Apno Ke Naam',
      logo: 'assets/images/logo.png',
      phone: '+91 9950263957',
      email: 'apnatohfa26@gmail.com',
      corporateEmail: 'apnatohfa26@gmail.com',
      whatsapp: '919950263957',
      address: 'Malviya Nagar, Jaipur, Rajasthan - 302017',
      hours: 'Mon – Sun: 9:00 AM – 9:00 PM IST',
      instagram: 'https://www.instagram.com/apna.tohfa?cplk=MmRjZDFraWVmbm8y',
      instagramHandle: '@apnatohfa.official',
      announcementText: '🪔 Diwali 2026 Festivel',
      activeCouponPill: '',
      freeShippingThreshold: 5000,
      standardShippingFee: 99
    },
    categories: [
      { id: 'budget', title: 'Budget Hampers (Under ₹500)', subtitle: 'Thoughtful & pocket-friendly festive joy', priceTag: 'Under ₹500', minPrice: 299, badge: 'Festive Value', icon: '✨' },
      { id: 'classic', title: 'Classic Hampers (₹500 - ₹1,000)', subtitle: 'Traditional sweets, dry fruits & festive brass diyas', priceTag: '₹500 - ₹1,000', minPrice: 500, badge: 'Festive Favorite', icon: '🎁' },
      { id: 'premium', title: 'Premium Hampers (₹1,000 - ₹2,500)', subtitle: 'Curated artisanal sweets & premium dry fruits', priceTag: '₹1,000 - ₹2,500', minPrice: 1000, badge: 'Bestseller Tier', icon: '🪔' },
      { id: 'luxury', title: 'Luxury Hampers (₹2,500+)', subtitle: 'Royal velvet chests, brass keepsakes & grand delicacies', priceTag: '₹2,500+', minPrice: 2500, badge: 'Royal Collection', icon: '👑' },
      { id: 'corporate', title: 'Corporate Gifting', subtitle: 'Bulk orders with company logo & branding', priceTag: 'Bulk & Customized Orders', minPrice: 399, badge: 'B2B Volume Discounts', icon: '🏢' },
      { id: 'family-combo', title: 'Family Combo Boxes', subtitle: 'All-in-one celebration packs for the whole family', priceTag: 'Starting from ₹799', minPrice: 799, badge: 'Family Special', icon: '👨‍👩‍👧‍👦' },
      { id: 'mini-baskets', title: 'Mini Gift Baskets', subtitle: 'Artisanal woven mini basket with gourmet treats', priceTag: 'Starting from ₹349', minPrice: 349, badge: 'Compact Basket', icon: '🧺' },
      { id: 'classic-baskets', title: 'Classic Gift Baskets', subtitle: 'Classic festive wicker basket with sweets & nuts', priceTag: 'Starting from ₹699', minPrice: 699, badge: 'Popular Basket', icon: '🧺' },
      { id: 'grand-baskets', title: 'Grand Gift Baskets', subtitle: 'Grand celebration basket with regal brass keepsakes', priceTag: 'Starting from ₹1,299', minPrice: 1299, badge: 'Grand Hamper', icon: '🧺' },
      { id: 'mini-jars', title: 'Mini Gift Jars', subtitle: 'Mini woven basket with airtight dry fruit jars', priceTag: 'Starting from ₹449', minPrice: 449, badge: 'Jar Duo', icon: '🫙' },
      { id: 'classic-jars', title: 'Classic Gift Jars', subtitle: 'Handcrafted basket with 4 premium glass jars', priceTag: 'Starting from ₹899', minPrice: 899, badge: 'Gourmet Jars', icon: '🫙' },
      { id: 'grand-jars', title: 'Grand Gift Jars', subtitle: 'Luxury regal basket featuring 6 hexagonal dry fruit jars', priceTag: 'Starting from ₹1,599', minPrice: 1599, badge: 'Royal Jar Suite', icon: '🫙' }
    ],
    products: [
      {
        id: 'shubh-aarambh',
        name: 'Shubh Aarambh',
        category: 'budget',
        badge: 'Budget Friendly',
        badgeType: 'accent',
        price: 349,
        originalPrice: 499,
        discount: '30% OFF',
        rating: 4.8,
        reviewsCount: 342,
        shortDescription: 'A beautiful budget-friendly Diwali hamper with artisanal sweets, painted diya & roasted almonds.',
        fullDescription: 'Begin your Diwali festivities on an auspicious note with Shubh Aarambh. Thoughtfully designed to offer a rich festive gesture at an accessible price point, this hamper combines traditional taste, festive light, and wholesome goodness.',
        image: 'assets/images/shubh-aarambh.jpg',
        images: ['assets/images/shubh-aarambh.jpg'],
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
        images: ['assets/images/apna-tohfa.jpg'],
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
        category: 'classic',
        badge: 'Classic Choice',
        badgeType: 'popular',
        price: 799,
        originalPrice: 1199,
        discount: '33% OFF',
        rating: 4.9,
        reviewsCount: 512,
        shortDescription: 'A classic festive hamper filled with favorite sweets, kaju katli, assorted dry fruits & colorful designer diyas.',
        fullDescription: 'Spread unbounded cheer with "Khushi Special". Loaded with festive favorites, this vibrant amber-gold gift box features a triple-tier dry fruit assortment, classic silver vark kaju katli, melt-in-mouth motichoor laddoos, and hand-painted peacock diyas.',
        image: 'assets/images/khushi-special.jpg',
        images: ['assets/images/khushi-special.jpg'],
        inStock: true,
        dispatchTime: 'Ships in 24 Hours',
        tags: ['Classic Hampers', '₹500 - ₹999', 'Classic', 'Dry Fruits', 'Kaju Katli', 'Designer Diya', 'Family Gift'],
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
        id: 'parivar-utsav-combo',
        name: 'Sampoorna Parivar Festive Combo Box',
        category: 'family-combo',
        badge: 'Family Special',
        badgeType: 'popular',
        price: 999,
        originalPrice: 1499,
        discount: '33% OFF',
        rating: 4.9,
        reviewsCount: 248,
        shortDescription: 'Grand festive combo box for the entire family with sweets, dry fruit potlis, artisanal chocolates & brass diyas.',
        fullDescription: 'Designed for joyous family gatherings, the Sampoorna Parivar Combo Box offers something special for every generation. Packed with pure desi ghee sweets, 4 potlis of almonds, cashews, raisins and pistachios, chocolates for the little ones, and handcrafted terracotta & brass diyas.',
        image: 'assets/images/apna-tohfa.jpg',
        images: ['assets/images/apna-tohfa.jpg'],
        inStock: true,
        dispatchTime: 'Ships in 24 Hours',
        tags: ['Family Combo Boxes', 'Combo Box', 'Family Gift', 'Celebration Pack', 'Dry Fruits', 'Sweets'],
        whatsInside: [
          { item: 'Assorted Festive Mithai Box (250g)', icon: '🍬' },
          { item: '4x Dry Fruit Potlis: Almonds, Cashews, Raisins, Pistachios (200g)', icon: '🌰' },
          { item: 'Artisanal Milk & Dark Chocolates (8 pcs)', icon: '🍫' },
          { item: 'Handcrafted Brass Diya Duo with Pure Cotton Wicks', icon: '🪔' },
          { item: 'Gold Foil Family Deepavali Wish Card', icon: '📜' },
          { item: 'Extra Large Festive Keepsake Trunk Box', icon: '🎁' }
        ],
        customizationOptions: ['Personalized Family Greeting Message', 'Custom Ribbon Color'],
        corporateAvailable: true,
        createdAt: '2026-10-01T10:35:00.000Z'
      },
      {
        id: 'shahi-tohfa',
        name: 'Shahi Tohfa',
        category: 'premium',
        badge: 'Premium Pick',
        badgeType: 'royal',
        price: 1199,
        originalPrice: 1799,
        discount: '33% OFF',
        rating: 5.0,
        reviewsCount: 275,
        shortDescription: 'A luxurious Diwali gifting experience with velvet rigid box, saffron sweets, macadamia & hanging brass diya.',
        fullDescription: 'Fit for royalty, "Shahi Tohfa" brings centuries-old royal Indian gifting traditions to life. Packaged in an opulent velvet-clad rigid chest with golden filigree, it holds saffron-infused sweets, imported macadamias and roasted pistachios, a hanging brass diya, and a luxury soy wax candle.',
        image: 'assets/images/shahi-tohfa.jpg',
        images: ['assets/images/shahi-tohfa.jpg'],
        inStock: true,
        dispatchTime: 'Same Day Dispatch',
        tags: ['Premium Hampers', '₹1,000 - ₹2,499', 'Premium', 'Velvet Box', 'Brass Bell Diya', 'Saffron Sweets', 'Candle'],
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
        badge: 'Royal Luxury',
        badgeType: 'royal',
        price: 2599,
        originalPrice: 3499,
        discount: '26% OFF',
        rating: 5.0,
        reviewsCount: 189,
        shortDescription: 'An elegant premium hamper for special occasions with multi-tier presentation, crystal jars, idol & soy candle.',
        fullDescription: 'The zenith of festive luxury. "Royal Celebration" is designed for life\'s most meaningful moments, cherished family patriarchs, and top VIP enterprise leaders. Presented on multiple tiers with navy velvet and brocade accents, featuring an antique brass Ganesha idol, crystal jars of exotic dry fruits, and gold leaf mithai.',
        image: 'assets/images/royal-celebration.jpg',
        images: ['assets/images/royal-celebration.jpg'],
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
        images: ['assets/images/corporate-tohfa.jpg'],
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
    this.isMongo = false;
    this.connectionStatus = 'initializing';
    this.data = null; // Local in-memory cache / file fallback
    this.initLocal();
    this.initMongo();
  }

  // 1. Local JSON Database Initialization (Always ready as fallback)
  initLocal() {
    if (!fs.existsSync(DB_FILE)) {
      this.data = getDefaultSeed();
      this.saveLocal();
    } else {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
        if (!this.data.products || !this.data.orders) {
          this.data = getDefaultSeed();
          this.saveLocal();
        }
      } catch (err) {
        console.error('Error reading local store.json, re-initializing default seed:', err);
        this.data = getDefaultSeed();
        this.saveLocal();
      }
    }
  }

  saveLocal() {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tempPath, DB_FILE);
      return true;
    } catch (e) {
      console.error('Error saving local store.json:', e);
      return false;
    }
  }

  // 2. MongoDB Atlas Connection & Automatic Data Migration
  async initMongo() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri || mongoUri.trim() === '') {
      this.isMongo = false;
      this.connectionStatus = 'local_fallback';
      console.log('----------------------------------------------------');
      console.log('ℹ️  Database Mode: Local JSON Storage (store.json)');
      console.log('👉 To enable MongoDB Atlas: Add MONGODB_URI to your .env file');
      console.log('----------------------------------------------------');
      return;
    }

    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 8000
      });
      this.isMongo = true;
      this.connectionStatus = 'mongodb_connected';
      console.log('----------------------------------------------------');
      console.log('🍃 MongoDB Atlas Connected Successfully!');
      console.log('Database Mode: Cloud MongoDB (Enterprise Scalable)');
      console.log('----------------------------------------------------');

      // Auto Migrate from local store.json if MongoDB is empty
      await this.syncLocalToMongoIfEmpty();
    } catch (err) {
      this.isMongo = false;
      this.connectionStatus = 'local_fallback_error';
      console.warn('⚠️  MongoDB connection failed, falling back to local store.json:', err.message);
    }
  }

  async syncLocalToMongoIfEmpty() {
    try {
      const productCount = await models.Product.countDocuments();
      if (productCount === 0) {
        console.log('📦 MongoDB is fresh. Auto-migrating data from local store.json to MongoDB Atlas...');
        const sourceData = this.data || getDefaultSeed();

        // 1. Settings
        if (sourceData.settings) {
          await models.Setting.deleteMany({});
          await models.Setting.create(sourceData.settings);
        }

        // 2. Admin Users
        if (sourceData.adminUsers && sourceData.adminUsers.length > 0) {
          await models.AdminUser.deleteMany({});
          await models.AdminUser.insertMany(sourceData.adminUsers);
        }

        // 3. Categories
        if (sourceData.categories && sourceData.categories.length > 0) {
          await models.Category.deleteMany({});
          await models.Category.insertMany(sourceData.categories);
        }

        // 4. Products
        if (sourceData.products && sourceData.products.length > 0) {
          await models.Product.deleteMany({});
          await models.Product.insertMany(sourceData.products);
        }

        // 5. Coupons
        if (sourceData.coupons && sourceData.coupons.length > 0) {
          await models.Coupon.deleteMany({});
          await models.Coupon.insertMany(sourceData.coupons);
        }

        // 6. Orders
        if (sourceData.orders && sourceData.orders.length > 0) {
          await models.Order.insertMany(sourceData.orders);
        }

        // 7. Leads
        if (sourceData.corporateLeads && sourceData.corporateLeads.length > 0) {
          await models.CorporateLead.insertMany(sourceData.corporateLeads);
        }

        console.log('✅ Auto-migration to MongoDB Atlas completed successfully!');
      }
    } catch (err) {
      console.error('Failed to auto-migrate data to MongoDB:', err);
    }
  }

  // ---------------------------------------------------------------------------
  // ADMIN AUTH
  // ---------------------------------------------------------------------------
  async findAdminByEmail(email) {
    if (!email) return null;
    const clean = email.toLowerCase().trim();
    if (this.isMongo) {
      const user = await models.AdminUser.findOne({ email: clean }).lean();
      if (user) return user;
    }
    return this.data.adminUsers.find(u => u.email.toLowerCase() === clean) || null;
  }

  // ---------------------------------------------------------------------------
  // CATEGORIES
  // ---------------------------------------------------------------------------
  async getCategories() {
    if (this.isMongo) {
      const cats = await models.Category.find({}).lean();
      if (cats && cats.length > 0) return cats;
    }
    return this.data.categories || [];
  }

  // ---------------------------------------------------------------------------
  // PRODUCTS
  // ---------------------------------------------------------------------------
  async getProducts(filter = {}) {
    if (this.isMongo) {
      const query = {};
      if (filter.category && filter.category !== 'all') {
        query.category = filter.category;
      }
      if (filter.inStock !== undefined) {
        query.inStock = filter.inStock === 'true' || filter.inStock === true;
      }
      if (filter.search) {
        const q = filter.search.trim();
        query.$or = [
          { name: { $regex: q, $options: 'i' } },
          { shortDescription: { $regex: q, $options: 'i' } },
          { tags: { $regex: q, $options: 'i' } }
        ];
      }
      return await models.Product.find(query).sort({ createdAt: -1 }).lean();
    }

    // Local fallback
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

  async getProductById(id) {
    if (this.isMongo) {
      const product = await models.Product.findOne({ id }).lean();
      if (product) return product;
    }
    return this.data.products.find(p => p.id === id) || null;
  }

  async addProduct(productData) {
    let id = productData.id || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!id) id = `hamper-${Date.now().toString().slice(-6)}`;

    const images = Array.isArray(productData.images) && productData.images.length > 0
      ? productData.images
      : (productData.image ? [productData.image] : ['assets/images/apna-tohfa.jpg']);
    const image = productData.image || images[0] || 'assets/images/apna-tohfa.jpg';

    let whatsInside = [];
    if (Array.isArray(productData.whatsInside) && productData.whatsInside.length > 0) {
      whatsInside = productData.whatsInside.map(item => {
        if (typeof item === 'string') return { item, icon: '✨' };
        return { item: item.item || item.name || '', icon: item.icon || '✨' };
      });
    } else {
      whatsInside = [
        { item: 'Handcrafted Festive Keepsakes & Diyas', icon: '🪔' },
        { item: 'Premium Curated Festive Delights', icon: '🍬' },
        { item: 'Roasted Dry Fruits in Airtight Pack', icon: '🌰' },
        { item: "Gold-Foiled 'Shubh Deepavali' Greeting Card", icon: '📜' },
        { item: 'Festive Keepsake Presentation Box', icon: '🎁' }
      ];
    }

    const newProduct = {
      ...productData,
      id,
      image,
      images,
      whatsInside,
      price: Number(productData.price) || 0,
      originalPrice: Number(productData.originalPrice) || Number(productData.price) || 0,
      rating: Number(productData.rating) || 5.0,
      reviewsCount: Number(productData.reviewsCount) || 1,
      inStock: productData.inStock !== false,
      createdAt: new Date().toISOString()
    };

    if (this.isMongo) {
      await models.Product.create(newProduct);
    }

    // Always keep local updated as well
    this.data.products.push(newProduct);
    this.saveLocal();

    return newProduct;
  }

  async updateProduct(id, updateData) {
    if (updateData.price) updateData.price = Number(updateData.price);
    if (updateData.originalPrice) updateData.originalPrice = Number(updateData.originalPrice);

    if (updateData.images && Array.isArray(updateData.images) && updateData.images.length > 0) {
      if (!updateData.image) updateData.image = updateData.images[0];
    } else if (updateData.image) {
      if (!updateData.images || !updateData.images.length) updateData.images = [updateData.image];
    }

    if (updateData.whatsInside && Array.isArray(updateData.whatsInside)) {
      updateData.whatsInside = updateData.whatsInside.map(item => {
        if (typeof item === 'string') return { item, icon: '✨' };
        return { item: item.item || item.name || '', icon: item.icon || '✨' };
      });
    }

    updateData.updatedAt = new Date().toISOString();

    if (this.isMongo) {
      await models.Product.findOneAndUpdate({ id }, { $set: updateData }, { new: true });
    }

    const index = this.data.products.findIndex(p => p.id === id);
    if (index !== -1) {
      this.data.products[index] = { ...this.data.products[index], ...updateData };
      this.saveLocal();
      return this.data.products[index];
    }

    if (this.isMongo) {
      return await models.Product.findOne({ id }).lean();
    }
    return null;
  }

  async deleteProduct(id) {
    let deleted = false;
    if (this.isMongo) {
      const res = await models.Product.deleteOne({ id });
      deleted = res.deletedCount > 0;
    }

    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter(p => p.id !== id);
    if (this.data.products.length < initialLen) {
      deleted = true;
      this.saveLocal();
    }
    return deleted;
  }

  // ---------------------------------------------------------------------------
  // ORDERS
  // ---------------------------------------------------------------------------
  async getOrders(filter = {}) {
    if (this.isMongo) {
      const query = {};
      if (filter.status && filter.status !== 'all') {
        query.orderStatus = { $regex: new RegExp(`^${filter.status}$`, 'i') };
      }
      if (filter.search) {
        const q = filter.search.trim();
        query.$or = [
          { orderId: { $regex: q, $options: 'i' } },
          { 'customer.name': { $regex: q, $options: 'i' } },
          { 'customer.phone': { $regex: q, $options: 'i' } },
          { 'customer.city': { $regex: q, $options: 'i' } }
        ];
      }
      return await models.Order.find(query).sort({ datePlaced: -1 }).lean();
    }

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
    list.sort((a, b) => new Date(b.datePlaced || 0) - new Date(a.datePlaced || 0));
    return list;
  }

  async getOrderById(id) {
    if (!id) return null;
    const cleanId = id.trim().toUpperCase();
    if (this.isMongo) {
      const order = await models.Order.findOne({ orderId: { $regex: new RegExp(`^${cleanId}$`, 'i') } }).lean();
      if (order) return order;
    }
    return this.data.orders.find(o => o.orderId.toUpperCase() === cleanId) || null;
  }

  async createOrder(orderPayload) {
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

    if (this.isMongo) {
      await models.Order.create(newOrder);
      if (newOrder.couponApplied) {
        await models.Coupon.findOneAndUpdate(
          { code: newOrder.couponApplied.toUpperCase() },
          { $inc: { usedCount: 1 } }
        );
      }
    }

    this.data.orders.unshift(newOrder);
    if (newOrder.couponApplied) {
      const c = this.data.coupons.find(cp => cp.code.toUpperCase() === newOrder.couponApplied.toUpperCase());
      if (c) c.usedCount = (c.usedCount || 0) + 1;
    }
    this.saveLocal();

    return newOrder;
  }

  async updateOrderStatus(orderId, status, courierInfo = null, note = '') {
    const timestamp = new Date().toISOString();
    const timelineEntry = {
      status,
      timestamp,
      note: note || `Order status updated to ${status}`
    };

    if (this.isMongo) {
      const updateFields = { orderStatus: status };
      if (courierInfo) updateFields.courier = courierInfo;
      const order = await models.Order.findOneAndUpdate(
        { orderId: { $regex: new RegExp(`^${orderId}$`, 'i') } },
        {
          $set: updateFields,
          $push: { timeline: timelineEntry }
        },
        { new: true }
      ).lean();
      if (order) {
        // Also update local copy
        const loc = this.data.orders.find(o => o.orderId.toUpperCase() === orderId.toUpperCase());
        if (loc) {
          loc.orderStatus = status;
          if (courierInfo) loc.courier = courierInfo;
          if (!loc.timeline) loc.timeline = [];
          loc.timeline.push(timelineEntry);
          this.saveLocal();
        }
        return order;
      }
    }

    const order = this.data.orders.find(o => o.orderId.toUpperCase() === orderId.toUpperCase());
    if (!order) return null;

    order.orderStatus = status;
    if (courierInfo) order.courier = courierInfo;
    if (!order.timeline) order.timeline = [];
    order.timeline.push(timelineEntry);

    this.saveLocal();
    return order;
  }

  // ---------------------------------------------------------------------------
  // CORPORATE LEADS
  // ---------------------------------------------------------------------------
  async getCorporateLeads() {
    if (this.isMongo) {
      return await models.CorporateLead.find({}).sort({ submittedAt: -1 }).lean();
    }
    return [...this.data.corporateLeads].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }

  async createCorporateLead(leadPayload) {
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

    if (this.isMongo) {
      await models.CorporateLead.create(newLead);
    }

    this.data.corporateLeads.unshift(newLead);
    this.saveLocal();
    return newLead;
  }

  async updateLeadStatus(leadId, status) {
    const updatedAt = new Date().toISOString();
    if (this.isMongo) {
      const updated = await models.CorporateLead.findOneAndUpdate(
        { id: leadId },
        { $set: { status, updatedAt } },
        { new: true }
      ).lean();
      if (updated) {
        const loc = this.data.corporateLeads.find(l => l.id === leadId);
        if (loc) {
          loc.status = status;
          loc.updatedAt = updatedAt;
          this.saveLocal();
        }
        return updated;
      }
    }

    const lead = this.data.corporateLeads.find(l => l.id === leadId);
    if (!lead) return null;
    lead.status = status;
    lead.updatedAt = updatedAt;
    this.saveLocal();
    return lead;
  }

  // ---------------------------------------------------------------------------
  // CONTACT INQUIRIES
  // ---------------------------------------------------------------------------
  async getContactInquiries() {
    if (this.isMongo) {
      return await models.ContactInquiry.find({}).sort({ submittedAt: -1 }).lean();
    }
    return [...this.data.contactInquiries].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }

  async createContactInquiry(inquiry) {
    const id = `cnt-${Date.now().toString().slice(-4)}`;
    const newInquiry = {
      id,
      ...inquiry,
      submittedAt: new Date().toISOString(),
      status: 'New'
    };

    if (this.isMongo) {
      await models.ContactInquiry.create(newInquiry);
    }

    this.data.contactInquiries.unshift(newInquiry);
    this.saveLocal();
    return newInquiry;
  }

  // ---------------------------------------------------------------------------
  // COUPONS
  // ---------------------------------------------------------------------------
  async getCoupons() {
    if (this.isMongo) {
      return await models.Coupon.find({}).lean();
    }
    return [...this.data.coupons];
  }

  async getCouponByCode(code) {
    if (!code) return null;
    const clean = code.trim().toUpperCase();
    if (this.isMongo) {
      const coupon = await models.Coupon.findOne({ code: clean }).lean();
      if (coupon) return coupon;
    }
    return this.data.coupons.find(c => c.code.toUpperCase() === clean) || null;
  }

  async createCoupon(couponData) {
    const cleanCode = couponData.code.trim().toUpperCase();
    const existing = await this.getCouponByCode(cleanCode);
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

    if (this.isMongo) {
      await models.Coupon.create(newCoupon);
    }

    this.data.coupons.push(newCoupon);
    this.saveLocal();
    return newCoupon;
  }

  async toggleCoupon(code) {
    const cleanCode = code.trim().toUpperCase();
    if (this.isMongo) {
      const current = await models.Coupon.findOne({ code: cleanCode });
      if (current) {
        current.active = !current.active;
        await current.save();
        const loc = this.data.coupons.find(c => c.code.toUpperCase() === cleanCode);
        if (loc) {
          loc.active = current.active;
          this.saveLocal();
        }
        return current.toObject();
      }
    }

    const coupon = this.data.coupons.find(c => c.code.toUpperCase() === cleanCode);
    if (!coupon) return null;
    coupon.active = !coupon.active;
    this.saveLocal();
    return coupon;
  }

  async deleteCoupon(code) {
    const cleanCode = code.trim().toUpperCase();
    let deleted = false;
    if (this.isMongo) {
      const res = await models.Coupon.deleteOne({ code: cleanCode });
      deleted = res.deletedCount > 0;
    }

    const initialLen = this.data.coupons.length;
    this.data.coupons = this.data.coupons.filter(c => c.code.toUpperCase() !== cleanCode);
    if (this.data.coupons.length < initialLen) {
      deleted = true;
      this.saveLocal();
    }
    return deleted;
  }

  // ---------------------------------------------------------------------------
  // SETTINGS
  // ---------------------------------------------------------------------------
  async getSettings() {
    if (this.isMongo) {
      const setting = await models.Setting.findOne({}).lean();
      if (setting) return setting;
    }
    return { ...this.data.settings };
  }

  async updateSettings(newSettings) {
    if (this.isMongo) {
      const updated = await models.Setting.findOneAndUpdate(
        {},
        { $set: newSettings },
        { new: true, upsert: true }
      ).lean();
      this.data.settings = { ...this.data.settings, ...newSettings };
      this.saveLocal();
      return updated;
    }

    this.data.settings = { ...this.data.settings, ...newSettings };
    this.saveLocal();
    return this.data.settings;
  }

  // ---------------------------------------------------------------------------
  // ADMIN DASHBOARD STATS
  // ---------------------------------------------------------------------------
  async getAdminStats() {
    const orders = await this.getOrders();
    const products = await this.getProducts();
    const leads = await this.getCorporateLeads();

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.grandTotal) || 0), 0);
    const pendingOrders = orders.filter(o => ['pending', 'confirmed', 'packed'].includes((o.orderStatus || '').toLowerCase())).length;
    const shippedOrders = orders.filter(o => (o.orderStatus || '').toLowerCase() === 'shipped').length;
    const deliveredOrders = orders.filter(o => (o.orderStatus || '').toLowerCase() === 'delivered').length;
    const corporateLeadsCount = leads.length;
    const productsCount = products.length;
    const outOfStockCount = products.filter(p => !p.inStock).length;

    // Calculate product sales distribution
    const salesByProduct = {};
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        const name = item.name || 'Gift Hamper';
        salesByProduct[name] = (salesByProduct[name] || 0) + (item.quantity || 1);
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
      databaseEngine: this.isMongo ? 'MongoDB Atlas (Cloud)' : 'Local JSON Storage',
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

  // ---------------------------------------------------------------------------
  // BACKUP EXPORT & RESET
  // ---------------------------------------------------------------------------
  async exportData() {
    if (this.isMongo) {
      const [settings, categories, products, coupons, orders, corporateLeads, contactInquiries, adminUsers] = await Promise.all([
        models.Setting.findOne({}).lean(),
        models.Category.find({}).lean(),
        models.Product.find({}).lean(),
        models.Coupon.find({}).lean(),
        models.Order.find({}).lean(),
        models.CorporateLead.find({}).lean(),
        models.ContactInquiry.find({}).lean(),
        models.AdminUser.find({}).lean()
      ]);
      return {
        exportedAt: new Date().toISOString(),
        engine: 'MongoDB Atlas',
        settings,
        categories,
        products,
        coupons,
        orders,
        corporateLeads,
        contactInquiries,
        adminUsers
      };
    }
    return this.data;
  }

  async resetData() {
    const seed = getDefaultSeed();
    this.data = seed;
    this.saveLocal();

    if (this.isMongo) {
      await Promise.all([
        models.Setting.deleteMany({}),
        models.Category.deleteMany({}),
        models.Product.deleteMany({}),
        models.Coupon.deleteMany({}),
        models.Order.deleteMany({}),
        models.CorporateLead.deleteMany({}),
        models.ContactInquiry.deleteMany({}),
        models.AdminUser.deleteMany({})
      ]);

      await models.Setting.create(seed.settings);
      await models.AdminUser.insertMany(seed.adminUsers);
      await models.Category.insertMany(seed.categories);
      await models.Product.insertMany(seed.products);
      await models.Coupon.insertMany(seed.coupons);
    }
    return true;
  }
}

module.exports = new StoreDB();
