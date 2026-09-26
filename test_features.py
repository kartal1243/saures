# -*- coding: utf-8 -*-
"""Faz 5/6/8/10b dogrulamasi: sifre guvenligi, brute force, personel rol kisiti, yedekleme."""
import json
import uuid
import urllib.request
import urllib.error

BASE = "http://localhost:3000"
PASSED = []
FAILED = []


def req(path, method="GET", body=None, cookie=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    r = urllib.request.Request(BASE + path, data=data, method=method)
    r.add_header("Content-Type", "application/json")
    if cookie:
        r.add_header("Cookie", cookie)
    try:
        resp = urllib.request.urlopen(r, timeout=15)
        raw = resp.read().decode("utf-8")
        try:
            parsed = json.loads(raw)
        except Exception:
            parsed = raw
        return resp.status, parsed, resp.headers
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8")
        try:
            parsed = json.loads(raw)
        except Exception:
            parsed = raw
        return e.code, parsed, e.headers


def check(name, cond, detail=""):
    if cond:
        PASSED.append(name)
        print(f"  PASS  {name}")
    else:
        FAILED.append(name)
        print(f"  FAIL  {name}  {detail}")


def sid_of(set_cookie):
    if not set_cookie:
        return None
    for part in set_cookie.split(","):
        if part.strip().startswith("sid="):
            return "sid=" + part.strip().split(";", 1)[0].split("=", 1)[1]
    return None


def main():
    tag = uuid.uuid4().hex[:6]
    phone = f"0501{tag}"

    print("\n== 1) KAYIT + SIFRE DEGISTIRME ==")
    code, d, h = req("/api/auth/register", "POST",
                     {"shopName": f"Guvenlik Testi {tag}", "ownerName": "Patron",
                      "phone": phone, "password": "1111"})
    cookie = sid_of(h.get("Set-Cookie", ""))
    check("register 200", code in (200, 201) and bool(cookie), f"{code}")

    code, d, _ = req("/api/auth/change-password", "POST",
                     {"currentPassword": "yanlis", "newPassword": "2222"}, cookie=cookie)
    check("yanlis mevcut sifre ile degisiklik 401", code == 401, f"{code} {d}")

    code, d, _ = req("/api/auth/change-password", "POST",
                     {"currentPassword": "1111", "newPassword": "22"}, cookie=cookie)
    check("4 haneden kisa yeni sifre 400", code == 400, f"{code} {d}")

    code, d, _ = req("/api/auth/change-password", "POST",
                     {"currentPassword": "1111", "newPassword": "2222"}, cookie=cookie)
    check("sifre degistirme 200", code == 200, f"{code} {d}")

    code, d, _ = req("/api/auth/login", "POST", {"phone": phone, "password": "1111"})
    check("eski sifre ile giris artik RED", code in (400, 401), f"{code}")
    code, d, h = req("/api/auth/login", "POST", {"phone": phone, "password": "2222"})
    cookie = sid_of(h.get("Set-Cookie", ""))
    check("yeni sifre ile giris 200", code == 200 and bool(cookie), f"{code}")

    print("\n== 2) BRUTE FORCE KORUMASI ==")
    lock_phone = f"0502{tag}"
    req("/api/auth/register", "POST",
        {"shopName": f"Kilit Testi {tag}", "ownerName": "Kilit", "phone": lock_phone,
         "password": "1234"})
    codes = []
    for _ in range(6):
        c, _, _ = req("/api/auth/login", "POST", {"phone": lock_phone, "password": "yanlis"})
        codes.append(c)
    check("6. yanlis denemede 429 kilit", codes[-1] == 429, str(codes))
    c, d, _ = req("/api/auth/login", "POST", {"phone": lock_phone, "password": "1234"})
    check("kilitliyken dogru sifre bile giris yapamaz", c == 429, f"{c} {d}")

    print("\n== 3) PERSONEL (KASIYER) EKLE + ROL KISITI ==")
    code, d, h = req("/api/auth/register", "POST",
                     {"shopName": f"Patronluk {tag}", "ownerName": "Patron",
                      "phone": f"0503{tag}", "password": "1234"})
    owner_cookie = sid_of(h.get("Set-Cookie", ""))
    check("patron kaydi 200", code in (200, 201) and bool(owner_cookie), f"{code}")

    # Profil tamamla (owner)
    code, d, _ = req("/api/shop-profile", "POST",
                     {"storeName": f"Patronluk {tag}", "ownerName": "Patron",
                      "businessField": "Bakkal / Market", "isConfigured": True},
                     cookie=owner_cookie)
    prof = (d.get("profile") or {}) if isinstance(d, dict) else {}
    check("profil kayit {success, profile} seklinde doner",
          code == 200 and d.get("success") is True and prof.get("storeName") == f"Patronluk {tag}"
          and prof.get("businessField") == "Bakkal / Market", f"{code} {d}")
    code, st, _ = req("/api/data", cookie=owner_cookie)
    check("kayitli profil /api/data ile ayni",
          (st.get("shopProfile") or {}).get("storeName") == f"Patronluk {tag}",
          str((st.get("shopProfile") or {}).get("storeName")))
    code, d, _ = req("/api/shop-profile", "POST",
                     {"storeName": f"Patronluk {tag}", "ownerName": "Patron",
                      "businessField": "Kuaför / Berber / Güzellik Salonu",
                      "sectorKey": "berber_kuafor", "isConfigured": True},
                     cookie=owner_cookie)
    check("berber sectorKey kaydolur",
          code == 200 and (d.get("profile") or {}).get("sectorKey") == "berber_kuafor",
          f"{code} {d}")
    code, st, _ = req("/api/data", cookie=owner_cookie)
    check("berber sectorKey /api/data ile ayni",
          (st.get("shopProfile") or {}).get("sectorKey") == "berber_kuafor",
          str((st.get("shopProfile") or {}).get("sectorKey")))

    cashier_phone = f"0504{tag}"
    code, d, _ = req("/api/auth/add-staff", "POST",
                     {"name": "Kasiyer Kiz", "phone": cashier_phone, "password": "4321"},
                     cookie=owner_cookie)
    staff_id = (d.get("account") or {}).get("id") if isinstance(d, dict) else None
    check("kasiyer eklendi", code == 200 and staff_id, f"{code} {d}")

    code, d, _ = req("/api/auth/staff", cookie=owner_cookie)
    check("personel listesi 1 kisi", code == 200 and len(d.get("staff", [])) == 1, str(d))

    # Kayitsiz telefondan add-staff denerse (auth yok) 401
    code, d, _ = req("/api/auth/add-staff", "POST",
                     {"name": "Seri", "phone": f"0505{tag}", "password": "1234"})
    check("giris yokken personel eklenemez 401", code == 401, f"{code}")

    code, d, h = req("/api/auth/login", "POST",
                     {"phone": cashier_phone, "password": "4321"})
    cash_cookie = sid_of(h.get("Set-Cookie", ""))
    check("kasiyer giris 200", code == 200 and bool(cash_cookie), f"{code}")

    code, d, _ = req("/api/auth/me", cookie=cash_cookie)
    check("kasiyer rol='cashier'", code == 200 and d.get("account", {}).get("role") == "cashier",
          str(d))

    # Kasiyer serbest isler
    code, d, _ = req("/api/data", cookie=cash_cookie)
    check("kasiyer /api/data gorebilir 200", code == 200, f"{code}")
    code, d, _ = req("/api/transactions", "POST",
                     {"type": "masraf", "amount": 10}, cookie=cash_cookie)
    check("kasiyer masraf girebilir 200", code == 200, f"{code} {d}")
    code, d, _ = req("/api/customers", "POST",
                     {"name": "Kasa Musteri", "phone": f"0556{tag}"}, cookie=cash_cookie)
    check("kasiyer musteri ekleyebilir 200", code == 200, f"{code}")
    code, d, _ = req("/api/daily-closings", "POST",
                     {"actualCashCount": -10}, cookie=cash_cookie)
    check("kasiyer gun sonu kapatabilir 200", code == 200, f"{code}")

    # Kasiyer yasak isler
    code, d, _ = req("/api/shop-profile", "POST",
                     {"storeName": "Kaciyer Gunci", "isConfigured": True}, cookie=cash_cookie)
    check("kasiyer profil degistiremez 403", code == 403, f"{code} {d}")
    code, d, _ = req("/api/backup", cookie=cash_cookie)
    check("kasiyer yedek alamaz 403", code == 403, f"{code}")
    code, d, _ = req("/api/products", "POST",
                     {"name": "X", "price": 10, "currentStock": 5, "minStock": 1},
                     cookie=cash_cookie)
    check("kasiyer urun ekleyemez 403", code == 403, f"{code} {d}")
    code, d, _ = req("/api/auth/staff", cookie=cash_cookie)
    check("kasiyer personel yonetemez 403", code == 403, f"{code}")

    print("\n== 3b) DAVA DOSYALARI (avukat) ==")
    code, d, _ = req("/api/cases", "POST", {"clientName": "Ali Veli"}, cookie=owner_cookie)
    check("dosya no yokken dava 400", code == 400, f"{code} {d}")
    code, d, _ = req("/api/cases", "POST",
                     {"fileNo": "2026/1234", "clientName": "Ali Veli",
                      "court": "Asliye Hukuk", "hearingDate": "2026-10-15",
                      "consultancyHours": 3, "hourlyRate": 5000,
                      "hearings": [{"date": "2026-10-15", "note": "Kesif"}]},
                     cookie=owner_cookie)
    case = d.get("case", {}) if isinstance(d, dict) else {}
    case_id = case.get("id")
    check("dava dosyasi olustu", code == 200 and case_id and len(case.get("hearings", [])) == 1,
          f"{code} {d}")
    code, d, _ = req("/api/data", cookie=owner_cookie)
    check("/api/data dosyayi dondurur",
          any(c.get("id") == case_id for c in d.get("cases", [])), str(d.get("cases")))
    code, d, _ = req("/api/cases", "POST",
                     {"id": case_id, "fileNo": "2026/1234", "clientName": "Ali Veli",
                      "status": "kapali", "hearings": []}, cookie=owner_cookie)
    check("dosya kapatilabiliyor",
          code == 200 and d.get("case", {}).get("status") == "kapali", f"{code} {d}")
    code, d, _ = req(f"/api/cases/{case_id}", "DELETE", cookie=cash_cookie)
    check("kasiyer dosya silemez 403", code == 403, f"{code} {d}")
    code, d, _ = req(f"/api/cases/{case_id}", "DELETE", cookie=owner_cookie)
    check("dosya silindi 200", code == 200, f"{code} {d}")

    print("\n== 4) YEDEK INDIR + GERI YUKLE ==")
    # Owner: 1 musteri ekle -> yedek al
    req("/api/customers", "POST", {"name": "Yedekli Ali", "phone": f"0557{tag}"},
        cookie=owner_cookie)
    code, backup, _ = req("/api/backup", cookie=owner_cookie)
    has_backup = code == 200 and isinstance(backup, dict) and backup.get("state", {}).get("customers")
    check("yedek indirme 200 + state var", bool(has_backup), f"{code}")
    saved_backup = backup if isinstance(backup, dict) else {}

    # 2. musteri ekle (yedek disinda kalan veri)
    req("/api/customers", "POST", {"name": "Sonrasi Mehmet", "phone": f"0558{tag}"},
        cookie=owner_cookie)
    code, st, _ = req("/api/data", cookie=owner_cookie)
    check("geri yukleme oncesi 2 musteri", len(st.get("customers", [])) == 2,
          str(len(st.get("customers", []))))

    code, d, _ = req("/api/backup/restore", "POST", {"state": saved_backup["state"]},
                     cookie=owner_cookie)
    check("geri yukleme 200", code == 200 and d.get("success") is True, f"{code} {d}")

    code, st, _ = req("/api/data", cookie=owner_cookie)
    names = [c.get("name") for c in st.get("customers", [])]
    check("geri yuklemeden sonra 1 musteri (Yedekli Ali)",
          len(names) == 1 and "Yedekli Ali" in names, str(names))

    code, d, _ = req("/api/backup/restore", "POST", {"state": {"customers": "bozuk"}},
                     cookie=owner_cookie)
    check("gecersiz yedek 400", code == 400, f"{code} {d}")

    print("\n== 5) PERSONEL SIL ==")
    code, d, _ = req(f"/api/auth/staff/{staff_id}", "DELETE", cookie=owner_cookie)
    check("personel silindi 200", code == 200, f"{code} {d}")
    code, d, _ = req("/api/data", cookie=cash_cookie)
    check("silinen kasiyerin oturumu dustu 401", code == 401, f"{code}")
    code, d, _ = req("/api/auth/login", "POST", {"phone": cashier_phone, "password": "4321"})
    check("silinen kasiyer giris yapamaz", code in (400, 401, 404), f"{code} {d}")

    print("\n== 6) GIDER KATEGORISI + TEDARIKCI CARI HESAP ==")
    code, d, _ = req("/api/transactions", "POST",
                     {"type": "masraf", "amount": 75, "category": "Fatura (Elektrik/Su/İnternet)",
                      "description": "Elektrik faturasi"}, cookie=owner_cookie)
    tx = d.get("transaction", {}) if isinstance(d, dict) else {}
    check("masraf kategori ile kaydolur", code == 200 and tx.get("category") == "Fatura (Elektrik/Su/İnternet)",
          f"{code} {d}")

    code, d, _ = req("/api/suppliers", "POST", {"phone": "0555000000"}, cookie=owner_cookie)
    check("isim yokken tedarikci 400", code == 400, f"{code} {d}")
    code, d, _ = req("/api/suppliers", "POST",
                     {"name": "Ekmekci Firin", "phone": f"0559{tag}"}, cookie=owner_cookie)
    sup = d.get("supplier", {}) if isinstance(d, dict) else {}
    sup_id = sup.get("id")
    check("tedarikci olustu, borc 0", code == 200 and sup_id and sup.get("balance") == 0,
          f"{code} {d}")

    code, d, _ = req(f"/api/suppliers/{sup_id}/purchase", "POST",
                     {"amount": 150}, cookie=owner_cookie)
    check("veresiye alim borcu 150 yapar", code == 200 and d.get("supplier", {}).get("balance") == 150,
          f"{code} {d}")

    code, d0, _ = req("/api/data", cookie=owner_cookie)
    exp0 = float((d0.get("cash") or {}).get("todayExpense", 0))
    code, d, _ = req(f"/api/suppliers/{sup_id}/pay", "POST",
                     {"amount": 50, "paymentMethod": "nakit"}, cookie=owner_cookie)
    pay_tx = (d.get("transaction") or {}) if isinstance(d, dict) else {}
    check("odeme sonrasi borc 100", code == 200 and d.get("supplier", {}).get("balance") == 100,
          f"{code} {d}")
    check("odeme gider fisi acar (kategori Toptanci)",
          pay_tx.get("type") == "gider" and pay_tx.get("category") == "Toptancı Ödemesi / Mal Alımı",
          str(pay_tx))
    code, d1, _ = req("/api/data", cookie=owner_cookie)
    exp1 = float((d1.get("cash") or {}).get("todayExpense", 0))
    check("odeme kasadan dustu (+50)", exp1 - exp0 == 50.0, f"{exp0} -> {exp1}")
    sups = [s for s in d1.get("suppliers", []) if s.get("id") == sup_id]
    check("/api/data tedarikciyi dondurur", len(sups) == 1 and sups[0].get("balance") == 100,
          str(sups))

    code, d, _ = req(f"/api/suppliers/{sup_id}", "DELETE", cookie=owner_cookie)
    check("tedarikci silindi 200", code == 200, f"{code} {d}")

    code, d, _ = req("/api/services", "POST", {"price": 300}, cookie=owner_cookie)
    check("isim yokken hizmet 400", code == 400, f"{code} {d}")
    code, d, _ = req("/api/services", "POST",
                     {"name": "Sakal Tıraşı", "price": 150}, cookie=owner_cookie)
    srv = d.get("service", {}) if isinstance(d, dict) else {}
    srv_id = srv.get("id")
    check("hizmet olustu (150)", code == 200 and srv_id and srv.get("price") == 150,
          f"{code} {d}")
    code, d, _ = req("/api/services", "POST",
                     {"id": srv_id, "name": "Sakal Tıraşı", "price": 200},
                     cookie=owner_cookie)
    check("hizmet fiyati guncellendi (200)",
          code == 200 and d.get("service", {}).get("price") == 200, f"{code} {d}")
    code, d, _ = req("/api/data", cookie=owner_cookie)
    check("/api/data hizmeti dondurur",
          any(s.get("id") == srv_id for s in d.get("services", [])), str(d.get("services")))
    code, d, _ = req(f"/api/services/{srv_id}", "DELETE", cookie=owner_cookie)
    check("hizmet silindi 200", code == 200, f"{code} {d}")
    code, d, _ = req("/api/data", cookie=owner_cookie)
    check("silinen tedarikci listede yok",
          all(s.get("id") != sup_id for s in d.get("suppliers", [])), str(d.get("suppliers")))

    code, d, h = req("/api/auth/register", "POST",
                     {"shopName": f"Izolasyon {tag}", "ownerName": "Diger",
                      "phone": f"0506{tag}", "password": "1234"})
    other_cookie = sid_of(h.get("Set-Cookie", ""))
    code, d, _ = req("/api/data", cookie=other_cookie)
    check("baska dukkan tedarikci gormez (bos)", code == 200 and d.get("suppliers") == [],
          str(d.get("suppliers")))

    print(f"\n===== SONUC: {len(PASSED)} PASS / {len(FAILED)} FAIL =====")
    if FAILED:
        print("Basarisiz:", ", ".join(FAILED))
    return 1 if FAILED else 0


if __name__ == "__main__":
    raise SystemExit(main())
