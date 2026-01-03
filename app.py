import os
import sqlite3
import datetime
import json
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__, static_folder='dist', static_url_path='/')
CORS(app, resources={r"/api/*": {"origins": "*"}})

DB_NAME = "mobil_market.db"

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Users Table
    cursor.execute('''CREATE TABLE IF NOT EXISTS users (
                        id TEXT PRIMARY KEY,
                        username TEXT UNIQUE NOT NULL,
                        password TEXT NOT NULL,
                        role TEXT DEFAULT 'user',
                        created_at TEXT NOT NULL)''')
    
    # Products Table
    cursor.execute('''CREATE TABLE IF NOT EXISTS products (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        price REAL NOT NULL,
                        category TEXT,
                        image TEXT,
                        videoUrl TEXT,
                        fileUrl TEXT,
                        description TEXT)''')
    
    # Orders Table
    cursor.execute('''CREATE TABLE IF NOT EXISTS orders (
                        id TEXT PRIMARY KEY,
                        userId TEXT NOT NULL,
                        username TEXT NOT NULL,
                        items TEXT NOT NULL, -- JSON string of CartItem[]
                        totalPrice REAL NOT NULL,
                        status TEXT DEFAULT 'PENDING',
                        createdAt TEXT NOT NULL,
                        FOREIGN KEY(userId) REFERENCES users(id))''')
    
    # Interactions
    cursor.execute('''CREATE TABLE IF NOT EXISTS favorites (
                        userId TEXT,
                        productId INTEGER,
                        PRIMARY KEY(userId, productId))''')
    
    cursor.execute('''CREATE TABLE IF NOT EXISTS saved (
                        userId TEXT,
                        productId INTEGER,
                        PRIMARY KEY(userId, productId))''')

    # Default Admin
    admin_id = 'admin_root'
    cursor.execute("SELECT * FROM users WHERE id = ?", (admin_id,))
    if not cursor.fetchone():
        cursor.execute("INSERT INTO users (id, username, password, role, created_at) VALUES (?, ?, ?, ?, ?)",
                       (admin_id, 'ibomiri431@gmail.com', generate_password_hash('FALCON2007YT'), 'admin', datetime.datetime.now().isoformat()))
    
    # Sample Products if empty
    cursor.execute("SELECT COUNT(*) FROM products")
    if cursor.fetchone()[0] == 0:
        samples = [
            ("iPhone 14 Pro", 74999, "Elektronik", "https://picsum.photos/400/400?random=1", "", "", "En yeni iPhone modeli."),
            ("MacBook Air M2", 42000, "Bilgisayar", "https://picsum.photos/400/400?random=2", "", "", "Hafif ve güçlü.")
        ]
        cursor.executemany("INSERT INTO products (name, price, category, image, videoUrl, fileUrl, description) VALUES (?,?,?,?,?,?,?)", samples)

    conn.commit()
    conn.close()

# --- Auth ---

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()
    
    if user and check_password_hash(user['password'], password):
        return jsonify({
            "id": user['id'],
            "username": user['username'],
            "role": user['role']
        })
    return jsonify({"error": "Hatalı kullanıcı adı veya şifre"}), 401

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    user_id = os.urandom(4).hex()
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO users (id, username, password, role, created_at) VALUES (?, ?, ?, 'user', ?)",
                       (user_id, username, generate_password_hash(password), datetime.datetime.now().isoformat()))
        conn.commit()
        return jsonify({"id": user_id, "username": username, "role": "user"})
    except sqlite3.IntegrityError:
        return jsonify({"error": "Kullanıcı adı zaten kullanımda"}), 400
    finally:
        conn.close()

# --- Products ---

@app.route('/api/products', methods=['GET'])
def get_products():
    search = request.args.get('search')
    category = request.args.get('category')
    
    conn = get_db()
    cursor = conn.cursor()
    query = "SELECT * FROM products WHERE 1=1"
    params = []
    
    if search:
        query += " AND name LIKE ?"
        params.append(f"%{search}%")
    if category and category != 'Tümü':
        query += " AND category = ?"
        params.append(category)
        
    cursor.execute(query, params)
    products = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(products)

UPLOAD_FOLDER = 'product_images'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/product_images/<path:filename>')
def serve_product_images(filename):
    return send_from_directory(os.path.abspath(UPLOAD_FOLDER), filename)

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'files' not in request.files:
        return jsonify({"error": "Dosya bulunamadı"}), 400
    
    files = request.files.getlist('files')
    paths = []
    for file in files:
        if file.filename == '':
            continue
        # Dosya adındaki boşlukları ve özel karakterleri temizle
        safe_name = "".join([c for c in file.filename if c.isalnum() or c in ('.','_')]).strip()
        filename = f"{datetime.datetime.now().timestamp()}_{safe_name}"
        path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(path)
        # başına mutlaka / ekliyoruz ki browser kök dizinden arasın
        paths.append(f"/product_images/{filename}")
    
    return jsonify({"paths": paths})

@app.route('/api/products', methods=['POST'])
def add_product():
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    # image can now be a JSON string of multiple image paths
    cursor.execute('''INSERT INTO products (name, price, category, image, videoUrl, fileUrl, description)
                      VALUES (?, ?, ?, ?, ?, ?, ?)''',
                   (data.get('name'), data.get('price'), data.get('category'), data.get('image'),
                    data.get('videoUrl'), data.get('fileUrl'), data.get('description')))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route('/api/products/<int:pid>', methods=['PUT', 'DELETE'])
def manage_product(pid):
    conn = get_db()
    cursor = conn.cursor()
    if request.method == 'DELETE':
        cursor.execute("DELETE FROM products WHERE id = ?", (pid,))
        conn.commit()
    else:
        data = request.json
        cursor.execute('''UPDATE products SET name=?, price=?, category=?, image=?, videoUrl=?, fileUrl=?, description=?
                          WHERE id=?''',
                       (data.get('name'), data.get('price'), data.get('category'), data.get('image'),
                        data.get('videoUrl'), data.get('fileUrl'), data.get('description'), pid))
        conn.commit()
    conn.close()
    return jsonify({"success": True})

# --- Interactions ---

@app.route('/api/favorites/<userId>', methods=['GET'])
def get_favorites(userId):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT productId FROM favorites WHERE userId = ?", (userId,))
    favs = [r[0] for r in cursor.fetchall()]
    conn.close()
    return jsonify(favs)

@app.route('/api/favorites', methods=['POST'])
def toggle_favorite():
    data = request.json
    user_id = data.get('userId')
    product_id = data.get('productId')
    if product_id == -1: return get_favorites(user_id)
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM favorites WHERE userId = ? AND productId = ?", (user_id, product_id))
    if cursor.fetchone():
        cursor.execute("DELETE FROM favorites WHERE userId = ? AND productId = ?", (user_id, product_id))
    else:
        cursor.execute("INSERT INTO favorites (userId, productId) VALUES (?, ?)", (user_id, product_id))
    conn.commit()
    conn.close()
    return get_favorites(user_id)

@app.route('/api/saved/<userId>', methods=['GET'])
def get_saved(userId):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT productId FROM saved WHERE userId = ?", (userId,))
    items = [r[0] for r in cursor.fetchall()]
    conn.close()
    return jsonify(items)

@app.route('/api/saved', methods=['POST'])
def toggle_saved():
    data = request.json
    user_id = data.get('userId')
    product_id = data.get('productId')
    if product_id == -1: return get_saved(user_id)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM saved WHERE userId = ? AND productId = ?", (user_id, product_id))
    if cursor.fetchone():
        cursor.execute("DELETE FROM saved WHERE userId = ? AND productId = ?", (user_id, product_id))
    else:
        cursor.execute("INSERT INTO saved (userId, productId) VALUES (?, ?)", (user_id, product_id))
    conn.commit()
    conn.close()
    return get_saved(user_id)

# --- Orders ---

@app.route('/api/orders', methods=['GET'])
def get_orders():
    user_id = request.args.get('userId')
    conn = get_db()
    cursor = conn.cursor()
    if user_id:
        cursor.execute("SELECT * FROM orders WHERE userId = ?", (user_id,))
    else:
        cursor.execute("SELECT * FROM orders")
    
    rows = cursor.fetchall()
    orders = []
    for r in rows:
        order = dict(r)
        order['items'] = json.loads(order['items'])
        orders.append(order)
    conn.close()
    return jsonify(orders)

@app.route('/api/orders', methods=['POST'])
def place_order():
    data = request.json
    order_id = 'ORD-' + os.urandom(3).hex().upper()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''INSERT INTO orders (id, userId, username, items, totalPrice, status, createdAt)
                      VALUES (?, ?, ?, ?, ?, ?, ?)''',
                   (order_id, data.get('userId'), data.get('username'), json.dumps(data.get('items')),
                    data.get('totalPrice'), 'PENDING', datetime.datetime.now().isoformat()))
    conn.commit()
    conn.close()
    return jsonify({"id": order_id})

@app.route('/api/orders/<oid>/status', methods=['POST'])
def update_order_status(oid):
    status = request.json.get('status')
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE orders SET status = ? WHERE id = ?", (status, oid))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

if __name__ == '__main__':
    init_db()
    # 0.0.0.0 sayesinde ağdaki diğer cihazlar (telefonlar) bu sunucuya erişebilir
    app.run(host='0.0.0.0', port=5000, debug=True)
