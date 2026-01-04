
import os
import threading
import time
import sys
import subprocess
from app import app, init_db

def run_flask():
    """Flask sunucusunu arka planda başlatır."""
    try:
        with app.app_context():
            init_db()
        app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)
    except Exception as e:
        print(f"Sunucu hatası: {e}")

def open_window():
    """Uygulamayı adres çubuğu olmayan özel bir pencerede açar."""
    url = "http://127.0.0.1:5000"
    
    # Windows'ta Edge veya Chrome'u 'app' modunda açma komutu
    # Bu sayede gerçek bir masaüstü uygulaması gibi görünür (browser öğeleri olmaz)
    edge_cmd = f'start msedge --app={url} --window-size=450,850'
    chrome_cmd = f'start chrome --app={url} --window-size=450,850'
    
    print(f"Uygulama penceresi hazırlanıyor: {url}")
    time.sleep(2) # Sunucunun açılması için bekle
    
    try:
        # Önce Edge deniyoruz (Windows'ta her zaman vardır)
        os.system(edge_cmd)
    except:
        try:
            # Olmazsa Chrome deniyoruz
            os.system(chrome_cmd)
        except:
            # Hiçbiri olmazsa normal tarayıcıda aç
            import webbrowser
            webbrowser.open(url)

if __name__ == '__main__':
    # 1. Flask'ı ayrı bir işlemde başlat
    flask_thread = threading.Thread(target=run_flask)
    flask_thread.daemon = True
    flask_thread.start()

    # 2. Pencereyi aç
    open_window()

    # 3. Programın kapanmaması için beklet
    print("\nUygulama çalışıyor. Kapatmak için bu pencerede CTRL+C yapabilirsiniz.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nUygulama kapatılıyor...")
        sys.exit(0)
