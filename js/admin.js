/**
 * APNA TOHFA - Executive Admin Controller
 * Brand: APNA TOHFA | Tagline: "Apno Ke Liye, Dil Se."
 */

const ADMIN = {
  token: localStorage.getItem('apna_admin_token') || null,
  currentTab: 'dashboard',
  orders: [],
  products: [],
  catalogs: [],
  corporateLeads: [],
  coupons: [],
  customItems: [],
  customItemFilter: 'all',
  customItemSearch: '',
  editingCustomItemId: null,
  settings: {},
  stats: {},
  selectedOrder: null,
  orderFilter: 'all',
  orderSearch: '',
  productFilter: 'all',
  currentProductImages: [],

  init() {
    // If URL has #login, #logout or ?action=logout, force logout and display login screen
    const urlParams = new URLSearchParams(window.location.search);
    if (window.location.hash === '#login' || window.location.hash === '#logout' || urlParams.get('logout') === 'true' || urlParams.get('action') === 'logout') {
      this.logout();
      return;
    }

    if (this.token) {
      this.verifySession();
    } else {
      this.showLogin();
    }

    // Monitor live database sync status
    this.checkDatabaseHealth();
    setInterval(() => this.checkDatabaseHealth(), 20000);
  },

  async checkDatabaseHealth() {
    const badge = document.getElementById('dbLiveStatusBadge');
    const text = document.getElementById('dbLiveStatusText');
    const dot = document.getElementById('dbLiveStatusDot');
    if (!badge || !text || !dot) return;

    try {
      const res = await fetch(this.getApiUrl('/api/health'), { signal: AbortSignal.timeout(4000) });
      const data = await res.json();
      if (data && data.status === 'ok') {
        if (data.database && data.database.includes('MongoDB')) {
          badge.style.background = 'rgba(16,185,129,0.15)';
          badge.style.color = '#34d399';
          badge.style.borderColor = 'rgba(16,185,129,0.3)';
          dot.style.background = '#10b981';
          dot.style.boxShadow = '0 0 8px #10b981';
          text.textContent = '☁️ MongoDB Atlas (Sync Active)';
          badge.title = 'All changes are permanently synced to MongoDB Atlas in Cloud.';
        } else {
          badge.style.background = 'rgba(234,179,8,0.15)';
          badge.style.color = '#facc15';
          badge.style.borderColor = 'rgba(234,179,8,0.3)';
          dot.style.background = '#eab308';
          dot.style.boxShadow = '0 0 8px #eab308';
          text.textContent = '📁 Local Storage (store.json)';
          badge.title = 'Saved locally to store.json. Add MONGODB_URI to .env for Cloud Sync.';
        }
        return;
      }
    } catch (e) {
      badge.style.background = 'rgba(239,68,68,0.15)';
      badge.style.color = '#f87171';
      badge.style.borderColor = 'rgba(239,68,68,0.3)';
      dot.style.background = '#ef4444';
      dot.style.boxShadow = '0 0 8px #ef4444';
      text.textContent = '⚠️ Server Offline (Run: npm start)';
      badge.title = 'Backend server is not running on port 3000! Changes will only be saved in temporary browser cache.';
    }
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
      const targetUrl = this.getApiUrl(url);
      const res = await fetch(targetUrl, options);
      const data = await res.json();
      if (res.status === 401) {
        if (!this._isLoggingOut) {
          this._isLoggingOut = true;
          this.logout();
          setTimeout(() => { this._isLoggingOut = false; }, 3000);
        }
        throw new Error(data.message || 'Session expired. Please log in again.');
      }
      return data;
    } catch (err) {
      console.warn('API Error for', url, ':', err.message);
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
    // Deprecated for production security
  },

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    // 1. Firebase Auth (if configured)
    if (window.APNA_FIREBASE && window.APNA_FIREBASE.isConfigured) {
      try {
        const { user, idToken } = await window.APNA_FIREBASE.loginWithEmail(email, password);
        
        // Exchange Firebase ID Token with server session
        try {
          const syncRes = await fetch(this.getApiUrl('/api/auth/firebase-session'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken })
          });
          const syncData = await syncRes.json();
          this.token = (syncData.success && syncData.token) ? syncData.token : idToken;
        } catch (syncErr) {
          this.token = idToken;
        }

        localStorage.setItem('apna_admin_token', this.token);
        const nameEl = document.getElementById('sidebarAdminName');
        if (nameEl) nameEl.textContent = user.displayName || user.email || 'Admin User';
        this.hideLogin();
        this.showToast('🔥 Logged in securely via Firebase Auth!', 'success');
        this.loadAllData();
        return;
      } catch (fbErr) {
        console.warn('Firebase login attempt, falling back to local credentials:', fbErr.message);
      }
    }

    // 2. Standard Local Backend Authentication
    try {
      const res = await fetch(this.getApiUrl('/api/auth/login'), {
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
      // Offline fallback: allow local admin login if password matches default
      if (email.toLowerCase().includes('admin') && (password === 'apnaAdmin@2026' || password === 'admin123')) {
        this.token = 'offline-admin-token-' + Date.now();
        localStorage.setItem('apna_admin_token', this.token);
        this.hideLogin();
        this.showToast('✨ Logged into Admin Desk (Offline Mode)', 'success');
        this.loadAllData();
        return;
      }
      this.showToast('Network error during login. Make sure server is running on http://localhost:3000', 'error');
    }
  },

  async handleGoogleLogin() {
    if (!window.APNA_FIREBASE || !window.APNA_FIREBASE.isConfigured) {
      this.showToast('Firebase keys not configured yet in js/firebase-config.js', 'info');
      return;
    }
    try {
      const { user, idToken } = await window.APNA_FIREBASE.loginWithGoogle();
      
      // Exchange Firebase ID Token with server session
      try {
        const syncRes = await fetch(this.getApiUrl('/api/auth/firebase-session'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
        });
        const syncData = await syncRes.json();
        this.token = (syncData.success && syncData.token) ? syncData.token : idToken;
      } catch (syncErr) {
        this.token = idToken;
      }

      localStorage.setItem('apna_admin_token', this.token);
      const nameEl = document.getElementById('sidebarAdminName');
      if (nameEl) nameEl.textContent = user.displayName || user.email || 'Admin User';
      this.hideLogin();
      this.showToast(`🔥 Welcome, ${user.displayName || 'Admin'}!`, 'success');
      this.loadAllData();
    } catch (err) {
      this.showToast(err.message || 'Google sign-in cancelled or failed', 'error');
    }
  },

  async handleForgotPassword() {
    const email = document.getElementById('loginEmail').value.trim();
    if (!email) {
      this.showToast('Please type your admin email in the box above first', 'info');
      return;
    }
    if (window.APNA_FIREBASE && window.APNA_FIREBASE.isConfigured) {
      try {
        await window.APNA_FIREBASE.sendPasswordReset(email);
        this.showToast(`📩 Password reset link sent to ${email}`, 'success');
      } catch (err) {
        this.showToast(err.message || 'Failed to send reset link', 'error');
      }
    } else {
      this.showToast('Firebase not configured. Please use your standard admin credentials.', 'info');
    }
  },

  async verifySession() {
    try {
      const data = await this.fetchWithAuth('/api/auth/me');
      if (data && data.success) {
        if (data.user && data.user.name) {
          const nameEl = document.getElementById('sidebarAdminName');
          if (nameEl) nameEl.textContent = data.user.name;
        }
        this.hideLogin();
        this.loadAllData();
        return;
      }
    } catch (e) {
      console.warn('Session check note:', e.message);
    }

    // In offline or file mode, keep session active if token or Firebase user exists
    if (this.token || (window.APNA_FIREBASE && window.APNA_FIREBASE.auth && window.APNA_FIREBASE.auth.currentUser)) {
      this.hideLogin();
      this.loadAllData();
      return;
    }

    this.showLogin();
  },

  async logout() {
    this.token = null;
    localStorage.removeItem('apna_admin_token');
    sessionStorage.clear();

    // Sign out from Firebase Auth if initialized
    if (window.APNA_FIREBASE && window.APNA_FIREBASE.isConfigured && window.APNA_FIREBASE.auth) {
      try {
        await window.APNA_FIREBASE.logout();
      } catch (err) {
        console.warn('Firebase logout notice:', err);
      }
    }

    this.showLogin();
    this.showToast('Logged out of Admin Desk successfully', 'info');
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
      catalogs: { title: 'Digital Catalogs & Lookbook Posters', sub: 'Manage official specification sheets and promotional brochures' },
      customizer: { title: 'Customizable Jars & Baskets Inventory', sub: 'Add, update and remove Jar dry fruits/mukhwas & Basket styles' },
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
      this.fetchCatalogs(),
      this.fetchCustomItems(),
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
                      ${item.customJars && item.customJars.length > 0 ? `<div style="font-size: 0.72rem; color: #a7f3d0; margin-top: 3px;">🫙 ${item.customJars.join(' • ')}</div>` : ''}
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
            <h1 style="margin: 0; color: #300812; font-size: 24px; font-weight: bold;">${this.settings?.brandName || 'APNA TOHFA'} 🪔</h1>
            <p style="margin: 4px 0 0; font-size: 12px; color: #666;">${this.settings?.tagline || 'Apno Ke Naam'} | Premium Diwali Hampers</p>
            <p style="margin: 4px 0 0; font-size: 11px; color: #777;">${this.settings?.address || 'Malviya Nagar, Jaipur, Rajasthan - 302017'}</p>
            <p style="margin: 2px 0 0; font-size: 11px; color: #777;">Helpline: ${this.settings?.phone || '+91 9950263957'} | Email: ${this.settings?.email || 'apnatohfa26@gmail.com'}</p>
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
                  ${item.customJars && item.customJars.length > 0 ? `<br><small style="color: #1b5e20; font-weight: bold;">🫙 ${item.customJars.join(' • ')}</small>` : ''}
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
      const data = await this.fetchWithAuth(`/api/products?_t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (data && data.success && Array.isArray(data.products)) {
        this.products = data.products;
        try { localStorage.setItem('apna_store_products', JSON.stringify(data.products)); } catch (err) {}
        this.renderProductsGrid();
        return;
      }
    } catch (e) {
      console.warn('Backend fetchProducts unavailable, checking local storage:', e.message);
    }

    const local = localStorage.getItem('apna_store_products');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.products = parsed;
          this.renderProductsGrid();
          return;
        }
      } catch (err) {}
    }

    if (window.APNA_DATA && Array.isArray(window.APNA_DATA.products)) {
      this.products = [...window.APNA_DATA.products];
      this.renderProductsGrid();
    }
  },

  filterProducts(category) {
    this.productFilter = category;
    document.querySelectorAll('#productCategoryFilters .filter-pill').forEach(btn => {
      btn.classList.remove('active');
      const oc = btn.getAttribute('onclick') || '';
      if (oc.includes(`'${category}'`)) {
        btn.classList.add('active');
      }
    });
    this.renderProductsGrid();
  },

  renderProductsGrid() {
    const container = document.getElementById('productsAdminGrid');
    if (!container) return;

    const legacyCategoryMap = {
      'small-basket': 'mini-baskets',
      'medium-basket': 'classic-baskets',
      'large-basket': 'grand-baskets',
      'small-basket-jar': 'mini-jars',
      'medium-jar-basket': 'classic-jars',
      'large-jar-basket': 'grand-jars'
    };

    let list = [...this.products];
    if (this.productFilter !== 'all') {
      list = list.filter(p => {
        const cat = legacyCategoryMap[p.category] || p.category;
        return cat === this.productFilter || p.category === this.productFilter;
      });
    }

    if (list.length === 0) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-dim);">No hampers in this category.</div>`;
      return;
    }

    container.innerHTML = list.map(p => `
      <div class="product-admin-card" id="admin-card-${p.id}">
        <div class="product-admin-img-wrap">
          <img src="${p.image}" alt="${p.name}" class="product-admin-img">
          <div class="product-admin-badge">${p.category ? p.category.toUpperCase().replace(/-/g, ' ') : 'HAMPER'}</div>
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
            <button class="btn btn-danger btn-sm" onclick="ADMIN.promptDeleteProduct('${p.id}')" title="Delete Hamper">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `).join('');
  },

  /* --- Hamper Images Manager --- */
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
        <div style="grid-column: 1 / -1; text-align: center; padding: 22px 14px; background: rgba(255,255,255,0.02); border: 1px dashed rgba(212,160,23,0.35); border-radius: var(--radius-sm); color: var(--text-dim); font-size: 0.82rem;">
          📷 <strong>No photos attached yet.</strong><br>
          <span style="font-size: 0.74rem; color: var(--text-muted); margin-top: 4px; display: inline-block;">
            Click <strong>"Upload Photos from Device"</strong> above or paste an image URL / click a preset.
          </span>
        </div>
      `;
      return;
    }

    grid.innerHTML = this.currentProductImages.map((src, idx) => `
      <div class="image-preview-card ${idx === 0 ? 'primary' : ''}">
        ${idx === 0 ? '<span class="image-card-badge">★ Cover</span>' : ''}
        <img src="${src}" alt="Photo ${idx + 1}" onerror="this.src='assets/images/apna-tohfa.jpg'">
        <div class="image-card-actions">
          ${idx !== 0 ? `
            <button type="button" class="image-action-btn" title="Make Primary Cover Photo" onclick="ADMIN.makeProductImagePrimary(${idx})">
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

  // Client-side Canvas Image Standardizer (Strict 1200 × 900 px - 4:3 Aspect Ratio)
  compressImage(file, targetWidth = 1200, targetHeight = 900, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const isImg = (file && file.type && file.type.startsWith('image/')) ||
                    /\.(jpg|jpeg|png|webp|jfif|avif|gif)$/i.test(file?.name || '');
      if (!file || !isImg) {
        return reject(new Error('Invalid image file'));
      }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error('Failed to load image element'));
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');

          // Smooth high-definition rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Background fill (crisp clean white for luxury hampers)
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetWidth, targetHeight);

          // Cover fit calculation to fill exact 1200x900 maintaining aspect ratio
          const imgRatio = img.width / img.height;
          const targetRatio = targetWidth / targetHeight; // 1200 / 900 = 1.3333

          let renderW, renderH, offsetX, offsetY;
          if (imgRatio > targetRatio) {
            // Source is wider than 4:3
            renderH = targetHeight;
            renderW = img.width * (targetHeight / img.height);
            offsetX = (targetWidth - renderW) / 2;
            offsetY = 0;
          } else {
            // Source is taller than 4:3
            renderW = targetWidth;
            renderH = img.height * (targetWidth / img.width);
            offsetX = 0;
            offsetY = (targetHeight - renderH) / 2;
          }

          ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  },

  async handleImageFileUpload(e) {
    const rawFiles = Array.from(e.target.files || []);
    if (!rawFiles.length) return;

    // Filter valid image files
    const files = rawFiles.filter(f => 
      (f.type && f.type.startsWith('image/')) || /\.(jpg|jpeg|png|webp|jfif|avif|gif)$/i.test(f.name || '')
    );

    if (!files.length) {
      this.showToast('Please select valid image files (JPG, PNG, WEBP).', 'error');
      e.target.value = '';
      return;
    }

    this.showToast(`Processing ${files.length} photo(s)...`, 'info');

    // 1. INSTANT LOCAL COMPRESSION & PREVIEW (Takes <100ms)
    let addedIndices = [];
    for (const file of files) {
      try {
        const compressedBase64 = await this.compressImage(file);
        this.currentProductImages.push(compressedBase64);
        addedIndices.push(this.currentProductImages.length - 1);
      } catch (err) {
        console.error('Image compression error for file:', file.name, err);
      }
    }

    if (addedIndices.length > 0) {
      this.renderProductImagePreviews();
      this.showToast(`✓ Added ${addedIndices.length} photo(s)! Cover photo ready.`, 'success');
    } else {
      this.showToast('Could not process selected photos. Please try another format.', 'error');
      e.target.value = '';
      return;
    }

    // 2. BACKGROUND CLOUD STORAGE UPLOAD (Optional & non-blocking with 4s timeout)
    if (window.APNA_FIREBASE && window.APNA_FIREBASE.isConfigured && window.APNA_FIREBASE.storage) {
      (async () => {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const targetIdx = addedIndices[i];
          try {
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Firebase Storage timeout')), 4000)
            );
            const downloadUrl = await Promise.race([
              window.APNA_FIREBASE.uploadProductImage(file),
              timeoutPromise
            ]);
            if (downloadUrl && this.currentProductImages[targetIdx]) {
              this.currentProductImages[targetIdx] = downloadUrl;
              this.renderProductImagePreviews();
              console.log('🔥 Photo synced to Firebase Cloud Storage:', downloadUrl);
            }
          } catch (cloudErr) {
            console.info('Cloud storage upload skipped, using optimized local image:', cloudErr.message);
          }
        }
      })();
    }

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
    this.showToast(this.currentProductImages.length === 1 ? 'Cover photo set!' : 'Added photo to gallery!', 'success');
  },

  addImagePreset(presetUrl) {
    this.currentProductImages.push(presetUrl);
    this.renderProductImagePreviews();
    this.showToast('Preset photo added!', 'success');
  },

  clearProductImages() {
    this.currentProductImages = [];
    this.renderProductImagePreviews();
    this.showToast('All photos cleared. You can upload new photos now.', 'info');
  },

  makeProductImagePrimary(index) {
    if (index <= 0 || index >= this.currentProductImages.length) return;
    const picked = this.currentProductImages.splice(index, 1)[0];
    this.currentProductImages.unshift(picked);
    this.renderProductImagePreviews();
    this.showToast('Cover photo updated!', 'success');
  },

  removeProductImage(index) {
    if (index >= 0 && index < this.currentProductImages.length) {
      this.currentProductImages.splice(index, 1);
      this.renderProductImagePreviews();
      this.showToast('Photo removed', 'info');
    }
  },

  populateBasketTypeSelect(selectedValue = '') {
    const select = document.getElementById('prodBasketType');
    if (!select) return;
    const baskets = (this.customItems || []).filter(item => item.type === 'basket');
    if (!baskets.length) {
      select.innerHTML = `
        <option value="Handwoven Cane Basket">🧺 Handwoven Cane Basket</option>
        <option value="Traditional Bamboo Tokri">🎋 Traditional Bamboo Tokri</option>
        <option value="Luxury Golden Wire Basket">✨ Luxury Golden Wire Basket</option>
        <option value="Vintage Wooden Crate">📦 Vintage Wooden Crate</option>
      `;
      if (selectedValue) select.value = selectedValue;
      return;
    }
    select.innerHTML = baskets.map(b => `
      <option value="${b.name}" ${selectedValue === b.name ? 'selected' : ''}>
        ${b.icon || '🧺'} ${b.name} ${b.priceExtra ? `(+₹${b.priceExtra})` : ''}
      </option>
    `).join('');
  },

  onHamperTypeChange(type) {
    const wrap = document.getElementById('prodBasketOptionsWrap');
    if (wrap) {
      wrap.style.display = (type === 'basket') ? 'block' : 'none';
    }
    this.updateBasketJarSummary();
  },

  onJarCountChange(val) {
    const customWrap = document.getElementById('prodCustomJarCountWrap');
    if (customWrap) {
      customWrap.style.display = (val === 'custom') ? 'block' : 'none';
    }
    this.updateBasketJarSummary();
  },

  updateBasketJarSummary() {
    const summaryNum = document.getElementById('prodBasketJarSummaryNum');
    if (!summaryNum) return;
    const jarSelect = document.getElementById('prodJarCount');
    const val = jarSelect ? jarSelect.value : '4';
    if (val === '0') {
      summaryNum.textContent = '0 (Sweets / Goodies only)';
    } else if (val === 'custom') {
      const customVal = document.getElementById('prodCustomJarCount')?.value || '';
      summaryNum.textContent = customVal ? `${customVal}` : 'custom';
    } else {
      summaryNum.textContent = val;
    }
  },

  applyHamperPreset(type, jarCount) {
    const hamperSelect = document.getElementById('prodHamperType');
    const jarSelect = document.getElementById('prodJarCount');
    const customWrap = document.getElementById('prodCustomJarCountWrap');
    const customInput = document.getElementById('prodCustomJarCount');

    if (hamperSelect) hamperSelect.value = type;
    const standardCounts = ['0', '1', '2', '3', '4', '6'];
    const countStr = String(jarCount);

    if (standardCounts.includes(countStr)) {
      if (jarSelect) jarSelect.value = countStr;
      if (customWrap) customWrap.style.display = 'none';
      if (customInput) customInput.value = '';
    } else {
      if (jarSelect) jarSelect.value = 'custom';
      if (customWrap) customWrap.style.display = 'block';
      if (customInput) customInput.value = jarCount;
    }

    this.onHamperTypeChange(type);
    this.onJarCountChange(jarSelect ? jarSelect.value : countStr);

    const typeName = type === 'basket' ? 'Basket' : type === 'box' ? 'Gift Box' : type.toUpperCase();
    this.showToast(`Applied preset: ${typeName} with ${jarCount === 0 ? 'No Jars' : jarCount + ' Jars'}!`, 'info');
  },

  openAddProductModal() {
    document.getElementById('productModalTitle').textContent = 'Add New Festive Hamper';
    document.getElementById('productForm').reset();
    document.getElementById('prodEditId').value = '';
    if (document.getElementById('prodPrice')) document.getElementById('prodPrice').value = '';
    if (document.getElementById('prodHidePrice')) document.getElementById('prodHidePrice').checked = false;

    // Reset container and jar setup
    if (document.getElementById('prodHamperType')) document.getElementById('prodHamperType').value = 'box';
    if (document.getElementById('prodJarCount')) document.getElementById('prodJarCount').value = '4';
    if (document.getElementById('prodCustomJarCountWrap')) document.getElementById('prodCustomJarCountWrap').style.display = 'none';
    if (document.getElementById('prodCustomJarCount')) document.getElementById('prodCustomJarCount').value = '';
    if (document.getElementById('prodBasketOptionsWrap')) document.getElementById('prodBasketOptionsWrap').style.display = 'none';
    this.populateBasketTypeSelect();
    this.updateBasketJarSummary();

    const insideEl = document.getElementById('prodWhatsInside');
    if (insideEl) {
      insideEl.value = [
        'Artisanal Kaju Katli (100g)',
        'Hand-painted Terracotta Diya with pure cotton wicks',
        'Roasted California Almonds in Jute Potli (60g)',
        "Gold-Foiled 'Shubh Deepavali' Greeting Card",
        'Rigid Festive Keepsake Gift Box'
      ].join('\n');
    }
    // Start with empty photos so user uploaded photo becomes the primary Cover photo immediately!
    this.currentProductImages = [];
    this.renderProductImagePreviews();
    this.openModal('productModal');
  },

  openEditProductModal(productId) {
    const p = this.products.find(item => item.id === productId);
    if (!p) return;

    const legacyCategoryMap = {
      'small-basket': 'mini-baskets',
      'medium-basket': 'classic-baskets',
      'large-basket': 'grand-baskets',
      'small-basket-jar': 'mini-jars',
      'medium-jar-basket': 'classic-jars',
      'large-jar-basket': 'grand-jars'
    };
    const mappedCategory = legacyCategoryMap[p.category] || p.category || 'budget';

    document.getElementById('productModalTitle').textContent = `Edit Hamper: ${p.name}`;
    document.getElementById('prodEditId').value = p.id;
    document.getElementById('prodName').value = p.name || '';
    document.getElementById('prodCategory').value = mappedCategory;
    document.getElementById('prodPrice').value = (p.price && p.price > 0) ? p.price : '';
    document.getElementById('prodOrigPrice').value = (p.originalPrice && p.originalPrice > 0) ? p.originalPrice : '';
    if (document.getElementById('prodHidePrice')) {
      document.getElementById('prodHidePrice').checked = p.hidePrice !== undefined ? Boolean(p.hidePrice) : (!p.price || p.price <= 0);
    }
    document.getElementById('prodBadge').value = p.badge || '';
    document.getElementById('prodDispatch').value = p.dispatchTime || 'Ships in 24 Hours';
    document.getElementById('prodShortDesc').value = p.shortDescription || '';
    document.getElementById('prodFullDesc').value = p.fullDescription || '';
    document.getElementById('prodTags').value = (p.tags || []).join(', ');

    // Configure Hamper container & jar capacity
    const hamperType = p.hamperType || (p.category && p.category.includes('basket') ? 'basket' : 'box');
    const jarCount = (p.jarCount !== undefined) ? Number(p.jarCount) : 4;

    if (document.getElementById('prodHamperType')) {
      document.getElementById('prodHamperType').value = hamperType;
    }
    this.populateBasketTypeSelect(p.basketType || '');

    const standardCounts = ['0', '1', '2', '3', '4', '6'];
    if (document.getElementById('prodJarCount')) {
      if (standardCounts.includes(String(jarCount))) {
        document.getElementById('prodJarCount').value = String(jarCount);
        if (document.getElementById('prodCustomJarCountWrap')) document.getElementById('prodCustomJarCountWrap').style.display = 'none';
        if (document.getElementById('prodCustomJarCount')) document.getElementById('prodCustomJarCount').value = '';
      } else {
        document.getElementById('prodJarCount').value = 'custom';
        if (document.getElementById('prodCustomJarCountWrap')) {
          document.getElementById('prodCustomJarCountWrap').style.display = 'block';
        }
        if (document.getElementById('prodCustomJarCount')) {
          document.getElementById('prodCustomJarCount').value = jarCount;
        }
      }
    }
    this.onHamperTypeChange(hamperType);
    this.updateBasketJarSummary();

    const insideEl = document.getElementById('prodWhatsInside');
    if (insideEl) {
      if (Array.isArray(p.whatsInside) && p.whatsInside.length > 0) {
        insideEl.value = p.whatsInside.map(item => (typeof item === 'object' ? (item.item || item.name || '') : item)).filter(Boolean).join('\n');
      } else {
        insideEl.value = '';
      }
    }

    if (Array.isArray(p.images) && p.images.length > 0) {
      this.currentProductImages = [...p.images];
    } else if (p.image) {
      this.currentProductImages = [p.image];
    } else {
      this.currentProductImages = [];
    }
    this.renderProductImagePreviews();

    this.openModal('productModal');
  },

  async saveProduct(e) {
    e.preventDefault();
    const editId = document.getElementById('prodEditId').value;
    const name = document.getElementById('prodName').value.trim();
    const category = document.getElementById('prodCategory').value;
    const priceVal = document.getElementById('prodPrice').value.trim();
    const price = priceVal === '' ? 0 : (Number(priceVal) || 0);
    const origPriceVal = document.getElementById('prodOrigPrice').value.trim();
    const originalPrice = origPriceVal === '' ? price : (Number(origPriceVal) || price);
    const hidePriceChecked = document.getElementById('prodHidePrice') ? document.getElementById('prodHidePrice').checked : false;
    const hidePrice = hidePriceChecked || price <= 0;
    const badge = document.getElementById('prodBadge').value.trim();
    const dispatchTime = document.getElementById('prodDispatch').value.trim() || 'Ships in 24 Hours';
    const shortDescription = document.getElementById('prodShortDesc').value.trim();
    const fullDescription = document.getElementById('prodFullDesc').value.trim();
    const tagsStr = document.getElementById('prodTags').value.trim();
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

    // Read container & jar capacity
    const hamperType = document.getElementById('prodHamperType') ? document.getElementById('prodHamperType').value : 'box';
    const jarCountSelect = document.getElementById('prodJarCount') ? document.getElementById('prodJarCount').value : '4';
    let jarCount = 4;
    if (jarCountSelect === 'custom') {
      const customVal = document.getElementById('prodCustomJarCount') ? document.getElementById('prodCustomJarCount').value.trim() : '';
      jarCount = customVal !== '' ? (Number(customVal) || 0) : 4;
    } else {
      jarCount = Number(jarCountSelect) || 0;
    }
    const hasJars = jarCount > 0;
    const basketType = (hamperType === 'basket' && document.getElementById('prodBasketType')) ? document.getElementById('prodBasketType').value : '';

    const insideEl = document.getElementById('prodWhatsInside');
    const whatsInsideRaw = insideEl ? insideEl.value.trim() : '';
    const whatsInside = whatsInsideRaw
      ? whatsInsideRaw.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
          let icon = '🎁';
          const lower = line.toLowerCase();
          if (lower.includes('diya') || lower.includes('light') || lower.includes('deepak')) icon = '🪔';
          else if (lower.includes('kaju') || lower.includes('sweet') || lower.includes('mithai') || lower.includes('ladoo') || lower.includes('barfi') || lower.includes('peda')) icon = '🍬';
          else if (lower.includes('almond') || lower.includes('cashew') || lower.includes('nut') || lower.includes('raisin') || lower.includes('pista') || lower.includes('walnut')) icon = '🌰';
          else if (lower.includes('chocolate') || lower.includes('truffle')) icon = '🍫';
          else if (lower.includes('candle')) icon = '🕯️';
          else if (lower.includes('card') || lower.includes('scroll') || lower.includes('note')) icon = '📜';
          else if (lower.includes('honey') || lower.includes('jar') || lower.includes('brittle')) icon = '🍯';
          else if (lower.includes('ganesha') || lower.includes('idol') || lower.includes('god') || lower.includes('pooja')) icon = '🕉️';
          return { item: line, icon };
        })
      : [
          { item: 'Handcrafted Festive Keepsakes & Diyas', icon: '🪔' },
          { item: 'Premium Curated Festive Delights', icon: '🍬' },
          { item: 'Roasted Dry Fruits in Airtight Pack', icon: '🌰' },
          { item: "Gold-Foiled 'Shubh Deepavali' Greeting Card", icon: '📜' },
          { item: 'Festive Keepsake Presentation Box', icon: '🎁' }
        ];

    const images = this.currentProductImages.length ? this.currentProductImages : ['assets/images/apna-tohfa.jpg'];
    const image = images[0];

    const payload = {
      name,
      category,
      price,
      originalPrice,
      hidePrice,
      hamperType,
      jarCount,
      hasJars,
      basketType,
      customizable: hasJars,
      badge: badge || (
        category === 'luxury' ? 'Luxury Pick' :
        category === 'budget' ? 'Budget Friendly' :
        category === 'classic' ? 'Classic Festive' :
        category === 'premium' ? 'Premium Pick' :
        category === 'family-combo' ? 'Family Favorite' :
        category === 'corporate' ? 'Corporate Gift' : 'Bestseller'
      ),
      badgeType: (category === 'luxury' || category === 'premium') ? 'royal' : category === 'corporate' ? 'corporate' : 'bestseller',
      dispatchTime,
      image,
      images,
      shortDescription,
      fullDescription: fullDescription || shortDescription,
      whatsInside,
      tags,
      discount: originalPrice > price ? `${Math.round(((originalPrice - price) / originalPrice) * 100)}% OFF` : ''
    };

    try {
      let data;
      try {
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
      } catch (netErr) {
        console.warn('Backend server unreachable or network error, saving hamper locally:', netErr.message);
        data = this.saveProductLocally(editId, payload);
      }

      if (data && data.success) {
        this.showToast(data.message || 'Hamper saved successfully! ✨', 'success');
        this.closeModal('productModal');
        await this.fetchProducts();
        await this.fetchStats();
        this.notifyStorefrontUpdate();
      } else {
        this.showToast(data?.message || 'Failed to save hamper. Please check inputs.', 'error');
      }
    } catch (e) {
      console.error('Error in saveProduct pipeline:', e);
      const fallback = this.saveProductLocally(editId, payload);
      if (fallback.success) {
        this.showToast('✨ Hamper saved locally & added to catalog!', 'success');
        this.closeModal('productModal');
        await this.fetchProducts();
        this.notifyStorefrontUpdate();
      } else {
        this.showToast('Could not save hamper. Please check required fields.', 'error');
      }
    }
  },

  saveProductLocally(editId, payload) {
    let products = [...(this.products || [])];
    if (!products.length && window.APNA_DATA && Array.isArray(window.APNA_DATA.products)) {
      products = [...window.APNA_DATA.products];
    }
    const id = editId || `hamper-${Date.now()}`;
    const productData = {
      id,
      inStock: true,
      createdAt: new Date().toISOString(),
      ...payload
    };

    if (editId) {
      const idx = products.findIndex(p => p.id === editId);
      if (idx !== -1) {
        products[idx] = { ...products[idx], ...productData };
      } else {
        products.unshift(productData);
      }
    } else {
      products.unshift(productData);
    }

    this.products = products;
    if (window.APNA_DATA) {
      window.APNA_DATA.products = products;
    }
    try {
      localStorage.setItem('apna_store_products', JSON.stringify(products));
    } catch(storageErr) {
      console.warn('LocalStorage size limit, saving lean copy:', storageErr);
      const lean = products.map(p => ({
        ...p,
        images: (p.images || []).slice(0, 1)
      }));
      try { localStorage.setItem('apna_store_products', JSON.stringify(lean)); } catch(e) {}
    }

    // Also sync to Firestore if initialized
    if (window.APNA_FIREBASE && window.APNA_FIREBASE.isConfigured && window.APNA_FIREBASE.db) {
      try {
        window.APNA_FIREBASE.db.collection('products').doc(id).set(productData, { merge: true })
          .then(() => console.log('🔥 Product saved to Firestore:', id))
          .catch(err => console.warn('Firestore note:', err.message));
      } catch(dbErr) {}
    }

    this.notifyStorefrontUpdate();
    return {
      success: true,
      message: editId ? '⚠️ Hamper saved locally in browser (Server offline! Run "npm start" to sync to MongoDB)' : '⚠️ Hamper added locally in browser (Server offline! Run "npm start" to sync to MongoDB)',
      product: productData
    };
  },

  notifyStorefrontUpdate() {
    try {
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('apna_tohfa_updates');
        channel.postMessage({ type: 'catalog_updated', timestamp: Date.now() });
      }
    } catch (e) {}
    try {
      localStorage.setItem('apna_last_catalog_update', Date.now().toString());
    } catch (e) {}
  },

  async toggleProductStock(productId) {
    try {
      let data;
      try {
        data = await this.fetchWithAuth(`/api/admin/products/${productId}/stock`, {
          method: 'PATCH'
        });
      } catch (netErr) {
        // Local stock toggle
        const prod = this.products.find(p => p.id === productId);
        if (prod) {
          prod.inStock = !prod.inStock;
          data = { success: true, message: `Stock status updated: ${prod.inStock ? 'In Stock' : 'Sold Out'}` };
          localStorage.setItem('apna_store_products', JSON.stringify(this.products));
        }
      }

      if (data && data.success) {
        this.showToast(data.message, 'success');
        await this.fetchProducts();
        this.notifyStorefrontUpdate();
      }
    } catch (e) {
      this.showToast('Failed to toggle stock status', 'error');
    }
  },

  productPendingDelete: null,

  promptDeleteProduct(productId) {
    if (!productId) return;
    const prod = this.products.find(p => p.id === productId || p._id === productId);
    this.productPendingDelete = productId;
    const nameEl = document.getElementById('deleteConfirmHamperName');
    if (nameEl) {
      nameEl.textContent = prod ? (prod.name || prod.title || productId) : productId;
    }
    this.openModal('deleteConfirmModal');
  },

  async executeDeleteProduct() {
    const productId = this.productPendingDelete;
    if (!productId) return;
    this.closeModal('deleteConfirmModal');
    this.productPendingDelete = null;
    await this.deleteProduct(productId, true);
  },

  async deleteProduct(productId, skipConfirm = false) {
    if (!productId) return;
    if (!skipConfirm) {
      this.promptDeleteProduct(productId);
      return;
    }

    try {
      let data;
      try {
        data = await this.fetchWithAuth(`/api/admin/products/${encodeURIComponent(productId)}`, {
          method: 'DELETE'
        });
      } catch (netErr) {
        console.warn('Backend delete product unreachable or network error, applying locally:', netErr.message);
        data = { success: true, message: 'Hamper removed locally in browser' };
      }

      // Optimistically remove from state & DOM immediately so UI never stutters
      this.products = this.products.filter(p => p.id !== productId && p._id !== productId);
      try { localStorage.setItem('apna_store_products', JSON.stringify(this.products)); } catch(e) {}
      if (window.APNA_DATA && Array.isArray(window.APNA_DATA.products)) {
        window.APNA_DATA.products = window.APNA_DATA.products.filter(p => p.id !== productId && p._id !== productId);
      }
      this.renderProductsGrid();

      if (data && data.success) {
        this.showToast(data.message || 'Hamper removed from catalog', 'success');
        await this.fetchProducts();
        await this.fetchStats();
        this.notifyStorefrontUpdate();
      } else {
        this.showToast(data?.message || 'Could not delete hamper from server', 'error');
        await this.fetchProducts();
      }
    } catch (e) {
      console.error('Error deleting product:', e);
      this.showToast('Failed to delete product', 'error');
    }
  },

  // --- DIGITAL CATALOGS & LOOKBOOK POSTERS ---
  async fetchCatalogs() {
    try {
      const res = await fetch(this.getApiUrl('/api/catalogs'));
      const data = await res.json();
      if (data && data.success && Array.isArray(data.catalogs)) {
        this.catalogs = data.catalogs;
      } else if (window.APNA_DATA && Array.isArray(window.APNA_DATA.catalogs)) {
        this.catalogs = window.APNA_DATA.catalogs;
      } else {
        this.catalogs = [];
      }
    } catch (e) {
      if (window.APNA_DATA && Array.isArray(window.APNA_DATA.catalogs)) {
        this.catalogs = window.APNA_DATA.catalogs;
      }
    }

    const countBadge = document.getElementById('sidebarCatalogCount');
    if (countBadge) countBadge.textContent = this.catalogs.length;

    this.renderAdminCatalogs();
  },

  renderAdminCatalogs() {
    const container = document.getElementById('adminCatalogList');
    if (!container) return;

    if (!this.catalogs || this.catalogs.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px; background: rgba(255,255,255,0.02); border: 1.5px dashed var(--admin-border); border-radius: 12px;">
          <div style="font-size: 2.5rem; margin-bottom: 12px;">📄</div>
          <h4 style="font-family: var(--font-serif); color: var(--gold-400); margin-bottom: 8px;">No Catalog Posters Added Yet</h4>
          <p style="color: var(--text-dim); font-size: 0.85rem; margin-bottom: 16px;">Apne marketing hampers ke promotional posters yahan add karein.</p>
          <button type="button" class="btn btn-primary btn-sm" onclick="ADMIN.openCatalogModal()">+ Add First Catalog Poster</button>
        </div>
      `;
      return;
    }

    container.innerHTML = this.catalogs.map(cat => {
      const jarsPreview = (Array.isArray(cat.jars) && cat.jars.length > 0)
        ? cat.jars.slice(0, 3).join(', ') + (cat.jars.length > 3 ? ` (+${cat.jars.length - 3} more)` : '')
        : '6 Designer Brass Jars';

      return `
        <div style="background: rgba(255,255,255,0.03); border: 1.5px solid rgba(212,175,55,0.25); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s, border-color 0.2s; box-shadow: 0 6px 20px rgba(0,0,0,0.35);">
          <div style="position: relative; height: 240px; background: #0c0908; overflow: hidden; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid rgba(212,175,55,0.2);">
            <img src="${cat.posterImage}" alt="${cat.title}" style="max-height: 100%; max-width: 100%; object-fit: contain;" onerror="this.src='assets/images/catalogs/peacock-floral-6jar-catalog.png'">
            <div style="position: absolute; top: 10px; left: 10px; display: flex; gap: 6px; flex-wrap: wrap;">
              <span style="background: rgba(128,0,32,0.85); color: #fff; padding: 3px 8px; border-radius: 10px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase;">
                ${cat.badge || 'Lookbook'}
              </span>
              <span style="background: rgba(212,175,55,0.85); color: #000; padding: 3px 8px; border-radius: 10px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase;">
                ${cat.category || 'Luxury'}
              </span>
            </div>
          </div>

          <div style="padding: 18px; flex: 1; display: flex; flex-direction: column;">
            <h4 style="font-size: 1.1rem; font-family: var(--font-serif); color: #fff; margin-bottom: 6px; line-height: 1.3;">
              ${cat.title}
            </h4>
            <p style="font-size: 0.78rem; color: var(--gold-300); margin-bottom: 12px; line-height: 1.4;">
              ${cat.tagline || ''}
            </p>

            <div style="background: rgba(0,0,0,0.3); padding: 10px 12px; border-radius: 6px; border-left: 2px solid var(--gold-400); font-size: 0.78rem; color: rgba(255,255,255,0.8); margin-bottom: 16px; margin-top: auto;">
              <strong style="color: var(--gold-400);">Inside:</strong> ${jarsPreview}
            </div>

            <div style="display: flex; gap: 8px; margin-top: auto;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="ADMIN.openEditCatalogModal('${cat.id}')" style="flex: 1; padding: 6px 10px; font-size: 0.8rem;">
                ✏️ Edit
              </button>
              <button type="button" class="btn btn-danger btn-sm" onclick="ADMIN.deleteCatalog('${cat.id}')" style="padding: 6px 10px; font-size: 0.8rem;">
                🗑️
              </button>
              <a href="/#catalog-section" target="_blank" class="btn btn-primary btn-sm" style="padding: 6px 10px; font-size: 0.8rem; text-decoration: none;">
                👁️ View
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  openCatalogModal() {
    document.getElementById('catalogModalTitle').textContent = 'Add New Catalog Poster';
    document.getElementById('catalogEditId').value = '';
    document.getElementById('catalogTitle').value = '';
    document.getElementById('catalogTagline').value = '';
    document.getElementById('catalogBadge').value = 'Signature Catalog Poster';
    document.getElementById('catalogCategory').value = 'grand-jars';
    document.getElementById('catalogImageUrlInput').value = '';
    document.getElementById('catalogFileInput').value = '';
    document.getElementById('catalogImagePreviewWrap').style.display = 'none';
    document.getElementById('catalogImagePreview').src = '';
    document.getElementById('catalogJars').value = [
      'Jar 1: Premium Cashews (Kaju)',
      'Jar 2: Premium Almonds (Badam)',
      'Jar 3: Raisins (Kishmish)',
      'Jar 4: Walnuts (Akhrot)',
      'Jar 5: Pistachios (Pista)',
      'Jar 6: Makhana'
    ].join('\n');
    document.getElementById('catalogFeatures').value = [
      'Handcrafted Peacock and Floral Artwork',
      '6 Premium Round Brass Jars with Designer Lids',
      'Golden Satin Cushion and Reusable Briefcase Box',
      'Delivery: Pan India'
    ].join('\n');
    document.getElementById('catalogCustomisation').value = [
      'Customise the box as per your choice',
      'Chocolates, Candies and different Dry Fruits can be added on request',
      'Perfect for your own brand, logo and personal message'
    ].join('\n');
    document.getElementById('catalogWhyChooseUs').value = [
      'Premium Quality Dry Fruits, Carefully Selected',
      'Hygienic Packing with Premium Presentation',
      'Bulk and Corporate Orders Accepted'
    ].join('\n');
    document.getElementById('catalogPerfectFor').value = [
      'Diwali, Wedding, Rakhi and Festive Gifting',
      'Corporate, Client and Employee Gifts',
      'Housewarming and Special Occasions'
    ].join('\n');
    document.getElementById('catalogInquiryMessage').value = '';
    this.openModal('catalogModal');
  },

  openEditCatalogModal(id) {
    const cat = (this.catalogs || []).find(c => c.id === id);
    if (!cat) return;

    document.getElementById('catalogModalTitle').textContent = `Edit Catalog Poster: ${cat.title}`;
    document.getElementById('catalogEditId').value = cat.id;
    document.getElementById('catalogTitle').value = cat.title || '';
    document.getElementById('catalogTagline').value = cat.tagline || '';
    document.getElementById('catalogBadge').value = cat.badge || 'Signature Catalog Poster';
    document.getElementById('catalogCategory').value = cat.category || 'grand-jars';
    document.getElementById('catalogImageUrlInput').value = cat.posterImage || '';
    document.getElementById('catalogFileInput').value = '';

    if (cat.posterImage) {
      document.getElementById('catalogImagePreview').src = cat.posterImage;
      document.getElementById('catalogImagePreviewWrap').style.display = 'block';
    } else {
      document.getElementById('catalogImagePreviewWrap').style.display = 'none';
    }

    document.getElementById('catalogJars').value = Array.isArray(cat.jars) ? cat.jars.join('\n') : (cat.jars || '');
    document.getElementById('catalogFeatures').value = Array.isArray(cat.features) ? cat.features.join('\n') : (cat.features || '');
    document.getElementById('catalogCustomisation').value = Array.isArray(cat.customisation) ? cat.customisation.join('\n') : (cat.customisation || '');
    document.getElementById('catalogWhyChooseUs').value = Array.isArray(cat.whyChooseUs) ? cat.whyChooseUs.join('\n') : (cat.whyChooseUs || '');
    document.getElementById('catalogPerfectFor').value = Array.isArray(cat.perfectFor) ? cat.perfectFor.join('\n') : (cat.perfectFor || '');
    document.getElementById('catalogInquiryMessage').value = cat.inquiryMessage || '';

    this.openModal('catalogModal');
  },

  handleCatalogFileUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target.result;
      document.getElementById('catalogImageUrlInput').value = base64Data;
      document.getElementById('catalogImagePreview').src = base64Data;
      document.getElementById('catalogImagePreviewWrap').style.display = 'block';
      this.showToast('Poster image selected! Click "Save Catalog Poster" to finish.', 'info');
    };
    reader.readAsDataURL(file);
  },

  updateCatalogPreviewFromInput(val) {
    const previewWrap = document.getElementById('catalogImagePreviewWrap');
    const previewImg = document.getElementById('catalogImagePreview');
    if (!previewWrap || !previewImg) return;
    if (val && val.trim()) {
      previewImg.src = val.trim();
      previewWrap.style.display = 'block';
    } else {
      previewWrap.style.display = 'none';
    }
  },

  async saveCatalog(e) {
    e.preventDefault();
    const editId = document.getElementById('catalogEditId').value.trim();
    const title = document.getElementById('catalogTitle').value.trim();
    const tagline = document.getElementById('catalogTagline').value.trim();
    const badge = document.getElementById('catalogBadge').value.trim();
    const category = document.getElementById('catalogCategory').value;
    const posterImage = document.getElementById('catalogImageUrlInput').value.trim();

    if (!title || !posterImage) {
      this.showToast('Please provide a Catalog Title and Poster Image!', 'error');
      return;
    }

    const parseLines = (val) => val ? val.split('\n').map(l => l.trim()).filter(Boolean) : [];

    const jars = parseLines(document.getElementById('catalogJars').value);
    const features = parseLines(document.getElementById('catalogFeatures').value);
    const customisation = parseLines(document.getElementById('catalogCustomisation').value);
    const whyChooseUs = parseLines(document.getElementById('catalogWhyChooseUs').value);
    const perfectFor = parseLines(document.getElementById('catalogPerfectFor').value);
    const inquiryMessage = document.getElementById('catalogInquiryMessage').value.trim() ||
      `Hello Apna Tohfa! I saw the ${title} catalog poster on your website and would like to order / enquire about pricing and bulk options.`;

    const payload = {
      title,
      tagline,
      badge: badge || 'Signature Catalog Poster',
      category: category || 'grand-jars',
      posterImage,
      jars,
      features,
      customisation,
      whyChooseUs,
      perfectFor,
      inquiryMessage
    };

    try {
      const url = editId ? `/api/admin/catalogs/${editId}` : '/api/admin/catalogs';
      const method = editId ? 'PUT' : 'POST';

      const data = await this.fetchWithAuth(url, { method, body: payload });
      if (data && data.success) {
        this.showToast(data.message || 'Catalog poster saved successfully! 🎉', 'success');
        this.closeModal('catalogModal');
        await this.fetchCatalogs();
      } else {
        this.showToast(data.message || 'Failed to save catalog poster', 'error');
      }
    } catch (err) {
      console.error('Error saving catalog:', err);
      // Fallback local save if server offline
      if (editId) {
        const idx = this.catalogs.findIndex(c => c.id === editId);
        if (idx !== -1) this.catalogs[idx] = { ...this.catalogs[idx], ...payload };
      } else {
        payload.id = 'catalog-' + Date.now();
        this.catalogs.unshift(payload);
      }
      this.renderAdminCatalogs();
      this.closeModal('catalogModal');
      this.showToast('Saved catalog in local session', 'info');
    }
  },

  async deleteCatalog(id) {
    if (!confirm('Are you sure you want to delete this catalog poster?')) return;

    try {
      const data = await this.fetchWithAuth(`/api/admin/catalogs/${id}`, { method: 'DELETE' });
      if (data && data.success) {
        this.showToast('Catalog poster removed', 'success');
      } else {
        this.showToast('Removed from local list', 'info');
      }
    } catch (err) {
      this.showToast('Removed from local session', 'info');
    }
    this.catalogs = this.catalogs.filter(c => c.id !== id);
    this.renderAdminCatalogs();
    const countBadge = document.getElementById('sidebarCatalogCount');
    if (countBadge) countBadge.textContent = this.catalogs.length;
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

  // --- CUSTOMIZABLE JARS & BASKETS ITEMS ---
  async fetchCustomItems() {
    try {
      const data = await this.fetchWithAuth('/api/custom-items');
      if (data && data.success && Array.isArray(data.items)) {
        this.customItems = data.items;
        try { localStorage.setItem('apna_store_custom_items', JSON.stringify(data.items)); } catch (err) {}
      }
    } catch (e) {
      console.warn('Backend custom-items unavailable, checking local storage:', e.message);
      const local = localStorage.getItem('apna_store_custom_items');
      if (local) {
        try { this.customItems = JSON.parse(local) || []; } catch(err) {}
      }
    }

    this.updateCustomItemCounts();
    this.renderCustomItems();
    this.populateBasketTypeSelect();
  },

  updateCustomItemCounts() {
    const allCount = document.getElementById('customFilterCountAll');
    const jarCount = document.getElementById('customFilterCountJars');
    const basketCount = document.getElementById('customFilterCountBaskets');
    if (allCount) allCount.textContent = this.customItems.length;
    if (jarCount) jarCount.textContent = this.customItems.filter(i => i.type === 'jar').length;
    if (basketCount) basketCount.textContent = this.customItems.filter(i => i.type === 'basket').length;
  },

  filterCustomItems(filter) {
    this.customItemFilter = filter;
    document.querySelectorAll('#customItemFilters .filter-pill').forEach(btn => {
      btn.classList.remove('active');
      const oc = btn.getAttribute('onclick') || '';
      if (oc.includes(`'${filter}'`)) {
        btn.classList.add('active');
      }
    });
    this.renderCustomItems();
  },

  searchCustomItems(term) {
    this.customItemSearch = (term || '').trim().toLowerCase();
    this.renderCustomItems();
  },

  renderCustomItems() {
    const grid = document.getElementById('adminCustomItemsGrid');
    if (!grid) return;

    let list = [...this.customItems];
    if (this.customItemFilter !== 'all') {
      list = list.filter(item => item.type === this.customItemFilter);
    }
    if (this.customItemSearch) {
      list = list.filter(item => 
        (item.name && item.name.toLowerCase().includes(this.customItemSearch)) ||
        (item.description && item.description.toLowerCase().includes(this.customItemSearch))
      );
    }

    if (list.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-dim); background: rgba(0,0,0,0.2); border-radius: var(--radius-md); border: 1px dashed var(--admin-border);">
          No customizable items found matching this filter or search. Click <strong>"+ Add New Item"</strong> above to create one.
        </div>
      `;
      return;
    }

    grid.innerHTML = list.map(item => {
      const isJar = item.type === 'jar';
      const typeLabel = isJar ? '🫙 Jar Item' : '🧺 Basket Style';
      const badgeClass = isJar ? 'badge-jar' : 'badge-basket';
      return `
        <div class="custom-item-card ${!item.inStock ? 'out-of-stock' : ''}" id="custom-card-${item.id}">
          <div class="custom-card-header">
            <span class="custom-type-pill ${badgeClass}">
              ${typeLabel}
            </span>
            <span class="custom-status-tag ${item.inStock ? 'stock-in' : 'stock-out'}">
              ${item.inStock ? '✓ IN STOCK' : 'SOLD OUT'}
            </span>
          </div>

          <div class="custom-card-body">
            <div class="custom-card-icon">${item.icon || (isJar ? '🫙' : '🧺')}</div>
            <div class="custom-card-details">
              <h4 class="custom-card-title">${item.name}</h4>
              <p class="custom-card-desc">${item.description || (isJar ? 'Customizable Jar Selection' : 'Customizable Basket Style')}</p>
              <div class="custom-card-price">
                ${item.priceExtra && item.priceExtra > 0 ? `<span style="color: var(--gold-400); font-weight: 700;">+₹${item.priceExtra}</span> <span style="font-size: 0.72rem; color: var(--text-dim);">(Extra)</span>` : '<span style="color: var(--success); font-weight: 600;">Included (Free)</span>'}
              </div>
            </div>
          </div>

          <div class="custom-card-actions">
            <button type="button" class="btn btn-secondary btn-sm" onclick="ADMIN.openEditCustomItemModal('${item.id}')">
              ✏️ Edit
            </button>
            <button type="button" class="btn ${item.inStock ? 'btn-secondary' : 'btn-primary'} btn-sm" onclick="ADMIN.toggleCustomItemStock('${item.id}')" title="Toggle Stock Status">
              ${item.inStock ? 'Mark Sold Out' : 'Mark In Stock ✓'}
            </button>
            <button type="button" class="btn btn-danger btn-sm" onclick="ADMIN.deleteCustomItem('${item.id}')" title="Delete Item">
              🗑️
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  onCustomItemTypeChange(type) {
    const iconInput = document.getElementById('customItemIcon');
    if (!iconInput) return;
    if (type === 'jar') {
      if (['🧺', '🎋', '✨', '👑', '📦'].includes(iconInput.value)) {
        iconInput.value = '🌰';
      }
    } else {
      if (['🌰', '🥜', '🟢', '🍇', '🍯', '🍫', '🍬'].includes(iconInput.value)) {
        iconInput.value = '🧺';
      }
    }
  },

  openAddCustomItemModal() {
    this.editingCustomItemId = null;
    document.getElementById('customItemModalTitle').textContent = 'Add Customizable Item (Jar or Basket)';
    document.getElementById('customItemForm').reset();
    document.getElementById('customItemEditId').value = '';
    document.getElementById('typeRadioJar').checked = true;
    document.getElementById('customItemIcon').value = '🌰';
    document.getElementById('customItemPrice').value = '0';
    document.getElementById('customItemInStock').checked = true;
    this.openModal('customItemModal');
  },

  openEditCustomItemModal(id) {
    const item = this.customItems.find(i => i.id === id);
    if (!item) return;

    this.editingCustomItemId = id;
    document.getElementById('customItemModalTitle').textContent = `Edit Customizable Item: ${item.name}`;
    document.getElementById('customItemEditId').value = item.id;
    if (item.type === 'basket') {
      document.getElementById('typeRadioBasket').checked = true;
    } else {
      document.getElementById('typeRadioJar').checked = true;
    }
    document.getElementById('customItemName').value = item.name || '';
    document.getElementById('customItemIcon').value = item.icon || '🌰';
    document.getElementById('customItemPrice').value = item.priceExtra || 0;
    document.getElementById('customItemDesc').value = item.description || '';
    document.getElementById('customItemInStock').checked = (item.inStock !== false);

    this.openModal('customItemModal');
  },

  async saveCustomItem(e) {
    e.preventDefault();
    const editId = document.getElementById('customItemEditId').value;
    const type = document.getElementById('typeRadioBasket').checked ? 'basket' : 'jar';
    const name = document.getElementById('customItemName').value.trim();
    const icon = document.getElementById('customItemIcon').value.trim() || (type === 'jar' ? '🫙' : '🧺');
    const priceExtra = Number(document.getElementById('customItemPrice').value) || 0;
    const description = document.getElementById('customItemDesc').value.trim();
    const inStock = document.getElementById('customItemInStock').checked;

    if (!name) {
      this.showToast('Please enter an item name', 'error');
      return;
    }

    const payload = {
      type,
      name,
      icon,
      priceExtra,
      description,
      inStock
    };

    try {
      let data;
      if (editId) {
        data = await this.fetchWithAuth(`/api/admin/custom-items/${editId}`, {
          method: 'PUT',
          body: payload
        });
      } else {
        data = await this.fetchWithAuth('/api/admin/custom-items', {
          method: 'POST',
          body: payload
        });
      }

      if (data && data.success) {
        this.showToast(data.message || 'Customizable item saved successfully! ✨', 'success');
        this.closeModal('customItemModal');
        await this.fetchCustomItems();
        this.notifyStorefrontUpdate();
      } else {
        this.showToast(data?.message || 'Could not save item', 'error');
      }
    } catch (err) {
      console.warn('Network error while saving custom item, applying locally:', err.message);
      // Fallback local update
      const id = editId || `custom-${Date.now()}`;
      const itemData = { id, ...payload, createdAt: new Date().toISOString() };
      let items = [...(this.customItems || [])];
      if (editId) {
        const idx = items.findIndex(i => i.id === editId);
        if (idx !== -1) items[idx] = { ...items[idx], ...itemData };
      } else {
        items.unshift(itemData);
      }
      this.customItems = items;
      try { localStorage.setItem('apna_store_custom_items', JSON.stringify(items)); } catch(e) {}
      this.updateCustomItemCounts();
      this.renderCustomItems();
      this.populateBasketTypeSelect();
      this.notifyStorefrontUpdate();
      this.showToast('Item saved locally in browser!', 'info');
      this.closeModal('customItemModal');
    }
  },

  async toggleCustomItemStock(id) {
    const item = this.customItems.find(i => i.id === id);
    if (!item) return;
    const newStock = !item.inStock;

    try {
      const data = await this.fetchWithAuth(`/api/admin/custom-items/${id}`, {
        method: 'PUT',
        body: { inStock: newStock }
      });
      if (data && data.success) {
        this.showToast(`"${item.name}" is now ${newStock ? 'In Stock ✓' : 'Sold Out ⚠️'}`, 'success');
        await this.fetchCustomItems();
        this.notifyStorefrontUpdate();
      }
    } catch (err) {
      item.inStock = newStock;
      try { localStorage.setItem('apna_store_custom_items', JSON.stringify(this.customItems)); } catch(e) {}
      this.renderCustomItems();
      this.notifyStorefrontUpdate();
      this.showToast(`Updated stock status locally!`, 'info');
    }
  },

  async deleteCustomItem(id) {
    const item = this.customItems.find(i => i.id === id);
    const itemName = item ? item.name : 'this item';
    if (!confirm(`Are you sure you want to delete "${itemName}" from customizable options?`)) return;

    try {
      const data = await this.fetchWithAuth(`/api/admin/custom-items/${id}`, {
        method: 'DELETE'
      });
      if (data && data.success) {
        this.showToast(`"${itemName}" deleted successfully!`, 'success');
        await this.fetchCustomItems();
        this.notifyStorefrontUpdate();
      } else {
        this.showToast(data?.message || 'Could not delete item', 'error');
      }
    } catch (err) {
      this.customItems = this.customItems.filter(i => i.id !== id);
      try { localStorage.setItem('apna_store_custom_items', JSON.stringify(this.customItems)); } catch(e) {}
      this.updateCustomItemCounts();
      this.renderCustomItems();
      this.populateBasketTypeSelect();
      this.notifyStorefrontUpdate();
      this.showToast(`Deleted "${itemName}" locally!`, 'info');
    }
  },

  // --- SETTINGS ---
  updateLogoPreviewFromInput(val) {
    const preview = document.getElementById('settingLogoPreview');
    if (preview) {
      preview.src = val || 'assets/images/logo.png';
    }
  },

  handleLogoUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showToast('Please select a valid image file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target.result;
      const logoInput = document.getElementById('settingLogo');
      const preview = document.getElementById('settingLogoPreview');
      if (logoInput) logoInput.value = dataUrl;
      if (preview) preview.src = dataUrl;
      this.showToast('Logo image loaded! Click Save to apply.', 'info');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  },

  async fetchSettings() {
    try {
      const data = await this.fetchWithAuth('/api/settings');
      if (data.success && data.settings) {
        this.settings = data.settings;
        const s = this.settings;
        if (document.getElementById('settingBrandName')) document.getElementById('settingBrandName').value = s.brandName || 'APNA TOHFA';
        if (document.getElementById('settingTagline')) document.getElementById('settingTagline').value = s.tagline || 'Apno Ke Naam';
        if (document.getElementById('settingLogo')) document.getElementById('settingLogo').value = s.logo || 'assets/images/logo.png';
        if (document.getElementById('settingLogoPreview')) document.getElementById('settingLogoPreview').src = s.logo || 'assets/images/logo.png';
        if (document.getElementById('settingPhone')) document.getElementById('settingPhone').value = s.phone || '+91 9950263957';
        if (document.getElementById('settingWhatsapp')) document.getElementById('settingWhatsapp').value = s.whatsapp || '919950263957';
        if (document.getElementById('settingEmail')) document.getElementById('settingEmail').value = s.email || 'apnatohfa26@gmail.com';
        if (document.getElementById('settingCorpEmail')) document.getElementById('settingCorpEmail').value = s.corporateEmail || 'apnatohfa26@gmail.com';
        if (document.getElementById('settingAddress')) document.getElementById('settingAddress').value = s.address || 'Malviya Nagar, Jaipur, Rajasthan - 302017';
        if (document.getElementById('settingHours')) document.getElementById('settingHours').value = s.hours || 'Mon – Sun: 9:00 AM – 9:00 PM IST';
        if (document.getElementById('settingInstagram')) document.getElementById('settingInstagram').value = s.instagram || 'https://instagram.com/apnatohfa.official';
        if (document.getElementById('settingInstagramHandle')) document.getElementById('settingInstagramHandle').value = s.instagramHandle || '@apnatohfa.official';
        if (document.getElementById('settingAnnouncement')) document.getElementById('settingAnnouncement').value = s.announcementText || '🪔 Diwali 2026 Festivel';
        if (document.getElementById('settingCouponPill')) document.getElementById('settingCouponPill').value = s.activeCouponPill || '';
        if (document.getElementById('settingFreeShipping')) document.getElementById('settingFreeShipping').value = s.freeShippingThreshold || 5000;
        if (document.getElementById('settingHidePrices')) document.getElementById('settingHidePrices').checked = (s.hidePrices !== undefined) ? Boolean(s.hidePrices) : true;
      }
    } catch (e) {
      console.error('Error fetching settings:', e);
    }
  },

  async saveStoreSettings(e) {
    e.preventDefault();
    const payload = {
      brandName: document.getElementById('settingBrandName').value.trim() || 'APNA TOHFA',
      tagline: document.getElementById('settingTagline').value.trim() || 'Apno Ke Naam',
      logo: document.getElementById('settingLogo').value.trim() || 'assets/images/logo.png',
      phone: document.getElementById('settingPhone').value.trim() || '+91 9950263957',
      whatsapp: document.getElementById('settingWhatsapp').value.trim().replace(/\D/g, '') || '919950263957',
      email: document.getElementById('settingEmail').value.trim() || 'apnatohfa26@gmail.com',
      corporateEmail: document.getElementById('settingCorpEmail').value.trim() || 'apnatohfa26@gmail.com',
      address: document.getElementById('settingAddress').value.trim() || 'Malviya Nagar, Jaipur, Rajasthan - 302017',
      hours: document.getElementById('settingHours').value.trim() || 'Mon – Sun: 9:00 AM – 9:00 PM IST',
      instagram: document.getElementById('settingInstagram') ? document.getElementById('settingInstagram').value.trim() : 'https://instagram.com/apnatohfa.official',
      instagramHandle: document.getElementById('settingInstagramHandle') ? document.getElementById('settingInstagramHandle').value.trim() : '@apnatohfa.official',
      announcementText: document.getElementById('settingAnnouncement').value.trim() || '🪔 Diwali 2026 Festivel',
      activeCouponPill: document.getElementById('settingCouponPill').value.trim(),
      freeShippingThreshold: Number(document.getElementById('settingFreeShipping').value) || 5000,
      hidePrices: document.getElementById('settingHidePrices') ? document.getElementById('settingHidePrices').checked : true
    };

    try {
      const data = await this.fetchWithAuth('/api/admin/settings', {
        method: 'PUT',
        body: payload
      });
      if (data.success) {
        this.showToast('All brand & store settings updated successfully!', 'success');
        this.settings = { ...this.settings, ...payload };
        try { localStorage.setItem('apna_store_settings', JSON.stringify(this.settings)); } catch (e) {}
        this.notifyStorefrontUpdate();
        // Update admin sidebar live
        const sbTitle = document.querySelector('.sidebar-brand-title');
        if (sbTitle) sbTitle.textContent = payload.brandName;
        const sbLogo = document.querySelector('.sidebar-brand img');
        if (sbLogo) sbLogo.src = payload.logo;
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
