import React, { useState, useEffect } from 'react';

export default function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('apna_react_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Checkout form state
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: 'Jaipur',
    pincode: '',
    giftMessage: 'Happy Diwali! May this festive season bring immense prosperity, health and sweetness to your home.'
  });

  // Save cart to local storage on change
  useEffect(() => {
    try {
      localStorage.setItem('apna_react_cart', JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  // Fetch live catalog, categories, and settings from MongoDB Express API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes, setRes] = await Promise.all([
          fetch('/api/products').then(r => r.json()).catch(() => null),
          fetch('/api/categories').then(r => r.json()).catch(() => null),
          fetch('/api/settings').then(r => r.json()).catch(() => null)
        ]);

        if (prodRes && prodRes.success && Array.isArray(prodRes.products)) {
          setProducts(prodRes.products);
        }
        if (catRes && catRes.success && Array.isArray(catRes.categories)) {
          setCategories(catRes.categories);
        }
        if (setRes && setRes.success && setRes.settings) {
          setSettings(setRes.settings);
        }
      } catch (err) {
        console.error('Failed to load catalog from API:', err);
      }
    };

    fetchData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [...prev, { ...product, quantity: qty }];
    });
    showToast(`✨ "${product.name}" added to Hamper Cart!`);
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const freeShippingThreshold = settings?.freeShippingThreshold || 5000;
  const shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : (settings?.standardShippingFee || 99);
  const grandTotal = Math.max(0, subtotal - couponDiscount + shippingFee);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), subtotal })
      });
      const data = await res.json();
      if (data.success && data.coupon) {
        setCouponDiscount(data.coupon.discountAmount);
        setCouponError('');
        showToast(`🎉 Coupon "${couponCode.toUpperCase()}" Applied! Saved ₹${data.coupon.discountAmount}`);
      } else {
        setCouponError(data.message || 'Invalid coupon');
        setCouponDiscount(0);
      }
    } catch (e) {
      setCouponError('Could not validate coupon');
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!checkoutForm.name || !checkoutForm.phone || !checkoutForm.address || !checkoutForm.pincode) {
      showToast('⚠️ Please fill in all required address fields.');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const payload = {
        customer: checkoutForm,
        items: cart.map(i => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image
        })),
        subtotal,
        shipping: shippingFee,
        discount: couponDiscount,
        couponApplied: couponDiscount > 0 ? couponCode : null,
        grandTotal,
        paymentMethod: 'upi',
        giftMessage: checkoutForm.giftMessage
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success && data.order) {
        setOrderSuccess(data.order);
        setCart([]);
        setShowCheckout(false);
        setIsCartOpen(false);
        showToast('🎉 Order successfully placed into MongoDB Database!');
      } else {
        showToast(data.message || 'Failed to place order.');
      }
    } catch (err) {
      showToast('Network error while placing order.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.shortDescription && p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  const instagramLink = settings?.instagram || 'https://www.instagram.com/apna.tohfa?cplk=MmRjZDFraWVmbm8y';
  const instagramHandle = settings?.instagramHandle || '@apnatohfa.official';
  const whatsappNumber = settings?.whatsapp || '919950263957';
  const brandPhone = settings?.phone || '+91 9950263957';

  return (
    <div>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'linear-gradient(135deg, #d4a017, #f7d27e)',
          color: '#2a0812',
          padding: '12px 22px',
          borderRadius: '30px',
          fontWeight: '700',
          boxShadow: '0 8px 25px rgba(0,0,0,0.6)',
          zIndex: 9999,
          animation: 'fadeIn 0.3s ease'
        }}>
          {toastMessage}
        </div>
      )}

      {/* Top Announcement Bar */}
      <div className="announcement-bar">
        <span>🪔 {settings?.announcementText || 'Diwali 2026 Festive Collection'}</span>
        <span>•</span>
        <span>Free Pan-India Delivery on ₹{freeShippingThreshold}+</span>
        <span>•</span>
        <span>Use Code <span className="announcement-pill" onClick={() => { setCouponCode('DIWALI2026'); setIsCartOpen(true); }} style={{ cursor: 'pointer' }}>DIWALI2026</span> for 10% OFF</span>
      </div>

      {/* Main Navbar */}
      <nav className="navbar">
        <div className="container navbar-inner">
          <a href="/" className="brand-logo">
            <img src="/assets/images/logo.png" alt="Apna Tohfa" onError={(e) => { e.target.style.display = 'none'; }} />
            <div className="brand-text">
              <h1>{settings?.brandName || 'APNA TOHFA'}</h1>
              <span>{settings?.tagline || 'Apno Ke Naam'}</span>
            </div>
          </a>

          <div className="nav-actions">
            <a href="/admin" className="btn-pill btn-outline" style={{ fontSize: '0.82rem' }}>
              👑 Admin Portal
            </a>
            <a 
              href={`https://wa.me/${whatsappNumber}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-pill btn-outline"
              style={{ display: 'none', md: 'inline-flex' }}
            >
              💬 WhatsApp
            </a>
            <button className="cart-btn" onClick={() => setIsCartOpen(true)}>
              <span>🛍️ Cart</span>
              {cart.length > 0 && <span className="cart-badge">{cart.reduce((s, i) => s + i.quantity, 0)}</span>}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero">
        <div className="container">
          <div className="hero-tag">
            <span>✨ Pure Desi Ghee Sweets • Handcrafted Brass Diyas • Exotic Dry Fruits</span>
          </div>
          <h1 className="hero-title">
            Celebrate Festive Warmth With <br />
            <span className="gold-gradient">Curated Luxury Gift Hampers</span>
          </h1>
          <p className="hero-subtitle">
            Handcrafted with love for your cherished family, friends, and corporate enterprise partners across India.
          </p>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn-pill btn-primary" 
              onClick={() => {
                document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{ fontSize: '1rem', padding: '12px 28px' }}
            >
              Explore Festive Hampers 🎁
            </button>
            <a 
              href={`https://wa.me/${whatsappNumber}?text=Hello%20Apna%20Tohfa,%20I%20want%20to%20inquire%20about%20Corporate%20Gifting%20Hampers`}
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-pill btn-outline"
              style={{ fontSize: '1rem', padding: '12px 24px' }}
            >
              🏢 Corporate Bulk Inquiry
            </a>
          </div>

          <div className="hero-stats">
            <div className="hero-stat-item">
              <h3>100%</h3>
              <p>Pure Desi Ghee Mithai</p>
            </div>
            <div className="hero-stat-item">
              <h3>Pan-India</h3>
              <p>Safe Express Delivery</p>
            </div>
            <div className="hero-stat-item">
              <h3>14+</h3>
              <p>Exclusive Hamper Designs</p>
            </div>
            <div className="hero-stat-item">
              <h3>MongoDB</h3>
              <p>Cloud Scalable Backend</p>
            </div>
          </div>
        </div>
      </header>

      {/* Search & Category Filter Section */}
      <section className="container" id="catalog-section" style={{ paddingTop: '20px' }}>
        {/* Search Bar */}
        <div style={{ margin: '0 auto 20px', maxWidth: '560px', position: 'relative' }}>
          <input
            type="text"
            placeholder="🔍 Search hampers by name, dry fruits, sweets, diyas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: '30px',
              border: '1px solid var(--card-border)',
              background: 'rgba(36, 12, 20, 0.8)',
              color: '#fff',
              fontSize: '0.95rem',
              outline: 'none',
              backdropFilter: 'blur(8px)'
            }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                color: 'var(--text-muted)',
                fontSize: '1rem'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="category-filter">
          <div className="filter-list">
            <button
              className={`filter-pill ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              All Hampers ({products.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`filter-pill ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.icon || '🎁'} {cat.title.split('(')[0].trim()}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Product Catalog Grid */}
      <section className="products-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>Signature Festive Collection</h2>
              <p>Showing {filteredProducts.length} festive hampers available for immediate dispatch</p>
            </div>
          </div>

          <div className="products-grid">
            {filteredProducts.map(product => (
              <div key={product.id} className="product-card">
                <div className="card-img-wrap" onClick={() => setSelectedProduct(product)} style={{ cursor: 'pointer' }}>
                  <img 
                    src={product.image || '/assets/images/apna-tohfa.jpg'} 
                    alt={product.name} 
                    onError={(e) => { e.target.src = '/assets/images/apna-tohfa.jpg'; }}
                    loading="lazy"
                  />
                  {product.badge && <span className="card-badge">{product.badge}</span>}
                  {product.discount && <span className="card-discount">{product.discount}</span>}
                </div>

                <div className="card-body">
                  <div className="card-rating">
                    <span>★ {product.rating || 4.9}</span>
                    <span style={{ color: 'var(--text-muted)' }}>({product.reviewsCount || 120}+ reviews)</span>
                  </div>

                  <h3 className="card-title" onClick={() => setSelectedProduct(product)} style={{ cursor: 'pointer' }}>
                    {product.name}
                  </h3>
                  <p className="card-desc">{product.shortDescription}</p>

                  <div className="card-price-row">
                    <span className="price-current">₹{product.price}</span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="price-original">₹{product.originalPrice}</span>
                    )}
                  </div>

                  <div className="card-actions">
                    <button className="btn-card-add" onClick={() => addToCart(product)}>
                      🛍️ Add to Cart
                    </button>
                    <button className="btn-card-view" onClick={() => setSelectedProduct(product)} title="View Hamper Details">
                      👁️ Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <h3>No hampers found matching your search.</h3>
              <p style={{ marginTop: '10px' }}>Try switching categories or clearing search keywords.</p>
              <button 
                className="btn-pill btn-primary" 
                onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
                style={{ marginTop: '16px' }}
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Hamper Quick View Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="btn-close" 
              onClick={() => setSelectedProduct(null)}
              style={{ position: 'absolute', top: '16px', right: '16px' }}
            >
              ✕
            </button>

            <div className="modal-grid">
              <div>
                <img 
                  src={selectedProduct.image || '/assets/images/apna-tohfa.jpg'} 
                  alt={selectedProduct.name} 
                  className="modal-img"
                  onError={(e) => { e.target.src = '/assets/images/apna-tohfa.jpg'; }}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  {(selectedProduct.images || [selectedProduct.image]).slice(0, 4).map((img, i) => (
                    <img 
                      key={i} 
                      src={img} 
                      alt="" 
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--card-border)' }}
                    />
                  ))}
                </div>
              </div>

              <div>
                {selectedProduct.badge && (
                  <span className="announcement-pill" style={{ marginBottom: '8px', display: 'inline-block' }}>
                    {selectedProduct.badge}
                  </span>
                )}
                <h2 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>{selectedProduct.name}</h2>
                <div className="card-rating" style={{ marginBottom: '14px' }}>
                  <span>★ {selectedProduct.rating || 4.9}</span>
                  <span style={{ color: 'var(--text-muted)' }}>({selectedProduct.reviewsCount || 100}+ customer ratings)</span>
                </div>

                <div className="card-price-row" style={{ marginBottom: '16px' }}>
                  <span className="price-current" style={{ fontSize: '1.7rem' }}>₹{selectedProduct.price}</span>
                  {selectedProduct.originalPrice && (
                    <span className="price-original" style={{ fontSize: '1.1rem' }}>₹{selectedProduct.originalPrice}</span>
                  )}
                  {selectedProduct.discount && (
                    <span style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '0.9rem' }}>
                      {selectedProduct.discount}
                    </span>
                  )}
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '16px' }}>
                  {selectedProduct.fullDescription || selectedProduct.shortDescription}
                </p>

                {/* What's Inside List */}
                {selectedProduct.whatsInside && selectedProduct.whatsInside.length > 0 && (
                  <div className="whats-inside-box">
                    <h4 style={{ fontSize: '0.95rem', color: 'var(--primary-light)', marginBottom: '8px' }}>
                      🎁 What's Inside This Hamper:
                    </h4>
                    {selectedProduct.whatsInside.map((item, idx) => (
                      <div key={idx} className="whats-inside-item">
                        <span>{item.icon || '✨'}</span>
                        <span>{typeof item === 'string' ? item : item.item}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button 
                    className="btn-card-add" 
                    onClick={() => {
                      addToCart(selectedProduct);
                      setSelectedProduct(null);
                    }}
                    style={{ padding: '14px 24px', fontSize: '1rem' }}
                  >
                    🛍️ Add to Cart (₹{selectedProduct.price})
                  </button>
                  <button 
                    className="btn-pill btn-outline" 
                    onClick={() => {
                      addToCart(selectedProduct);
                      setSelectedProduct(null);
                      setIsCartOpen(true);
                    }}
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sliding Cart Drawer */}
      <div className={`cart-overlay ${isCartOpen ? 'open' : ''}`} onClick={() => setIsCartOpen(false)}>
        <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="drawer-header">
            <h3>🛍️ Your Festive Basket ({cart.reduce((s, i) => s + i.quantity, 0)})</h3>
            <button className="btn-close" onClick={() => setIsCartOpen(false)}>✕</button>
          </div>

          {/* Free Shipping Meter */}
          <div style={{ padding: '12px 24px', background: 'rgba(212, 160, 23, 0.08)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
              <span>Pan-India Delivery</span>
              <span style={{ color: 'var(--primary-light)', fontWeight: '700' }}>
                {subtotal >= freeShippingThreshold ? '🎉 FREE DELIVERY UNLOCKED!' : `Add ₹${freeShippingThreshold - subtotal} for FREE Delivery`}
              </span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div 
                style={{
                  height: '100%',
                  width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%`,
                  background: 'linear-gradient(90deg, #d4a017, #f7d27e)',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
          </div>

          <div className="drawer-items">
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '3rem' }}>🎁</span>
                <p style={{ marginTop: '12px' }}>Your basket is currently empty.</p>
                <button 
                  className="btn-pill btn-primary" 
                  onClick={() => setIsCartOpen(false)}
                  style={{ marginTop: '16px' }}
                >
                  Start Gifting
                </button>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="cart-item">
                  <img src={item.image} alt={item.name} onError={(e) => { e.target.src = '/assets/images/apna-tohfa.jpg'; }} />
                  <div className="cart-item-info">
                    <h4 className="cart-item-title">{item.name}</h4>
                    <span className="cart-item-price">₹{item.price} each</span>
                    <div className="cart-item-controls">
                      <button className="btn-qty" onClick={() => updateQuantity(item.id, -1)}>-</button>
                      <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>{item.quantity}</span>
                      <button className="btn-qty" onClick={() => updateQuantity(item.id, 1)}>+</button>
                      <span style={{ marginLeft: 'auto', fontWeight: '700', color: 'var(--primary-light)' }}>
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="drawer-footer">
              {/* Promo Code Input */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <input
                  type="text"
                  placeholder="Promo Code (DIWALI2026)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    color: '#fff',
                    textTransform: 'uppercase',
                    fontSize: '0.85rem'
                  }}
                />
                <button className="btn-pill btn-outline" onClick={applyCoupon} style={{ padding: '8px 14px' }}>
                  Apply
                </button>
              </div>
              {couponError && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginBottom: '8px' }}>{couponError}</p>}
              {couponDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)', fontSize: '0.85rem', marginBottom: '8px' }}>
                  <span>Festive Discount</span>
                  <span>-₹{couponDiscount}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>
                <span>Delivery Fee</span>
                <span>{shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</span>
              </div>

              <div className="subtotal-row">
                <span>Grand Total:</span>
                <span>₹{grandTotal}</span>
              </div>

              <button 
                className="btn-pill btn-primary" 
                onClick={() => {
                  setShowCheckout(true);
                  setIsCartOpen(false);
                }}
                style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem' }}
              >
                Proceed to Checkout (₹{grandTotal}) ➔
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="modal-overlay" onClick={() => setShowCheckout(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <button className="btn-close" onClick={() => setShowCheckout(false)} style={{ position: 'absolute', top: '16px', right: '16px' }}>
              ✕
            </button>

            <h3 style={{ fontSize: '1.4rem', marginBottom: '4px' }}>📦 Delivery & Gifting Details</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Enter delivery recipient address. Your order will be synced directly to MongoDB Atlas.
            </p>

            <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Recipient Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Gupta"
                  value={checkoutForm.name}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--card-border)',
                    color: '#fff'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    10-digit Mobile *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="9950263957"
                    maxLength={10}
                    value={checkoutForm.phone}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value.replace(/\D/g, '') })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--card-border)',
                      color: '#fff'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Email ID (for Invoice)
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={checkoutForm.email}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--card-border)',
                      color: '#fff'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Street / House Address *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Flat No, Building, Landmark, Street"
                  value={checkoutForm.address}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--card-border)',
                    color: '#fff'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={checkoutForm.city}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--card-border)',
                      color: '#fff'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    6-digit PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="302017"
                    value={checkoutForm.pincode}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, pincode: e.target.value.replace(/\D/g, '') })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--card-border)',
                      color: '#fff'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  📜 Personalized Diwali Message Card Note:
                </label>
                <input
                  type="text"
                  value={checkoutForm.giftMessage}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, giftMessage: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--card-border)',
                    color: '#fff'
                  }}
                />
              </div>

              <div style={{ background: 'rgba(212,160,23,0.1)', border: '1px dashed var(--primary)', padding: '12px', borderRadius: '6px', marginTop: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                  <span>Payable Amount:</span>
                  <span style={{ color: 'var(--primary-light)', fontSize: '1.2rem' }}>₹{grandTotal}</span>
                </div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Payment Mode: Instant UPI / Cash on Dispatch</span>
              </div>

              <button
                type="submit"
                disabled={isSubmittingOrder}
                className="btn-pill btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem', marginTop: '10px' }}
              >
                {isSubmittingOrder ? 'Processing Festive Order...' : `Confirm & Place Order (₹${grandTotal}) ✨`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Order Success Modal */}
      {orderSuccess && (
        <div className="modal-overlay" onClick={() => setOrderSuccess(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', textAlign: 'center' }}>
            <span style={{ fontSize: '3.5rem' }}>🎉</span>
            <h2 style={{ fontSize: '1.6rem', margin: '14px 0 6px' }}>Festive Order Confirmed!</h2>
            <p style={{ color: 'var(--primary-light)', fontWeight: '700', fontSize: '1.1rem' }}>
              Order ID: #{orderSuccess.orderId}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '12px 0 20px' }}>
              Thank you, <strong>{orderSuccess.customer?.name}</strong>! Your order has been placed into our MongoDB database and sent to dispatch.
            </p>

            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '8px', textAlign: 'left', fontSize: '0.88rem', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Estimated Delivery:</span>
                <span style={{ fontWeight: '700' }}>{orderSuccess.estimatedDelivery || 'Within 3 Business Days'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Grand Total:</span>
                <span style={{ fontWeight: '700', color: 'var(--primary-light)' }}>₹{orderSuccess.grandTotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <span style={{ color: 'var(--success)', fontWeight: '700' }}>Confirmed ✓</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                className="btn-pill btn-primary"
                onClick={() => setOrderSuccess(null)}
              >
                Continue Shopping
              </button>
              <a 
                href={`https://wa.me/${whatsappNumber}?text=Hi,%20I%20just%20placed%20order%20%23${orderSuccess.orderId}%20on%20Apna%20Tohfa`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-pill btn-outline"
              >
                WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <h4 style={{ fontSize: '1.2rem', color: 'var(--primary-light)', marginBottom: '10px' }}>
              {settings?.brandName || 'APNA TOHFA'}
            </h4>
            <p style={{ fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '16px' }}>
              Crafted with heartfelt love for festive celebrations, royal Indian dry fruit hampers, bespoke brass diyas, and authentic pure desi ghee delights.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <a 
                href={instagramLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-pill btn-outline"
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              >
                📷 {instagramHandle}
              </a>
              <a 
                href={`https://wa.me/${whatsappNumber}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-pill btn-outline"
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              >
                💬 WhatsApp
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Hamper Collections</h4>
            <ul>
              <li><a href="#catalog-section" onClick={() => setActiveCategory('budget')}>Budget Under ₹500</a></li>
              <li><a href="#catalog-section" onClick={() => setActiveCategory('classic')}>Classic Hampers</a></li>
              <li><a href="#catalog-section" onClick={() => setActiveCategory('premium')}>Premium Hampers</a></li>
              <li><a href="#catalog-section" onClick={() => setActiveCategory('luxury')}>Royal Luxury Hampers</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="/admin">Executive Admin Portal</a></li>
              <li><a href={`tel:${brandPhone.replace(/\s+/g, '')}`}>Direct Call Desk</a></li>
              <li><a href="#catalog-section">Track Order</a></li>
              <li><a href={instagramLink} target="_blank" rel="noopener noreferrer">Instagram Showcase</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Festive Care Desk</h4>
            <p style={{ fontSize: '0.85rem', marginBottom: '8px' }}>📍 {settings?.address || 'Malviya Nagar, Jaipur, Rajasthan'}</p>
            <p style={{ fontSize: '0.85rem', marginBottom: '8px' }}>📞 {brandPhone}</p>
            <p style={{ fontSize: '0.85rem', marginBottom: '8px' }}>✉️ {settings?.email || 'apnatohfa26@gmail.com'}</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--primary)' }}>⏰ {settings?.hours || 'Mon – Sun: 9 AM – 9 PM IST'}</p>
          </div>
        </div>

        <div className="container footer-bottom">
          <p>© 2026 {settings?.brandName || 'APNA TOHFA'} — Built with MERN Stack (MongoDB Atlas, Express.js, React.js, Node.js).</p>
        </div>
      </footer>
    </div>
  );
}
