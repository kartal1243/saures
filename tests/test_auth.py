# -*- coding: utf-8 -*-
"""Esnaf Portali auth + izolasyon + kasa akisi testi (seed verisi yok)."""
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
    shopA = {"shopName": f"Test Market {tag}", "ownerName": "Ali Test",
             "phone": f"0500{tag}", "password": "1234"}
    shopB = {"shopName": f"Other Shop {tag}", "ownerName": "Veli Test",
             "phone": f"0600{tag}", "password": "1234"}

    print("\n== 1) AUTH BLOKLAMA (giris yok) ==")
    code, data, _ = req("/api/data")
    check("giris yokken /api/data 401", code == 401, f"got {code}")
    code, data, _ = req("/api/auth/me")
    check("giris yokken /api/auth/me 401", code == 401, f"got {code}")

    print("\n== 2) KAYIT ==")
    code, data, hdr = req("/api/auth/register", "POST", shopA)
    check("register 200/201", code in (200, 201), f"got {code}: {data}")
    cookie = sid_of(hdr.get("Set-Cookie", ""))
    check("sid cookie alindi", bool(cookie), str(hdr.get("Set-Cookie")))
    code, data, _ = req("/api/auth/me", cookie=cookie)
    acc = data.get("account", {}) if isinstance(data, dict) else {}
    check("/api/auth/me 200 + dogru hesap",
          code == 200 and acc.get("shopName") == shopA["shopName"],
          f"{code} {data}")

    print("\n== 3) ILK ACILIS (seed yok, bos veri) ==")
    code, st, _ = req("/api/data", cookie=cookie)
    check("/api/data 200", code == 200, f"got {code}")
    check("musteri bos", st.get("customers") == [], str(st.get("customers"))[:80])
    check("islemler bos", st.get("transactions") == [], str(st.get("transactions"))[:80])
    cash = st.get("cash", {})
    check("kasa sifir (gelir/gider 0)", float(cash.get("todayExpense", -1)) == 0.0
          and float(cash.get("todayTotalIncome", -1)) == 0.0, str(cash))
    check("isConfigured false (wizard acilir)",
          st.get("shopProfile", {}).get("isConfigured") is False)

    print("\n== 4) DUUKKAN PROFILI KAYDI ==")
    profile = {"storeName": f"Test Market {tag}", "ownerName": "Ali Test",
               "businessField": "Bakkal / Market / Büfe", "sectorKey": "bakkal_market",
               "employeeCount": "2", "phone": shopA["phone"],
               "cityDistrict": "Istanbul / Kadikoy", "dailyTarget": 1500,
               "slogan": "test", "isConfigured": True}
    code, data, _ = req("/api/shop-profile", "POST", profile, cookie=cookie)
    check("profil kaydi 200", code == 200 and data.get("success") is True,
          f"got {code}: {data}")
    code, st, _ = req("/api/data", cookie=cookie)
    check("profil kaydedildi (isConfigured true)",
          st.get("shopProfile", {}).get("isConfigured") is True)
    check("storeName guncellendi", st.get("storeName") == profile["storeName"],
          str(st.get("storeName")))

    print("\n== 5) MUSTERI + MASRAF + KASA ==")
    code, d, _ = req("/api/customers", "POST",
                     {"name": "Hasan Müşteri", "phone": f"0555{tag}", "notes": "test"},
                     cookie=cookie)
    cust_id = (d.get("customer") or {}).get("id") if isinstance(d, dict) else None
    check("musteri eklendi", code == 200 and cust_id, f"got {code}: {d}")

    code, d, _ = req("/api/transactions", "POST",
                     {"type": "masraf", "amount": 100, "description": "Elektrik"},
                     cookie=cookie)
    tx1 = (d.get("transaction") or {}) if isinstance(d, dict) else {}
    check("masraf islemi", code == 200 and tx1.get("type") == "masraf",
          f"got {code}: {d}")
    code, d, _ = req("/api/transactions", "POST",
                     {"type": "gider", "amount": 50, "description": "Toptanci"},
                     cookie=cookie)
    tx2 = (d.get("transaction") or {}) if isinstance(d, dict) else {}
    check("gider islemi", code == 200 and tx2.get("type") == "gider",
          f"got {code}: {d}")
    code, d, _ = req("/api/transactions", "POST",
                     {"type": "veresiye", "amount": 75, "customerId": cust_id},
                     cookie=cookie)
    tx3 = (d.get("transaction") or {}) if isinstance(d, dict) else {}
    check("veresiye islemi", code == 200 and tx3.get("type") == "veresiye",
          f"got {code}: {d}")

    code, st, _ = req("/api/data", cookie=cookie)
    cash = st.get("cash", {})
    check("gider+masraf dusum toplami 150", float(cash.get("todayExpense", -1)) == 150.0,
          str(cash))
    check("netTodayCash -150 (veresiye kasayi etkilemez)",
          float(cash.get("netTodayCash", -99)) == -150.0, str(cash))
    check("toplam alacak 75 (veresiye)", float(cash.get("totalReceivables", -1)) == 75.0,
          str(cash))
    custs = st.get("customers", [])
    check("musteri bakiyesi 75", len(custs) == 1 and float(custs[0].get("balance", -1)) == 75.0,
          str(custs))

    print("\n== 6) TAHsilat (bakiye dusmesi) ==")
    code, d, _ = req("/api/transactions", "POST",
                     {"type": "tahsilat", "amount": 75, "customerId": cust_id,
                      "paymentMethod": "nakit"}, cookie=cookie)
    check("tahsilat islemi", code == 200, f"got {code}: {d}")
    code, st, _ = req("/api/data", cookie=cookie)
    cash = st.get("cash", {})
    check("bakiye 0'a dustu",
          float(st.get("customers", [{}])[0].get("balance", -1)) == 0.0,
          str(st.get("customers", [])[:1]))
    check("netTodayCash -75 (75 tahsilat - 150 gider)",
          float(cash.get("netTodayCash", -99)) == -75.0, str(cash))

    print("\n== 7) GUN SONU ==")
    code, d, _ = req("/api/daily-closings", "POST",
                     {"actualCashCount": -75, "note": "gun sonu"}, cookie=cookie)
    closing = (d.get("closing") or {}) if isinstance(d, dict) else {}
    check("gun sonu 200", code == 200 and closing.get("id"), f"got {code}: {d}")
    check("gun sonu diff 0 (sayilan = beklenen)",
          float(closing.get("diffAmount", 99)) == 0.0, str(closing))
    code, st, _ = req("/api/data", cookie=cookie)
    check("dailyClosings 1 kayit", len(st.get("dailyClosings", [])) == 1,
          str(len(st.get("dailyClosings", []))))

    print("\n== 8) IZOLASYON (ikinci hesap) ==")
    code, data, hdr2 = req("/api/auth/register", "POST", shopB)
    check("ikinci register 200", code in (200, 201), f"got {code}: {data}")
    cookieB = sid_of(hdr2.get("Set-Cookie", ""))
    code, stB, _ = req("/api/data", cookie=cookieB)
    check("B verileri bos", code == 200 and stB.get("customers") == []
          and stB.get("transactions") == [], f"{code}")
    check("B gun sonu yok", len(stB.get("dailyClosings", [])) == 0)
    check("B kasa 0", float(stB.get("cash", {}).get("todayExpense", -1)) == 0.0)

    print("\n== 9) AYNI TELEFON TEKRAR KAYIT ==")
    code, data, _ = req("/api/auth/register", "POST", shopA)
    check("ayni telefonla kayit reddedildi", code in (400, 409), f"got {code}: {data}")

    print("\n== 10) GIRIS (yanlis ve dogru) ==")
    code, data, _ = req("/api/auth/login", "POST",
                        {"phone": shopA["phone"], "password": "yanlis"})
    check("yanlis sifre reddedildi", code in (400, 401, 403), f"got {code}: {data}")
    code, data, hdr3 = req("/api/auth/login", "POST",
                           {"phone": shopA["phone"], "password": shopA["password"]})
    check("dogru giris 200", code == 200, f"got {code}: {data}")
    cookieA2 = sid_of(hdr3.get("Set-Cookie", ""))
    check("yeni sid verildi", bool(cookieA2))
    code, st, _ = req("/api/data", cookie=cookieA2)
    check("A verileri geri geldi (musteri 1, islem 4, gun sonu 1)",
          code == 200 and len(st.get("customers", [])) == 1
          and len(st.get("transactions", [])) == 4
          and len(st.get("dailyClosings", [])) == 1,
          f"cust={len(st.get('customers', []))} tx={len(st.get('transactions', []))}"
          f" dc={len(st.get('dailyClosings', []))}")

    print("\n== 11) CIKIS ==")
    code, data, _ = req("/api/auth/logout", "POST", cookie=cookieA2)
    check("logout 200", code == 200, f"got {code}: {data}")
    code, data, _ = req("/api/data", cookie=cookieA2)
    check("ciktan sonra 401", code == 401, f"got {code}")

    print(f"\n===== SONUC: {len(PASSED)} PASS / {len(FAILED)} FAIL =====")
    if FAILED:
        print("Basarisiz:", ", ".join(FAILED))
    return 1 if FAILED else 0


if __name__ == "__main__":
    raise SystemExit(main())
