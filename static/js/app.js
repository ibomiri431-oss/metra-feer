let currentUser = JSON.parse(localStorage.getItem('m_market_user')) || null;
let currentPage = 'home';

// Init on load
document.addEventListener('DOMContentLoaded', () => {
    if (currentUser) {
        if (currentUser.type === 'admin') {
            showAdminScreen();
        } else {
            showMainScreen();
            loadProducts();
            updateCartBadge();
        }
    } else {
        showUserAuth();
    }
});

// --- UI Navigation ---

function toggleAuth(type) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.form-container').forEach(f => f.classList.add('hidden'));
    
    if (type === 'login') {
        document.querySelector('.auth-tab:first-child').classList.add('active');
        document.getElementById('login-form').classList.remove('hidden');
    } else {
        document.querySelector('.auth-tab:last-child').classList.add('active');
        document.getElementById('register-form').classList.remove('hidden');
    }
}

function showAdminLogin() {
    document.querySelectorAll('.form-container').forEach(f => f.classList.add('hidden'));
    document.getElementById('admin-login-form').classList.remove('hidden');
    document.querySelector('.auth-tabs').classList.add('hidden');
}

function showUserAuth() {
    document.getElementById('auth-screen').classList.add('active');
    document.getElementById('main-screen').classList.remove('active');
    document.getElementById('admin-screen').classList.remove('active');
    document.querySelector('.auth-tabs').classList.remove('hidden');
    toggleAuth('login');
}

function showMainScreen() {
    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('main-screen').classList.add('active');
    document.getElementById('admin-screen').classList.remove('active');
    document.getElementById('user-greeting').innerText = `Merhaba, ${currentUser.username || 'Kullanıcı'}!`;
    switchPage('home');
}

function showAdminScreen() {
    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('main-screen').classList.remove('active');
    document.getElementById('admin-screen').classList.add('active');
    loadAdminOrders();
}

function switchPage(page) {
    currentPage = page;
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const content = document.getElementById('content');
    content.innerHTML = '<div class="loader">Yükleniyor...</div>';

    if (page === 'home') {
        document.querySelector('[onclick="switchPage(\'home\')"]').classList.add('active');
        loadProducts();
    } else if (page === 'search') {
        document.querySelector('[onclick="switchPage(\'search\')"]').classList.add('active');
        renderSearch();
    } else if (page === 'cart') {
        document.querySelector('[onclick="switchPage(\'cart\')"]').classList.add('active');
        loadCart();
    } else if (page === 'profile') {
        document.querySelector('[onclick="switchPage(\'profile\')"]').classList.add('active');
        loadProfile();
    }
}

// --- Auth Handling ---

async function handleLogin() {
    const username = document.getElementById('login-user').value;
    const password = document.getElementById('login-pass').value;

    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (res.ok) {
        currentUser = data.user;
        localStorage.setItem('m_market_user', JSON.stringify(currentUser));
        showMainScreen();
        showToast("Giriş yapıldı!");
    } else {
        showToast(data.error);
    }
}

async function handleRegister() {
    const username = document.getElementById('reg-user').value;
    const password = document.getElementById('reg-pass').value;

    const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (res.ok) {
        currentUser = data.user;
        localStorage.setItem('m_market_user', JSON.stringify(currentUser));
        showMainScreen();
        showToast("Hesap oluşturuldu!");
    } else {
        showToast(data.error);
    }
}

async function handleAdminLogin() {
    const gmail = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-pass').value;

    const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gmail, password })
    });

    const data = await res.json();
    if (res.ok) {
        currentUser = data.user;
        localStorage.setItem('m_market_user', JSON.stringify(currentUser));
        showAdminScreen();
        showToast("Yönetici girişi başarılı!");
    } else {
        showToast(data.error);
    }
}

function logout() {
    localStorage.removeItem('m_market_user');
    currentUser = null;
    location.reload();
}

// --- Product Logic ---

async function loadProducts(search = '') {
    const res = await fetch(`/api/products?user_id=${currentUser.id}&search=${search}`);
    const products = await res.json();
    
    renderProductGrid(products);
}

function renderProductGrid(products) {
    const content = document.getElementById('content');
    if (products.length === 0) {
        content.innerHTML = '<p style="text-align:center; padding: 20px;">Ürün bulunamadı.</p>';
        return;
    }

    let html = '<div class="products-grid">';
    products.forEach(p => {
        html += `
            <div class="product-card">
                <img src="${p.image_url}" class="product-image">
                <div class="product-name">${p.name}</div>
                <div class="product-price">${p.price.toLocaleString()} TL</div>
                <div class="card-actions">
                    <button class="icon-btn ${p.is_liked ? 'active' : ''}" onclick="interact(${p.id}, 'like')">❤️</button>
                    <button class="icon-btn ${p.is_saved ? 'active' : ''}" onclick="interact(${p.id}, 'save')">🔖</button>
                    <button class="add-btn" onclick="addToCart(${p.id})">Ekle</button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    content.innerHTML = html;
}

function renderSearch() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="search-page">
            <h3 class="section-title">Hızlı Keşif</h3>
            <div class="categories" style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 15px;">
                <button class="btn-sm btn-dark" onclick="searchByCat('Telefon')">Telefon</button>
                <button class="btn-sm btn-dark" onclick="searchByCat('Bilgisayar')">Bilgisayar</button>
                <button class="btn-sm btn-dark" onclick="searchByCat('Aksesuar')">Aksesuar</button>
            </div>
            <div id="search-results"></div>
        </div>
    `;
    loadProducts(); // Show all initially
}

function searchProducts() {
    const query = document.getElementById('search-input').value;
    loadProducts(query);
}

async function interact(pid, action) {
    const res = await fetch('/api/products/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, product_id: pid, action })
    });
    const data = await res.json();
    loadProducts();
    showToast(action === 'like' ? (data.status ? "Beğenildi" : "Beğeni kaldırıldı") : (data.status ? "Kaydedildi" : "Kayıt kaldırıldı"));
}

// --- Cart Logic ---

async function addToCart(pid) {
    await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, product_id: pid })
    });
    updateCartBadge();
    showToast("Sepete eklendi!");
}

async function updateCartBadge() {
    const res = await fetch(`/api/cart?user_id=${currentUser.id}`);
    const items = await res.json();
    const badge = document.getElementById('cart-badge');
    badge.innerText = items.length;
}

async function loadCart() {
    const res = await fetch(`/api/cart?user_id=${currentUser.id}`);
    const items = await res.json();
    const content = document.getElementById('content');

    if (items.length === 0) {
        content.innerHTML = '<div style="text-align:center; padding: 50px;">Sepetiniz boş.</div>';
        return;
    }

    let total = 0;
    let html = '<h3 class="section-title">Sepetim</h3>';
    items.forEach(item => {
        total += item.total_price;
        html += `
            <div class="cart-item">
                <img src="${item.image_url}" class="cart-thumb">
                <div class="cart-details">
                    <div class="product-name">${item.name}</div>
                    <div class="product-price">${item.unit_price} TL x ${item.quantity}</div>
                </div>
                <button class="icon-btn" onclick="removeFromCart(${item.id})">🗑️</button>
            </div>
        `;
    });

    html += `
        <div class="cart-summary">
            <div class="total-row">
                <span>Toplam:</span>
                <span>${total.toLocaleString()} TL</span>
            </div>
            <button class="btn btn-primary" style="width: 100%" onclick="submitOrder()">Siparişi Tamamla</button>
        </div>
    `;
    content.innerHTML = html;
}

async function removeFromCart(cid) {
    await fetch('/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart_id: cid })
    });
    loadCart();
    updateCartBadge();
}

async function submitOrder() {
    const res = await fetch('/api/order/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id })
    });
    if (res.ok) {
        showToast("Sipariş alındı!");
        switchPage('home');
        updateCartBadge();
    }
}

// --- Profile & History ---

async function loadProfile() {
    const content = document.getElementById('content');
    
    // Alışveriş Geçmişi
    const hRes = await fetch(`/api/user/history?user_id=${currentUser.id}`);
    const history = await hRes.json();
    
    // Kaydedilenler
    const sRes = await fetch(`/api/user/saved?user_id=${currentUser.id}&type=saves`);
    const saved = await sRes.json();

    let html = `
        <div class="profile-page">
            <h3 class="section-title">Sipariş Geçmişi</h3>
            <div class="history-list">
    `;

    if (history.length === 0) html += '<p style="color:#666">Henüz sipariş yok.</p>';
    
    history.forEach(h => {
        html += `
            <div class="history-card">
                <div style="font-weight:700">${h.name}</div>
                <div style="font-size:0.8rem; color:#666">${h.action_date}</div>
                <div class="status-badge ${h.status.toLowerCase().includes('onayli') ? 'status-approved' : h.status.toLowerCase().includes('red') ? 'status-rejected' : 'status-pending'}">
                    ${h.status}
                </div>
            </div>
        `;
    });

    html += `
            </div>
            <h3 class="section-title" style="margin-top:20px">Kaydedilen Ürünler</h3>
            <div class="saved-list">
    `;

    if (saved.length === 0) html += '<p style="color:#666">Kayıtlı ürün yok.</p>';

    saved.forEach(s => {
        html += `
            <div class="cart-item" onclick="viewProduct(${s.id})">
                <img src="${s.image_url}" class="cart-thumb">
                <div class="cart-details">
                    <div class="product-name">${s.name}</div>
                    <div class="product-price">${s.price} TL</div>
                </div>
            </div>
        `;
    });

    html += '</div></div>';
    content.innerHTML = html;
}

// --- Admin Logic ---

async function loadAdminOrders() {
    const filter = document.getElementById('admin-filter').value;
    const res = await fetch(`/api/admin/orders?filter=${filter}`);
    const orders = await res.json();
    const adminContent = document.getElementById('admin-content');

    if (orders.length === 0) {
        adminContent.innerHTML = '<p style="padding:20px; text-align:center">Gösterilecek sipariş yok.</p>';
        return;
    }

    let html = '';
    orders.forEach(o => {
        html += `
            <div class="admin-order-card">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <strong>${o.username}</strong>
                    <span class="status-badge status-${o.status}">${o.status.toUpperCase()}</span>
                </div>
                <div style="font-size:0.9rem">${o.product_name} (x${o.quantity})</div>
                <div style="font-size:1.1rem; font-weight:800; margin:10px 0;">${o.total_price.toLocaleString()} TL</div>
                <div style="font-size:0.75rem; color:#666; margin-bottom:15px;">Tarih: ${o.created_at}</div>
                
                ${o.status === 'onay_bekliyor' ? `
                    <div style="display:flex; gap:10px;">
                        <button class="btn btn-primary" style="padding:10px; flex:1" onclick="updateOrderStatus(${o.id}, 'onaylandi')">Onayla</button>
                        <button class="btn btn-dark" style="padding:10px; flex:1" onclick="updateOrderStatus(${o.id}, 'reddedildi')">Reddet</button>
                    </div>
                ` : ''}
            </div>
        `;
    });
    adminContent.innerHTML = html;
}

async function updateOrderStatus(cid, status) {
    await fetch('/api/admin/order/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart_id: cid, status })
    });
    loadAdminOrders();
    showToast("Durum güncellendi!");
}

// --- Utils ---

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 2500);
}
