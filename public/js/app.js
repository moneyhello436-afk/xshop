const API = '/api';

const state = {
  user: null,
  cart: JSON.parse(localStorage.getItem('shopee_cart') || '[]'),
  categories: [],
  products: [],
  banners: []
};

function saveCart() {
  localStorage.setItem('shopee_cart', JSON.stringify(state.cart));
  updateCartBadge();
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (badge) {
    const count = state.cart.reduce((s, i) => s + i.quantity, 0);
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

function formatPrice(price) {
  return '฿' + price.toLocaleString('th-TH');
}

function showToast(msg, type = '') {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = 'toast show' + (type ? ' ' + type : '');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

async function api(url, options = {}) {
  try {
    const token = localStorage.getItem('shopee_token');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(API + url, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด');
    return data;
  } catch (e) {
    if (typeof DB !== 'undefined') {
      try { return DB.api(url, options); }
      catch (err) { throw new Error(err.message); }
    }
    throw e;
  }
}

async function checkAuth() {
  const token = localStorage.getItem('shopee_token');
  if (!token) return;
  try {
    state.user = await api('/auth/me');
    updateUserUI();
  } catch {
    localStorage.removeItem('shopee_token');
  }
}

function updateUserUI() {
  const el = document.getElementById('userMenu');
  if (!el) return;
  if (state.user) {
    el.innerHTML = `
      <div class="header-action" onclick="toggleUserDropdown()">
        <i class="fas fa-user"></i>
        <span>${state.user.name.split(' ')[0]}</span>
      </div>
      <div id="userDropdown" class="user-dropdown" style="display:none;position:absolute;top:100%;right:0;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.15);border-radius:4px;min-width:160px;z-index:100;">
        <a href="${SHOPEE.orders}" style="display:block;padding:10px 16px;font-size:13px;color:#333;">คำสั่งซื้อของฉัน</a>
        <a href="#" onclick="logout()" style="display:block;padding:10px 16px;font-size:13px;color:#333;">ออกจากระบบ</a>
      </div>`;
  } else {
    el.innerHTML = `<a href="#" class="header-action" onclick="openAuthModal()"><i class="fas fa-user"></i><span>เข้าสู่ระบบ</span></a>`;
  }
}

function toggleUserDropdown() {
  const dd = document.getElementById('userDropdown');
  if (dd) dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
}

function logout() {
  localStorage.removeItem('shopee_token');
  state.user = null;
  updateUserUI();
  showToast('ออกจากระบบแล้ว');
  if (window.location.pathname.includes('checkout') || window.location.pathname.includes('orders')) {
    window.location.href = SHOPEE.home;
  }
}

function openAuthModal(tab = 'login') {
  document.getElementById('authModal').classList.add('active');
  switchAuthTab(tab);
}

function closeAuthModal() {
  document.getElementById('authModal').classList.remove('active');
  document.getElementById('authError').textContent = '';
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  try {
    const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    localStorage.setItem('shopee_token', data.token);
    state.user = data.user;
    updateUserUI();
    closeAuthModal();
    showToast('เข้าสู่ระบบสำเร็จ', 'success');
  } catch (err) {
    document.getElementById('authError').textContent = err.message;
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const body = {
    username: document.getElementById('regUsername').value,
    email: document.getElementById('regEmail').value,
    password: document.getElementById('regPassword').value,
    name: document.getElementById('regName').value,
    phone: document.getElementById('regPhone').value
  };
  const kycData = {
    firstName: document.getElementById('regName').value.split(' ')[0],
    lastName: document.getElementById('regName').value.split(' ').slice(1).join(' ') || document.getElementById('regName').value,
    idType: document.getElementById('regIdType').value,
    idNumber: document.getElementById('regIdNumber').value,
    dateOfBirth: document.getElementById('regDateOfBirth').value,
    address: document.getElementById('regAddress').value || '',
    city: document.getElementById('regCity').value || '',
    state: document.getElementById('regState').value || '',
    zipCode: document.getElementById('regZipCode').value || '',
    country: 'Thailand'
  };
  try {
    const data = await api('/auth/register', { method: 'POST', body: JSON.stringify(body) });
    localStorage.setItem('shopee_token', data.token);
    state.user = data.user;
    
    // Send KYC data to backend
    try {
      await api('/kyc', { method: 'POST', body: JSON.stringify(kycData) });
    } catch (kycErr) {
      console.log('KYC error:', kycErr.message);
    }
    
    updateUserUI();
    closeAuthModal();
    showToast('สมัครสมาชิกและส่งข้อมูล KYC สำเร็จ', 'success');
  } catch (err) {
    document.getElementById('authError').textContent = err.message;
  }
}

function switchRegisterStep(step) {
  if (step === 'kyc') {
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    if (!username || !email || !password) {
      alert('กรุณากรอกข้อมูลก่อน');
      return;
    }
    document.getElementById('registerStep1').style.display = 'none';
    document.getElementById('registerStep2').style.display = 'block';
  } else if (step === 'account') {
    document.getElementById('registerStep1').style.display = 'block';
    document.getElementById('registerStep2').style.display = 'none';
  }
}

function renderProductCard(product, compact = false) {
  const discount = product.discount ? `<div class="product-discount-badge">-${product.discount}%</div>` : '';
  const flash = product.flashSale ? '<div class="product-flash-badge">⚡ Flash Sale</div>' : '';
  const shipping = product.freeShipping ? '<div class="free-shipping-tag">ส่งฟรี</div>' : '';
  return `
    <div class="product-card" onclick="window.location.href='${SHOPEE.product(product.id)}'">
      <div class="product-card-image">
        <img src="${product.images[0]}" alt="${product.name}" loading="lazy">
        ${discount}${flash}
      </div>
      <div class="product-card-body">
        <div class="product-card-name">${product.name}</div>
        <div class="product-card-price">
          <span class="price-current">${formatPrice(product.price)}</span>
          ${product.originalPrice ? `<span class="price-original">${formatPrice(product.originalPrice)}</span>` : ''}
        </div>
        <div class="product-card-meta">
          <span class="product-rating">★ ${product.rating}</span>
          <span>ขายแล้ว ${product.sold >= 1000 ? (product.sold/1000).toFixed(1)+'k' : product.sold}</span>
        </div>
        ${shipping}
      </div>
    </div>`;
}

function addToCart(productId, quantity = 1, variants = {}) {
  const existing = state.cart.find(i => i.productId === productId && JSON.stringify(i.variants) === JSON.stringify(variants));
  if (existing) {
    existing.quantity += quantity;
  } else {
    state.cart.push({ productId, quantity, variants });
  }
  saveCart();
  showToast('เพิ่มลงตะกร้าแล้ว', 'success');
}

function removeFromCart(index) {
  state.cart.splice(index, 1);
  saveCart();
}

function getHeaderHTML() {
  return `
    <div class="top-bar">
      <div class="container">
        <div class="top-bar-left">
          <a href="#">Seller Centre</a>
          <span class="top-bar-divider">|</span>
          <a href="#">ดาวน์โหลด</a>
          <span class="top-bar-divider">|</span>
          <span>ติดตามเรา</span>
        </div>
        <div class="top-bar-right">
          <a href="#"><i class="fas fa-bell"></i> การแจ้งเตือน</a>
          <a href="#"><i class="fas fa-question-circle"></i> ช่วยเหลือ</a>
          <span id="userMenu" style="position:relative;"></span>
        </div>
      </div>
    </div>
    <header class="header">
      <div class="container">
        <a href="${SHOPEE.home}" class="logo">
          <div class="logo-icon">🛒</div>
          Shopee
        </a>
        <form class="search-box" onsubmit="handleSearch(event)">
          <input type="text" id="searchInput" placeholder="ค้นหาสินค้า..." value="${new URLSearchParams(location.search).get('search') || ''}">
          <button type="submit"><i class="fas fa-search"></i></button>
        </form>
        <div class="header-actions">
          <a href="${SHOPEE.cart}" class="header-action">
            <i class="fas fa-shopping-cart"></i>
            <span>ตะกร้า</span>
            <span class="cart-badge" id="cartBadge" style="display:none">0</span>
          </a>
        </div>
      </div>
    </header>`;
}

function getFooterHTML() {
  return `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-col">
            <h4>ศูนย์ช่วยเหลือ</h4>
            <ul>
              <li><a href="#">ศูนย์ช่วยเหลือ Shopee</a></li>
              <li><a href="#">วิธีการสั่งซื้อ</a></li>
              <li><a href="#">วิธีการชำระเงิน</a></li>
              <li><a href="#">นโยบายคืนเงิน</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>เกี่ยวกับ Shopee</h4>
            <ul>
              <li><a href="#">เกี่ยวกับเรา</a></li>
              <li><a href="#">Shopee Careers</a></li>
              <li><a href="#">นโยบายความเป็นส่วนตัว</a></li>
              <li><a href="#">ข้อกำหนดในการให้บริการ</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>ติดตามเรา</h4>
            <ul>
              <li><a href="#">Facebook</a></li>
              <li><a href="#">Instagram</a></li>
              <li><a href="#">Line</a></li>
              <li><a href="#">Twitter</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>ช่องทางการชำระเงิน</h4>
            <ul>
              <li><a href="#">ShopeePay</a></li>
              <li><a href="#">บัตรเครดิต/เดบิต</a></li>
              <li><a href="#">เก็บเงินปลายทาง</a></li>
              <li><a href="#">โอนผ่านธนาคาร</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          © 2026 Shopee Clone. All rights reserved.
        </div>
      </div>
    </footer>`;
}

function getAuthModalHTML() {
  return `
    <div class="modal-overlay" id="authModal">
      <div class="modal">
        <button class="modal-close" onclick="closeAuthModal()">&times;</button>
        <div class="modal-header"><h2>ยินดีต้อนรับสู่ Shopee</h2></div>
        <div class="modal-body">
          <div class="auth-tabs">
            <button class="auth-tab active" data-tab="login" onclick="switchAuthTab('login')">เข้าสู่ระบบ</button>
            <button class="auth-tab" data-tab="register" onclick="switchAuthTab('register')">สมัครสมาชิก</button>
          </div>
          <div id="authError" class="auth-error"></div>
          <form id="loginForm" onsubmit="handleLogin(event)">
            <div class="form-group">
              <label>อีเมล / ชื่อผู้ใช้</label>
              <input type="text" id="loginEmail" required placeholder="admin@shopee.com">
            </div>
            <div class="form-group">
              <label>รหัสผ่าน</label>
              <input type="password" id="loginPassword" required placeholder="admin123">
            </div>
            <button type="submit" class="btn btn-primary btn-block">เข้าสู่ระบบ</button>
          </form>
          <form id="registerForm" style="display:none" onsubmit="handleRegister(event)">
            <div id="registerStep1">
              <h3 style="font-size:14px;margin-bottom:12px;font-weight:500;">ขั้นตอนที่ 1: ข้อมูลบัญชี</h3>
              <div class="form-group">
                <label>ชื่อผู้ใช้</label>
                <input type="text" id="regUsername" required>
              </div>
              <div class="form-group">
                <label>อีเมล</label>
                <input type="email" id="regEmail" required>
              </div>
              <div class="form-group">
                <label>รหัสผ่าน</label>
                <input type="password" id="regPassword" required minlength="6">
              </div>
              <div class="form-group">
                <label>เบอร์โทร</label>
                <input type="tel" id="regPhone">
              </div>
              <button type="button" class="btn btn-primary btn-block" onclick="switchRegisterStep('kyc')">ต่อไป → KYC</button>
            </div>
            <div id="registerStep2" style="display:none">
              <h3 style="font-size:14px;margin-bottom:12px;font-weight:500;">ขั้นตอนที่ 2: ข้อมูล KYC</h3>
              <div class="form-group">
                <label>ชื่อ-นามสกุล</label>
                <input type="text" id="regName" required>
              </div>
              <div class="form-group">
                <label>ประเภทเอกสার</label>
                <select id="regIdType" required>
                  <option value="">เลือกประเภท</option>
                  <option value="national_id">บัตรประชาชน</option>
                  <option value="passport">พาสปอร์ต</option>
                  <option value="driver_license">ใบขับขี่</option>
                </select>
              </div>
              <div class="form-group">
                <label>เลขประจำตัว</label>
                <input type="text" id="regIdNumber" required>
              </div>
              <div class="form-group">
                <label>วันเกิด</label>
                <input type="date" id="regDateOfBirth" required>
              </div>
              <div class="form-group">
                <label>ที่อยู่</label>
                <input type="text" id="regAddress">
              </div>
              <div class="form-group">
                <label>เมือง</label>
                <input type="text" id="regCity">
              </div>
              <div class="form-group">
                <label>จังหวัด</label>
                <input type="text" id="regState">
              </div>
              <div class="form-group">
                <label>รหัสไปรษณีย์</label>
                <input type="text" id="regZipCode">
              </div>
              <button type="button" class="btn btn-outline btn-block" onclick="switchRegisterStep('account')" style="margin-bottom:8px;">← ย้อนกลับ</button>
              <button type="submit" class="btn btn-primary btn-block">สมัครสมาชิก</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;
}

function handleSearch(e) {
  e.preventDefault();
  const q = document.getElementById('searchInput').value.trim();
  if (q) window.location.href = SHOPEE.search(q);
}

function initCountdown() {
  const end = new Date();
  end.setHours(23, 59, 59);
  function update() {
    const now = new Date();
    let diff = end - now;
    if (diff < 0) { end.setDate(end.getDate() + 1); diff = end - now; }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    ['cdH','cdM','cdS'].forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String([h,m,s][i]).padStart(2,'0');
    });
  }
  update();
  setInterval(update, 1000);
}

function initBannerSlider() {
  let current = 0;
  const slides = document.querySelectorAll('.banner-slide');
  const dots = document.querySelectorAll('.banner-dot');
  if (!slides.length) return;
  setInterval(() => {
    slides[current].classList.remove('active');
    if (dots[current]) dots[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
    if (dots[current]) dots[current].classList.add('active');
  }, 4000);
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  updateCartBadge();
});
