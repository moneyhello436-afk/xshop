const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'shopee-clone-secret-key-2026';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

const DATA_DIR = path.join(__dirname, 'data');

function readData(file) {
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeData(file, data) {
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
}

async function initUsers() {
  const users = readData('users.json');
  // Add wallet to existing users
  users.forEach(u => {
    if (!u.wallet) u.wallet = { balance: 0, totalTopUp: 0, totalUsed: 0 };
    if (u.verified === undefined) u.verified = false;
  });
  if (users.length > 0 && !users[0].password.startsWith('$2a$')) return;
  const hashedAdmin = await bcrypt.hash('admin123', 10);
  const hashedDemo = await bcrypt.hash('demo123', 10);
  writeData('users.json', [
    {
      id: 'user1', username: 'admin', email: 'admin@shopee.com',
      password: hashedAdmin, name: 'Admin Shopee', role: 'admin',
      phone: '0812345678', address: '123 Shopee Tower, Bangkok',
      wallet: { balance: 0, totalTopUp: 0, totalUsed: 0 },
      verified: true,
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'user2', username: 'demo', email: 'demo@email.com',
      password: hashedDemo, name: 'Demo User', role: 'customer',
      phone: '0898765432', address: '456 Sukhumvit Rd, Bangkok',
      wallet: { balance: 1000, totalTopUp: 1000, totalUsed: 0 },
      verified: true,
      createdAt: '2026-02-01T00:00:00.000Z'
    }
  ]);
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token ไม่ถูกต้อง' });
  }
}

function adminMiddleware(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึง' });
  next();
}

// ===== AUTH =====
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, name, phone } = req.body;
  const users = readData('users.json');
  if (users.find(u => u.email === email)) return res.status(400).json({ error: 'อีเมลนี้ถูกใช้แล้ว' });
  if (users.find(u => u.username === username)) return res.status(400).json({ error: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' });
  const hashed = await bcrypt.hash(password, 10);
  const user = {
    id: uuidv4(), username, email, password: hashed, name,
    role: 'customer', phone: phone || '', address: '',
    wallet: { balance: 0, totalTopUp: 0, totalUsed: 0 },
    verified: false,
    createdAt: new Date().toISOString()
  };
  users.push(user);
  writeData('users.json', users);
  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username, email, name, role: user.role } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const users = readData('users.json');
  const user = users.find(u => u.email === email || u.username === email);
  if (!user) return res.status(400).json({ error: 'ไม่พบบัญชีผู้ใช้' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, email: user.email, name: user.name, role: user.role } });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const users = readData('users.json');
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
  res.json({ 
    id: user.id, 
    username: user.username, 
    email: user.email, 
    name: user.name, 
    role: user.role, 
    phone: user.phone, 
    address: user.address,
    wallet: user.wallet || { balance: 0, totalTopUp: 0, totalUsed: 0 },
    verified: user.verified || false
  });
});

// ===== PRODUCTS =====
app.get('/api/products', (req, res) => {
  let products = readData('products.json');
  const { category, search, flashSale, sort, limit, page } = req.query;
  if (category) products = products.filter(p => p.categoryId === category);
  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p => p.name.toLowerCase().includes(q) || p.shopName.toLowerCase().includes(q));
  }
  if (flashSale === 'true') products = products.filter(p => p.flashSale);
  if (sort === 'price-asc') products.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') products.sort((a, b) => b.price - a.price);
  else if (sort === 'sold') products.sort((a, b) => b.sold - a.sold);
  else if (sort === 'rating') products.sort((a, b) => b.rating - a.rating);
  const total = products.length;
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const start = (pageNum - 1) * limitNum;
  products = products.slice(start, start + limitNum);
  res.json({ products, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
});

app.get('/api/products/:id', (req, res) => {
  const products = readData('products.json');
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'ไม่พบสินค้า' });
  res.json(product);
});

app.post('/api/products', authMiddleware, adminMiddleware, (req, res) => {
  const products = readData('products.json');
  const product = { id: uuidv4(), ...req.body, sold: 0, createdAt: new Date().toISOString() };
  products.push(product);
  writeData('products.json', products);
  res.status(201).json(product);
});

app.put('/api/products/:id', authMiddleware, adminMiddleware, (req, res) => {
  const products = readData('products.json');
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'ไม่พบสินค้า' });
  products[idx] = { ...products[idx], ...req.body };
  writeData('products.json', products);
  res.json(products[idx]);
});

app.delete('/api/products/:id', authMiddleware, adminMiddleware, (req, res) => {
  let products = readData('products.json');
  products = products.filter(p => p.id !== req.params.id);
  writeData('products.json', products);
  res.json({ message: 'ลบสินค้าแล้ว' });
});

// ===== CATEGORIES =====
app.get('/api/categories', (req, res) => {
  res.json(readData('categories.json'));
});

app.post('/api/categories', authMiddleware, adminMiddleware, (req, res) => {
  const categories = readData('categories.json');
  const cat = { id: uuidv4(), ...req.body };
  categories.push(cat);
  writeData('categories.json', categories);
  res.status(201).json(cat);
});

app.put('/api/categories/:id', authMiddleware, adminMiddleware, (req, res) => {
  const categories = readData('categories.json');
  const idx = categories.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'ไม่พบหมวดหมู่' });
  categories[idx] = { ...categories[idx], ...req.body };
  writeData('categories.json', categories);
  res.json(categories[idx]);
});

app.delete('/api/categories/:id', authMiddleware, adminMiddleware, (req, res) => {
  let categories = readData('categories.json');
  categories = categories.filter(c => c.id !== req.params.id);
  writeData('categories.json', categories);
  res.json({ message: 'ลบหมวดหมู่แล้ว' });
});

// ===== ORDERS =====
app.get('/api/orders', authMiddleware, (req, res) => {
  let orders = readData('orders.json');
  if (req.user.role !== 'admin') orders = orders.filter(o => o.userId === req.user.id);
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(orders);
});

app.get('/api/orders/:id', authMiddleware, (req, res) => {
  const orders = readData('orders.json');
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });
  if (req.user.role !== 'admin' && order.userId !== req.user.id) return res.status(403).json({ error: 'ไม่มีสิทธิ์' });
  res.json(order);
});

app.post('/api/orders', authMiddleware, (req, res) => {
  const { items, shippingAddress, paymentMethod, note } = req.body;
  const products = readData('products.json');
  let total = 0;
  const orderItems = items.map(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product) throw new Error('ไม่พบสินค้า');
    if (product.stock < item.quantity) throw new Error(`${product.name} มีสินค้าไม่เพียงพอ`);
    total += product.price * item.quantity;
    product.stock -= item.quantity;
    product.sold += item.quantity;
    return {
      productId: product.id, name: product.name, price: product.price,
      quantity: item.quantity, image: product.images[0],
      variants: item.variants || {}
    };
  });
  writeData('products.json', products);
  const orders = readData('orders.json');
  const order = {
    id: 'ORD' + Date.now(), userId: req.user.id, userName: req.user.name,
    items: orderItems, total, shippingFee: total >= 500 ? 0 : 39,
    grandTotal: total + (total >= 500 ? 0 : 39),
    shippingAddress, paymentMethod: paymentMethod || 'cod',
    status: 'pending', note: note || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  orders.push(order);
  writeData('orders.json', orders);
  res.status(201).json(order);
});

app.put('/api/orders/:id/status', authMiddleware, adminMiddleware, (req, res) => {
  const orders = readData('orders.json');
  const idx = orders.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });
  orders[idx].status = req.body.status;
  orders[idx].updatedAt = new Date().toISOString();
  writeData('orders.json', orders);
  res.json(orders[idx]);
});

// ===== KYC VERIFICATION =====
app.post('/api/kyc', authMiddleware, (req, res) => {
  const { idType, idNumber, firstName, lastName, dateOfBirth, address, city, state, zipCode, country } = req.body;
  if (!idType || !idNumber || !firstName || !lastName || !dateOfBirth) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูล KYC ให้ครบถ้วน' });
  }
  const kyc = readData('kyc.json');
  let userKyc = kyc.find(k => k.userId === req.user.id);
  const kycData = {
    userId: req.user.id,
    idType,
    idNumber,
    firstName,
    lastName,
    dateOfBirth,
    address: address || '',
    city: city || '',
    state: state || '',
    zipCode: zipCode || '',
    country: country || 'Thailand',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  if (userKyc) {
    userKyc = { ...userKyc, ...kycData };
    const idx = kyc.findIndex(k => k.userId === req.user.id);
    kyc[idx] = userKyc;
  } else {
    kyc.push(kycData);
  }
  writeData('kyc.json', kyc);
  res.status(201).json(kycData);
});

app.get('/api/kyc', authMiddleware, (req, res) => {
  const kyc = readData('kyc.json');
  const userKyc = kyc.find(k => k.userId === req.user.id);
  if (!userKyc) return res.status(404).json({ error: 'ไม่พบข้อมูล KYC' });
  res.json(userKyc);
});

app.get('/api/kyc/admin/list', authMiddleware, adminMiddleware, (req, res) => {
  const kyc = readData('kyc.json');
  const users = readData('users.json');
  const kycList = kyc.map(k => {
    const user = users.find(u => u.id === k.userId);
    return {
      ...k,
      userName: user?.name || 'Unknown',
      userEmail: user?.email || 'Unknown'
    };
  });
  res.json(kycList);
});

app.put('/api/kyc/:userId/approve', authMiddleware, adminMiddleware, (req, res) => {
  const kyc = readData('kyc.json');
  const idx = kyc.findIndex(k => k.userId === req.params.userId);
  if (idx === -1) return res.status(404).json({ error: 'ไม่พบข้อมูล KYC' });
  kyc[idx].status = 'approved';
  kyc[idx].approvedAt = new Date().toISOString();
  kyc[idx].approvedBy = req.user.name;
  kyc[idx].updatedAt = new Date().toISOString();
  writeData('kyc.json', kyc);
  res.json(kyc[idx]);
});

app.put('/api/kyc/:userId/reject', authMiddleware, adminMiddleware, (req, res) => {
  const kyc = readData('kyc.json');
  const idx = kyc.findIndex(k => k.userId === req.params.userId);
  if (idx === -1) return res.status(404).json({ error: 'ไม่พบข้อมูล KYC' });
  kyc[idx].status = 'rejected';
  kyc[idx].rejectionReason = req.body.reason || '';
  kyc[idx].rejectedAt = new Date().toISOString();
  kyc[idx].rejectedBy = req.user.name;
  kyc[idx].updatedAt = new Date().toISOString();
  writeData('kyc.json', kyc);
  res.json(kyc[idx]);
});

// ===== WALLET MANAGEMENT =====
app.get('/api/wallet', authMiddleware, (req, res) => {
  const users = readData('users.json');
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
  res.json({
    userId: user.id,
    balance: user.wallet?.balance || 0,
    totalTopUp: user.wallet?.totalTopUp || 0,
    totalUsed: user.wallet?.totalUsed || 0
  });
});

app.post('/api/wallet/topup', authMiddleware, (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'จำนวนเงินไม่ถูกต้อง' });
  
  const users = readData('users.json');
  const idx = users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
  
  if (!users[idx].wallet) users[idx].wallet = { balance: 0, totalTopUp: 0, totalUsed: 0 };
  users[idx].wallet.balance += amount;
  users[idx].wallet.totalTopUp += amount;
  writeData('users.json', users);
  
  // Record transaction
  const transactions = readData('transactions.json');
  transactions.push({
    id: uuidv4(),
    userId: req.user.id,
    type: 'topup',
    amount,
    description: 'เติมเงินลงบัญชี',
    status: 'completed',
    createdAt: new Date().toISOString()
  });
  writeData('transactions.json', transactions);
  
  res.json({
    message: 'เติมเงินสำเร็จ',
    balance: users[idx].wallet.balance
  });
});

app.post('/api/wallet/withdraw', authMiddleware, (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'จำนวนเงินไม่ถูกต้อง' });
  
  const users = readData('users.json');
  const idx = users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
  
  if (!users[idx].wallet) users[idx].wallet = { balance: 0, totalTopUp: 0, totalUsed: 0 };
  if (users[idx].wallet.balance < amount) return res.status(400).json({ error: 'ยอดเงินไม่เพียงพอ' });
  
  users[idx].wallet.balance -= amount;
  writeData('users.json', users);
  
  // Record transaction
  const transactions = readData('transactions.json');
  transactions.push({
    id: uuidv4(),
    userId: req.user.id,
    type: 'withdraw',
    amount,
    description: 'ถอนเงินออกจากบัญชี',
    status: 'pending',
    createdAt: new Date().toISOString()
  });
  writeData('transactions.json', transactions);
  
  res.json({
    message: 'ยื่นคำขอถอนเงินแล้ว',
    balance: users[idx].wallet.balance
  });
});

app.get('/api/transactions', authMiddleware, (req, res) => {
  const transactions = readData('transactions.json');
  const userTransactions = transactions.filter(t => t.userId === req.user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(userTransactions);
});

// ===== ADMIN WALLET MANAGEMENT =====
app.post('/api/admin/wallet/topup/:userId', authMiddleware, adminMiddleware, (req, res) => {
  const { amount, description } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'จำนวนเงินไม่ถูกต้อง' });
  
  const users = readData('users.json');
  const idx = users.findIndex(u => u.id === req.params.userId);
  if (idx === -1) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
  
  if (!users[idx].wallet) users[idx].wallet = { balance: 0, totalTopUp: 0, totalUsed: 0 };
  users[idx].wallet.balance += amount;
  users[idx].wallet.totalTopUp += amount;
  writeData('users.json', users);
  
  // Record transaction
  const transactions = readData('transactions.json');
  transactions.push({
    id: uuidv4(),
    userId: req.params.userId,
    type: 'admin_topup',
    amount,
    description: description || 'เติมเงินจากแอดมิน',
    adminId: req.user.id,
    adminName: req.user.name,
    status: 'completed',
    createdAt: new Date().toISOString()
  });
  writeData('transactions.json', transactions);
  
  res.json({
    message: 'เติมเงินสำเร็จ',
    userName: users[idx].name,
    balance: users[idx].wallet.balance
  });
});

app.post('/api/admin/wallet/refund/:userId', authMiddleware, adminMiddleware, (req, res) => {
  const { amount, reason } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'จำนวนเงินไม่ถูกต้อง' });
  
  const users = readData('users.json');
  const idx = users.findIndex(u => u.id === req.params.userId);
  if (idx === -1) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
  
  if (!users[idx].wallet) users[idx].wallet = { balance: 0, totalTopUp: 0, totalUsed: 0 };
  users[idx].wallet.balance += amount;
  writeData('users.json', users);
  
  // Record transaction
  const transactions = readData('transactions.json');
  transactions.push({
    id: uuidv4(),
    userId: req.params.userId,
    type: 'refund',
    amount,
    description: reason || 'คืนเงินจากแอดมิน',
    adminId: req.user.id,
    adminName: req.user.name,
    status: 'completed',
    createdAt: new Date().toISOString()
  });
  writeData('transactions.json', transactions);
  
  res.json({
    message: 'คืนเงินสำเร็จ',
    userName: users[idx].name,
    balance: users[idx].wallet.balance
  });
});

app.get('/api/admin/transactions', authMiddleware, adminMiddleware, (req, res) => {
  const transactions = readData('transactions.json');
  const users = readData('users.json');
  const fullTransactions = transactions.map(t => {
    const user = users.find(u => u.id === t.userId);
    return {
      ...t,
      userName: user?.name || 'Unknown',
      userEmail: user?.email || 'Unknown'
    };
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(fullTransactions);
});

// ===== USER MANAGEMENT =====
app.put('/api/admin/users/:userId', authMiddleware, adminMiddleware, (req, res) => {
  const { name, phone, address, verified } = req.body;
  const users = readData('users.json');
  const idx = users.findIndex(u => u.id === req.params.userId);
  if (idx === -1) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
  
  if (name) users[idx].name = name;
  if (phone) users[idx].phone = phone;
  if (address) users[idx].address = address;
  if (verified !== undefined) users[idx].verified = verified;
  
  writeData('users.json', users);
  const { password, ...userWithoutPassword } = users[idx];
  res.json(userWithoutPassword);
});

app.delete('/api/admin/users/:userId', authMiddleware, adminMiddleware, (req, res) => {
  if (req.params.userId === req.user.id) return res.status(400).json({ error: 'ไม่สามารถลบบัญชีของตัวเองได้' });
  
  let users = readData('users.json');
  const user = users.find(u => u.id === req.params.userId);
  if (!user) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
  if (user.role === 'admin') return res.status(400).json({ error: 'ไม่สามารถลบแอดมินได้' });
  
  users = users.filter(u => u.id !== req.params.userId);
  writeData('users.json', users);
  
  res.json({ message: 'ลบผู้ใช้แล้ว' });
});

// ===== ADMIN ORDER MANAGEMENT =====
app.post('/api/admin/orders/create', authMiddleware, adminMiddleware, (req, res) => {
  const { userId, items, shippingAddress, paymentMethod, note } = req.body;
  const users = readData('users.json');
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(400).json({ error: 'ไม่พบผู้ใช้' });
  
  const products = readData('products.json');
  let total = 0;
  const orderItems = items.map(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product) throw new Error('ไม่พบสินค้า');
    if (product.stock < item.quantity) throw new Error(`${product.name} มีสินค้าไม่เพียงพอ`);
    total += product.price * item.quantity;
    product.stock -= item.quantity;
    product.sold += item.quantity;
    return {
      productId: product.id, name: product.name, price: product.price,
      quantity: item.quantity, image: product.images[0],
      variants: item.variants || {}
    };
  });
  writeData('products.json', products);
  const orders = readData('orders.json');
  const order = {
    id: 'ORD' + Date.now(), userId: userId, userName: user.name,
    items: orderItems, total, shippingFee: total >= 500 ? 0 : 39,
    grandTotal: total + (total >= 500 ? 0 : 39),
    shippingAddress, paymentMethod: paymentMethod || 'cod',
    status: 'pending', note: note || '',
    createdByAdmin: req.user.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  orders.push(order);
  writeData('orders.json', orders);
  res.status(201).json(order);
});

app.post('/api/admin/orders/:orderId/mark-paid', authMiddleware, adminMiddleware, (req, res) => {
  const orders = readData('orders.json');
  const idx = orders.findIndex(o => o.id === req.params.orderId);
  if (idx === -1) return res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });
  
  orders[idx].status = 'confirmed';
  orders[idx].paidAt = new Date().toISOString();
  orders[idx].updatedAt = new Date().toISOString();
  writeData('orders.json', orders);
  
  res.json({ message: 'ยืนยันการชำระเงินแล้ว', order: orders[idx] });
});

// ===== KYC MANAGEMENT =====
app.get('/api/users', authMiddleware, adminMiddleware, (req, res) => {
  const users = readData('users.json');
  const kyc = readData('kyc.json');
  const userList = users.map(({ password, ...u }) => {
    const userKyc = kyc.find(k => k.userId === u.id);
    return {
      ...u,
      kycStatus: userKyc?.status || 'not_submitted',
      wallet: u.wallet || { balance: 0, totalTopUp: 0, totalUsed: 0 }
    };
  });
  res.json(userList);
});

// ===== DASHBOARD =====
app.get('/api/dashboard', authMiddleware, adminMiddleware, (req, res) => {
  const products = readData('products.json');
  const orders = readData('orders.json');
  const users = readData('users.json');
  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.grandTotal, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const recentOrders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const topProducts = [...products].sort((a, b) => b.sold - a.sold).slice(0, 5);
  res.json({
    totalProducts: products.length,
    totalOrders: orders.length,
    totalUsers: users.filter(u => u.role === 'customer').length,
    totalRevenue, pendingOrders, recentOrders, topProducts
  });
});

// ===== BANNERS =====
app.get('/api/banners', (req, res) => {
  res.json([
    { id: 1, image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200', title: 'Shopee 11.11 Sale', link: '/?flashSale=true' },
    { id: 2, image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200', title: 'Fashion Week', link: '/?category=cat4' },
    { id: 3, image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200', title: 'Tech Gadgets', link: '/?category=cat1' }
  ]);
});

initUsers().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🛒 Shopee Clone Server running at http://localhost:${PORT}`);
    console.log(`📊 Admin Panel: http://localhost:${PORT}/admin`);
    console.log(`👤 Admin: admin@shopee.com / admin123`);
    console.log(`👤 Demo:  demo@email.com / demo123\n`);
  });
});
