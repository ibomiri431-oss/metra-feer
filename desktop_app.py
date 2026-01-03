
import os
import sqlite3
import datetime
import json
import threading
import time
import sys
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import webbrowser

app = Flask(__name__, static_folder='dist', static_url_path='/')
CORS(app)

DB_NAME = "mobil_market.db"
UPLOAD_FOLDER = 'product_images'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# --- Flask Routes ---

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.route('/product_images/<path:filename>')
def serve_product_images(filename):
    return send_from_directory(os.path.abspath(UPLOAD_FOLDER), filename)

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE, password TEXT, role TEXT DEFAULT 'user', created_at TEXT)''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, price REAL, category TEXT, image TEXT, videoUrl TEXT, fileUrl TEXT, description TEXT)''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, userId TEXT, username TEXT, items TEXT, totalPrice REAL, status TEXT DEFAULT 'PENDING', createdAt TEXT)''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS favorites (userId TEXT, productId INTEGER, PRIMARY KEY(userId, productId))''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS saved (userId TEXT, productId INTEGER, PRIMARY KEY(userId, productId))''')
    
    admin_id = 'admin_root'
    cursor.execute("SELECT * FROM users WHERE id = ?", (admin_id,))
    if not cursor.fetchone():
        cursor.execute("INSERT INTO users (id, username, password, role, created_at) VALUES (?, ?, ?, ?, ?)",
                       (admin_id, 'ibomiri431@gmail.com', generate_password_hash('FALCON2007YT'), 'admin', datetime.datetime.now().isoformat()))
    conn.commit()
    conn.close()

# --- API Endpoints ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    u, p = data.get('username'), data.get('password')
    conn = get_db(); cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (u,))
    user = cursor.fetchone(); conn.close()
    if user and check_password_hash(user['password'], p):
        return jsonify({"id": user['id'], "username": user['username'], "role": user['role']})
    return jsonify({"error": "Hata"}), 401

@app.route('/api/upload', methods=['POST'])
def upload_file():
    files = request.files.getlist('files')
    paths = []
    for file in files:
        if file.filename == '': continue
        safe_name = "".join([c for c in file.filename if c.isalnum() or c in ('.','_')]).strip()
        filename = f"{datetime.datetime.now().timestamp()}_{safe_name}"
        path = os.path.join(UPLOAD_FOLDER, filename); file.save(path)
        paths.append(f"/product_images/{filename}")
    return jsonify({"paths": paths})

@app.route('/api/products', methods=['GET', 'POST'])
def manage_products():
    conn = get_db(); cursor = conn.cursor()
    if request.method == 'POST':
        data = request.json
        cursor.execute('INSERT INTO products (name,price,category,image,description) VALUES (?,?,?,?,?)',
                       (data.get('name'), data.get('price'), data.get('category'), data.get('image'), data.get('description')))
        conn.commit(); conn.close(); return jsonify({"success": True})
    else:
        search = request.args.get('search')
        category = request.args.get('category')
        query = "SELECT * FROM products WHERE 1=1"
        params = []
        if search:
            query += " AND name LIKE ?"
            params.append(f"%{search}%")
        if category and category != 'Tümü':
            query += " AND category = ?"
            params.append(category)
        
        cursor.execute(query, params)
        prods = [dict(r) for r in cursor.fetchall()]; conn.close(); return jsonify(prods)

@app.route('/api/favorites', methods=['POST'])
def toggle_favorite():
    data = request.json
    uid, pid = data.get('userId'), data.get('productId')
    conn = get_db(); cursor = conn.cursor()
    if pid == -1:
        cursor.execute("SELECT productId FROM favorites WHERE userId = ?", (uid,))
        res = [r[0] for r in cursor.fetchall()]
    else:
        cursor.execute("SELECT * FROM favorites WHERE userId = ? AND productId = ?", (uid, pid))
        if cursor.fetchone():
            cursor.execute("DELETE FROM favorites WHERE userId = ? AND productId = ?", (uid, pid))
        else:
            cursor.execute("INSERT INTO favorites (userId, productId) VALUES (?, ?)", (uid, pid))
        conn.commit()
        cursor.execute("SELECT productId FROM favorites WHERE userId = ?", (uid,))
        res = [r[0] for r in cursor.fetchall()]
    conn.close(); return jsonify(res)

@app.route('/api/saved', methods=['POST'])
def toggle_saved():
    data = request.json
    uid, pid = data.get('userId'), data.get('productId')
    conn = get_db(); cursor = conn.cursor()
    if pid == -1:
        cursor.execute("SELECT productId FROM saved WHERE userId = ?", (uid,))
        res = [r[0] for r in cursor.fetchall()]
    else:
        cursor.execute("SELECT * FROM saved WHERE userId = ? AND productId = ?", (uid, pid))
        if cursor.fetchone():
            cursor.execute("DELETE FROM saved WHERE userId = ? AND productId = ?", (uid, pid))
        else:
            cursor.execute("INSERT INTO saved (userId, productId) VALUES (?, ?)", (uid, pid))
        conn.commit()
        cursor.execute("SELECT productId FROM saved WHERE userId = ?", (uid,))
        res = [r[0] for r in cursor.fetchall()]
    conn.close(); return jsonify(res)

@app.route('/api/orders', methods=['GET', 'POST'])
def manage_orders():
    conn = get_db(); cursor = conn.cursor()
    if request.method == 'POST':
        data = request.json
        oid = 'ORD-' + os.urandom(3).hex().upper()
        cursor.execute('INSERT INTO orders (id,userId,username,items,totalPrice,createdAt) VALUES (?,?,?,?,?,?)',
                       (oid, data.get('userId'), data.get('username'), json.dumps(data.get('items')), data.get('totalPrice'), datetime.datetime.now().isoformat()))
        conn.commit(); conn.close(); return jsonify({"id": oid})
    else:
        cursor.execute("SELECT * FROM orders")
        orders = []
        for r in cursor.fetchall():
            o = dict(r); o['items'] = json.loads(o['items']); orders.append(o)
        conn.close(); return jsonify(orders)

@app.route('/api/orders/<oid>/status', methods=['POST'])
def update_status(oid):
    status = request.json.get('status')
    conn = get_db(); cursor = conn.cursor()
    cursor.execute("UPDATE orders SET status = ? WHERE id = ?", (status, oid))
    conn.commit(); conn.close(); return jsonify({"success": True})

# --- Desktop Integration ---

def run_flask():
    init_db()
    app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)

if __name__ == '__main__':
    # Flask'ı arka planda başlat
    flask_thread = threading.Thread(target=run_flask)
    flask_thread.daemon = True
    flask_thread.start()
    
    # Sunucunun başlaması için bekle
    time.sleep(2)
    
    # Uygulamayı tarayıcıda uygulama modunda (app mode) aç
    # Bu özellik çoğu modern tarayıcıda (Chrome, Edge) pencereyi adres çubuğu olmadan "uygulama" gibi açar
    url = "http://127.0.0.1:5000"
    
    print(f"Uygulama başlatılıyor: {url}")
    
    # Windows için spesifik Chrome/Edge 'app' modu komutu denemesi
    try:
        if os.name == 'nt': # Windows
            # Chrome denemesi
            chrome_path = "C:/Program Files/Google/Chrome/Application/chrome.exe --app=%s --window-size=400,800"
            if os.path.exists("C:/Program Files/Google/Chrome/Application/chrome.exe"):
                os.system(f'start chrome --app={url} --window-size=400,800')
            else:
                webbrowser.open(url)
        else:
            webbrowser.open(url)
    except:
        webbrowser.open(url)

    # Arka plan işleminin kapanmaması için ana thread'i açık tut
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        sys.exit(0)
