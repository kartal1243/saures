import urllib.request
import urllib.error
import http.cookiejar
import json
import datetime

BASE_URL = "http://localhost:3000"

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

def req(method, path, data=None):
    url = f"{BASE_URL}{path}"
    body = json.dumps(data).encode('utf-8') if data is not None else None
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    if data is not None:
        headers["Content-Type"] = "application/json"
    r = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with opener.open(r) as resp:
            content = resp.read().decode('utf-8')
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode('utf-8')
        try:
            return e.code, json.loads(content)
        except Exception:
            return e.code, {"error": content}

def main():
    print("=== MAKAS SANATI ERKEK KUAFÖRÜ TEST HESABI OLUŞTURULUYOR ===")

    phone = "05350002026"
    password = "kartal1234"
    shop_name = "Makas Sanatı Erkek Kuaförü"
    owner_name = "Murat Usta"

    # 1. Kayıt / Giriş
    print("\n[1] Hesap oluşturuluyor...")
    status, res = req("POST", "/api/auth/register", {
        "shopName": shop_name,
        "ownerName": owner_name,
        "phone": phone,
        "email": "murat@makassanati.com",
        "password": password
    })
    if status != 200:
        print("  Zaten kayıtlı, giriş yapılıyor...")
        status, res = req("POST", "/api/auth/login", {
            "phone": phone,
            "password": password
        })
    assert status == 200, f"Giriş hatası: {res}"
    print("  ✓ Oturum açıldı.")

    # 2. Berber Profil Ayarı
    print("\n[2] Dükkan profili ayarlanıyor...")
    status, res = req("POST", "/api/shop-profile", {
        "storeName": shop_name,
        "ownerName": owner_name,
        "businessField": "Kuaför / Berber / Güzellik",
        "sectorKey": "kuafor_berber",
        "employeeCount": "3",
        "phone": phone,
        "dailyTarget": 6500,
        "slogan": "Alaplı'nın En Prestijli Erkek Kuaförü & Sakal Tasarım Merkezi",
        "slug": "makas-sanati"
    })
    assert status == 200, f"Profil hatası: {res}"
    print("  ✓ Berber profili ve slug (makas-sanati) kaydedildi.")

    # 3. Ustalar ve Personel Kadrosu
    print("\n[3] Usta ve personel kadrosu ekleniyor...")
    staff = [
        {"id": "st_murat", "name": "Murat Usta", "title": "Kıdemli Usta & Kurucu", "phone": "05350002026", "active": True, "allowedServiceIds": []},
        {"id": "st_can", "name": "Can Kalfa", "title": "Stilist & Sakal Tasarım", "phone": "05351112233", "active": True, "allowedServiceIds": []},
        {"id": "st_yusuf", "name": "Yusuf", "title": "Yıkama & Saç Bakımı", "phone": "05352223344", "active": True, "allowedServiceIds": []}
    ]
    status, res = req("POST", "/api/barber/staff", {"staff": staff})
    assert status == 200, f"Personel hatası: {res}"
    print("  ✓ 3 kişilik usta ve ekip kadrosu kaydedildi.")

    # 4. Hizmet Kataloğu & Fiyat Listesi
    print("\n[4] Hizmet kataloğu oluşturuluyor...")
    services = [
        {"id": "srv_sac", "name": "Saç Kesimi & Yıkama", "durationMinutes": 30, "price": 250, "category": "Saç", "allowedStaffIds": []},
        {"id": "srv_sakal", "name": "Sakal Tıraşı & Buharlı Sıcak Havlu", "durationMinutes": 20, "price": 150, "category": "Sakal", "allowedStaffIds": []},
        {"id": "srv_komple", "name": "VIP Komple Bakım (Saç + Sakal + Maske + Masaj)", "durationMinutes": 60, "price": 450, "category": "VIP", "allowedStaffIds": []},
        {"id": "srv_cocuk", "name": "Çocuk Saç Kesimi (0-12 Yaş)", "durationMinutes": 25, "price": 180, "category": "Saç", "allowedStaffIds": []},
        {"id": "srv_boya", "name": "Saç / Sakal Beyaz Kamuflaj & Boya", "durationMinutes": 45, "price": 350, "category": "Boya", "allowedStaffIds": []}
    ]
    status, res = req("POST", "/api/barber/services", {"services": services})
    assert status == 200, f"Hizmet hatası: {res}"
    print("  ✓ 5 adet profesyonel hizmet kaydedildi.")

    # 5. Salon Çalışma Saatleri ve Online Randevu Ayarları
    print("\n[5] Çalışma saatleri ve online randevu ayarlanıyor...")
    status, res = req("POST", "/api/barber/settings", {
        "openHour": "09:00",
        "closeHour": "21:00",
        "slotIntervalMinutes": 30,
        "closedDays": [0],
        "closedReason": "Pazar Günü Dinlenme",
        "slug": "makas-sanati",
        "requireOtp": False,
        "enableWhatsAppReminders": True
    })
    assert status == 200, f"Ayar hatası: {res}"
    print("  ✓ 09:00 - 21:00 çalışma saatleri ve online randevu aktif.")

    # 6. Eski randevuları temizle
    status, res = req("GET", "/api/appointments")
    if status == 200:
        for a in res.get("appointments", []):
            req("DELETE", f"/api/appointments/{a['id']}")

    # 7. Gerçekçi Randevular ve Kasa İşlemleri Ekleniyor
    print("\n[6] Gerçekçi randevu takvimi ve kasa hareketleri işleniyor...")

    today = datetime.date.today().strftime("%Y-%m-%d")
    tomorrow = (datetime.date.today() + datetime.timedelta(days=1)).strftime("%Y-%m-%d")

    apts_to_create = [
        # Bugünün Tamamlanmış (Kasaya Gelir Olarak İşlenmiş) Randevuları
        {
            "customerName": "Ali Vural",
            "phone": "05421112233",
            "date": today,
            "timeSlot": "09:30",
            "durationMinutes": 30,
            "serviceName": "Saç Kesimi & Yıkama",
            "price": 250,
            "staffId": "st_murat",
            "staffName": "Murat Usta",
            "notes": "Yanlar 2 numara, üstler makas kalsın",
            "complete": True,
            "payMethod": "nakit"
        },
        {
            "customerName": "Mehmet Eren",
            "phone": "05432223344",
            "date": today,
            "timeSlot": "10:30",
            "durationMinutes": 60,
            "serviceName": "VIP Komple Bakım (Saç + Sakal + Maske + Masaj)",
            "price": 450,
            "staffId": "st_murat",
            "staffName": "Murat Usta",
            "notes": "Düğün tıraşı, özenli çalışma rica edildi",
            "complete": True,
            "payMethod": "kart"
        },
        {
            "customerName": "Burak Yılmaz",
            "phone": "05443334455",
            "date": today,
            "timeSlot": "11:30",
            "durationMinutes": 20,
            "serviceName": "Sakal Tıraşı & Buharlı Sıcak Havlu",
            "price": 150,
            "staffId": "st_can",
            "staffName": "Can Kalfa",
            "notes": "Sadece çizgi düzeltme ve bıyık kısaltma",
            "complete": True,
            "payMethod": "nakit"
        },
        # Şu an Koltukta Olan Randevu
        {
            "customerName": "Serdar Öz",
            "phone": "05454445566",
            "date": today,
            "timeSlot": "13:00",
            "durationMinutes": 30,
            "serviceName": "Saç Kesimi & Yıkama",
            "price": 250,
            "staffId": "st_can",
            "staffName": "Can Kalfa",
            "status": "koltukta",
            "notes": "Şu an koltukta tıraş ediliyor"
        },
        # Bugün Bekleyen / Onaylı Randevular
        {
            "customerName": "Emre Demir",
            "phone": "05465556677",
            "date": today,
            "timeSlot": "14:00",
            "durationMinutes": 60,
            "serviceName": "VIP Komple Bakım (Saç + Sakal + Maske + Masaj)",
            "price": 450,
            "staffId": "st_murat",
            "staffName": "Murat Usta",
            "status": "onayli",
            "notes": "Özel iş toplantısı öncesi bakım"
        },
        {
            "customerName": "Hakan Koç",
            "phone": "05476667788",
            "date": today,
            "timeSlot": "15:30",
            "durationMinutes": 25,
            "serviceName": "Çocuk Saç Kesimi (0-12 Yaş)",
            "price": 180,
            "staffId": "st_can",
            "staffName": "Can Kalfa",
            "status": "onayli",
            "notes": "Oğlu Kerem için okul tıraşı"
        },
        {
            "customerName": "Tolga Arslan",
            "phone": "05487778899",
            "date": today,
            "timeSlot": "17:00",
            "durationMinutes": 45,
            "serviceName": "Saç / Sakal Beyaz Kamuflaj & Boya",
            "price": 350,
            "staffId": "st_murat",
            "staffName": "Murat Usta",
            "status": "bekliyor",
            "notes": "Online randevu aldı (onay bekliyor)"
        },
        {
            "customerName": "Cenk Tosun",
            "phone": "05498889900",
            "date": today,
            "timeSlot": "18:30",
            "durationMinutes": 30,
            "serviceName": "Saç Kesimi & Yıkama",
            "price": 250,
            "staffId": "st_murat",
            "staffName": "Murat Usta",
            "status": "bekliyor",
            "notes": "İş çıkışı uğrayacak"
        },
        # Yarının Randevuları
        {
            "customerName": "Okan Buruk",
            "phone": "05551112233",
            "date": tomorrow,
            "timeSlot": "10:00",
            "durationMinutes": 30,
            "serviceName": "Saç Kesimi & Yıkama",
            "price": 250,
            "staffId": "st_murat",
            "staffName": "Murat Usta",
            "status": "onayli",
            "notes": "Haftalık rutin saç tıraşı"
        },
        {
            "customerName": "Kerem Aktürkoğlu",
            "phone": "05552223344",
            "date": tomorrow,
            "timeSlot": "11:30",
            "durationMinutes": 60,
            "serviceName": "VIP Komple Bakım (Saç + Sakal + Maske + Masaj)",
            "price": 450,
            "staffId": "st_can",
            "staffName": "Can Kalfa",
            "status": "onayli",
            "notes": "VIP hizmet talep etti"
        },
        {
            "customerName": "Barış Alper",
            "phone": "05553334455",
            "date": tomorrow,
            "timeSlot": "14:00",
            "durationMinutes": 30,
            "serviceName": "Saç Kesimi & Yıkama",
            "price": 250,
            "staffId": "st_murat",
            "staffName": "Murat Usta",
            "status": "bekliyor",
            "notes": "Maç öncesi traş"
        }
    ]

    for item in apts_to_create:
        status, res = req("POST", "/api/appointments", {
            "customerName": item["customerName"],
            "phone": item["phone"],
            "appointmentDate": item["date"],
            "timeSlot": item["timeSlot"],
            "durationMinutes": item["durationMinutes"],
            "serviceName": item["serviceName"],
            "price": item["price"],
            "staffId": item["staffId"],
            "staffName": item["staffName"],
            "status": item.get("status", "bekliyor"),
            "notes": item.get("notes", "")
        })
        apt_id = res.get("appointment", {}).get("id")

        # Eğer tamamlanmış randevuysa kasaya işle
        if item.get("complete") and apt_id:
            req("POST", f"/api/appointments/{apt_id}/complete", {
                "paymentMethod": item["payMethod"]
            })

    print("  ✓ Randevular takvime işlendi, 3 randevu tamamlanıp kasaya gelir olarak yazıldı!")

    # 8. Müşterileri Deftere Ekle
    print("\n[7] Müşteri rehberi (defter) zenginleştiriliyor...")
    customers = [
        {"name": "Ali Vural", "phone": "05421112233", "balance": 0, "notes": "Düzenli 2 haftada bir saç kestirir"},
        {"name": "Mehmet Eren", "phone": "05432223344", "balance": 0, "notes": "VIP paket müşterisi"},
        {"name": "Hasan Uçar", "phone": "05419998877", "balance": -400, "notes": "Veresiye bakiye: Komple bakım borcu var"}
    ]
    for c in customers:
        req("POST", "/api/customers", c)
    print("  ✓ Müşteriler rehbere ve veresiye defterine kaydedildi.")

    # 9. Kontrolleri Sağla
    print("\n[8] Doğrulama kontrolleri yapılıyor...")
    status, res = req("GET", "/api/appointments")
    total_apts = len(res.get("appointments", []))
    print(f"  ✓ Aktif Takvim Randevu Sayısı: {total_apts}")

    status, res = req("GET", "/api/data")
    cash = res.get('cash', {}) if status == 200 else {}
    print(f"  ✓ Güncel Kasa Durumu: Nakit {cash.get('todayCash', 0)} ₺ | Kart {cash.get('todayCard', 0)} ₺ | Toplam Gelir: {cash.get('todayTotalIncome', 0)} ₺")

    print("\n==================================================================")
    print("🎉 MAKAS SANATI HESABI VE GERÇEKÇİ VERİLERİ HAZIR! 🎉")
    print("==================================================================")
    print(f"Giriş URL:      https://dukkanimyanimda.com.tr")
    print(f"Telefon:        {phone}")
    print(f"Şifre:          {password}")
    print(f"Dükkan Adı:     {shop_name}")
    print(f"Online Randevu: https://dukkanimyanimda.com.tr/r/makas-sanati")
    print("==================================================================")

if __name__ == "__main__":
    main()
