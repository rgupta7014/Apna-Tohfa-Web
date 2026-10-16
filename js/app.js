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

    // Re-sync catalog when returning to tab from Admin
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        this.syncWithBackend();
      }
    });

    // Check URL hash for direct navigation
    this.handleHashChange();
    window.addEventListener("hashchange", () => this.handleHashChange());
  },

  getApiUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    if (window.location.protocol === 'file:' || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '3000')) {
      return `http://localhost:3000${cleanUrl}`;
    }
    return cleanUrl;
  },

  async syncWithBackend() {
    // 0. Pre-load from local storage if available for instant render
    const cachedSettings = localStorage.getItem('apna_store_settings');
    if (cachedSettings) {
      try { this.applyStoreSettings(JSON.parse(cachedSettings)); } catch (e) {}
    }
    const cachedProducts = localStorage.getItem('apna_store_products');
    if (cachedProducts) {
      try {
        const parsed = JSON.parse(cachedProducts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          APNA_DATA.products = parsed;
          this.renderProducts();
        }
      } catch (e) {}
    }

    try {
      const [prodRes, catRes, setRes] = await Promise.all([
        fetch(this.getApiUrl('/api/products')).then(r => r.json()).catch(() => null),
        fetch(this.getApiUrl('/api/categories')).then(r => r.json()).catch(() => null),
        fetch(this.getApiUrl('/api/settings')).then(r => r.json()).catch(() => null)
      ]);

      if (prodRes && prodRes.success && Array.isArray(prodRes.products) && prodRes.products.length > 0) {
        APNA_DATA.products = prodRes.products;
        try { localStorage.setItem('apna_store_products', JSON.stringify(prodRes.products)); } catch (e) {}
        this.renderProducts();
      }

      if (catRes && catRes.success && Array.isArray(catRes.categories) && catRes.categories.length > 0) {
        APNA_DATA.categories = catRes.categories;
        this.renderCategories();
      }

      if (setRes && setRes.success && setRes.settings) {
        try { localStorage.setItem('apna_store_settings', JSON.stringify(setRes.settings)); } catch (e) {}
        this.applyStoreSettings(setRes.settings);
      }
    } catch (err) {
      console.warn('Live API sync unavailable, using cached catalog:', err);
    }
  },

  applyStoreSettings(s) {
    if (!s) return;

    // Cache settings in APNA_DATA for cart/other modules
    APNA_DATA.settings = s;

    // 1. Update APNA_DATA.brand in memory
    if (s.brandName) APNA_DATA.brand.name = s.brandName;
    if (s.tagline) APNA_DATA.brand.tagline = s.tagline;
    if (s.logo) APNA_DATA.brand.logo = s.logo;
    if (s.phone) {
      APNA_DATA.brand.phone = s.phone;
      APNA_DATA.brand.phoneDisplay = s.phone;
    }
    if (s.whatsapp) {
      APNA_DATA.brand.whatsapp = s.whatsapp.replace(/\D/g, '');
    }
    if (s.email) APNA_DATA.brand.email = s.email;
    if (s.corporateEmail) APNA_DATA.brand.corporateEmail = s.corporateEmail;
    if (s.address) APNA_DATA.brand.address = s.address;
    if (s.hours) APNA_DATA.brand.hours = s.hours;

    const brand = APNA_DATA.brand;

    // 2. Document Title
    if (s.brandName) {
      document.title = `${s.brandName} | Premium Diwali Gift Hampers & Corporate Gifting | ${s.tagline || brand.tagline}`;
    }

    // 3. Top Announcement Bar
    const annContainer = document.getElementById("announcementTextContainer");
    if (annContainer && s.announcementText) {
      const parts = [`<span><strong>${s.announcementText}</strong></span>`];
      if (s.activeCouponPill && s.activeCouponPill.trim()) {
        const couponCode = s.activeCouponPill.trim();
        parts.push(`<span>Use Code <span class="coupon-pill" id="headerCouponPill" onclick="APNA_CART.applyCouponCode('${couponCode}')" title="Click to apply" style="cursor: pointer;">${couponCode}</span></span>`);
      }
      if (s.freeShippingThreshold) {
        parts.push(`<span id="headerShippingPill">Free Pan-India Delivery on ₹${s.freeShippingThreshold}+</span>`);
      }
      annContainer.innerHTML = parts.join(' <span>•</span> ');
    }
    const heroShip = document.getElementById("heroFreeShippingDisplay");
    if (heroShip && s.freeShippingThreshold) {
      heroShip.textContent = `Free on orders over ₹${s.freeShippingThreshold}`;
    }
    const hPhoneDisp = document.getElementById("headerPhoneDisplay");
    if (hPhoneDisp && s.phone) hPhoneDisp.textContent = s.phone;
    const hPhoneLink = document.getElementById("headerPhoneLink");
    if (hPhoneLink && s.phone) hPhoneLink.href = `tel:${s.phone.replace(/\s+/g, '')}`;

    // 4. Header & Mobile Nav Brand (Logo, Title, Tagline)
    if (s.logo) {
      const siteLogo = document.getElementById("siteBrandLogo");
      if (siteLogo) siteLogo.src = s.logo;
      const mobLogo = document.getElementById("mobileBrandLogo");
      if (mobLogo) mobLogo.src = s.logo;
      const footLogo = document.getElementById("footerBrandLogo");
      if (footLogo) footLogo.src = s.logo;
    }
    if (s.brandName) {
      const bTitle = document.getElementById("brandTitleDisplay");
      if (bTitle) bTitle.textContent = s.brandName;
      const mobBTitle = document.getElementById("mobileBrandTitleDisplay");
      if (mobBTitle) mobBTitle.textContent = s.brandName;
      const footBTitle = document.getElementById("footerBrandTitleDisplay");
      if (footBTitle) footBTitle.textContent = s.brandName;
      const contactTitle = document.getElementById("contactSupportBrandTitle");
      if (contactTitle) contactTitle.textContent = s.brandName;
      const copyBrand = document.getElementById("footerCopyrightBrand");
      if (copyBrand) copyBrand.textContent = s.brandName;
    }
    if (s.tagline) {
      const bTag = document.getElementById("brandTaglineDisplay");
      if (bTag) bTag.textContent = `"${s.tagline}"`;
      const mobBTag = document.getElementById("mobileBrandTaglineDisplay");
      if (mobBTag) mobBTag.textContent = `"${s.tagline}"`;
      const footBTag = document.getElementById("footerBrandTaglineDisplay");
      if (footBTag) footBTag.textContent = `"${s.tagline}"`;
      const heroTag = document.getElementById("heroTitleDisplay");
      if (heroTag) {
        const highlightPart = s.tagline.replace(/^Apno Ke\s*/i, '');
        heroTag.innerHTML = `Apno Ke <span class="festive-highlight">${highlightPart || s.tagline}</span>`;
      }
    }

    // 5. Mobile Nav Footer Helpline
    const mobPhone = document.getElementById("mobileNavPhone");
    if (mobPhone && s.phone) {
      mobPhone.textContent = `📞 ${s.phone}`;
      mobPhone.href = `tel:${s.phone.replace(/\s+/g, '')}`;
    }

    // 6. Support Desk Section
    const cPhoneDisp = document.getElementById("contactPhoneDisplay");
    if (cPhoneDisp && s.phone) cPhoneDisp.textContent = s.phone;
    const cPhoneLink = document.getElementById("contactPhoneLink");
    if (cPhoneLink && s.phone) cPhoneLink.href = `tel:${s.phone.replace(/\s+/g, '')}`;

    const cleanWa = brand.whatsapp;
    const waInquiryMsg = encodeURIComponent(`Hi ${brand.name}! I would like to inquire about Diwali gift hampers.`);
    const cWaLink = document.getElementById("contactWhatsappLink");
    if (cWaLink && cleanWa) cWaLink.href = `https://wa.me/${cleanWa}?text=${waInquiryMsg}`;
    const cWaDisp = document.getElementById("contactWhatsappDisplay");
    if (cWaDisp && (s.phone || cleanWa)) cWaDisp.textContent = s.phone || `+${cleanWa}`;

    const cEmailDisp = document.getElementById("contactEmailDisplay");
    if (cEmailDisp && s.email) cEmailDisp.textContent = s.email;
    const cEmailLink = document.getElementById("contactEmailLink");
    if (cEmailLink && s.email) cEmailLink.href = `mailto:${s.email}`;

    const cCorpDisp = document.getElementById("contactCorpEmailDisplay");
    if (cCorpDisp && s.corporateEmail) cCorpDisp.textContent = s.corporateEmail;
    const cCorpLink = document.getElementById("contactCorpEmailLink");
    if (cCorpLink && s.corporateEmail) cCorpLink.href = `mailto:${s.corporateEmail}`;

    const cAddrDisp = document.getElementById("contactAddressDisplay");
    if (cAddrDisp && s.address) {
      cAddrDisp.textContent = s.address;
    }

    const cHoursDisp = document.getElementById("contactHoursDisplay");
    if (cHoursDisp && s.hours) {
      cHoursDisp.textContent = s.hours;
    }

    // 7. Floating WhatsApp & Footer WhatsApp
    const floatWa = document.getElementById("floatingWhatsappBtn");
    if (floatWa && cleanWa) {
      floatWa.href = `https://wa.me/${cleanWa}?text=${waInquiryMsg}`;
    }
    const footWa = document.getElementById("footerWhatsappBtn");
    if (footWa && cleanWa) {
      footWa.href = `https://wa.me/${cleanWa}`;
    }

    // 8. Checkout Modal Direct WhatsApp
    const coWaLink = document.getElementById("checkoutDirectWhatsappLink");
    if (coWaLink && cleanWa) {
      coWaLink.href = `https://wa.me/${cleanWa}?text=${waInquiryMsg}`;
    }
    const coWaDisp = document.getElementById("checkoutDirectWhatsappDisplay");
    if (coWaDisp && (s.phone || cleanWa)) {
      coWaDisp.textContent = s.phone || `+${cleanWa}`;
    }

    // 9. Social & Instagram Links
    const instaUrl = s.instagram || 'https://instagram.com';
    const instaHandle = s.instagramHandle || '@apnatohfa';

    const footInsta = document.getElementById("footerInstagramBtn");
    if (footInsta) footInsta.href = instaUrl;

    const socInstaBtn = document.getElementById("socialInstagramBtn");
    if (socInstaBtn) socInstaBtn.href = instaUrl;

    const socInstaText = document.getElementById("socialInstagramBtnText");
    if (socInstaText) socInstaText.textContent = `Follow us on Instagram ${instaHandle}`;

    const socInstaTag = document.getElementById("socialInstagramTag");
    if (socInstaTag) socInstaTag.textContent = instaHandle;
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
      const cat = this.currentCategoryFilter.toLowerCase();
      if (cat === "under500" || cat === "budget") {
        list = list.filter(p => p.category === "budget" || p.price <= 500 || (p.tags && p.tags.some(t => t.toLowerCase().includes("budget"))));
      } else if (cat === "classic") {
        list = list.filter(p => p.category === "classic" || (p.price >= 500 && p.price <= 1000) || (p.tags && p.tags.some(t => t.toLowerCase().includes("classic"))));
      } else if (cat === "premium") {
        list = list.filter(p => p.category === "premium" || (p.price >= 1000 && p.price <= 2500) || (p.tags && p.tags.some(t => t.toLowerCase().includes("premium"))));
      } else if (cat === "luxury") {
        list = list.filter(p => p.category === "luxury" || p.price >= 2500 || (p.tags && p.tags.some(t => t.toLowerCase().includes("luxury"))));
      } else if (cat === "corporate") {
        list = list.filter(p => p.category === "corporate" || p.corporateAvailable || (p.tags && p.tags.some(t => t.toLowerCase().includes("corporate"))));
      } else if (cat === "family-combo" || cat === "family") {
        list = list.filter(p => p.category === "family-combo" || (p.tags && p.tags.some(t => t.toLowerCase().includes("family") || t.toLowerCase().includes("combo"))));
      } else if (cat === "mini-baskets" || cat === "small-basket") {
        list = list.filter(p => p.category === "mini-baskets" || p.category === "small-basket" || (p.tags && p.tags.some(t => t.toLowerCase().includes("mini") || t.toLowerCase().includes("small basket"))));
      } else if (cat === "classic-baskets" || cat === "medium-basket") {
        list = list.filter(p => p.category === "classic-baskets" || p.category === "medium-basket" || (p.tags && p.tags.some(t => t.toLowerCase().includes("classic basket") || t.toLowerCase().includes("medium basket"))));
      } else if (cat === "grand-baskets" || cat === "large-basket") {
        list = list.filter(p => p.category === "grand-baskets" || p.category === "large-basket" || (p.tags && p.tags.some(t => t.toLowerCase().includes("grand basket") || t.toLowerCase().includes("large basket"))));
      } else if (cat === "mini-jars" || cat === "small-basket-jar") {
        list = list.filter(p => p.category === "mini-jars" || p.category === "small-basket-jar" || (p.tags && p.tags.some(t => t.toLowerCase().includes("mini jar") || t.toLowerCase().includes("small basket jar"))));
      } else if (cat === "classic-jars" || cat === "medium-jar-basket") {
        list = list.filter(p => p.category === "classic-jars" || p.category === "medium-jar-basket" || (p.tags && p.tags.some(t => t.toLowerCase().includes("classic jar") || t.toLowerCase().includes("medium jar"))));
      } else if (cat === "grand-jars" || cat === "large-jar-basket") {
        list = list.filter(p => p.category === "grand-jars" || p.category === "large-jar-basket" || (p.tags && p.tags.some(t => t.toLowerCase().includes("grand jar") || t.toLowerCase().includes("large jar"))));
      } else {
        const catNormalized = cat.replace(/-/g, ' ');
        const matches = list.filter(p => {
          if (p.category && p.category.toLowerCase() === cat) return true;
          if (p.category && p.category.toLowerCase().replace(/-/g, ' ') === catNormalized) return true;
          if (p.tags && p.tags.some(t => t.toLowerCase().includes(catNormalized) || catNormalized.includes(t.toLowerCase()))) return true;
          return false;
        });
        list = matches.length > 0 ? matches : list;
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
          <div class="product-thumb-backdrop" style="background-image: url('${prod.image}');"></div>
          <img src="${prod.image}" alt="${prod.name}" class="product-thumb" loading="lazy">
          <div class="product-badge-overlay">
            ${prod.badge ? `<span class="badge badge-${prod.badgeType || 'accent'}">${prod.badge}</span>` : ''}
            ${prod.discount ? `<span class="badge" style="background: rgba(15,10,9,0.75); color: #fff;">${prod.discount}</span>` : ''}
          </div>
          ${(prod.images && prod.images.length > 1) ? `
            <span class="product-gallery-badge">📷 ${prod.images.length} Photos</span>
          ` : ''}
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
    if (!productId) return;
    const product = APNA_DATA.products.find(p => p.id === productId || String(p.id) === String(productId));
    if (!product) {
      console.warn('Product not found:', productId);
      return;
    }

    this.selectedProduct = product;
    this.productModalQty = 1;

    const modal = document.getElementById("productDetailsModal");
    const container = document.getElementById("productModalContent");

    if (!modal || !container) return;

    // Robust safety fallbacks
    const mainImg = product.image || (product.images && product.images[0]) || 'assets/images/apna-tohfa.jpg';
    const galleryImages = (Array.isArray(product.images) && product.images.length > 0) ? product.images : [mainImg];
    const badgeText = product.badge || 'Festive Special';
    const badgeType = product.badgeType || 'accent';
    const rating = product.rating || 5.0;
    const reviewsCount = product.reviewsCount || 1;
    const dispatchTime = product.dispatchTime || 'Ships in 24 Hours';
    const shortDesc = product.shortDescription || '';
    const fullDesc = product.fullDescription || shortDesc || 'Handcrafted festive hamper curated for Diwali celebrations.';

    // Normalize whatsInside safely (handles array of strings, array of objects, or empty)
    let whatsInsideItems = [];
    if (Array.isArray(product.whatsInside) && product.whatsInside.length > 0) {
      whatsInsideItems = product.whatsInside.map(item => {
        if (typeof item === 'string') return { item, icon: '✨' };
        return { item: item.item || item.name || '', icon: item.icon || '✨' };
      });
    } else {
      whatsInsideItems = [
        { item: 'Handcrafted Festive Keepsakes & Diyas', icon: '🪔' },
        { item: 'Premium Curated Festive Delights', icon: '🍬' },
        { item: 'Roasted Dry Fruits in Airtight Pack', icon: '🌰' },
        { item: "Gold-Foiled 'Shubh Deepavali' Greeting Card", icon: '📜' },
        { item: 'Festive Keepsake Presentation Box', icon: '🎁' }
      ];
    }

    container.innerHTML = `
      <div class="modal-product-layout">
        <!-- Left: Image View -->
        <div class="modal-image-col">
          <div class="modal-main-image-wrap">
            <div class="modal-image-backdrop" id="modalMainImgBackdrop" style="background-image: url('${mainImg}');"></div>
            <img src="${mainImg}" alt="${product.name}" class="modal-main-image" id="modalMainImg" onerror="this.src='assets/images/apna-tohfa.jpg'">
          </div>
          ${galleryImages.length > 1 ? `
            <div class="modal-gallery-thumbs" id="modalGalleryThumbs">
              ${galleryImages.map((img, idx) => `
                <img src="${img}" alt="${product.name} photo ${idx + 1}" class="modal-gallery-thumb ${idx === 0 ? 'active' : ''}" onclick="APNA_APP.switchModalImageByIndex(${idx}, this)" onerror="this.src='assets/images/apna-tohfa.jpg'">
              `).join('')}
            </div>
          ` : ''}
          <div style="display: flex; gap: 8px; margin-top: 10px;">
            <div style="flex: 1; padding: 10px; background: var(--cream-100); border-radius: var(--radius-sm); border: 1px solid var(--cream-300); text-align: center; font-size: 0.785rem; color: var(--maroon-800); font-weight: 700;">
              ✨ ${dispatchTime}
            </div>
            <div style="flex: 1; padding: 10px; background: var(--cream-100); border-radius: var(--radius-sm); border: 1px solid var(--cream-300); text-align: center; font-size: 0.785rem; color: var(--maroon-800); font-weight: 700;">
              🪔 100% Festive Freshness
            </div>
          </div>
        </div>

        <!-- Right: Product Info & Actions -->
        <div class="modal-info-col">
          <div style="margin-bottom: 8px;">
            <span class="badge badge-${badgeType}">${badgeText}</span>
            <span style="font-size: 0.75rem; color: var(--gold-800); margin-left: 8px; font-weight: 700; text-transform: uppercase;">Diwali 2026 Collection</span>
          </div>

          <h2 class="modal-product-title">${product.name}</h2>

          <div class="modal-product-meta">
            <span class="stars-gold">★★★★★</span>
            <span style="font-weight: 700; color: var(--dark-900);">${rating}</span>
            <span>(${reviewsCount} customer reviews)</span>
            <span>•</span>
            <span style="color: var(--success-600); font-weight: 600;">✓ In Stock</span>
          </div>

          <div class="modal-price-box">
            <span style="font-size: 1.85rem; font-weight: 800; color: var(--maroon-900);">₹${product.price}${product.priceSuffix || ''}</span>
            ${product.originalPrice ? `<span style="font-size: 1.1rem; color: var(--dark-300); text-decoration: line-through;">₹${product.originalPrice}</span>` : ''}
            ${product.discount ? `<span class="price-discount-tag">${product.discount}</span>` : ''}
            <span style="font-size: 0.75rem; color: var(--dark-500); margin-left: auto;">(Inclusive of all taxes)</span>
          </div>

          <p class="modal-desc">${fullDesc}</p>

          <!-- What's Inside Checklist -->
          <div class="whats-inside-box">
            <h4 class="whats-inside-title">
              <span>🎁</span> What's Inside This Hamper:
            </h4>
            <div class="whats-inside-list">
              ${whatsInsideItems.map(item => `
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

  switchModalImageByIndex(idx, clickedEl) {
    if (!this.selectedProduct) return;
    const images = (Array.isArray(this.selectedProduct.images) && this.selectedProduct.images.length > 0)
      ? this.selectedProduct.images
      : [this.selectedProduct.image || 'assets/images/apna-tohfa.jpg'];
    const imgSrc = images[idx] || images[0];
    const main = document.getElementById("modalMainImg");
    if (main && imgSrc) main.src = imgSrc;
    const backdrop = document.getElementById("modalMainImgBackdrop");
    if (backdrop && imgSrc) backdrop.style.backgroundImage = `url('${imgSrc}')`;
    document.querySelectorAll(".modal-gallery-thumb").forEach(t => t.classList.remove("active"));
    if (clickedEl) clickedEl.classList.add("active");
  },

  switchModalImage(imgSrc, clickedEl) {
    const main = document.getElementById("modalMainImg");
    if (main) main.src = imgSrc;
    const backdrop = document.getElementById("modalMainImgBackdrop");
    if (backdrop && imgSrc) backdrop.style.backgroundImage = `url('${imgSrc}')`;
    document.querySelectorAll(".modal-gallery-thumb").forEach(t => t.classList.remove("active"));
    if (clickedEl) clickedEl.classList.add("active");
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

        <div style="background: var(--cream-100); border: 1px solid var(--cream-300); border-radius: var(--radius-sm); padding: 18px; text-align: left; margin-bottom: 20px;">
          <h4 style="font-family: var(--font-serif); font-size: 1rem; color: var(--maroon-900); margin-bottom: 8px;">Delivery Details:</h4>
          <p style="font-size: 0.85rem; color: var(--dark-700); line-height: 1.5;">
            <strong>Recipient:</strong> ${orderData.customer.name} (${orderData.customer.phone})<br>
            <strong>Address:</strong> ${orderData.customer.address}, ${orderData.customer.city}, ${orderData.customer.state} - ${orderData.customer.pincode}<br>
            ${orderData.customer.giftMessage ? `<strong>Greeting Message:</strong> "${orderData.customer.giftMessage}"<br>` : ''}
            <strong>Total Amount:</strong> ₹${orderData.grandTotal} (${orderData.items.length} hamper items)
          </p>
        </div>

        <!-- WhatsApp & Contact Assistance Box -->
        <div style="background: rgba(37,211,102,0.08); border: 1px solid rgba(37,211,102,0.35); border-radius: var(--radius-md); padding: 18px; margin-bottom: 24px; text-align: center;">
          <div style="font-size: 1.15rem; font-weight: 700; color: #128C7E; margin-bottom: 6px;">
            💬 Confirm & Pay via WhatsApp / Phone
          </div>
          <p style="font-size: 0.85rem; color: var(--dark-700); line-height: 1.5; margin-bottom: 14px;">
            We process orders directly via WhatsApp & Phone helpline. Send your order summary to our WhatsApp now to receive our instant payment UPI QR code and dispatch tracking!
          </p>
          <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            ${orderData.whatsappUrl ? `
              <a href="${orderData.whatsappUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp" style="background: #25D366; color: #fff; font-weight: 700; text-decoration: none; padding: 10px 18px; border-radius: 8px; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(37,211,102,0.35);">
                <span>💬</span> Open WhatsApp to Finalize
              </a>
            ` : ''}
            <a href="tel:${(APNA_DATA.brand.phone || '+91 9950263957').replace(/\s+/g, '')}" class="btn btn-secondary" style="padding: 10px 18px; border-radius: 8px; display: inline-flex; align-items: center; gap: 8px;">
              <span>📞</span> Call ${APNA_DATA.brand.phone || '+91 9950263957'}
            </a>
          </div>
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
        <div class="tier-quote-title">${tier.quote}</div>
        <div class="tier-saving-tag">${tier.badge}</div>
        <div class="tier-feature-tag">${tier.feature}</div>
        <div class="tier-delivery-text">${tier.delivery}</div>
        <div style="margin-top: 16px;">
          <a href="https://wa.me/${APNA_DATA.brand.whatsapp}?text=${encodeURIComponent(`Namaste Apna Tohfa! I would like to request a corporate quotation for ${tier.range}.`)}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp btn-sm btn-block" style="background: #25D366; color: #fff; font-weight: 700; text-decoration: none; border: none; padding: 9px 14px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 6px; font-size: 0.82rem; box-shadow: 0 3px 10px rgba(37,211,102,0.3);">
            <span>💬</span> Get Quote on WhatsApp
          </a>
        </div>
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

    const targetInsta = (APNA_DATA && APNA_DATA.brand && APNA_DATA.brand.instagram) || 'https://www.instagram.com/apna.tohfa?cplk=MmRjZDFraWVmbm8y';

    container.innerHTML = APNA_DATA.instagramFeed.map(item => `
      <div class="social-card" onclick="window.open('${targetInsta}', '_blank')">
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
          <p><strong>2. Damage or Defect Guarantee:</strong> If your hamper arrives damaged or missing an item, notify us within 24 hours of delivery via WhatsApp at ${APNA_DATA.brand.phone || '+91 9950263957'} or email ${APNA_DATA.brand.email || 'apnatohfa26@gmail.com'} with an unboxing photo or video.</p>
          <p><strong>3. Instant Resolution:</strong> We will process an immediate free replacement or issue a full refund to your original payment method within 2-3 business days.</p>
        `
      },
      privacy: {
        title: "Privacy Policy",
        content: `
          <p><strong>1. Data Protection:</strong> We value your trust. Apna Tohfa collects only the necessary details (Name, Contact Number, Email, Delivery Address) strictly to fulfill your orders and keep you updated.</p>
          <p><strong>2. No Third-Party Selling:</strong> We never sell, rent, or lease your personal data or your recipient's contact details to external marketing agencies.</p>
          <p><strong>3. Order & Payment Security:</strong> All orders are confirmed directly via WhatsApp or our verified helpline (${APNA_DATA.brand.phone || '+91 9950263957'}). Payments are accepted via direct UPI, QR Code, or Cash on Delivery (COD). Apna Tohfa does not collect or store credit card CVVs or bank PINs on the website.</p>
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
          <p><strong>2. Refund Timeline:</strong> Approved cancellations or refund requests are credited back to your UPI or Bank Account within 2-3 working days.</p>
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
