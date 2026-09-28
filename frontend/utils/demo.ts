// Demo hesapla tek tıkla giriş. Demo dükkanlar sunucuda tohumludur
// (scripts/seed-demo.py): Makas Berber 05900000011 / Demo1234!
export const DEMO_PHONE = '05900000011';
export const DEMO_PASSWORD = 'Demo1234!';

/** Demo giriş yapar, başarılıysa sayfayı yeniler. Hata mesajı döndürür (null = ok). */
export async function demoLogin(): Promise<string | null> {
  try {
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
    return 'Bağlantı hatası oluştu.';
  }
}
