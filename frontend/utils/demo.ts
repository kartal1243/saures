// Demo hesapla tek tıkla giriş. Demo dükkan sunucuda otomatik tohumlanır:
// Makas & Tarak Erkek Kuaförü (05900000011 / Demo1234!)
export const DEMO_PHONE = '05900000011';
export const DEMO_PASSWORD = 'Demo1234!';

/** Demo giriş yapar, başarılıysa ana sayfaya yönlendirir. Hata mesajı döndürür (null = ok). */
export async function demoLogin(): Promise<string | null> {
  try {
    // 1. Öncelikli olarak doğrudan demo uç noktasını dene
    const demoRes = await fetch('/api/auth/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (demoRes.ok) {
      window.location.href = '/';
      return null;
    }

    // 2. Yedek olarak standart login uç noktası ile dene
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: DEMO_PHONE, password: DEMO_PASSWORD }),
    });
    const data = await res.json().catch(() => ({} as any));
    if (!res.ok) return data.error || 'Demo hesabına girilemedi.';

    window.location.href = '/';
    return null;
  } catch {
    return 'Sunucuya bağlanılamadı. Lütfen internetinizi kontrol edin.';
  }
}
