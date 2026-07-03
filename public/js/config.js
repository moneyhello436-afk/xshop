// Path helpers — works with Express server and direct file open
const SHOPEE = {
  home: 'index.html',
  product: (id) => `product.html?id=${id}`,
  cart: 'cart.html',
  checkout: 'checkout.html',
  orders: 'orders.html',
  admin: '../admin/login.html',
  adminHome: '../admin/index.html',
  css: 'css/style.css',
  search: (q) => `index.html?search=${encodeURIComponent(q)}`,
  category: (id) => `index.html?category=${id}`,
  flashSale: 'index.html?flashSale=true'
};

const ADMIN = {
  login: 'login.html',
  home: 'index.html',
  products: 'products.html',
  orders: 'orders.html',
  categories: 'categories.html',
  users: 'users.html',
  css: 'css/admin.css',
  store: '../public/index.html'
};
