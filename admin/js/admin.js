const API = '/api';
let adminUser = null;

async function api(url, options = {}) {
  const token = localStorage.getItem('admin_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API + url, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API Error: ' + res.status);
  return data;
}

function formatPrice(p) { return '฿' + p.toLocaleString('th-TH'); }

function showToast(msg, type = '') {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' ' + type : '');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function checkAdminAuth() {
  const token = localStorage.getItem('admin_token');
  if (!token) { window.location.href = ADMIN.login; return false; }
  return true;
}

async function loadAdminUser() {
  try {
    adminUser = await api('/auth/me');
    if (adminUser.role !== 'admin') {
      localStorage.removeItem('admin_token');
      window.location.href = ADMIN.login;
      return;
    }
    const el = document.getElementById('adminUserName');
    if (el) el.textContent = adminUser.name;
  } catch {
    localStorage.removeItem('admin_token');
    window.location.href = ADMIN.login;
  }
}

function getSidebarHTML(activePage) {
  const pages = [
    { id: 'dashboard', icon: 'fa-chart-pie', label: 'Dashboard', href: ADMIN.home },
    { id: 'products', icon: 'fa-box', label: 'สินค้า', href: ADMIN.products },
    { id: 'orders', icon: 'fa-shopping-bag', label: 'คำสั่งซื้อ', href: ADMIN.orders },
    { id: 'categories', icon: 'fa-tags', label: 'หมวดหมู่', href: ADMIN.categories },
    { id: 'users', icon: 'fa-users', label: 'จัดการผู้ใช้', href: ADMIN.usersManage },
    { id: 'kyc', icon: 'fa-id-card', label: 'KYC Verification', href: ADMIN.kyc },
    { id: 'wallet', icon: 'fa-wallet', label: 'ธุรกรรมเงิน', href: ADMIN.wallet },
  ];
  return `
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="icon">🛒</div>
        <div><span>Shopee Admin</span><small>ระบบหลังบ้าน</small></div>
      </div>
      <nav class="sidebar-menu">
        <div class="menu-label">เมนูหลัก</div>
        ${pages.map(p => `
          <a href="${p.href}" class="menu-item ${activePage === p.id ? 'active' : ''}">
            <i class="fas ${p.icon}"></i> ${p.label}
          </a>
        `).join('')}
        <div class="menu-label" style="margin-top:16px;">อื่นๆ</div>
        <a href="${ADMIN.store}" class="menu-item" target="_blank"><i class="fas fa-external-link-alt"></i> ดูหน้าร้าน</a>
        <a href="#" class="menu-item" onclick="adminLogout()"><i class="fas fa-sign-out-alt"></i> ออกจากระบบ</a>
      </nav>
    </aside>`;
}

function getTopHeaderHTML(title) {
  return `
    <header class="top-header">
      <h1>${title}</h1>
      <div class="header-actions">
        <a href="${ADMIN.store}" target="_blank"><i class="fas fa-store"></i> หน้าร้าน</a>
        <div class="user-info">
          <div class="user-avatar"><i class="fas fa-user"></i></div>
          <span id="adminUserName">Admin</span>
        </div>
      </div>
    </header>`;
}

function adminLogout() {
  localStorage.removeItem('admin_token');
  window.location.href = ADMIN.login;
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

const statusMap = {
  pending: { label: 'รอดำเนินการ', class: 'badge-pending' },
  confirmed: { label: 'ยืนยันแล้ว', class: 'badge-confirmed' },
  shipping: { label: 'กำลังจัดส่ง', class: 'badge-shipping' },
  delivered: { label: 'จัดส่งแล้ว', class: 'badge-delivered' },
  cancelled: { label: 'ยกเลิก', class: 'badge-cancelled' }
};

function renderStatusBadge(status) {
  const s = statusMap[status] || { label: status, class: '' };
  return `<span class="badge ${s.class}">${s.label}</span>`;
}
