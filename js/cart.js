/**
 * Apna Tohfa - Cart & Checkout Controller
 * Tagline: "Apno Ke Liye, Dil Se."
 */

const APNA_CART = {
  items: [],
  appliedCoupon: null,
  activePaymentMethod: "upi",
  lastPlacedOrder: null,

  init() {
    this.loadFromStorage();
    this.renderDrawer();
    this.renderHeaderCount();
  },

  loadFromStorage() {
    try {
      const stored = localStorage.getItem("apna_tohfa_cart");
      if (stored) {
        this.items = JSON.parse(stored);
      }
      const storedCoupon = localStorage.getItem("apna_tohfa_coupon");
      if (storedCoupon && APNA_DATA.coupons[storedCoupon]) {
        this.appliedCoupon = storedCoupon;
      }
    } catch (e) {
      console.error("Storage error:", e);
      this.items = [];
    }
  },

  saveToStorage() {
    try {
      localStorage.setItem("apna_tohfa_cart", JSON.stringify(this.items));
      if (this.appliedCoupon) {
        localStorage.setItem("apna_tohfa_coupon", this.appliedCoupon);
      } else {
        localStorage.removeItem("apna_tohfa_coupon");
      }
    } catch (e) {
      console.error("Storage error:", e);
    }
    this.renderDrawer();
    this.renderHeaderCount();
  },

  addItem(productId, quantity = 1, customNote = "") {
    const product = APNA_DATA.products.find(p => p.id === productId);
    if (!product) return;

    const existingIndex = this.items.findIndex(item => item.id === productId);
    if (existingIndex > -1) {
      this.items[existingIndex].quantity += quantity;
      if (customNote) this.items[existingIndex].customNote = customNote;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: quantity,
        customNote: customNote || ""
      });
    }

    this.saveToStorage();
    this.bumpCartIcon();
    APNA_APP.showToast(`✨ Added "${product.name}" to your hamper cart!`, "success");
  },

  updateQuantity(productId, newQty) {
    const item = this.items.find(i => i.id === productId);
    if (!item) return;

    if (newQty <= 0) {
      this.removeItem(productId);
    } else {
      item.quantity = newQty;
      this.saveToStorage();
    }
  },

  removeItem(productId) {
    const item = this.items.find(i => i.id === productId);
    const itemName = item ? item.name : "Item";
    this.items = this.items.filter(i => i.id !== productId);
    this.saveToStorage();
    APNA_APP.showToast(`Removed "${itemName}" from cart`);
  },

  clearCart() {
    this.items = [];
    this.appliedCoupon = null;
    this.saveToStorage();
  },

  getTotalItemsCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getSubtotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },

  getShippingFee() {
    const subtotal = this.getSubtotal();
    if (subtotal === 0) return 0;
    return subtotal >= 999 ? 0 : 99; // Free shipping over ₹999
  },

  getDiscount() {
    const subtotal = this.getSubtotal();
    if (!this.appliedCoupon || !APNA_DATA.coupons[this.appliedCoupon]) return 0;

    const rule = APNA_DATA.coupons[this.appliedCoupon];
    if (rule.minSpend && subtotal < rule.minSpend) {
      return 0;
    }

    if (rule.discountPercent) {
      return Math.round((subtotal * rule.discountPercent) / 100);
    } else if (rule.discountFlat) {
      return Math.min(rule.discountFlat, subtotal);
    }
    return 0;
  },

  getGrandTotal() {
    const subtotal = this.getSubtotal();
    if (subtotal === 0) return 0;
    const shipping = this.getShippingFee();
    const discount = this.getDiscount();
    return Math.max(0, subtotal + shipping - discount);
  },

  async applyCouponCode(code) {
    const cleanCode = (code || "").trim().toUpperCase();
    if (!cleanCode) {
      APNA_APP.showToast("Please enter a coupon code", "error");
      return;
    }

    const subtotal = this.getSubtotal();

    // Check backend API first
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode, subtotal })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.appliedCoupon = cleanCode;
        if (!APNA_DATA.coupons[cleanCode]) {
          APNA_DATA.coupons[cleanCode] = {
            discountPercent: data.coupon.discountPercent || 0,
            discountFlat: data.coupon.discountFlat || 0,
            label: data.coupon.label
          };
        }
        this.saveToStorage();
        APNA_APP.showToast(`🎉 Coupon "${cleanCode}" applied successfully!`, "success");
        return;
      } else if (!res.ok && data.message) {
        APNA_APP.showToast(data.message, "error");
        return;
      }
    } catch (e) {
      // Offline fallback
    }

    if (!APNA_DATA.coupons[cleanCode]) {
      APNA_APP.showToast("Invalid coupon code. Try DIWALI2026", "error");
      return;
    }

    const rule = APNA_DATA.coupons[cleanCode];
    if (rule.minSpend && subtotal < rule.minSpend) {
      APNA_APP.showToast(`Minimum order of ₹${rule.minSpend} required for this coupon`, "error");
      return;
    }

    this.appliedCoupon = cleanCode;
    this.saveToStorage();
    APNA_APP.showToast(`🎉 Coupon "${cleanCode}" applied successfully!`, "success");
  },

  removeCoupon() {
    this.appliedCoupon = null;
    this.saveToStorage();
    APNA_APP.showToast("Coupon removed");
  },

  bumpCartIcon() {
    const badge = document.getElementById("headerCartCount");
    if (badge) {
      badge.classList.remove("bump");
      void badge.offsetWidth; // trigger reflow
      badge.classList.add("bump");
    }
  },

  renderHeaderCount() {
    const count = this.getTotalItemsCount();
    const badge = document.getElementById("headerCartCount");
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? "flex" : "none";
    }
  },

  renderDrawer() {
    const container = document.getElementById("cartDrawerItemsList");
    const subtotalEl = document.getElementById("cartSubtotalDisplay");
    const shippingEl = document.getElementById("cartShippingDisplay");
    const discountEl = document.getElementById("cartDiscountDisplay");
    const discountRow = document.getElementById("cartDiscountRow");
    const grandTotalEl = document.getElementById("cartGrandTotalDisplay");
    const freeShippingProgress = document.getElementById("freeShippingProgressFill");
    const freeShippingText = document.getElementById("freeShippingText");
    const checkoutBtn = document.getElementById("cartDrawerCheckoutBtn");

    if (!container) return;

    if (this.items.length === 0) {
      container.innerHTML = `
        <div class="cart-empty-state">
          <div class="cart-empty-icon">🪔</div>
          <h4 style="font-family: var(--font-serif); font-size: 1.15rem; color: var(--maroon-800); margin-bottom: 6px;">Your Hamper Box is Empty</h4>
          <p style="font-size: 0.85rem; margin-bottom: 20px;">Bring light & smiles to your loved ones this Diwali.</p>
          <button class="btn btn-primary btn-sm" onclick="APNA_APP.closeCartDrawer(); APNA_APP.scrollToSection('shop-section');">Explore Hampers</button>
        </div>
      `;
      if (checkoutBtn) checkoutBtn.disabled = true;
    } else {
      if (checkoutBtn) checkoutBtn.disabled = false;
      container.innerHTML = this.items.map(item => `
        <div class="cart-item-row" data-id="${item.id}">
          <img src="${item.image}" alt="${item.name}" class="cart-item-img">
          <div class="cart-item-info">
            <span class="cart-item-name">${item.name}</span>
            <span class="cart-item-price">₹${item.price}</span>
            ${item.customNote ? `<span style="font-size: 0.72rem; color: var(--gold-800); font-style: italic;">Note: "${item.customNote.substring(0, 30)}..."</span>` : ''}
            <div class="cart-item-stepper">
              <button type="button" onclick="APNA_CART.updateQuantity('${item.id}', ${item.quantity - 1})" aria-label="Decrease quantity">−</button>
              <span>${item.quantity}</span>
              <button type="button" onclick="APNA_CART.updateQuantity('${item.id}', ${item.quantity + 1})" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <button type="button" class="cart-item-remove-btn" onclick="APNA_CART.removeItem('${item.id}')" title="Remove hamper" aria-label="Remove item">✕</button>
        </div>
      `).join('');
    }

    const subtotal = this.getSubtotal();
    const shipping = this.getShippingFee();
    const discount = this.getDiscount();
    const grandTotal = this.getGrandTotal();

    if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
    if (shippingEl) shippingEl.textContent = shipping === 0 ? "FREE" : `₹${shipping}`;
    
    if (discountRow && discountEl) {
      if (discount > 0) {
        discountRow.style.display = "flex";
        discountEl.textContent = `-₹${discount}`;
      } else {
        discountRow.style.display = "none";
      }
    }

    if (grandTotalEl) grandTotalEl.textContent = `₹${grandTotal}`;

    // Free shipping threshold (₹999)
    if (freeShippingProgress && freeShippingText) {
      const threshold = 999;
      if (subtotal >= threshold) {
        freeShippingProgress.style.width = "100%";
        freeShippingText.innerHTML = `<span>🎉 <strong>Congratulations!</strong> Free Pan-India Delivery unlocked!</span>`;
      } else {
        const diff = threshold - subtotal;
        const pct = Math.min(100, Math.round((subtotal / threshold) * 100));
        freeShippingProgress.style.width = `${pct}%`;
        freeShippingText.innerHTML = `<span>Add <strong>₹${diff}</strong> more for <strong>FREE Delivery</strong></span> <span>${pct}%</span>`;
      }
    }
  },

  renderCheckoutSummary() {
    const listEl = document.getElementById("checkoutSummaryItems");
    const subtotalEl = document.getElementById("checkoutSubtotal");
    const shippingEl = document.getElementById("checkoutShipping");
    const discountEl = document.getElementById("checkoutDiscount");
    const discountRow = document.getElementById("checkoutDiscountRow");
    const grandTotalEl = document.getElementById("checkoutGrandTotal");
    const btnTotal = document.getElementById("checkoutPlaceOrderBtnTotal");

    if (!listEl) return;

    if (this.items.length === 0) {
      listEl.innerHTML = `<p class="text-muted" style="font-size: 0.85rem; padding: 10px 0;">No hampers in your cart.</p>`;
    } else {
      listEl.innerHTML = this.items.map(item => `
        <div class="summary-item">
          <div style="display: flex; align-items: center; gap: 8px;">
            <img src="${item.image}" alt="${item.name}" style="width: 38px; height: 38px; border-radius: 4px; object-fit: cover;">
            <div>
              <div style="font-weight: 700; color: var(--maroon-900);">${item.name}</div>
              <div style="font-size: 0.75rem; color: var(--dark-500);">Qty: ${item.quantity} × ₹${item.price}</div>
            </div>
          </div>
          <span style="font-weight: 700;">₹${item.price * item.quantity}</span>
        </div>
      `).join('');
    }

    const subtotal = this.getSubtotal();
    const shipping = this.getShippingFee();
    const discount = this.getDiscount();
    const grandTotal = this.getGrandTotal();

    if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
    if (shippingEl) shippingEl.textContent = shipping === 0 ? "FREE" : `₹${shipping}`;

    if (discountRow && discountEl) {
      if (discount > 0) {
        discountRow.style.display = "flex";
        discountEl.textContent = `-₹${discount}`;
      } else {
        discountRow.style.display = "none";
      }
    }

    if (grandTotalEl) grandTotalEl.textContent = `₹${grandTotal}`;
    if (btnTotal) btnTotal.textContent = `₹${grandTotal}`;
  },

  async handleCheckoutSubmit(e) {
    e.preventDefault();
    if (this.items.length === 0) {
      APNA_APP.showToast("Your cart is empty! Add hampers first.", "error");
      return;
    }

    const form = e.target;
    const name = form.fullName.value.trim();
    const phone = form.mobile.value.trim();
    const email = form.email.value.trim();
    const address = form.address.value.trim();
    const city = form.city.value.trim();
    const state = form.state.value;
    const pincode = form.pincode.value.trim();
    const giftMessage = form.giftMessage ? form.giftMessage.value.trim() : "";

    if (!name || !phone || !email || !address || !city || !state || !pincode) {
      APNA_APP.showToast("Please fill in all mandatory delivery fields", "error");
      return;
    }

    if (!/^[0-9]{10}$/.test(phone.replace(/\D/g, ''))) {
      APNA_APP.showToast("Please enter a valid 10-digit mobile number", "error");
      return;
    }

    if (!/^[0-9]{6}$/.test(pincode)) {
      APNA_APP.showToast("Please enter a valid 6-digit Indian pincode", "error");
      return;
    }

    const orderPayload = {
      customer: { name, phone, email, address, city, state, pincode, giftMessage },
      paymentMethod: this.activePaymentMethod,
      items: [...this.items],
      subtotal: this.getSubtotal(),
      shipping: this.getShippingFee(),
      discount: this.getDiscount(),
      grandTotal: this.getGrandTotal(),
      couponApplied: this.appliedCoupon,
      giftMessage
    };

    let placedOrder = null;

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();
      if (res.ok && data.success && data.order) {
        placedOrder = data.order;
      }
    } catch (err) {
      console.warn("Backend unreachable, proceeding with offline order confirmation:", err);
    }

    // Fallback if offline
    if (!placedOrder) {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const orderId = `AT-2026-${randomNum}`;
      const orderDate = new Date();
      const estDeliveryDate = new Date(orderDate.getTime() + (3 * 24 * 60 * 60 * 1000));
      const estDeliveryStr = estDeliveryDate.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
      });

      placedOrder = {
        orderId,
        ...orderPayload,
        estimatedDelivery: estDeliveryStr,
        datePlaced: orderDate.toLocaleDateString("en-IN")
      };
    }

    this.lastPlacedOrder = placedOrder;
    this.clearCart();

    // Show Confirmation Modal
    APNA_APP.showOrderConfirmation(placedOrder);
  }
};
