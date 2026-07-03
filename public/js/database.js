const DB = {
  KEYS: { products: 'shopee_products', categories: 'shopee_categories', users: 'shopee_users', orders: 'shopee_orders', initialized: 'shopee_db_init' },

  init() {
    if (localStorage.getItem(this.KEYS.initialized)) return;
    const categories = [
      { id: "cat1", name: "โทรศัพท์มือถือ", icon: "📱", slug: "mobile" },
      { id: "cat2", name: "คอมพิวเตอร์", icon: "💻", slug: "computer" },
      { id: "cat3", name: "เครื่องใช้ไฟฟ้า", icon: "🔌", slug: "appliance" },
      { id: "cat4", name: "เสื้อผ้าผู้ชาย", icon: "👔", slug: "men-fashion" },
      { id: "cat5", name: "เสื้อผ้าผู้หญิง", icon: "👗", slug: "women-fashion" },
      { id: "cat6", name: "รองเท้าผู้ชาย", icon: "👟", slug: "men-shoes" },
      { id: "cat7", name: "กระเป๋า", icon: "👜", slug: "bags" },
      { id: "cat8", name: "เครื่องสำอาง", icon: "💄", slug: "beauty" },
      { id: "cat9", name: "สุขภาพ", icon: "💊", slug: "health" },
      { id: "cat10", name: "ของเล่น", icon: "🧸", slug: "toys" },
      { id: "cat11", name: "อาหาร", icon: "🍜", slug: "food" },
      { id: "cat12", name: "เฟอร์นิเจอร์", icon: "🛋️", slug: "furniture" }
    ];
    const products = [
      { id:"prod1", name:"iPhone 15 Pro Max 256GB สี Titanium Natural", description:"iPhone 15 Pro Max มาพร้อมชิป A17 Pro กล้อง 48MP", price:48900, originalPrice:52900, discount:8, categoryId:"cat1", shopName:"Apple Official Store", shopId:"shop1", rating:4.9, sold:1250, stock:50, images:["https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400"], variants:[{name:"สี",options:["Titanium Natural","Titanium Blue"]}], flashSale:true, freeShipping:true, createdAt:"2026-01-15T00:00:00.000Z" },
      { id:"prod2", name:"Samsung Galaxy S24 Ultra 512GB", description:"Galaxy S24 Ultra กล้อง 200MP S Pen ในตัว", price:42900, originalPrice:46900, discount:9, categoryId:"cat1", shopName:"Samsung Official", shopId:"shop2", rating:4.8, sold:890, stock:35, images:["https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400"], variants:[], flashSale:true, freeShipping:true, createdAt:"2026-01-20T00:00:00.000Z" },
      { id:"prod3", name:"MacBook Air M3 13 นิ้ว", description:"MacBook Air ชิป M3 แบattery 18 ชม.", price:39900, originalPrice:42900, discount:7, categoryId:"cat2", shopName:"Apple Official Store", shopId:"shop1", rating:4.9, sold:560, stock:20, images:["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400"], variants:[], flashSale:false, freeShipping:true, createdAt:"2026-02-01T00:00:00.000Z" },
      { id:"prod4", name:"เสื้อโปโลผู้ชาย Premium Cotton", description:"เสื้อโปโลผ้าคotton 100% ใส่สบาย", price:299, originalPrice:599, discount:50, categoryId:"cat4", shopName:"Fashion Hub TH", shopId:"shop3", rating:4.7, sold:3200, stock:200, images:["https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=400"], variants:[{name:"ไซส์",options:["S","M","L","XL"]}], flashSale:true, freeShipping:false, createdAt:"2026-02-10T00:00:00.000Z" },
      { id:"prod5", name:"กระเป๋าสะพายข้าง Luxury Leather", description:"กระเป๋าหนังแท้ ดีไซน์หรูหรา", price:1290, originalPrice:2590, discount:50, categoryId:"cat7", shopName:"Bag Paradise", shopId:"shop4", rating:4.6, sold:780, stock:45, images:["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400"], variants:[], flashSale:true, freeShipping:true, createdAt:"2026-02-15T00:00:00.000Z" },
      { id:"prod6", name:"รองเท้าผ้าใบ Nike Air Max 90", description:"รองเท้า Nike Air Max 90 สไตล์คลาสสิก", price:3490, originalPrice:4990, discount:30, categoryId:"cat6", shopName:"Sneaker World", shopId:"shop5", rating:4.8, sold:1560, stock:80, images:["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"], variants:[], flashSale:false, freeShipping:true, createdAt:"2026-03-01T00:00:00.000Z" },
      { id:"prod7", name:"เครื่องปั่น Smoothie Maker 1000W", description:"เครื่องปั่น 6 ใบมีด ความเร็ว 5 ระดับ", price:890, originalPrice:1590, discount:44, categoryId:"cat3", shopName:"Home Appliance Pro", shopId:"shop6", rating:4.5, sold:2100, stock:120, images:["https://images.unsplash.com/photo-1570222094114-d0547368172a?w=400"], variants:[], flashSale:true, freeShipping:true, createdAt:"2026-03-05T00:00:00.000Z" },
      { id:"prod8", name:"ลิปสติก MAC Ruby Woo Matte", description:"ลิปสติก MAC สี Ruby Woo เนื้อ Matte", price:890, originalPrice:1200, discount:26, categoryId:"cat8", shopName:"Beauty Queen", shopId:"shop7", rating:4.9, sold:4500, stock:300, images:["https://images.unsplash.com/photo-1586495777744-4413d210d962?w=400"], variants:[], flashSale:false, freeShipping:false, createdAt:"2026-03-10T00:00:00.000Z" },
      { id:"prod9", name:"หูฟัง Sony WH-1000XM5 Wireless", description:"หูฟัง Noise Cancelling อันดับ 1", price:11990, originalPrice:13990, discount:14, categoryId:"cat1", shopName:"Tech Gadget TH", shopId:"shop8", rating:4.9, sold:670, stock:25, images:["https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400"], variants:[], flashSale:true, freeShipping:true, createdAt:"2026-03-15T00:00:00.000Z" },
      { id:"prod10", name:"โซฟา 3 ที่นั่ง Premium", description:"โซฟาดีไซน์โมเดิร์น ผ้ากำมะหยี่นุ่ม", price:15900, originalPrice:22900, discount:31, categoryId:"cat12", shopName:"Furniture Land", shopId:"shop9", rating:4.4, sold:89, stock:10, images:["https://images.unsplash.com/photo-1555041467-a586c17e46bb?w=400"], variants:[], flashSale:false, freeShipping:true, createdAt:"2026-03-20T00:00:00.000Z" },
      { id:"prod11", name:"ชุดเครื่องสำอาง SK-II Starter Kit", description:"ชุดเริ่มต้น SK-II", price:4590, originalPrice:5990, discount:23, categoryId:"cat8", shopName:"Beauty Queen", shopId:"shop7", rating:4.8, sold:1200, stock:60, images:["https://images.unsplash.com/photo-1570194065650-d99fb4b3c1e9?w=400"], variants:[], flashSale:true, freeShipping:true, createdAt:"2026-04-01T00:00:00.000Z" },
      { id:"prod12", name:"กาแฟ Arabica Premium 1kg", description:"เมล็ดกาแฟ Arabica 100% คั่วสด", price:450, originalPrice:650, discount:31, categoryId:"cat11", shopName:"Coffee Lover TH", shopId:"shop10", rating:4.7, sold:5600, stock:500, images:["https://images.unsplash.com/photo-1559056199-641a0ac8b55c?w=400"], variants:[], flashSale:false, freeShipping:false, createdAt:"2026-04-05T00:00:00.000Z" }
    ];
    const users = [
      { id:"user1", username:"admin", email:"admin@shopee.com", password:"admin123", name:"Admin Shopee", role:"admin", phone:"0812345678", address:"123 Shopee Tower, Bangkok", createdAt:"2026-01-01T00:00:00.000Z" },
      { id:"user2", username:"demo", email:"demo@email.com", password:"demo123", name:"Demo User", role:"customer", phone:"0898765432", address:"456 Sukhumvit Rd, Bangkok", createdAt:"2026-02-01T00:00:00.000Z" }
    ];
    localStorage.setItem(this.KEYS.categories, JSON.stringify(categories));
    localStorage.setItem(this.KEYS.products, JSON.stringify(products));
    localStorage.setItem(this.KEYS.users, JSON.stringify(users));
    localStorage.setItem(this.KEYS.orders, JSON.stringify([]));
    localStorage.setItem(this.KEYS.initialized, '1');
  },

  _get(key) { return JSON.parse(localStorage.getItem(key) || '[]'); },
  _set(key, data) { localStorage.setItem(key, JSON.stringify(data)); },
  _uid() { return 'id_' + Date.now() + Math.random().toString(36).substr(2, 5); },

  getCurrentUser() {
    const token = localStorage.getItem('shopee_token') || localStorage.getItem('admin_token');
    if (!token) return null;
    try { return JSON.parse(atob(token)); } catch { return null; }
  },

  login(email, password) {
    const users = this._get(this.KEYS.users);
    const user = users.find(u => u.email === email || u.username === email);
    if (!user || user.password !== password) throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    const token = btoa(JSON.stringify({ id: user.id, role: user.role, name: user.name }));
    return { token, user: { id: user.id, username: user.username, email: user.email, name: user.name, role: user.role, phone: user.phone, address: user.address } };
  },

  register(data) {
    const users = this._get(this.KEYS.users);
    if (users.find(u => u.email === data.email)) throw new Error('อีเมลนี้ถูกใช้แล้ว');
    if (users.find(u => u.username === data.username)) throw new Error('ชื่อผู้ใช้นี้ถูกใช้แล้ว');
    const user = { id: this._uid(), ...data, role: 'customer', address: '', createdAt: new Date().toISOString() };
    users.push(user);
    this._set(this.KEYS.users, users);
    const token = btoa(JSON.stringify({ id: user.id, role: user.role, name: user.name }));
    return { token, user: { id: user.id, username: user.username, email: user.email, name: user.name, role: user.role } };
  },

  getMe() {
    const cu = this.getCurrentUser();
    if (!cu) throw new Error('กรุณาเข้าสู่ระบบ');
    const user = this._get(this.KEYS.users).find(u => u.id === cu.id);
    if (!user) throw new Error('ไม่พบผู้ใช้');
    return { id: user.id, username: user.username, email: user.email, name: user.name, role: user.role, phone: user.phone, address: user.address };
  },

  getProducts(query = {}) {
    let products = this._get(this.KEYS.products);
    if (query.category) products = products.filter(p => p.categoryId === query.category);
    if (query.search) { const q = query.search.toLowerCase(); products = products.filter(p => p.name.toLowerCase().includes(q)); }
    if (query.flashSale === 'true') products = products.filter(p => p.flashSale);
    const total = products.length;
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    return { products: products.slice((page-1)*limit, page*limit), total, page, totalPages: Math.ceil(total/limit) };
  },

  getProduct(id) {
    const p = this._get(this.KEYS.products).find(p => p.id === id);
    if (!p) throw new Error('ไม่พบสินค้า');
    return p;
  },

  saveProduct(data, id) {
    const products = this._get(this.KEYS.products);
    if (id) {
      const idx = products.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('ไม่พบสินค้า');
      products[idx] = { ...products[idx], ...data };
      this._set(this.KEYS.products, products);
      return products[idx];
    }
    const p = { id: this._uid(), sold: 0, createdAt: new Date().toISOString(), ...data };
    products.push(p);
    this._set(this.KEYS.products, products);
    return p;
  },

  deleteProduct(id) {
    this._set(this.KEYS.products, this._get(this.KEYS.products).filter(p => p.id !== id));
    return { message: 'ลบแล้ว' };
  },

  getCategories() { return this._get(this.KEYS.categories); },
  saveCategory(data, id) {
    const cats = this._get(this.KEYS.categories);
    if (id) { const idx = cats.findIndex(c => c.id === id); cats[idx] = { ...cats[idx], ...data }; this._set(this.KEYS.categories, cats); return cats[idx]; }
    const c = { id: this._uid(), ...data }; cats.push(c); this._set(this.KEYS.categories, cats); return c;
  },
  deleteCategory(id) { this._set(this.KEYS.categories, this._get(this.KEYS.categories).filter(c => c.id !== id)); },

  getOrders(userId, isAdmin) {
    let orders = this._get(this.KEYS.orders);
    if (!isAdmin) orders = orders.filter(o => o.userId === userId);
    return orders.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  createOrder(data, user) {
    const products = this._get(this.KEYS.products);
    let total = 0;
    const orderItems = data.items.map(item => {
      const p = products.find(x => x.id === item.productId);
      if (!p) throw new Error('ไม่พบสินค้า');
      if (p.stock < item.quantity) throw new Error(p.name + ' มีสินค้าไม่เพียงพอ');
      total += p.price * item.quantity;
      p.stock -= item.quantity; p.sold += item.quantity;
      return { productId: p.id, name: p.name, price: p.price, quantity: item.quantity, image: p.images[0], variants: item.variants || {} };
    });
    this._set(this.KEYS.products, products);
    const orders = this._get(this.KEYS.orders);
    const shipping = total >= 500 ? 0 : 39;
    const order = { id: 'ORD'+Date.now(), userId: user.id, userName: user.name, items: orderItems, total, shippingFee: shipping, grandTotal: total+shipping, shippingAddress: data.shippingAddress, paymentMethod: data.paymentMethod||'cod', status:'pending', note:'', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    orders.push(order);
    this._set(this.KEYS.orders, orders);
    return order;
  },

  updateOrderStatus(id, status) {
    const orders = this._get(this.KEYS.orders);
    const idx = orders.findIndex(o => o.id === id);
    orders[idx].status = status;
    orders[idx].updatedAt = new Date().toISOString();
    this._set(this.KEYS.orders, orders);
    return orders[idx];
  },

  getUsers() { return this._get(this.KEYS.users).map(({password,...u}) => u); },

  getDashboard() {
    const products = this._get(this.KEYS.products);
    const orders = this._get(this.KEYS.orders);
    const users = this._get(this.KEYS.users);
    return {
      totalProducts: products.length, totalOrders: orders.length,
      totalUsers: users.filter(u => u.role === 'customer').length,
      totalRevenue: orders.filter(o => o.status !== 'cancelled').reduce((s,o) => s+o.grandTotal, 0),
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      recentOrders: orders.sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5),
      topProducts: [...products].sort((a,b) => b.sold-a.sold).slice(0,5)
    };
  },

  getBanners() {
    return [
      { id:1, image:'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200', title:'Shopee 11.11 Sale', link:'/?flashSale=true' },
      { id:2, image:'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200', title:'Fashion Week', link:'/?category=cat4' },
      { id:3, image:'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200', title:'Tech Gadgets', link:'/?category=cat1' }
    ];
  },

  api(url, options = {}) {
    this.init();
    const method = (options.method || 'GET').toUpperCase();
    const body = options.body ? JSON.parse(options.body) : {};
    const cu = this.getCurrentUser();

    if (url.startsWith('/auth/login') && method === 'POST') return this.login(body.email, body.password);
    if (url.startsWith('/auth/register') && method === 'POST') return this.register(body);
    if (url.startsWith('/auth/me')) return this.getMe();

    if (url.startsWith('/products?') || url === '/products') {
      const q = Object.fromEntries(new URLSearchParams(url.split('?')[1] || ''));
      return this.getProducts(q);
    }
    if (url.match(/^\/products\/[^/]+$/)) {
      const id = url.split('/products/')[1];
      if (method === 'GET') return this.getProduct(id);
      if (method === 'PUT') { if (!cu || cu.role !== 'admin') throw new Error('ไม่มีสิทธิ์'); return this.saveProduct(body, id); }
      if (method === 'DELETE') { if (!cu || cu.role !== 'admin') throw new Error('ไม่มีสิทธิ์'); return this.deleteProduct(id); }
    }
    if (url === '/products' && method === 'POST') { if (!cu || cu.role !== 'admin') throw new Error('ไม่มีสิทธิ์'); return this.saveProduct(body); }

    if (url === '/categories' && method === 'GET') return this.getCategories();
    if (url === '/categories' && method === 'POST') { if (!cu || cu.role !== 'admin') throw new Error('ไม่มีสิทธิ์'); return this.saveCategory(body); }
    if (url.match(/^\/categories\/[^/]+$/)) {
      const id = url.split('/categories/')[1];
      if (method === 'PUT') return this.saveCategory(body, id);
      if (method === 'DELETE') return this.deleteCategory(id);
    }

    if (url === '/orders' && method === 'GET') return this.getOrders(cu?.id, cu?.role === 'admin');
    if (url === '/orders' && method === 'POST') return this.createOrder(body, cu);
    if (url.match(/^\/orders\/[^/]+\/status$/) && method === 'PUT') {
      if (!cu || cu.role !== 'admin') throw new Error('ไม่มีสิทธิ์');
      return this.updateOrderStatus(url.split('/orders/')[1].replace('/status',''), body.status);
    }

    if (url === '/users') return this.getUsers();
    if (url === '/dashboard') { if (!cu || cu.role !== 'admin') throw new Error('ไม่มีสิทธิ์'); return this.getDashboard(); }
    if (url === '/banners') return this.getBanners();

    throw new Error('API not found: ' + url);
  }
};

DB.init();

async function apiClient(url, options = {}) {
  try {
    const token = localStorage.getItem('shopee_token') || localStorage.getItem('admin_token');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch('/api' + url, { ...options, headers });
    if (res.ok) return res.json();
  } catch {}
  return DB.api(url, options);
}
