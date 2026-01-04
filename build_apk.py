import os
import subprocess
import shutil

print("=" * 50)
print("🚀 OTOMATİK APK OLUŞTURUCU BAŞLADI")
print("=" * 50)

# Java ve Gradle ayarları
os.environ["JAVA_HOME"] = r"C:\Program Files\Java\jdk-17"
os.environ["GRADLE_USER_HOME"] = os.path.join(os.getcwd(), ".gradle_clean")

def run_cmd(cmd, cwd=None):
    print(f"\n▶ {cmd}")
    result = subprocess.run(cmd, shell=True, cwd=cwd)
    if result.returncode != 0:
        print(f"❌ Hata: {cmd}")
        return False
    return True

# 1. Web Build
print("\n📦 Adım 1: Web kodları derleniyor...")
if not run_cmd("npm run build"):
    print("❌ Web build başarısız!")
    input("Kapatmak için Enter...")
    exit(1)

# 2. Capacitor Sync
print("\n🔄 Adım 2: Android projesi güncelleniyor...")
if not run_cmd("npx cap sync android"):
    print("⚠ Sync hatası, android klasörü ekleniyor...")
    run_cmd("npx cap add android")
    run_cmd("npx cap sync android")

# 3. Gradle Build
print("\n🔨 Adım 3: APK oluşturuluyor (Bu 2-3 dakika sürebilir)...")
android_dir = os.path.join(os.getcwd(), "android")
if not run_cmd("gradlew.bat assembleDebug --no-daemon --stacktrace", cwd=android_dir):
    print("❌ APK oluşturulamadı!")
    input("Kapatmak için Enter...")
    exit(1)

# 4. APK Kopyalama
print("\n📲 Adım 4: APK dosyası kopyalanıyor...")
source_apk = os.path.join(android_dir, "app", "build", "outputs", "apk", "debug", "app-debug.apk")
target_apk = os.path.join(os.getcwd(), "MOBILE_MARKET.apk")

if os.path.exists(source_apk):
    shutil.copy(source_apk, target_apk)
    print("\n" + "=" * 50)
    print("✅ BAŞARILI! APK OLUŞTURULDU")
    print("=" * 50)
    print(f"\n📍 Dosya konumu:\n{target_apk}")
    print("\nBu dosyayı telefonunuza göndererek kurabilirsiniz!")
else:
    print("❌ APK dosyası bulunamadı!")

input("\n\nKapatmak için Enter'a basın...")
