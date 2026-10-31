import urllib.request
import urllib.error
import http.cookiejar
import json
import sys

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

def request(method, path, data=None):
    url = f"{BASE_URL}{path}"
    body = json.dumps(data).encode('utf-8') if data is not None else None
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    if data is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with opener.open(req) as resp:
            content = resp.read().decode('utf-8')
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode('utf-8')
        try:
            return e.code, json.loads(content)
        except Exception:
            return e.code, {"error": content}

def run_tests():
    print(f"=== BAŞLIYORUZ: Berber Sektörü Uçtan Uca Otomatik Test Paketi ({BASE_URL}) ===")

    # 1. Yeni Berber Hesabı Aç
    test_phone = "05991234567"
    test_pass = "Password123"
    print("\n[Adım 1] Berber hesabı açılıyor...")
    status, res = request("POST", "/api/auth/register", {
        "shopName": "Usta Eller Erkek Kuaförü",
        "ownerName": "Serkan Usta",
        "phone": test_phone,
        "email": "serkan@example.com",
        "password": test_pass
    })
    if status != 200:
        # Daha önce açılmışsa giriş yap
        print("  -> Zaten kayıtlı olabilir, giriş deneniyor...")
        status, res = request("POST", "/api/auth/login", {
            "phone": test_phone,
            "password": test_pass
        })
    assert status == 200, f"Giriş/Kayıt başarısız: {res}"
    print(f"  ✓ Hesap hazır: {res.get('account', {}).get('shopName')}")

    # 2. Profili Berber / Kuaför Olarak Yapılandır
    print("\n[Adım 2] Dükkan profili berber olarak ayarlanıyor...")
    status, res = request("POST", "/api/shop-profile", {
        "storeName": "Usta Eller Erkek Kuaförü",
        "ownerName": "Serkan Usta",
        "businessField": "Kuaför / Berber / Güzellik",
        "sectorKey": "kuafor_berber",
        "employeeCount": "2",
        "phone": test_phone,
        "dailyTarget": 6000,
        "slogan": "Klasik ve Modern Saç Tasarımı",
        "slug": "usta-eller-berber"
    })
    assert status == 200, f"Profil güncelleme hatası: {res}"
    print("  ✓ Profil ve slug 'usta-eller-berber' olarak kaydedildi.")

    # 3. Personelleri Tanımla
    print("\n[Adım 3] Ustalar tanımlanıyor (Serkan Usta ve Caner Kalfa)...")
    staff_data = [
        {"id": "st_serkan", "name": "Serkan Usta", "title": "Kıdemli Usta", "phone": "05321110001", "active": True, "allowedServiceIds": []},
        {"id": "st_caner", "name": "Caner Kalfa", "title": "Kalfa", "phone": "05321110002", "active": True, "allowedServiceIds": []}
    ]
    status, res = request("POST", "/api/barber/staff", {"staff": staff_data})
    assert status == 200, f"Personel kaydı hatası: {res}"
    print("  ✓ 2 aktif usta kaydedildi.")

    # 4. Hizmetleri Tanımla
    print("\n[Adım 4] Hizmetler tanımlanıyor (Saç, Sakal, Komple)...")
    service_data = [
        {"id": "srv_sac", "name": "Saç Kesimi", "durationMinutes": 30, "price": 250, "category": "Saç", "allowedStaffIds": []},
        {"id": "srv_sakal", "name": "Sakal Tıraşı", "durationMinutes": 20, "price": 150, "category": "Sakal", "allowedStaffIds": []},
        {"id": "srv_komple", "name": "Komple Bakım", "durationMinutes": 50, "price": 400, "category": "Özel", "allowedStaffIds": []}
    ]
    status, res = request("POST", "/api/barber/services", {"services": service_data})
    assert status == 200, f"Hizmet kaydı hatası: {res}"
    print("  ✓ 3 berber hizmeti kaydedildi.")

    # 5. Salon Çalışma Saatleri ve Ayarları
    print("\n[Adım 5] Salon ayarları (09:00 - 21:00, 30 dk slot, Pazar kapalı)...")
    status, res = request("POST", "/api/barber/settings", {
        "openHour": "09:00",
        "closeHour": "21:00",
        "slotIntervalMinutes": 30,
        "closedDays": [0],
        "closedReason": "Pazar Günü Dinlenme",
        "slug": "usta-eller-berber",
        "requireOtp": False
    })
    assert status == 200, f"Ayar kaydı hatası: {res}"
    print("  ✓ Salon ayarları güncellendi.")

    # 6. Kamusal API Doğrulaması (Müşteri Gözünden)
    print("\n[Adım 6] Müşteri randevu sayfası verisi çekiliyor (GET /api/public/barber/usta-eller-berber)...")
    status, res = request("GET", "/api/public/barber/usta-eller-berber")
    assert status == 200, f"Kamusal veri hatası: {res}"
    assert len(res.get("staff", [])) == 2, "Ustalar eksik"
    assert len(res.get("services", [])) == 3, "Hizmetler eksik"
    print(f"  ✓ Kamusal sayfa aktif: {res.get('shop', {}).get('storeName')}")

    # 7. İlk Müşteri Randevusu Alma
    test_date = "2026-11-02" # Pazartesi
    print(f"\n[Adım 7] Müşteri 1 (Ali Kaya) Serkan Usta'ya 10:00 randevusu alıyor...")
    status, res = request("POST", "/api/public/barber/usta-eller-berber/book", {
        "customerName": "Ali Kaya",
        "phone": "05441112233",
        "date": test_date,
        "timeSlot": "10:00",
        "serviceIds": ["srv_sac"],
        "staffId": "st_serkan",
        "kvkkApproved": True,
        "otpCode": "1234"
    })
    assert status == 200, f"Randevu alma hatası: {res}"
    apt1 = res.get("appointment", {})
    apt1_id = apt1.get("id")
    print(f"  ✓ Randevu başarıyla alındı! ID: {apt1_id}, Usta: {apt1.get('staffName')}, Saat: {apt1.get('timeSlot')}")

    # 8. Çakışma / Çift Rezervasyon Testi (Double-Booking Prevention)
    print("\n[Adım 8] Çift Randevu Testi: Başka bir müşteri aynı saatte aynı ustayı almaya çalışıyor...")
    status, res = request("POST", "/api/public/barber/usta-eller-berber/book", {
        "customerName": "Mehmet Demir",
        "phone": "05442223344",
        "date": test_date,
        "timeSlot": "10:00",
        "serviceIds": ["srv_sac"],
        "staffId": "st_serkan",
        "kvkkApproved": True,
        "otpCode": "1234"
    })
    assert status == 409, f"HATA: Çakışan randevu engellenmedi! Yanıt: {status} {res}"
    print(f"  ✓ Çakışma başarıyla engellendi! (HTTP 409: {res.get('error')})")

    # 9. Otomatik / Fark Etmez Usta Atama Testi
    print("\n[Adım 9] Otomatik Usta Atama Testi: 10:00 saatine 'Fark Etmez' ile randevu alınıyor...")
    status, res = request("POST", "/api/public/barber/usta-eller-berber/book", {
        "customerName": "Burak Yılmaz",
        "phone": "05443334455",
        "date": test_date,
        "timeSlot": "10:00",
        "serviceIds": ["srv_sac"],
        "staffId": "auto",
        "kvkkApproved": True,
        "otpCode": "1234"
    })
    assert status == 200, f"Otomatik atama hatası: {res}"
    apt2 = res.get("appointment", {})
    assert apt2.get("staffId") == "st_caner", f"Serkan Usta doluyken Caner Kalfa atanmalıydı! Atanan: {apt2.get('staffName')}"
    print(f"  ✓ Serkan Usta dolu olduğu için sistem akıllıca boş olan Caner Kalfa'yı atadı! Usta: {apt2.get('staffName')}")

    # Artık 10:00 saatinde her iki usta da dolu! 3. kişi 10:00'a alamamalı!
    print("  -> Şimdi her iki usta da 10:00'da dolu, 3. randevu deneniyor...")
    status, res = request("POST", "/api/public/barber/usta-eller-berber/book", {
        "customerName": "Emre Can",
        "phone": "05445556677",
        "date": test_date,
        "timeSlot": "10:00",
        "serviceIds": ["srv_sac"],
        "staffId": "auto",
        "kvkkApproved": True,
        "otpCode": "1234"
    })
    assert status == 409, f"HATA: Tüm ustalar doluyken randevu kabul edildi! {status} {res}"
    print(f"  ✓ Salon tam kapasite dolu olduğu için 3. randevu doğru şekilde reddedildi: {res.get('error')}")

    # 10. Toplu / Çoklu Randevu Testi (Bi Sürü Randevu Al)
    print("\n[Adım 10] Toplu Randevu Testi: Gün içine 8 farklı randevu serisi oluşturuluyor...")
    slots = ["11:00", "11:30", "12:00", "12:30", "14:00", "14:30", "15:00", "15:30"]
    bulk_ids = []
    for idx, s in enumerate(slots):
        c_name = f"Test Müşteri {idx+1}"
        c_phone = f"0544{idx+10:02d}0000"
        status, res = request("POST", "/api/public/barber/usta-eller-berber/book", {
            "customerName": c_name,
            "phone": c_phone,
            "date": test_date,
            "timeSlot": s,
            "serviceIds": ["srv_sac"],
            "staffId": "st_serkan",
            "kvkkApproved": True,
            "otpCode": "1234"
        })
        assert status == 200, f"Slot {s} için randevu alınamadı: {res}"
        bulk_ids.append(res.get("appointment", {}).get("id"))
    print(f"  ✓ 8 adet randevu peş peşe başarıyla kaydedildi: {len(bulk_ids)} adet")

    # 11. Berber Panelinde Randevu Listesini ve Takvimi Kontrol Et
    print("\n[Adım 11] Berber sahibi panelinden randevu listesi çekiliyor (GET /api/appointments)...")
    status, res = request("GET", "/api/appointments")
    assert status == 200, f"Randevu listesi alınamadı: {res}"
    all_apts = res.get("appointments", [])
    assert len(all_apts) >= 10, f"Randevular eksik, beklenen en az 10, bulunan: {len(all_apts)}"
    print(f"  ✓ Berber panelinde toplam {len(all_apts)} randevu takvimde başarıyla listelendi.")

    # 12. Randevu Durum Döngüsü & Kasaya Tahsilat Testi
    print(f"\n[Adım 12] Randevu {apt1_id} durumu güncelleniyor (bekliyor -> koltukta -> tamamlandi)...")
    status, res = request("PATCH", f"/api/appointments/{apt1_id}/status", {"status": "koltukta"})
    assert status == 200, f"Durum güncelleme hatası: {res}"
    assert res.get("appointment", {}).get("status") == "koltukta"
    print("  ✓ Müşteri koltuğa oturtuldu (status: koltukta)")

    # Tamamla ve Kasaya 250 TL Nakit Tahsilat Yaz
    status, res = request("POST", f"/api/appointments/{apt1_id}/complete", {"paymentMethod": "nakit"})
    assert status == 200, f"Randevu tamamlama hatası: {res}"
    tx = res.get("transaction", {})
    cash = res.get("cash", {})
    assert tx.get("amount") == 250, f"Hatalı tahsilat tutarı: {tx}"
    assert cash.get("todayCash", 0) >= 250, f"Kasa güncellenmedi: {cash}"
    print(f"  ✓ Randevu tamamlandı, kasaya +{tx.get('amount')} TL nakit gelir olarak işlendi! Kasa toplamı: {cash.get('todayCash')} TL")

    # 13. Randevu Sil ve Tekrar Al Testi ("Randevu sil tekrar al")
    print("\n[Adım 13] Randevu Silme & Serbest Kalan Saate Yeniden Randevu Alma Testi...")
    # apt2 (Caner Kalfa 10:00 randevusu) siliniyor
    status, res = request("DELETE", f"/api/appointments/{apt2['id']}")
    assert status == 200, f"Randevu silinemedi: {res}"
    print(f"  ✓ Caner Kalfa'nın 10:00 randevusu ({apt2['id']}) silindi.")

    # Kamusal API'de Caner Kalfa'nın 10:00 saati tekrar boşa çıkmış olmalı
    status, res = request("GET", "/api/public/barber/usta-eller-berber")
    occ = res.get("occupiedSlots", [])
    caner_10_busy = any(o.get("date") == test_date and o.get("timeSlot") == "10:00" and o.get("staffId") == "st_caner" for o in occ)
    assert not caner_10_busy, "HATA: Silinen randevu kamusal takvimde hala dolu gözüküyor!"
    print("  ✓ Kamusal takvim kontrol edildi: Caner Kalfa için 10:00 saati yeniden BOŞ olarak açıldı.")

    # Aynı saate yeni müşteri randevu alabilmeli
    print("  -> Boşa çıkan 10:00 saatine yeni müşteri (Levent Kırca) randevu alıyor...")
    status, res = request("POST", "/api/public/barber/usta-eller-berber/book", {
        "customerName": "Levent Kırca",
        "phone": "05449998877",
        "date": test_date,
        "timeSlot": "10:00",
        "serviceIds": ["srv_sakal"],
        "staffId": "st_caner",
        "kvkkApproved": True,
        "otpCode": "1234"
    })
    assert status == 200, f"Yeniden randevu alma başarısız: {res}"
    apt_new = res.get("appointment", {})
    assert apt_new.get("customerName") == "Levent Kırca"
    print(f"  ✓ Silinen saat anında yeni müşteriyle dolduruldu! ID: {apt_new.get('id')}")

    print("\n==================================================================")
    print("🎉 TÜM BERBER VE RANDEVU TESTLERİ %100 BAŞARIYLA TAMAMLANDI! 🎉")
    print("==================================================================")

if __name__ == "__main__":
    run_tests()
