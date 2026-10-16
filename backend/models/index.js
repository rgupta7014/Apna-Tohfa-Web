const mongoose = require('mongoose');

// Admin User Schema
const AdminUserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'superadmin' },
  createdAt: { type: Date, default: Date.now }
});

// Store Settings Schema
const SettingSchema = new mongoose.Schema({
  brandName: { type: String, default: 'APNA TOHFA' },
  tagline: { type: String, default: 'Apno Ke Naam' },
  logo: { type: String, default: 'assets/images/logo.png' },
  phone: { type: String, default: '+91 9950263957' },
  email: { type: String, default: 'apnatohfa26@gmail.com' },
  corporateEmail: { type: String, default: 'apnatohfa26@gmail.com' },
  whatsapp: { type: String, default: '919950263957' },
  address: { type: String, default: 'Malviya Nagar, Jaipur, Rajasthan - 302017' },
  hours: { type: String, default: 'Mon – Sun: 9:00 AM – 9:00 PM IST' },
  instagram: { type: String, default: 'https://instagram.com/apnatohfa.official' },
  instagramHandle: { type: String, default: '@apnatohfa.official' },
  announcementText: { type: String, default: '🪔 Diwali 2026 Festivel' },
  activeCouponPill: { type: String, default: '' },
  freeShippingThreshold: { type: Number, default: 5000 },
  standardShippingFee: { type: Number, default: 99 }
}, { timestamps: true });

// Category Schema
const CategorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  priceTag: { type: String, default: '' },
  minPrice: { type: Number, default: 0 },
  badge: { type: String, default: '' },
  icon: { type: String, default: '🎁' }
});

// Product / Hamper Schema
const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  badge: { type: String, default: '' },
  badgeType: { type: String, default: 'accent' },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  discount: { type: String, default: '' },
  priceSuffix: { type: String, default: '' },
  rating: { type: Number, default: 4.8 },
  reviewsCount: { type: Number, default: 10 },
  shortDescription: { type: String, default: '' },
  fullDescription: { type: String, default: '' },
  image: { type: String, default: 'assets/images/apna-tohfa.jpg' },
  images: [{ type: String }],
  inStock: { type: Boolean, default: true },
  dispatchTime: { type: String, default: 'Ships in 24 Hours' },
  tags: [{ type: String }],
  whatsInside: [{
    item: { type: String },
    icon: { type: String, default: '✨' }
  }],
  customizationOptions: [{ type: String }],
  corporateAvailable: { type: Boolean, default: true },
  isCorporateQuote: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Coupon Schema
const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountPercent: { type: Number, default: 0 },
  discountFlat: { type: Number, default: 0 },
  minSpend: { type: Number, default: 0 },
  label: { type: String, default: '' },
  active: { type: Boolean, default: true },
  usedCount: { type: Number, default: 0 }
});

// Order Schema
const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    pincode: { type: String, required: true },
    giftMessage: { type: String }
  },
  paymentMethod: { type: String, default: 'upi' },
  paymentStatus: { type: String, default: 'Paid' },
  orderStatus: { type: String, default: 'Confirmed' },
  courier: {
    partner: { type: String },
    awb: { type: String },
    trackingUrl: { type: String },
    dispatchedAt: { type: String }
  },
  items: [mongoose.Schema.Types.Mixed],
  subtotal: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  couponApplied: { type: String },
  grandTotal: { type: Number, default: 0 },
  datePlaced: { type: Date, default: Date.now },
  estimatedDelivery: { type: String },
  timeline: [{
    status: { type: String },
    timestamp: { type: Date, default: Date.now },
    note: { type: String }
  }]
});

// Corporate Lead Schema
const CorporateLeadSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  companyName: { type: String, default: 'Corporate Client' },
  contactPerson: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  hampersCount: { type: String, default: '50-99' },
  budget: { type: String, default: 'Standard' },
  city: { type: String, default: 'India' },
  message: { type: String, default: '' },
  status: { type: String, default: 'New' },
  submittedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

// Contact Inquiry Schema
const ContactInquirySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  message: { type: String, required: true },
  status: { type: String, default: 'New' },
  submittedAt: { type: Date, default: Date.now }
});

module.exports = {
  AdminUser: mongoose.models.AdminUser || mongoose.model('AdminUser', AdminUserSchema),
  Setting: mongoose.models.Setting || mongoose.model('Setting', SettingSchema),
  Category: mongoose.models.Category || mongoose.model('Category', CategorySchema),
  Product: mongoose.models.Product || mongoose.model('Product', ProductSchema),
  Coupon: mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema),
  Order: mongoose.models.Order || mongoose.model('Order', OrderSchema),
  CorporateLead: mongoose.models.CorporateLead || mongoose.model('CorporateLead', CorporateLeadSchema),
  ContactInquiry: mongoose.models.ContactInquiry || mongoose.model('ContactInquiry', ContactInquirySchema)
};
