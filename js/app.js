/**
 * Apna Tohfa - Core Application Controller
 * Brand: APNA TOHFA | Tagline: "Apno Ke Liye, Dil Se."
 */

const APNA_APP = {
  currentCategoryFilter: "all",
  currentSort: "featured",
  selectedProduct: null,
  productModalQty: 1,

  init() {
    this.renderCategories();
    this.renderProducts();
    this.renderCorporateFeatures();
    this.renderPricingTiers();
    this.renderWhyFeatures();
    this.renderHowItWorks();
    this.renderReviews();
    this.renderInstagramFeed();
    this.setupEventListeners();

    // Initialize cart
    APNA_CART.init();

    // Sync live catalog and settings with backend
    this.syncWithBackend();

    // Check URL hash for direct navigation
    this.handleHashChange();
    window.addEventListener("hashchange", () => this.handleHashChange());
  },

  handleHashChange() {
    const hash = window.location.hash.replace("#", "");
    if (hash === "checkout") {
      this.openCheckoutView();
    } else if (hash.startsWith("product-")) {
      const prodId = hash.replace("product-", "");
      this.openProductModal(prodId);
    } else if (hash === "corporate") {
      this.scrollToSection("corporate-section");
    } else if (hash === "shop") {
      this.scrollToSection("shop-section");
    }
  },

  setupEventListeners() {
    // Header Scroll Shadow
    window.addEventListener("scroll", () => {
      const header = document.getElementById("siteHeader");
      if (header) {
        if (window.scrollY > 30) {
          header.classList.add("scrolled");
        } else {
          header.classList.remove("scrolled");
        }
      }
    });

    // Close Modals on ESC key
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeAllModals();
      }
    });

    // Close modals when clicking backdrop
    document.querySelectorAll(".modal-backdrop, .cart-drawer-backdrop, .mobile-nav-backdrop").forEach(backdrop => {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) {
          this.closeAllModals();
        }
      });
    });
  },

  /* --- Render Categories --- */
  renderCategories() {
    const container = document.getElementById("categoriesGrid");
    if (!container) return;

    container.innerHTML = APNA_DATA.categories.map(cat => `
      <div class="category-card" onclick="APNA_APP.filterByCategory('${cat.id}')">
        <div class="category-icon">${cat.icon}</div>
        <h3 class="category-title">${cat.title}</h3>
        <p class="category-subtitle">${cat.subtitle}</p>
        <div class="category-price-tag">
          <span>${cat.priceTag}</span>
          <span class="arrow-icon">→</span>
        </div>
      </div>
    `).join('');
  },

  /* --- Render Products --- */
  renderProducts() {
    const container = document.getElementById("productGridContainer");
    if (!container) return;

    let list = [...APNA_DATA.products];

    // Filter
    if (this.currentCategoryFilter !== "all") {
      if (this.currentCategoryFilter === "under500") {
        list = list.filter(p => p.price <= 500);
      } else {
        list = list.filter(p => p.category === this.currentCategoryFilter);
      }
    }

    // Sort
    if (this.currentSort === "price-low") {
      list.sort((a, b) => a.price - b.price);
    } else if (this.currentSort === "price-high") {
      list.sort((a, b) => b.price - a.price);
    } else if (this.currentSort === "rating") {
      list.sort((a, b) => b.rating - a.rating);
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
          <div style="font-size: 3rem; margin-bottom: 12px;">🪔</div>
          <h3 style="font-family: var(--font-serif); font-size: 1.3rem; color: var(--maroon-800); margin-bottom: 8px;">No Hampers Found</h3>
          <p style="color: var(--dark-500); margin-bottom: 20px;">Try switching category filters to view our full Diwali collection.</p>
          <button class="btn btn-primary btn-sm" onclick="APNA_APP.filterByCategory('all')">View All Hampers</button>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(prod => `
      <div class="product-card" id="card-${prod.id}">
        <div class="product-thumb-wrap">
          <img src="${prod.image}" alt="${prod.name}" class="product-thumb" loading="lazy">
          <div class="product-badge-overlay">
            ${prod.badge ? `<span class="badge badge-${prod.badgeType || 'accent'}">${prod.badge}</span>` : ''}
            ${prod.discount ? `<span class="badge" style="background: rgba(15,10,9,0.75); color: #fff;">${prod.discount}</span>` : ''}
          </div>
          <button class="product-quick-view-btn" onclick="APNA_APP.openProductModal('${prod.id}')">
            Quick View 👁️
          </button>
        </div>

        <div class="product-card-body">
          <div class="product-card-rating">
            <span class="stars-gold">★</span>
            <span style="font-weight: 700; color: var(--dark-900);">${prod.rating}</span>
            <span>(${prod.reviewsCount})</span>
          </div>

          <h3 class="product-card-title">${prod.name}</h3>
          <p class="product-card-desc">${prod.shortDescription}</p>

          <div class="product-card-price-row">
            <span class="price-current">₹${prod.price}${prod.priceSuffix || ''}</span>
            ${prod.originalPrice ? `<span class="price-original">₹${prod.originalPrice}</span>` : ''}
            ${prod.discount ? `<span class="price-discount-tag">${prod.discount}</span>` : ''}
          </div>

          <div class="product-card-actions">
            ${prod.isCorporateQuote ? `
              <button class="btn btn-gold btn-block" onclick="APNA_APP.openCorporateQuoteModal('${prod.name}')">
                Get Quote 🏢
              </button>
              <button class="btn btn-secondary btn-block" onclick="APNA_APP.openProductModal('${prod.id}')">
                Details
              </button>
            ` : `
              <button class="btn btn-primary btn-block" onclick="APNA_CART.addItem('${prod.id}', 1)">
                Add to Cart 🛒
              </button>
              <button class="btn btn-secondary btn-block" onclick="APNA_APP.openProductModal('${prod.id}')">
                View Details
              </button>
            `}
          </div>
        </div>
      </div>
    `).join('');
  },

  /* --- Product Filtering & Sorting --- */
  filterByCategory(catId) {
    this.currentCategoryFilter = catId;

    // Update filter pills UI
    document.querySelectorAll(".filter-pill").forEach(pill => {
      if (pill.dataset.category === catId) {
        pill.classList.add("active");
      } else {
        pill.classList.remove("active");
      }
    });

    this.renderProducts();
    this.scrollToSection("shop-section");
  },

  handleSortChange(e) {
    this.currentSort = e.target.value;
    this.renderProducts();
  },

  /* --- Product Details Modal --- */
  openProductModal(productId) {
    const product = APNA_DATA.products.find(p => p.id === productId);
    if (!product) return;

    this.selectedProduct = product;
    this.productModalQty = 1;

    const modal = document.getElementById("productDetailsModal");
    const container = document.getElementById("productModalContent");

    if (!modal || !container) return;

    container.innerHTML = `
      <div class="modal-product-layout">
        <!-- Left: Image View -->
        <div class="modal-image-col">
          <div class="modal-main-image-wrap">
            <img src="${product.image}" alt="${product.name}" class="modal-main-image" id="modalMainImg">
          </div>
          <div style="display: flex; gap: 8px;">
            <div style="flex: 1; padding: 10px; background: var(--cream-100); border-radius: var(--radius-sm); border: 1px solid var(--cream-300); text-align: center; font-size: 0.785rem; color: var(--maroon-800); font-weight: 700;">
              ✨ ${product.dispatchTime}
            </div>
            <div style="flex: 1; padding: 10px; background: var(--cream-100); border-radius: var(--radius-sm); border: 1px solid var(--cream-300); text-align: center; font-size: 0.785rem; color: var(--maroon-800); font-weight: 700;">
              🪔 100% Festive Freshness
            </div>
          </div>
        </div>

        <!-- Right: Product Info & Actions -->
        <div class="modal-info-col">
          <div style="margin-bottom: 8px;">
            <span class="badge badge-${product.badgeType || 'accent'}">${product.badge}</span>
            <span style="font-size: 0.75rem; color: var(--gold-800); margin-left: 8px; font-weight: 700; text-transform: uppercase;">Diwali 2026 Collection</span>
          </div>

          <h2 class="modal-product-title">${product.name}</h2>

          <div class="modal-product-meta">
            <span class="stars-gold">★★★★★</span>
            <span style="font-weight: 700; color: var(--dark-900);">${product.rating}</span>
            <span>(${product.reviewsCount} customer reviews)</span>
            <span>•</span>
            <span style="color: var(--success-600); font-weight: 600;">✓ In Stock</span>
          </div>

          <div class="modal-price-box">
            <span style="font-size: 1.85rem; font-weight: 800; color: var(--maroon-900);">₹${product.price}${product.priceSuffix || ''}</span>
            ${product.originalPrice ? `<span style="font-size: 1.1rem; color: var(--dark-300); text-decoration: line-through;">₹${product.originalPrice}</span>` : ''}
            ${product.discount ? `<span class="price-discount-tag">${product.discount}</span>` : ''}
            <span style="font-size: 0.75rem; color: var(--dark-500); margin-left: auto;">(Inclusive of all taxes)</span>
          </div>

          <p class="modal-desc">${product.fullDescription}</p>

          <!-- What's Inside Checklist -->
          <div class="whats-inside-box">
            <h4 class="whats-inside-title">
              <span>🎁</span> What's Inside This Hamper:
            </h4>
            <div class="whats-inside-list">
              ${product.whatsInside.map(item => `
                <div class="whats-inside-item">
                  <span class="item-icon">${item.icon}</span>
                  <span>${item.item}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Quantity & CTAs -->
          <div class="modal-actions-row">
            <div class="qty-stepper">
              <button type="button" class="qty-btn" onclick="APNA_APP.adjustModalQty(-1)" aria-label="Decrease quantity">−</button>
              <span class="qty-value" id="modalQtyDisplay">1</span>
              <button type="button" class="qty-btn" onclick="APNA_APP.adjustModalQty(1)" aria-label="Increase quantity">+</button>
            </div>

            <div class="modal-ctas">
              ${product.isCorporateQuote ? `
                <button class="btn btn-gold btn-lg btn-block" onclick="APNA_APP.openCorporateQuoteModal('${product.name}')">
                  Request Corporate Quote 🏢
                </button>
              ` : `
                <button class="btn btn-primary btn-block" onclick="APNA_APP.addCurrentModalToCart()">
                  Add to Cart 🛒
                </button>
                <button class="btn btn-gold btn-block" onclick="APNA_APP.buyNowCurrentModal()">
                  Buy Now ⚡
                </button>
              `}
            </div>
          </div>

          <!-- Delivery Availability / Pincode Check -->
          <div class="pincode-checker-box">
            <div class="pincode-label">
              <span>🚚</span> Check Delivery & Pincode Availability:
            </div>
            <div class="pincode-input-row">
              <input type="text" id="modalPincodeInput" class="pincode-input" placeholder="Enter 6-digit Indian Pincode (e.g. 110001, 400001)" maxlength="6">
              <button type="button" class="btn btn-secondary btn-sm" onclick="APNA_APP.checkPincodeDelivery()">Check</button>
            </div>
            <div id="modalPincodeResult" class="pincode-result"></div>
          </div>

          <!-- Custom Gift Message Option -->
          <div class="custom-options-box">
            <div class="custom-options-title">
              <span>✍️</span> Free Personalized Diwali Greeting Card:
            </div>
            <textarea id="modalGiftNote" class="gift-note-textarea" placeholder="Add your heartfelt message to be printed on an elegant gold-foiled Diwali card (complimentary)..."></textarea>
          </div>

          <!-- Corporate Bulk Nudge -->
          <div class="modal-corp-nudge">
            <div class="modal-corp-text">
              <strong>Need 25+ hampers for your team or clients?</strong><br>
              Get customized logo branding & bulk discounts up to 35%.
            </div>
            <button class="btn btn-sm btn-outline-gold" onclick="APNA_APP.closeAllModals(); APNA_APP.scrollToSection('corporate-section');">
              Corporate Bulk Gifting →
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.add("active");
    document.body.classList.add("no-scroll");
  },

  adjustModalQty(delta) {
    this.productModalQty = Math.max(1, this.productModalQty + delta);
    const display = document.getElementById("modalQtyDisplay");
    if (display) display.textContent = this.productModalQty;
  },

  addCurrentModalToCart() {
    if (!this.selectedProduct) return;
    const noteEl = document.getElementById("modalGiftNote");
    const note = noteEl ? noteEl.value.trim() : "";
    APNA_CART.addItem(this.selectedProduct.id, this.productModalQty, note);
    this.closeAllModals();
    this.openCartDrawer();
  },

  buyNowCurrentModal() {
    if (!this.selectedProduct) return;
    const noteEl = document.getElementById("modalGiftNote");
    const note = noteEl ? noteEl.value.trim() : "";
    APNA_CART.addItem(this.selectedProduct.id, this.productModalQty, note);
    this.closeAllModals();
    this.openCheckoutView();
  },

  checkPincodeDelivery() {
    const input = document.getElementById("modalPincodeInput");
    const result = document.getElementById("modalPincodeResult");
    if (!input || !result) return;

    const pin = input.value.trim();
    if (!/^[0-9]{6}$/.test(pin)) {
      result.className = "pincode-result error";
      result.innerHTML = "⚠️ Please enter a valid 6-digit Indian postal pincode.";
      return;
    }

    if (APNA_DATA.pincodes[pin]) {
      const data = APNA_DATA.pincodes[pin];
      result.className = "pincode-result success";
      result.innerHTML = `✅ <strong>Delivery Available to ${data.city}, ${data.state}!</strong><br>Estimated Delivery: <strong>${data.days}</strong> • Express 24-hr Dispatch Active • Cash on Delivery Available.`;
    } else {
      result.className = "pincode-result success";
      result.innerHTML = `✅ <strong>Delivery Available to Pincode ${pin}!</strong><br>Estimated Delivery: <strong>3-4 Business Days</strong> • Safe Protective Packaging • Tracking Number provided on dispatch.`;
    }
  },

  /* --- Modals & Drawer Management --- */
  openCartDrawer() {
    this.closeAllModals();
    APNA_CART.renderDrawer();
    const drawerBackdrop = document.getElementById("cartDrawerBackdrop");
    if (drawerBackdrop) {
      drawerBackdrop.classList.add("active");
      document.body.classList.add("no-scroll");
    }
  },

  closeCartDrawer() {
    const drawerBackdrop = document.getElementById("cartDrawerBackdrop");
    if (drawerBackdrop) {
      drawerBackdrop.classList.remove("active");
      document.body.classList.remove("no-scroll");
    }
  },

  closeAllModals() {
    document.querySelectorAll(".modal-backdrop, .cart-drawer-backdrop, .mobile-nav-backdrop").forEach(el => {
      el.classList.remove("active");
    });
    document.body.classList.remove("no-scroll");
  },

  toggleMobileNav() {
    const backdrop = document.getElementById("mobileNavBackdrop");
    if (backdrop) {
      backdrop.classList.toggle("active");
      if (backdrop.classList.contains("active")) {
        document.body.classList.add("no-scroll");
      } else {
        document.body.classList.remove("no-scroll");
      }
    }
  },

  /* --- Checkout View --- */
  openCheckoutView() {
    this.closeAllModals();
    const modal = document.getElementById("checkoutModal");
    if (modal) {
      APNA_CART.renderCheckoutSummary();
      modal.classList.add("active");
      document.body.classList.add("no-scroll");
    }
  },

  closeCheckoutView() {
    const modal = document.getElementById("checkoutModal");
    if (modal) {
      modal.classList.remove("active");
      document.body.classList.remove("no-scroll");
    }
  },

  selectPaymentMethod(method) {
    APNA_CART.activePaymentMethod = method;
    document.querySelectorAll(".payment-method-option").forEach(el => {
      if (el.dataset.method === method) {
        el.classList.add("selected");
        const radio = el.querySelector("input[type='radio']");
        if (radio) radio.checked = true;
      } else {
        el.classList.remove("selected");
      }
    });
  },

  showOrderConfirmation(orderData) {
    this.closeAllModals();
    const modal = document.getElementById("orderConfirmationModal");
    const container = document.getElementById("orderConfirmationDetails");

    if (!modal || !container) return;

    container.innerHTML = `
      <div class="confirmation-card">
        <div class="confetti-celebration">🎉🪔✨</div>
        <h2 class="confirmation-title">Your Order is Confirmed!</h2>
        <p class="confirmation-subtitle">Thank you, <strong>${orderData.customer.name}</strong>! Your Diwali hampers are being curated with love and festive devotion.</p>

        <div class="order-badge-row">
          <span>Order ID: <strong>#${orderData.orderId}</strong></span>
          <span>•</span>
          <span>Payment: <strong>${orderData.paymentMethod.toUpperCase()} (Confirmed)</strong></span>
          <span>•</span>
          <span>Estimated Delivery: <strong>${orderData.estimatedDelivery}</strong></span>
        </div>

        <!-- Order Delivery Tracker Timeline -->
        <div class="delivery-timeline">
          <div class="timeline-step completed">
            <div class="timeline-icon-wrap">✓</div>
            <span class="timeline-step-title">Order Placed</span>
            <span class="timeline-step-desc">${orderData.datePlaced}</span>
          </div>
          <div class="timeline-step active">
            <div class="timeline-icon-wrap">🪔</div>
            <span class="timeline-step-title">Artisan Packing</span>
            <span class="timeline-step-desc">Diya & Mithai Quality Check</span>
          </div>
          <div class="timeline-step">
            <div class="timeline-icon-wrap">🚚</div>
            <span class="timeline-step-title">Festive Express</span>
            <span class="timeline-step-desc">Pan-India Dispatch</span>
          </div>
          <div class="timeline-step">
            <div class="timeline-icon-wrap">🎁</div>
            <span class="timeline-step-title">Delivered</span>
            <span class="timeline-step-desc">Smiles Guaranteed</span>
          </div>
        </div>

        <div style="background: var(--cream-100); border: 1px solid var(--cream-300); border-radius: var(--radius-sm); padding: 18px; text-align: left; margin-bottom: 24px;">
          <h4 style="font-family: var(--font-serif); font-size: 1rem; color: var(--maroon-900); margin-bottom: 8px;">Delivery Details:</h4>
          <p style="font-size: 0.85rem; color: var(--dark-700); line-height: 1.5;">
            <strong>Recipient:</strong> ${orderData.customer.name} (${orderData.customer.phone})<br>
            <strong>Address:</strong> ${orderData.customer.address}, ${orderData.customer.city}, ${orderData.customer.state} - ${orderData.customer.pincode}<br>
            ${orderData.customer.giftMessage ? `<strong>Greeting Message:</strong> "${orderData.customer.giftMessage}"<br>` : ''}
            <strong>Total Amount Paid:</strong> ₹${orderData.grandTotal} (${orderData.items.length} hamper items)
          </p>
        </div>

        <div style="display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;">
          <button class="btn btn-primary" onclick="APNA_APP.openTrackingModal('${orderData.orderId}')">
            Track Order Live 📦
          </button>
          <button class="btn btn-secondary" onclick="APNA_APP.closeAllModals(); APNA_APP.scrollToSection('shop-section');">
            Continue Shopping 🛍️
          </button>
        </div>
      </div>
    `;

    modal.classList.add("active");
    document.body.classList.add("no-scroll");
  },

  async syncWithBackend() {
    try {
      const [prodRes, setRes] = await Promise.all([
        fetch('/api/products').then(r => r.json()).catch(() => null),
        fetch('/api/settings').then(r => r.json()).catch(() => null)
      ]);
      if (prodRes && prodRes.success && Array.isArray(prodRes.products) && prodRes.products.length > 0) {
        APNA_DATA.products = prodRes.products;
        this.renderProducts();
      }
      if (setRes && setRes.success && setRes.settings) {
        const s = setRes.settings;
        if (s.phone) APNA_DATA.brand.phone = s.phone;
        if (s.email) APNA_DATA.brand.email = s.email;
        if (s.corporateEmail) APNA_DATA.brand.corporateEmail = s.corporateEmail;
      }
    } catch (e) {
      console.log("Using static data fallback");
    }
  },

  openTrackingModal(orderId = "AT-2026-8492") {
    this.closeAllModals();
    const modal = document.getElementById("trackingModal");
    const input = document.getElementById("trackingInputOrderId");
    if (input) input.value = orderId.replace(/^#/, '');

    if (modal) {
      modal.classList.add("active");
      document.body.classList.add("no-scroll");
      this.trackOrderById(orderId.replace(/^#/, ''));
    }
  },

  async trackOrderById(orderId) {
    const container = document.getElementById("trackingDynamicContainer");
    if (!container) return;

    const cleanId = (orderId || "").trim().toUpperCase();
    if (!cleanId) {
      container.innerHTML = `<div style="text-align: center; color: var(--danger); padding: 20px;">Please enter an Order ID.</div>`;
      return;
    }

    container.innerHTML = `<div style="text-align: center; padding: 30px; color: var(--dark-500);">Fetching live dispatch status for <strong>#${cleanId}</strong>...</div>`;

    try {
      const res = await fetch(`/api/orders/${cleanId}/track`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        container.innerHTML = `
          <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: var(--radius-sm); padding: 18px; text-align: center; margin-bottom: 12px;">
            <div style="font-size: 1.8rem; margin-bottom: 6px;">🔍</div>
            <div style="font-weight: 700; color: var(--maroon-900);">Order #${cleanId} Not Found</div>
            <div style="font-size: 0.82rem; color: var(--dark-500); margin-top: 4px;">
              Please check your 10-character Diwali order number or test with <strong>AT-2026-8492</strong>.
            </div>
          </div>
        `;
        return;
      }

      const status = (data.orderStatus || 'Confirmed').toLowerCase();
      const isConfirmed = true;
      const isPacked = ['packed', 'shipped', 'delivered'].includes(status);
      const isShipped = ['shipped', 'delivered'].includes(status);
      const isDelivered = status === 'delivered';

      container.innerHTML = `
        <!-- Dynamic Timeline -->
        <div class="delivery-timeline" style="margin-bottom: 24px;">
          <div class="timeline-step ${isConfirmed ? 'completed' : ''}">
            <div class="timeline-icon-wrap">✓</div>
            <span class="timeline-step-title">Order Confirmed</span>
            <span class="timeline-step-desc">Payment Verified</span>
          </div>
          <div class="timeline-step ${isPacked ? (isShipped ? 'completed' : 'active') : ''}">
            <div class="timeline-icon-wrap">🪔</div>
            <span class="timeline-step-title">Hamper Packed</span>
            <span class="timeline-step-desc">Diya & Sweet Boxing</span>
          </div>
          <div class="timeline-step ${isShipped ? (isDelivered ? 'completed' : 'active') : ''}">
            <div class="timeline-icon-wrap">🚚</div>
            <span class="timeline-step-title">Express Dispatch</span>
            <span class="timeline-step-desc">${data.courier ? data.courier.name : 'Express Air'}</span>
          </div>
          <div class="timeline-step ${isDelivered ? 'completed active' : ''}">
            <div class="timeline-icon-wrap">🎁</div>
            <span class="timeline-step-title">Delivered</span>
            <span class="timeline-step-desc">Apno Ke Haath</span>
          </div>
        </div>

        <div style="background: var(--cream-100); border: 1px solid var(--cream-300); border-radius: var(--radius-sm); padding: 16px; margin-bottom: 16px; font-size: 0.85rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: var(--dark-500);">Current Dispatch Status:</span>
            <strong style="color: var(--maroon-800); text-transform: uppercase;">${data.orderStatus}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: var(--dark-500);">Recipient & Destination:</span>
            <strong>${data.customerName || 'Customer'} (${data.city || 'India'})</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: var(--dark-500);">Expected Delivery Date:</span>
            <strong style="color: var(--success-600);">${data.estimatedDelivery || 'In 2-3 Business Days'}</strong>
          </div>
          ${data.courier ? `
            <div style="display: flex; justify-content: space-between; padding-top: 6px; border-top: 1px dashed var(--cream-300);">
              <span style="color: var(--dark-500);">Tracking Courier:</span>
              <span>
                <strong>${data.courier.name}</strong> 
                ${data.courier.trackingNumber ? `(AWB: <code>${data.courier.trackingNumber}</code>)` : ''}
              </span>
            </div>
          ` : ''}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="text-align: center; color: var(--danger); padding: 20px;">Could not connect to tracking server.</div>`;
    }
  },

  /* --- Corporate Gifting Section --- */
  renderCorporateFeatures() {
    const container = document.getElementById("corporateFeaturesGrid");
    if (!container) return;

    const feats = [
      { icon: "👥", title: "Employee Gifting", desc: "Celebrate and motivate your workforce with doorstep home deliveries across 100+ cities." },
      { icon: "🤝", title: "Client & Partner Gifting", desc: "Make a prestigious lasting statement with gold-stamped luxury rigid chests and gourmet treats." },
      { icon: "📦", title: "Bulk Orders & Logistics", desc: "Seamless single or multi-address split shipping with real-time enterprise tracking dashboard." },
      { icon: "🎨", title: "Custom Branding & Sleeves", desc: "Your company logo foil-stamped on outer boxes, bespoke greeting cards, and matching ribbons." },
      { icon: "📜", title: "Personalized Leadership Note", desc: "Include custom notes signed by your Founder, CEO, or People Ops team in each hamper." },
      { icon: "💰", title: "GST Invoicing & Volume Tiers", desc: "Complete 18% GST compliant tax invoicing with direct wholesale corporate tier pricing." },
      { icon: "🛡️", title: "100% Zero-Damage Guarantee", desc: "Triple-cushioned transit packaging ensures every fragile diya and sweet arrives pristine." },
      { icon: "⏰", title: "Dedicated Corporate Desk", desc: "One-on-one corporate account manager providing 24/7 priority support and custom sampling." }
    ];

    container.innerHTML = feats.map(f => `
      <div class="corporate-feat-card">
        <div class="corp-feat-icon">${f.icon}</div>
        <h4 class="corp-feat-title">${f.title}</h4>
        <p class="corp-feat-desc">${f.desc}</p>
      </div>
    `).join('');
  },

  renderPricingTiers() {
    const container = document.getElementById("corporatePricingGrid");
    if (!container) return;

    container.innerHTML = APNA_DATA.corporatePricing.map(tier => `
      <div class="pricing-tier-card ${tier.badge === 'Most Popular' ? 'featured' : ''}">
        <div class="tier-range">${tier.range}</div>
        <div class="tier-price">₹${tier.price} <span>/box</span></div>
        <div class="tier-saving-tag">${tier.saving}</div>
        <div class="tier-delivery-text">${tier.delivery}</div>
      </div>
    `).join('');
  },

  handleCorporateInquirySubmit(e) {
    e.preventDefault();
    const form = e.target;
    const company = form.companyName.value.trim();
    const contact = form.contactPerson.value.trim();
    const phone = form.phone.value.trim();
    const email = form.email.value.trim();
    const count = form.hampersCount.value;
    const budget = form.budget.value;
    const city = form.city.value.trim();
    const message = form.message.value.trim();

    if (!company || !contact || !phone || !email || !count) {
      this.showToast("Please fill in all mandatory corporate fields", "error");
      return;
    }

    const leadPayload = {
      companyName: company,
      contactPerson: contact,
      phone,
      email,
      hampersCount: count,
      budget,
      city,
      message
    };

    fetch('/api/corporate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadPayload)
    }).catch(err => console.log('Corporate API sync offline', err));

    form.reset();
    this.showToast(`🎉 Thank you, ${contact}! Our Corporate Desk will contact ${company} within 2 hours with a bespoke proposal.`, "success");

    // Optional direct WhatsApp connect
    setTimeout(() => {
      const waText = encodeURIComponent(`Hi Apna Tohfa! I submitted a corporate inquiry for ${company}. Looking for ${count} hampers (${budget}) for delivery in ${city}. Please share your corporate catalog.`);
      window.open(`https://wa.me/${APNA_DATA.brand.whatsapp}?text=${waText}`, "_blank");
    }, 1200);
  },

  openCorporateQuoteModal(productName = "Corporate Tohfa") {
    this.scrollToSection("corporate-section");
    const reqField = document.getElementById("corpCustomizationReq");
    if (reqField) {
      reqField.value = `Interested in bulk order for "${productName}".`;
      reqField.focus();
    }
  },

  /* --- Why Apna Tohfa --- */
  renderWhyFeatures() {
    const container = document.getElementById("whyGridContainer");
    if (!container) return;

    container.innerHTML = APNA_DATA.features.map(f => `
      <div class="why-card">
        <div class="why-icon">${f.icon}</div>
        <h4 class="why-title">${f.title}</h4>
        <p class="why-desc">${f.description}</p>
      </div>
    `).join('');
  },

  /* --- How It Works --- */
  renderHowItWorks() {
    const container = document.getElementById("howStepsContainer");
    if (!container) return;

    container.innerHTML = APNA_DATA.howItWorks.map(step => `
      <div class="how-step-card">
        <div class="step-num-badge">${step.step}</div>
        <div class="how-icon">${step.icon}</div>
        <h3 class="how-step-title">${step.title}</h3>
        <p class="how-step-desc">${step.description}</p>
      </div>
    `).join('');
  },

  /* --- Testimonials --- */
  renderReviews() {
    const container = document.getElementById("reviewsGridContainer");
    if (!container) return;

    container.innerHTML = APNA_DATA.testimonials.map(rev => `
      <div class="review-card">
        <div class="review-stars">★★★★★</div>
        <p class="review-quote">"${rev.quote}"</p>
        <div class="review-author-wrap">
          <div class="review-avatar-char">${rev.author.charAt(0)}</div>
          <div>
            <div class="review-author-name">${rev.author}</div>
            <div class="review-author-role">${rev.role}${rev.company ? ` • ${rev.company}` : rev.city ? ` • ${rev.city}` : ''}</div>
          </div>
        </div>
      </div>
    `).join('');
  },

  /* --- Instagram Grid --- */
  renderInstagramFeed() {
    const container = document.getElementById("socialGridContainer");
    if (!container) return;

    container.innerHTML = APNA_DATA.instagramFeed.map(item => `
      <div class="social-card" onclick="window.open('https://instagram.com', '_blank')">
        <img src="${item.image}" alt="Apna Tohfa Festive Moment" class="social-img" loading="lazy">
        <div class="social-overlay">
          <div class="social-likes">❤️ ${item.likes} likes</div>
          <div class="social-caption">${item.caption}</div>
        </div>
      </div>
    `).join('');
  },

  /* --- Live Search Modal --- */
  openSearchModal() {
    this.closeAllModals();
    const modal = document.getElementById("searchModal");
    const input = document.getElementById("searchModalInput");
    if (modal) {
      modal.classList.add("active");
      document.body.classList.add("no-scroll");
      if (input) {
        input.value = "";
        setTimeout(() => input.focus(), 100);
        this.handleSearchInput("");
      }
    }
  },

  handleSearchInput(query) {
    const listEl = document.getElementById("searchResultsList");
    if (!listEl) return;

    const q = (query || "").trim().toLowerCase();
    let matches = APNA_DATA.products;

    if (q) {
      matches = APNA_DATA.products.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    if (matches.length === 0) {
      listEl.innerHTML = `<p class="text-muted" style="text-align: center; padding: 20px;">No hampers matched "${query}". Try searching "dry fruits", "budget", "sweets", or "luxury".</p>`;
      return;
    }

    listEl.innerHTML = matches.map(p => `
      <div class="search-result-item" onclick="APNA_APP.closeAllModals(); APNA_APP.openProductModal('${p.id}')">
        <img src="${p.image}" alt="${p.name}" class="search-result-img">
        <div style="flex: 1;">
          <div style="font-family: var(--font-serif); font-weight: 700; color: var(--maroon-900); font-size: 0.95rem;">${p.name}</div>
          <div style="font-size: 0.785rem; color: var(--dark-500);">${p.shortDescription.substring(0, 60)}...</div>
        </div>
        <div style="font-weight: 700; color: var(--maroon-700); font-size: 0.95rem;">₹${p.price}</div>
      </div>
    `).join('');
  },

  /* --- Contact Form Submission --- */
  handleContactSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.name?.value || form.fullName?.value || "Festive Customer";
    const email = form.email?.value || "";
    const phone = form.phone?.value || "";
    const message = form.message?.value || "";

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, message })
    }).catch(err => console.log('Contact sync offline', err));

    this.showToast("🙏 Dhanyawad! Your message has been received. Our team will get back to you promptly.", "success");
    form.reset();
  },

  /* --- Policy Modals --- */
  openPolicyModal(type) {
    this.closeAllModals();
    const modal = document.getElementById("policyModal");
    const titleEl = document.getElementById("policyModalTitle");
    const bodyEl = document.getElementById("policyModalBody");

    if (!modal || !titleEl || !bodyEl) return;

    const policies = {
      shipping: {
        title: "Shipping & Festive Delivery Policy",
        content: `
          <p><strong>1. Pan-India Delivery Coverage:</strong> Apna Tohfa delivers festive gift hampers to over 27,000+ postal pincodes across India via premium express courier partners (BlueDart, Delhivery, DTDC).</p>
          <p><strong>2. Free Shipping Threshold:</strong> All retail orders with subtotal above ₹999 qualify for 100% Free Pan-India Delivery. A flat shipping fee of ₹99 applies on orders below ₹999.</p>
          <p><strong>3. Dispatch Timelines:</strong> Standard hampers are dispatched within 24 hours of order placement. Luxury and customized corporate orders are dispatched as per agreed schedules.</p>
          <p><strong>4. Festive Transit Window:</strong> During Diwali peak season, metro delivery takes 2-3 business days, while non-metro locations take 3-5 business days. Real-time SMS and WhatsApp tracking links are dispatched once your parcel leaves our fulfillment center.</p>
          <p><strong>5. Zero Damage Guarantee:</strong> All fragile clay/brass diyas and sweet boxes are encased in multi-layered honeycomb cushioning. In the rare event of transit damage, we provide immediate instant replacements.</p>
        `
      },
      return: {
        title: "Return & Replacement Policy",
        content: `
          <p><strong>1. Perishable Festive Goods:</strong> Due to the handcrafted, artisanal, and perishable nature of our sweets, dry fruits, and customized packaging, returns are not accepted once delivered in good condition.</p>
          <p><strong>2. Damage or Defect Guarantee:</strong> If your hamper arrives damaged or missing an item, notify us within 24 hours of delivery via WhatsApp at +91 98765 43210 or email namaste@apnatohfa.in with an unboxing photo or video.</p>
          <p><strong>3. Instant Resolution:</strong> We will process an immediate free replacement or issue a full refund to your original payment method within 2-3 business days.</p>
        `
      },
      privacy: {
        title: "Privacy Policy",
        content: `
          <p><strong>1. Data Protection:</strong> We value your trust. Apna Tohfa collects only the necessary details (Name, Contact Number, Email, Delivery Address) strictly to fulfill your orders and keep you updated.</p>
          <p><strong>2. No Third-Party Selling:</strong> We never sell, rent, or lease your personal data or your recipient's contact details to external marketing agencies.</p>
          <p><strong>3. Payment Security:</strong> All financial transactions are processed over encrypted 256-bit SSL connections through RBI-approved payment gateways (Razorpay / Cashfree). Apna Tohfa does not store card CVVs or bank PINs.</p>
        `
      },
      terms: {
        title: "Terms & Conditions",
        content: `
          <p><strong>1. Agreement:</strong> By accessing and ordering through Apna Tohfa, you agree to comply with our festive terms of service and shipping policies.</p>
          <p><strong>2. Product Representation:</strong> While we strive for exact visual presentation, handcrafted brass diyas and sweets may display slight natural variations in texture and artisanal finish.</p>
          <p><strong>3. Corporate Orders:</strong> Bulk corporate quotes are subject to final proforma invoice agreement and inventory lock upon advance clearance.</p>
        `
      },
      refund: {
        title: "Cancellation & Refund Policy",
        content: `
          <p><strong>1. Order Cancellation:</strong> Orders can be cancelled free of charge within 2 hours of placement before transit packaging commences.</p>
          <p><strong>2. Refund Timeline:</strong> Approved cancellations or refund requests are credited back to the original source (UPI, Credit/Debit Card, Net Banking) within 3-5 working days.</p>
        `
      }
    };

    const policy = policies[type] || policies.shipping;
    titleEl.textContent = policy.title;
    bodyEl.innerHTML = policy.content;

    modal.classList.add("active");
    document.body.classList.add("no-scroll");
  },

  /* --- Navigation Utilities --- */
  scrollToSection(sectionId) {
    this.closeAllModals();
    const el = document.getElementById(sectionId);
    if (el) {
      const headerOffset = 70;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  },

  /* --- Toast System --- */
  showToast(message, type = "info") {
    let container = document.getElementById("toastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type === 'success' ? 'toast-success' : ''}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '✨' : '🪔'}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(20px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }
};

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  APNA_APP.init();
});
