/**
 * APNA TOHFA - Executive Admin Controller
 * Brand: APNA TOHFA | Tagline: "Apno Ke Liye, Dil Se."
 */

const ADMIN = {
  token: localStorage.getItem('apna_admin_token') || null,
  currentTab: 'dashboard',
  orders: [],
  products: [],
  corporateLeads: [],
  coupons: [],
  settings: {},
  stats: {},
  selectedOrder: null,
  orderFilter: 'all',
  orderSearch: '',
  productFilter: 'all',
  currentProductImages: [],

  init() {
    if (this.token) {
      this.verifySession();
    } else {
      this.showLogin();
    }
  },

  async fetchWithAuth(url, options = {}) {
    options.headers = options.headers || {};
    if (this.token) {
      options.headers['Authorization'] = `Bearer ${this.token}`;
    }
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    try {
      const res = await fetch(url, options);
      const data = await res.json();
      if (res.status === 401) {
        this.logout();
        throw new Error(data.message || 'Session expired. Please log in again.');
      }
      return data;
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
  },

  showLogin() {
    document.getElementById('adminLoginScreen').style.display = 'flex';
    document.getElementById('adminMainLayout').style.display = 'none';
  },

  hideLogin() {
    document.getElementById('adminLoginScreen').style.display = 'none';
    document.getElementById('adminMainLayout').style.display = 'flex';
  },

  fillDemoCredentials() {
    document.getElementById('loginEmail').value = 'admin@apnatohfa.in';
    document.getElementById('loginPassword').value = 'apnaAdmin@2026';
    this.showToast('Demo admin credentials populated!', 'info');
  },

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        this.showToast(data.message || 'Login failed. Invalid credentials.', 'error');
        return;
      }

      this.token = data.token;
      localStorage.setItem('apna_admin_token', this.token);
      if (data.user && data.user.name) {
        const nameEl = document.getElementById('sidebarAdminName');
        if (nameEl) nameEl.textContent = data.user.name;
      }

      this.hideLogin();
      this.showToast('✨ Welcome to Apna Tohfa Control Desk!', 'success');
      this.loadAllData();
    } catch (err) {
      this.showToast('Network error during login', 'error');
    }
  },

  async verifySession() {
    try {
      const data = await this.fetchWithAuth('/api/auth/me');
      if (data.success) {
        if (data.user && data.user.name) {
          const nameEl = document.getElementById('sidebarAdminName');
          if (nameEl) nameEl.textContent = data.user.name;
        }
        this.hideLogin();
        this.loadAllData();
      } else {
        this.showLogin();
      }
    } catch (e) {
      this.showLogin();
    }
  },

  logout() {
    this.token = null;
    localStorage.removeItem('apna_admin_token');
    this.showLogin();
    this.showToast('Logged out of Admin Desk successfully');
  },

  toggleSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    if (sidebar) sidebar.classList.toggle('open');
  },

  switchTab(tabId) {
    this.currentTab = tabId;

    // Update sidebar navigation active state
    document.querySelectorAll('.sidebar-item').forEach(item => {
      item.classList.remove('active');
    });
    const clickedBtn = Array.from(document.querySelectorAll('.sidebar-item')).find(btn =>
      btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(tabId)
    );
    if (clickedBtn) clickedBtn.classList.add('active');

    // Update view panels
    document.querySelectorAll('.tab-content').forEach(panel => {
      panel.classList.remove('active');
    });
    const targetPanel = document.getElementById(`tab-${tabId}`);
    if (targetPanel) targetPanel.classList.add('active');

    // Update Topbar Title
    const titles = {
      dashboard: { title: 'Dashboard Overview', sub: 'Real-time festive orders & logistics tracking' },
      orders: { title: 'Orders & Fulfillment', sub: 'Manage packaging, invoices and express courier tracking' },
      products: { title: 'Hamper Catalog Management', sub: 'Add, update pricing and curate gift box collections' },
      corporate: { title: 'Corporate Bulk Leads', sub: 'High-value B2B inquiries & customized company quotes' },
      coupons: { title: 'Festive Discounts & Offers', sub: 'Create and activate promotional coupon codes' },
      settings: { title: 'Store Settings & Configuration', sub: 'Update top announcements, helpline & store policies' }
    };

    const info = titles[tabId] || titles.dashboard;
    document.getElementById('pageTitleDisplay').textContent = info.title;
    document.getElementById('pageSubDisplay').textContent = info.sub;

    // Close mobile drawer if open
    const sidebar = document.getElementById('adminSidebar');
    if (sidebar) sidebar.classList.remove('open');
  },

  async loadAllData() {
    await Promise.all([
      this.fetchStats(),
      this.fetchOrders(),
      this.fetchProducts(),
      this.fetchCorporateLeads(),
      this.fetchCoupons(),
      this.fetchSettings()
    ]);
  },

  async refreshCurrentData() {
    this.showToast('Refreshing data from server...', 'info');
    await this.loadAllData();
    this.showToast('All records updated!', 'success');
  },

  // --- STATS & DASHBOARD ---
  async fetchStats() {
    try {
      const data = await this.fetchWithAuth('/api/admin/stats');
      if (data.success && data.stats) {
        this.stats = data.stats;
        this.renderDashboard();
      }
    } catch (e) {
      console.error('Error fetching stats:', e);
    }
  },

  renderDashboard() {
    const s = this.stats;
    if (!s) return;

    // KPI values
    document.getElementById('kpiRevenue').textContent = `₹${(s.totalRevenue || 0).toLocaleString('en-IN')}`;
    document.getElementById('kpiOrdersCount').textContent = s.totalOrders || 0;
    document.getElementById('kpiPendingCount').textContent = s.pendingOrders || 0;
    document.getElementById('kpiCorpCount').textContent = s.corporateLeadsCount || 0;
    document.getElementById('kpiShippedText').textContent = `${s.shippedOrders || 0} dispatched, ${s.deliveredOrders || 0} delivered`;

    // Sidebar badges
    const orderBadge = document.getElementById('sidebarOrderCount');
    if (orderBadge) orderBadge.textContent = s.pendingOrders || s.totalOrders || 0;
    const prodBadge = document.getElementById('sidebarProductCount');
    if (prodBadge) prodBadge.textContent = s.productsCount || 0;
    const corpBadge = document.getElementById('sidebarCorpCount');
    if (corpBadge) corpBadge.textContent = s.corporateLeadsCount || 0;

    // Top Selling Hampers
    const topListEl = document.getElementById('dashTopHampersList');
    if (topListEl) {
      if (!s.topSellingHampers || s.topSellingHampers.length === 0) {
        topListEl.innerHTML = `<div style="font-size: 0.85rem; color: var(--text-dim); text-align: center; padding: 16px;">No hampers sold yet.</div>`;
      } else {
        const maxUnits = Math.max(...s.topSellingHampers.map(h => h.units), 1);
        topListEl.innerHTML = s.topSellingHampers.map(h => `
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px;">
              <span style="font-weight: 600; color: #fff;">${h.name}</span>
              <span style="color: var(--gold-400); font-weight: 700;">${h.units} boxes</span>
            </div>
            <div style="height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;">
              <div style="height: 100%; width: ${Math.round((h.units / maxUnits) * 100)}%; background: linear-gradient(90deg, var(--gold-500), #f59e0b); border-radius: 3px;"></div>
            </div>
          </div>
        `).join('');
      }
    }

    // Recent orders in dashboard table
    const recentBody = document.getElementById('dashRecentOrdersBody');
    if (recentBody) {
      if (!s.recentOrders || s.recentOrders.length === 0) {
        recentBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: var(--text-dim);">No recent orders recorded.</td></tr>`;
      } else {
        recentBody.innerHTML = s.recentOrders.map(o => `
          <tr>
            <td><strong style="color: var(--gold-300);">#${o.orderId}</strong></td>
            <td>${o.customerName}</td>
            <td>${o.itemsCount} boxes</td>
            <td><strong style="color: #fff;">₹${(o.grandTotal || 0).toLocaleString('en-IN')}</strong></td>
            <td><span class="status-badge status-${(o.orderStatus || 'confirmed').toLowerCase()}">${o.orderStatus}</span></td>
            <td>
              <button class="btn btn-secondary btn-sm" onclick="ADMIN.openOrderModal('${o.orderId}')">
                View 👁️
              </button>
            </td>
          </tr>
        `).join('');
      }
    }
  },

  // --- ORDERS ---
  async fetchOrders() {
    try {
      const data = await this.fetchWithAuth('/api/admin/orders');
      if (data.success) {
        this.orders = data.orders || [];
        this.renderOrdersTable();
      }
    } catch (e) {
      console.error('Error fetching orders:', e);
    }
  },

  filterOrders(status) {
    this.orderFilter = status;
    document.querySelectorAll('#orderStatusFilters .filter-pill').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(status)) {
        btn.classList.add('active');
      }
    });
    this.renderOrdersTable();
  },

  handleOrderSearch(query) {
    this.orderSearch = (query || '').toLowerCase().trim();
    this.renderOrdersTable();
  },

  renderOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    let list = [...this.orders];

    if (this.orderFilter !== 'all') {
      list = list.filter(o => (o.orderStatus || '').toLowerCase() === this.orderFilter.toLowerCase());
    }

    if (this.orderSearch) {
      list = list.filter(o =>
        o.orderId.toLowerCase().includes(this.orderSearch) ||
        (o.customer?.name && o.customer.name.toLowerCase().includes(this.orderSearch)) ||
        (o.customer?.phone && o.customer.phone.includes(this.orderSearch)) ||
        (o.customer?.city && o.customer.city.toLowerCase().includes(this.orderSearch))
      );
    }

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--text-dim);">No orders matching current filter or search.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(o => {
      const dateStr = o.datePlaced ? new Date(o.datePlaced).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recent';
      const itemsCount = (o.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0);

      return `
        <tr>
          <td><strong style="color: var(--gold-400);">#${o.orderId}</strong></td>
          <td style="font-size: 0.78rem;">${dateStr}</td>
          <td>
            <div style="font-weight: 600; color: #fff;">${o.customer?.name || 'Customer'}</div>
            <div style="font-size: 0.75rem; color: var(--text-dim);">📞 ${o.customer?.phone || 'N/A'}</div>
          </td>
          <td>
            <div style="font-size: 0.85rem;">${o.customer?.city || 'India'}, ${o.customer?.state || ''}</div>
            <div style="font-size: 0.72rem; color: var(--text-dim);">${o.customer?.pincode || ''}</div>
          </td>
          <td><strong style="color: #fff; font-size: 0.95rem;">₹${(o.grandTotal || 0).toLocaleString('en-IN')}</strong></td>
          <td>
            <span style="font-size: 0.75rem; text-transform: uppercase; background: rgba(255,255,255,0.06); padding: 3px 7px; border-radius: 4px;">
              ${o.paymentMethod || 'UPI'}
            </span>
          </td>
          <td>
            <span class="status-badge status-${(o.orderStatus || 'confirmed').toLowerCase()}">
              ${o.orderStatus || 'Confirmed'}
            </span>
          </td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-primary btn-sm" onclick="ADMIN.openOrderModal('${o.orderId}')">
                Manage 📦
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  openOrderModal(orderId) {
    const order = this.orders.find(o => o.orderId.toUpperCase() === orderId.toUpperCase());
    if (!order) return;

    this.selectedOrder = order;

    document.getElementById('orderModalTitle').textContent = `Order #${order.orderId}`;
    const dateFormatted = order.datePlaced ? new Date(order.datePlaced).toLocaleString('en-IN') : 'Recent';
    document.getElementById('orderModalDate').textContent = `Placed on ${dateFormatted} | Mode: ${(order.paymentMethod || 'UPI').toUpperCase()}`;

    const body = document.getElementById('orderModalBody');
    body.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--admin-border); border-radius: var(--radius-md); padding: 14px;">
          <h4 style="font-size: 0.8rem; text-transform: uppercase; color: var(--gold-400); margin-bottom: 8px;">Recipient & Delivery Address</h4>
          <div style="font-weight: 700; color: #fff;">${order.customer?.name}</div>
          <div style="font-size: 0.85rem; color: var(--text-muted);">📞 ${order.customer?.phone} | ✉️ ${order.customer?.email}</div>
          <div style="font-size: 0.85rem; margin-top: 6px; line-height: 1.4;">
            ${order.customer?.address}<br>
            ${order.customer?.city}, ${order.customer?.state} - <strong>${order.customer?.pincode}</strong>
          </div>
        </div>

        <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--admin-border); border-radius: var(--radius-md); padding: 14px;">
          <h4 style="font-size: 0.8rem; text-transform: uppercase; color: var(--gold-400); margin-bottom: 8px;">Fulfillment & Courier Dispatch</h4>
          <div class="form-group" style="margin-bottom: 10px;">
            <label class="form-label" style="font-size: 0.72rem;">Order Status</label>
            <select id="modalOrderStatus" class="form-select" style="padding: 6px 10px; font-size: 0.85rem;">
              <option value="Confirmed" ${order.orderStatus === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="Packed" ${order.orderStatus === 'Packed' ? 'selected' : ''}>Packed (Ready for Dispatch)</option>
              <option value="Shipped" ${order.orderStatus === 'Shipped' ? 'selected' : ''}>Shipped (In Transit)</option>
              <option value="Delivered" ${order.orderStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
              <option value="Cancelled" ${order.orderStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </div>

          <div class="form-row" style="gap: 8px; margin-bottom: 10px;">
            <div>
              <label class="form-label" style="font-size: 0.72rem;">Courier Partner</label>
              <input type="text" id="modalCourierName" class="form-input" style="padding: 6px 10px; font-size: 0.85rem;" placeholder="BlueDart Express" value="${order.courier?.name || 'BlueDart Express'}">
            </div>
            <div>
              <label class="form-label" style="font-size: 0.72rem;">AWB / Tracking No.</label>
              <input type="text" id="modalCourierAWB" class="form-input" style="padding: 6px 10px; font-size: 0.85rem;" placeholder="BD-DEL-984321" value="${order.courier?.trackingNumber || ''}">
            </div>
          </div>

          <button type="button" class="btn btn-primary btn-sm" style="width: 100%;" onclick="ADMIN.updateSelectedOrderStatus()">
            Save Status & Tracking 🚀
          </button>
        </div>
      </div>

      ${order.customer?.giftMessage ? `
        <div style="background: rgba(212,175,55,0.08); border-left: 3px solid var(--gold-500); padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
          <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--gold-400); font-weight: 700;">📜 Gold-Foiled Diwali Greeting Card Message:</div>
          <div style="font-style: italic; font-size: 0.9rem; color: #fff; margin-top: 4px;">"${order.customer.giftMessage}"</div>
        </div>
      ` : ''}

      <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--gold-400); margin-bottom: 10px;">Ordered Hampers (${order.items?.length || 0} items)</h4>
      <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--admin-border); border-radius: var(--radius-md); overflow: hidden; margin-bottom: 20px;">
        <table class="admin-table" style="font-size: 0.82rem;">
          <thead>
            <tr>
              <th>Hamper Item</th>
              <th>Unit Price</th>
              <th>Qty</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${(order.items || []).map(item => `
              <tr>
                <td>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${item.image}" alt="${item.name}" style="width: 36px; height: 36px; border-radius: 4px; object-fit: cover;">
                    <div>
                      <div style="font-weight: 700; color: #fff;">${item.name}</div>
                      ${item.customNote ? `<div style="font-size: 0.72rem; color: var(--gold-400); font-style: italic;">Note: ${item.customNote}</div>` : ''}
                    </div>
                  </div>
                </td>
                <td>₹${item.price}</td>
                <td><strong>${item.quantity}</strong></td>
                <td><strong style="color: var(--gold-300);">₹${item.price * item.quantity}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Financial Totals -->
      <div style="display: flex; justify-content: flex-end;">
        <div style="width: 280px; background: rgba(0,0,0,0.3); border: 1px solid var(--admin-border); border-radius: var(--radius-md); padding: 14px; font-size: 0.85rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: var(--text-dim);">Subtotal:</span>
            <span>₹${order.subtotal}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: var(--text-dim);">Shipping Fee:</span>
            <span>${order.shipping === 0 ? '<strong style="color: var(--success);">FREE</strong>' : `₹${order.shipping}`}</span>
          </div>
          ${order.discount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: var(--gold-400);">
              <span>Discount (${order.couponApplied || 'Promo'}):</span>
              <span>-₹${order.discount}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--admin-border); padding-top: 8px; font-weight: 700; font-size: 1rem; color: #fff;">
            <span>Grand Total:</span>
            <span style="color: var(--gold-400);">₹${order.grandTotal}</span>
          </div>
        </div>
      </div>
    `;

    this.openModal('orderModal');
  },

  async updateSelectedOrderStatus() {
    if (!this.selectedOrder) return;

    const newStatus = document.getElementById('modalOrderStatus').value;
    const courierName = document.getElementById('modalCourierName').value.trim();
    const trackingNumber = document.getElementById('modalCourierAWB').value.trim();

    const courier = trackingNumber ? {
      name: courierName || 'BlueDart Express',
      trackingNumber,
      trackingUrl: courierName.toLowerCase().includes('delhivery') ? 'https://www.delhivery.com' : 'https://www.bluedart.com'
    } : null;

    try {
      const data = await this.fetchWithAuth(`/api/admin/orders/${this.selectedOrder.orderId}/status`, {
        method: 'PATCH',
        body: { status: newStatus, courier, note: `Status updated via Admin Control Desk to ${newStatus}` }
      });

      if (data.success) {
        this.showToast(`Order #${this.selectedOrder.orderId} updated to "${newStatus}"!`, 'success');
        await this.fetchOrders();
        await this.fetchStats();
        this.closeModal('orderModal');
      } else {
        this.showToast(data.message || 'Failed to update order', 'error');
      }
    } catch (e) {
      this.showToast('Network error while updating status', 'error');
    }
  },

  printOrderSlip() {
    if (!this.selectedOrder) return;
    const o = this.selectedOrder;
    const printContainer = document.getElementById('printableInvoice');

    printContainer.innerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #111;">
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #300812; padding-bottom: 16px; margin-bottom: 20px;">
          <div>
            <h1 style="margin: 0; color: #300812; font-size: 24px; font-weight: bold;">APNA TOHFA 🪔</h1>
            <p style="margin: 4px 0 0; font-size: 12px; color: #666;">Apno Ke Liye, Dil Se. | Premium Diwali Hampers</p>
            <p style="margin: 4px 0 0; font-size: 11px; color: #777;">Regal Pavilion, Connaught Place, New Delhi - 110001</p>
            <p style="margin: 2px 0 0; font-size: 11px; color: #777;">GSTIN: 07AAACA0000A1Z5 | Helpline: +91 98765 43210</p>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; font-size: 18px; color: #300812;">PACKING SLIP & TAX INVOICE</h2>
            <p style="margin: 4px 0 0; font-size: 13px; font-weight: bold;">Invoice No: INV-${o.orderId}</p>
            <p style="margin: 2px 0 0; font-size: 12px;">Order ID: <strong>#${o.orderId}</strong></p>
            <p style="margin: 2px 0 0; font-size: 12px;">Date: ${new Date(o.datePlaced || Date.now()).toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 24px; background: #fdfaf6; padding: 14px; border: 1px solid #eee;">
          <div style="width: 48%;">
            <strong style="font-size: 12px; color: #300812; text-transform: uppercase;">Ship To (Recipient):</strong>
            <div style="font-size: 13px; font-weight: bold; margin-top: 4px;">${o.customer?.name}</div>
            <div style="font-size: 12px; margin-top: 2px;">${o.customer?.address}</div>
            <div style="font-size: 12px;">${o.customer?.city}, ${o.customer?.state} - <strong>${o.customer?.pincode}</strong></div>
            <div style="font-size: 12px; margin-top: 4px;">Phone: <strong>${o.customer?.phone}</strong></div>
          </div>
          <div style="width: 48%;">
            <strong style="font-size: 12px; color: #300812; text-transform: uppercase;">Logistics Dispatch Details:</strong>
            <div style="font-size: 12px; margin-top: 4px;">Courier: <strong>${o.courier?.name || 'BlueDart Express'}</strong></div>
            <div style="font-size: 12px;">AWB Tracking: <strong>${o.courier?.trackingNumber || 'Pending Allocation'}</strong></div>
            <div style="font-size: 12px;">Payment Status: <strong>PAID (${(o.paymentMethod || 'UPI').toUpperCase()})</strong></div>
            <div style="font-size: 12px;">Delivery Window: <strong>${o.estimatedDelivery}</strong></div>
          </div>
        </div>

        ${o.customer?.giftMessage ? `
          <div style="margin-bottom: 20px; padding: 12px; border: 1px dashed #d4af37; background: #fffdf5;">
            <strong style="font-size: 11px; text-transform: uppercase; color: #855f00;">Enclosed Greeting Card Wish:</strong>
            <p style="margin: 4px 0 0; font-size: 13px; font-style: italic;">"${o.customer.giftMessage}"</p>
          </div>
        ` : ''}

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
          <thead>
            <tr style="background: #300812; color: #fff;">
              <th style="padding: 8px; text-align: left;">S.No</th>
              <th style="padding: 8px; text-align: left;">Hamper Box Description</th>
              <th style="padding: 8px; text-align: center;">Qty</th>
              <th style="padding: 8px; text-align: right;">Unit Price (₹)</th>
              <th style="padding: 8px; text-align: right;">Total Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${(o.items || []).map((item, idx) => `
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px;">${idx + 1}</td>
                <td style="padding: 8px;">
                  <strong>${item.name}</strong>
                  ${item.customNote ? `<br><small style="color: #666;">Note: ${item.customNote}</small>` : ''}
                </td>
                <td style="padding: 8px; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px; text-align: right;">₹${item.price}</td>
                <td style="padding: 8px; text-align: right;">₹${item.price * item.quantity}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
          <table style="width: 250px; font-size: 12px;">
            <tr><td style="padding: 4px 0;">Subtotal:</td><td style="text-align: right;">₹${o.subtotal}</td></tr>
            <tr><td style="padding: 4px 0;">Delivery Charges:</td><td style="text-align: right;">${o.shipping === 0 ? 'FREE' : '₹' + o.shipping}</td></tr>
            ${o.discount > 0 ? `<tr><td style="padding: 4px 0; color: #855f00;">Discount (${o.couponApplied || 'Coupon'}):</td><td style="text-align: right; color: #855f00;">-₹${o.discount}</td></tr>` : ''}
            <tr style="border-top: 2px solid #300812; font-weight: bold; font-size: 14px;"><td style="padding: 6px 0;">Grand Total:</td><td style="text-align: right;">₹${o.grandTotal}</td></tr>
          </table>
        </div>

        <div style="border-top: 1px solid #ccc; padding-top: 14px; text-align: center; font-size: 11px; color: #777;">
          <p>Thank you for choosing Apna Tohfa for your festive gifting! Wishing you and your loved ones a very Happy Diwali! 🪔✨</p>
          <p>Authorized Signatory: Apna Tohfa Central Dispatch Desk | Computer Generated Document</p>
        </div>
      </div>
    `;

    window.print();
  },

  // --- PRODUCTS ---
  async fetchProducts() {
    try {
      const data = await this.fetchWithAuth('/api/products');
      if (data.success) {
        this.products = data.products || [];
        this.renderProductsGrid();
      }
    } catch (e) {
      console.error('Error fetching products:', e);
    }
  },

  filterProducts(category) {
    this.productFilter = category;
    document.querySelectorAll('#productCategoryFilters .filter-pill').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(category)) {
        btn.classList.add('active');
      }
    });
    this.renderProductsGrid();
  },

  renderProductsGrid() {
    const container = document.getElementById('productsAdminGrid');
    if (!container) return;

    let list = [...this.products];
    if (this.productFilter !== 'all') {
      list = list.filter(p => p.category === this.productFilter);
    }

    if (list.length === 0) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-dim);">No hampers in this category.</div>`;
      return;
    }

    container.innerHTML = list.map(p => `
      <div class="product-admin-card" id="admin-card-${p.id}">
        <div class="product-admin-img-wrap">
          <img src="${p.image}" alt="${p.name}" class="product-admin-img">
          <div class="product-admin-badge">${p.category.toUpperCase()}</div>
          ${!p.inStock ? `<div style="position: absolute; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; color: var(--danger); font-weight: 700;">SOLD OUT</div>` : ''}
        </div>
        <div class="product-admin-body">
          <h4 class="product-admin-title">${p.name}</h4>
          <p class="product-admin-desc">${p.shortDescription || ''}</p>
          <div class="product-admin-price-row">
            <span class="product-price-current">₹${p.price}</span>
            ${p.originalPrice ? `<span class="product-price-orig">₹${p.originalPrice}</span>` : ''}
            ${p.discount ? `<span style="font-size: 0.72rem; color: var(--gold-400); font-weight: 600;">${p.discount}</span>` : ''}
          </div>
          <div class="product-admin-actions">
            <button class="btn btn-secondary btn-sm" onclick="ADMIN.openEditProductModal('${p.id}')">
              ✏️ Edit
            </button>
            <button class="btn ${p.inStock ? 'btn-secondary' : 'btn-primary'} btn-sm" onclick="ADMIN.toggleProductStock('${p.id}')" title="Toggle Stock Status">
              ${p.inStock ? 'In Stock ✓' : 'Mark In Stock'}
            </button>
            <button class="btn btn-danger btn-sm" onclick="ADMIN.deleteProduct('${p.id}')" title="Delete Hamper">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `).join('');
  },

  /* --- Hamper Images Manager --- */
  renderProductImagePreviews() {
    const grid = document.getElementById('prodImagePreviewGrid');
    const countEl = document.getElementById('prodImageCount');
    const hiddenInput = document.getElementById('prodImage');
    if (!grid) return;

    if (countEl) countEl.textContent = this.currentProductImages.length;
    if (hiddenInput) {
      hiddenInput.value = this.currentProductImages[0] || 'assets/images/apna-tohfa.jpg';
    }

    if (!this.currentProductImages.length) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 14px; color: var(--text-dim); font-size: 0.8rem;">
          No images attached yet. Click the upload box above or paste a URL!
        </div>
      `;
      return;
    }

    grid.innerHTML = this.currentProductImages.map((src, idx) => `
      <div class="image-preview-card ${idx === 0 ? 'primary' : ''}">
        ${idx === 0 ? '<span class="image-card-badge">Cover</span>' : ''}
        <img src="${src}" alt="Photo ${idx + 1}" onerror="this.src='assets/images/apna-tohfa.jpg'">
        <div class="image-card-actions">
          ${idx !== 0 ? `
            <button type="button" class="image-action-btn" title="Make Primary Cover" onclick="ADMIN.makeProductImagePrimary(${idx})">
              ★ Set Cover
            </button>
          ` : ''}
          <button type="button" class="image-action-btn delete" title="Remove Photo" onclick="ADMIN.removeProductImage(${idx})">
            ✕ Delete
          </button>
        </div>
      </div>
    `).join('');
  },

  handleImageFileUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    let loaded = 0;
    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        this.showToast(`Skipped non-image file: ${file.name}`, 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const dataUrl = loadEvent.target.result;
        this.currentProductImages.push(dataUrl);
        loaded++;
        if (loaded === files.length) {
          this.renderProductImagePreviews();
          this.showToast(`Uploaded ${files.length} photo(s) from device!`, 'success');
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  },

  addImageFromUrl() {
    const input = document.getElementById('prodImageUrlInput');
    if (!input) return;
    const url = input.value.trim();
    if (!url) {
      this.showToast('Please enter an image URL or relative path', 'error');
      return;
    }
    this.currentProductImages.push(url);
    input.value = '';
    this.renderProductImagePreviews();
    this.showToast('Added image to hamper photos!', 'success');
  },

  addImagePreset(presetUrl) {
    this.currentProductImages.push(presetUrl);
    this.renderProductImagePreviews();
    this.showToast('Preset photo added!', 'success');
  },

  makeProductImagePrimary(index) {
    if (index <= 0 || index >= this.currentProductImages.length) return;
    const picked = this.currentProductImages.splice(index, 1)[0];
    this.currentProductImages.unshift(picked);
    this.renderProductImagePreviews();
    this.showToast('Cover photo updated!', 'success');
  },

  removeProductImage(index) {
    if (this.currentProductImages.length <= 1) {
      this.showToast('A hamper must have at least one image!', 'error');
      return;
    }
    this.currentProductImages.splice(index, 1);
    this.renderProductImagePreviews();
  },

  openAddProductModal() {
    document.getElementById('productModalTitle').textContent = 'Add New Festive Hamper';
    document.getElementById('productForm').reset();
    document.getElementById('prodEditId').value = '';
    this.currentProductImages = ['assets/images/apna-tohfa.jpg'];
    this.renderProductImagePreviews();
    this.openModal('productModal');
  },

  openEditProductModal(productId) {
    const p = this.products.find(item => item.id === productId);
    if (!p) return;

    document.getElementById('productModalTitle').textContent = `Edit Hamper: ${p.name}`;
    document.getElementById('prodEditId').value = p.id;
    document.getElementById('prodName').value = p.name;
    document.getElementById('prodCategory').value = p.category;
    document.getElementById('prodPrice').value = p.price;
    document.getElementById('prodOrigPrice').value = p.originalPrice || '';
    document.getElementById('prodBadge').value = p.badge || '';
    document.getElementById('prodDispatch').value = p.dispatchTime || 'Ships in 24 Hours';
    document.getElementById('prodShortDesc').value = p.shortDescription || '';
    document.getElementById('prodFullDesc').value = p.fullDescription || '';
    document.getElementById('prodTags').value = (p.tags || []).join(', ');

    if (Array.isArray(p.images) && p.images.length > 0) {
      this.currentProductImages = [...p.images];
    } else if (p.image) {
      this.currentProductImages = [p.image];
    } else {
      this.currentProductImages = ['assets/images/apna-tohfa.jpg'];
    }
    this.renderProductImagePreviews();

    this.openModal('productModal');
  },

  async saveProduct(e) {
    e.preventDefault();
    const editId = document.getElementById('prodEditId').value;
    const name = document.getElementById('prodName').value.trim();
    const category = document.getElementById('prodCategory').value;
    const price = Number(document.getElementById('prodPrice').value);
    const originalPrice = Number(document.getElementById('prodOrigPrice').value) || price;
    const badge = document.getElementById('prodBadge').value.trim();
    const dispatchTime = document.getElementById('prodDispatch').value.trim() || 'Ships in 24 Hours';
    const shortDescription = document.getElementById('prodShortDesc').value.trim();
    const fullDescription = document.getElementById('prodFullDesc').value.trim();
    const tagsStr = document.getElementById('prodTags').value.trim();
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()) : [];

    const images = this.currentProductImages.length ? this.currentProductImages : ['assets/images/apna-tohfa.jpg'];
    const image = images[0];

    const payload = {
      name,
      category,
      price,
      originalPrice,
      badge,
      badgeType: category === 'luxury' ? 'royal' : category === 'corporate' ? 'corporate' : 'bestseller',
      dispatchTime,
      image,
      images,
      shortDescription,
      fullDescription: fullDescription || shortDescription,
      tags,
      discount: originalPrice > price ? `${Math.round(((originalPrice - price) / originalPrice) * 100)}% OFF` : ''
    };

    try {
      let data;
      if (editId) {
        data = await this.fetchWithAuth(`/api/admin/products/${editId}`, {
          method: 'PUT',
          body: payload
        });
      } else {
        data = await this.fetchWithAuth('/api/admin/products', {
          method: 'POST',
          body: payload
        });
      }

      if (data.success) {
        this.showToast(data.message || 'Hamper saved successfully!', 'success');
        this.closeModal('productModal');
        await this.fetchProducts();
        await this.fetchStats();
      } else {
        this.showToast(data.message || 'Failed to save product', 'error');
      }
    } catch (e) {
      this.showToast('Network error while saving product', 'error');
    }
  },

  async toggleProductStock(productId) {
    try {
      const data = await this.fetchWithAuth(`/api/admin/products/${productId}/stock`, {
        method: 'PATCH'
      });
      if (data.success) {
        this.showToast(data.message, 'success');
        await this.fetchProducts();
      }
    } catch (e) {
      this.showToast('Failed to toggle stock status', 'error');
    }
  },

  async deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this hamper from the store?')) return;

    try {
      const data = await this.fetchWithAuth(`/api/admin/products/${productId}`, {
        method: 'DELETE'
      });
      if (data.success) {
        this.showToast('Hamper removed from catalog', 'success');
        await this.fetchProducts();
        await this.fetchStats();
      }
    } catch (e) {
      this.showToast('Failed to delete product', 'error');
    }
  },

  // --- CORPORATE LEADS ---
  async fetchCorporateLeads() {
    try {
      const data = await this.fetchWithAuth('/api/admin/corporate');
      if (data.success) {
        this.corporateLeads = data.leads || [];
        this.renderCorporateLeadsTable();
      }
    } catch (e) {
      console.error('Error fetching leads:', e);
    }
  },

  renderCorporateLeadsTable() {
    const tbody = document.getElementById('corporateLeadsBody');
    if (!tbody) return;

    if (this.corporateLeads.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--text-dim);">No corporate leads recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.corporateLeads.map(lead => {
      const dateStr = lead.submittedAt ? new Date(lead.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent';
      const cleanPhone = (lead.phone || '').replace(/\D/g, '');
      const waLink = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Namaste ${lead.contactPerson}! Regarding your corporate Diwali hamper inquiry for ${lead.companyName} at Apna Tohfa...`)}`;
      const mailLink = `mailto:${lead.email}?subject=${encodeURIComponent(`Apna Tohfa Diwali Proposal for ${lead.companyName}`)}`;

      return `
        <tr>
          <td style="font-size: 0.78rem;">${dateStr}</td>
          <td><strong style="color: #fff;">${lead.companyName}</strong></td>
          <td>${lead.contactPerson}</td>
          <td>
            <div style="font-size: 0.82rem;">📞 ${lead.phone}</div>
            <div style="font-size: 0.75rem; color: var(--text-dim);">✉️ ${lead.email}</div>
          </td>
          <td><span style="font-weight: 700; color: var(--gold-400);">${lead.hampersCount} boxes</span></td>
          <td>${lead.budget || 'Custom'}</td>
          <td>
            <select class="form-select" style="padding: 4px 8px; font-size: 0.75rem; width: 130px;" onchange="ADMIN.updateLeadStatus('${lead.id}', this.value)">
              <option value="New" ${lead.status === 'New' ? 'selected' : ''}>New</option>
              <option value="In Discussion" ${lead.status === 'In Discussion' ? 'selected' : ''}>In Discussion</option>
              <option value="Proposal Sent" ${lead.status === 'Proposal Sent' ? 'selected' : ''}>Proposal Sent</option>
              <option value="Won / Closed" ${lead.status === 'Won / Closed' ? 'selected' : ''}>Won / Closed</option>
              <option value="Declined" ${lead.status === 'Declined' ? 'selected' : ''}>Declined</option>
            </select>
          </td>
          <td>
            <div style="display: flex; gap: 6px;">
              <a href="${waLink}" target="_blank" class="btn btn-secondary btn-sm" title="Chat on WhatsApp" style="color: #10b981; border-color: rgba(16,185,129,0.3);">
                💬 WA
              </a>
              <a href="${mailLink}" class="btn btn-secondary btn-sm" title="Send Email Proposal">
                ✉️ Mail
              </a>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  async updateLeadStatus(leadId, newStatus) {
    try {
      const data = await this.fetchWithAuth(`/api/admin/corporate/${leadId}/status`, {
        method: 'PATCH',
        body: { status: newStatus }
      });
      if (data.success) {
        this.showToast(`Lead status updated to "${newStatus}"!`, 'success');
      }
    } catch (e) {
      this.showToast('Failed to update lead status', 'error');
    }
  },

  // --- COUPONS ---
  async fetchCoupons() {
    try {
      const data = await this.fetchWithAuth('/api/admin/coupons');
      if (data.success) {
        this.coupons = data.coupons || [];
        this.renderCouponsTable();
      }
    } catch (e) {
      console.error('Error fetching coupons:', e);
    }
  },

  renderCouponsTable() {
    const tbody = document.getElementById('couponsTableBody');
    if (!tbody) return;

    if (this.coupons.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--text-dim);">No promo coupons active.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.coupons.map(c => `
      <tr>
        <td>
          <span style="font-family: monospace; font-size: 0.95rem; font-weight: 700; color: var(--gold-300); background: rgba(212,175,55,0.1); padding: 4px 10px; border-radius: 4px; border: 1px dashed var(--gold-500);">
            ${c.code}
          </span>
          <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 4px;">${c.label || ''}</div>
        </td>
        <td>
          <strong>${c.discountPercent > 0 ? `${c.discountPercent}% OFF` : `Flat ₹${c.discountFlat} OFF`}</strong>
        </td>
        <td>${c.minSpend > 0 ? `₹${c.minSpend}` : 'No minimum'}</td>
        <td>${c.usedCount || 0} times</td>
        <td>
          <span class="status-badge ${c.active ? 'status-delivered' : 'status-cancelled'}">
            ${c.active ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm" onclick="ADMIN.toggleCoupon('${c.code}')">
              ${c.active ? 'Deactivate' : 'Activate'}
            </button>
            <button class="btn btn-danger btn-sm" onclick="ADMIN.deleteCoupon('${c.code}')" title="Delete Coupon">
              ✕
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  openAddCouponModal() {
    document.getElementById('couponForm').reset();
    this.openModal('couponModal');
  },

  async saveCoupon(e) {
    e.preventDefault();
    const code = document.getElementById('couponCode').value.trim().toUpperCase();
    const discountPercent = Number(document.getElementById('couponPercent').value) || 0;
    const discountFlat = Number(document.getElementById('couponFlat').value) || 0;
    const minSpend = Number(document.getElementById('couponMinSpend').value) || 0;
    const label = document.getElementById('couponLabel').value.trim();

    if (discountPercent === 0 && discountFlat === 0) {
      this.showToast('Please specify either percentage discount or flat amount', 'error');
      return;
    }

    try {
      const data = await this.fetchWithAuth('/api/admin/coupons', {
        method: 'POST',
        body: { code, discountPercent, discountFlat, minSpend, label }
      });

      if (data.success) {
        this.showToast(`Coupon "${code}" created successfully!`, 'success');
        this.closeModal('couponModal');
        await this.fetchCoupons();
      } else {
        this.showToast(data.message || 'Failed to create coupon', 'error');
      }
    } catch (e) {
      this.showToast('Error creating coupon', 'error');
    }
  },

  async toggleCoupon(code) {
    try {
      const data = await this.fetchWithAuth(`/api/admin/coupons/${code}/toggle`, {
        method: 'PATCH'
      });
      if (data.success) {
        this.showToast(data.message, 'success');
        await this.fetchCoupons();
      }
    } catch (e) {
      this.showToast('Failed to toggle coupon', 'error');
    }
  },

  async deleteCoupon(code) {
    if (!confirm(`Are you sure you want to delete coupon code "${code}"?`)) return;

    try {
      const data = await this.fetchWithAuth(`/api/admin/coupons/${code}`, {
        method: 'DELETE'
      });
      if (data.success) {
        this.showToast(`Coupon "${code}" removed`, 'success');
        await this.fetchCoupons();
      }
    } catch (e) {
      this.showToast('Failed to delete coupon', 'error');
    }
  },

  // --- SETTINGS ---
  async fetchSettings() {
    try {
      const data = await this.fetchWithAuth('/api/settings');
      if (data.success && data.settings) {
        this.settings = data.settings;
        const s = this.settings;
        if (document.getElementById('settingAnnouncement')) document.getElementById('settingAnnouncement').value = s.announcementText || '';
        if (document.getElementById('settingCouponPill')) document.getElementById('settingCouponPill').value = s.activeCouponPill || 'DIWALI2026';
        if (document.getElementById('settingFreeShipping')) document.getElementById('settingFreeShipping').value = s.freeShippingThreshold || 999;
        if (document.getElementById('settingPhone')) document.getElementById('settingPhone').value = s.phone || '+91 98765 43210';
        if (document.getElementById('settingEmail')) document.getElementById('settingEmail').value = s.email || 'namaste@apnatohfa.in';
        if (document.getElementById('settingCorpEmail')) document.getElementById('settingCorpEmail').value = s.corporateEmail || 'corporate@apnatohfa.in';
      }
    } catch (e) {
      console.error('Error fetching settings:', e);
    }
  },

  async saveStoreSettings(e) {
    e.preventDefault();
    const payload = {
      announcementText: document.getElementById('settingAnnouncement').value.trim(),
      activeCouponPill: document.getElementById('settingCouponPill').value.trim(),
      freeShippingThreshold: Number(document.getElementById('settingFreeShipping').value) || 999,
      phone: document.getElementById('settingPhone').value.trim(),
      email: document.getElementById('settingEmail').value.trim(),
      corporateEmail: document.getElementById('settingCorpEmail').value.trim()
    };

    try {
      const data = await this.fetchWithAuth('/api/admin/settings', {
        method: 'PUT',
        body: payload
      });
      if (data.success) {
        this.showToast('Store settings saved successfully!', 'success');
      } else {
        this.showToast(data.message || 'Failed to update settings', 'error');
      }
    } catch (e) {
      this.showToast('Network error while saving settings', 'error');
    }
  },

  exportBackup() {
    window.open('/api/admin/export', '_blank');
    this.showToast('Exporting store backup JSON...', 'info');
  },

  async resetDatabase() {
    if (!confirm('⚠️ WARNING: This will reset all orders, leads, and hampers back to original default Diwali seeds. Continue?')) return;

    try {
      const data = await this.fetchWithAuth('/api/admin/reset', { method: 'POST' });
      if (data.success) {
        this.showToast('Store reset to initial Diwali seed data!', 'success');
        await this.loadAllData();
      }
    } catch (e) {
      this.showToast('Failed to reset store', 'error');
    }
  },

  // --- MODAL UTILS ---
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  },

  // --- TOAST NOTIFICATIONS ---
  showToast(message, type = 'info') {
    let container = document.getElementById('adminToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'adminToastContainer';
      container.className = 'admin-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'admin-toast';
    toast.innerHTML = `
      <span>${type === 'success' ? '✨' : type === 'error' ? '⚠️' : '🪔'}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  ADMIN.init();
});
