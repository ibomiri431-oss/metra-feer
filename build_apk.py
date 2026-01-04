import os
import sys
import subprocess
import time

def print_box(text):
    print("\n" + "=" * 60)
    print(f"🚀 {text}")
    print("=" * 60)

def install_requirements():
    print_box("GEREKSİNİMLER KONTROL EDİLİYOR...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
    print("✅ Gereksinimler hazır.")

def run_app_locally():
    print_box("UYGULAMA MASAÜSTÜNDE BAŞLATILIYOR...")
    print("ℹ️  Bu mod sadece tasarım testi içindir.")
    print("ℹ️  Gerçek APK GitHub Actions üzerinden derlenecektir.")
    subprocess.call([sys.executable, "main.py"])

def push_to_github():
    print_box("GITHUB'A GÖNDERİLİYOR (APK DERLEMESİ İÇİN)...")
    
    # Git status verification
    subprocess.call(["git", "add", "."])
    commit_msg = f"Update for Kivy Build {int(time.time())}"
    subprocess.call(["git", "commit", "-m", commit_msg])
    
    print("\nPushlanıyor...")
    result = subprocess.call(["git", "push"])
    
    if result == 0:
        print("\n✅ BAŞARILI! Kod GitHub'a gönderildi.")
        print("🌍 GitHub Actions sekmesinden APK derlemesini takip edebilirsiniz.")
    else:
        print("\n❌ HATA: Git push işlemi başarısız oldu.")

def main():
    while True:
        print("\n" + "-"*30)
        print("  MOBIL MARKET - KIVY MANAGER")
        print("-"*30)
        print("1. [TEST] Uygulamayı Windows'ta Çalıştır")
        print("2. [BUILD] GitHub'a Gönder ve APK Oluştur")
        print("3. [SETUP] Gereksinimleri Yükle (pip install)")
        print("4. Çıkış")
        
        choice = input("\nSeçiminiz (1-4): ")
        
        if choice == '1':
            run_app_locally()
        elif choice == '2':
            push_to_github()
        elif choice == '3':
            install_requirements()
        elif choice == '4':
            break
        else:
            print("Geçersiz seçim!")

if __name__ == "__main__":
    main()
