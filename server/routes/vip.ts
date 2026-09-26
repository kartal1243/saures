import type { Express, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { S } from '../context';
import { calculateCashRegister } from '../cash';

export function registerVipRoutes(app: Express): void {
  // 11. VIP AI Shop Consultant & Live Support (Yapay Zeka Esnaf Danışmanı)
  app.post('/api/vip/ai-consultant', async (req: Request, res: Response) => {
    const { message, topic } = req.body;
    const profile = S().shopProfile;
    const cash = calculateCashRegister();

    // Context for AI
    const shopContext = `
Dükkan Adı: ${profile?.storeName || 'Mahalle Esnafı'}
Faaliyet Alanı / Sektör: ${profile?.businessField || 'Küçük İşletme'}
Dükkan Sahibi: ${profile?.ownerName || 'Esnaf'}
Çalışan Sayısı: ${profile?.employeeCount || '1'} kişi
Şehir / Semt: ${profile?.cityDistrict || 'Türkiye'}
Bugünkü Toplam Gelir: ${cash.todayTotalIncome} TL (Nakit: ${cash.todayCash} TL, Kart: ${cash.todayCard} TL, IBAN: ${cash.todayBank} TL)
Bugünkü Dükkan Harcamaları / Masraf: ${cash.todayExpense} TL
Bugünkü Net Kasa Kârı: ${cash.todayTotalIncome - cash.todayExpense} TL
Günlük Ciro Hedefi: ${profile?.dailyTarget || 2500} TL
`;

    // High quality intelligent fallback if Gemini API key not present
    const getSmartFallback = (t: string, userMsg?: string) => {
      if (t === 'profile') {
        return {
          title: 'Dükkan Profil & Vitrin İyileştirme Tavsiyeleri',
          advice: `Sayın ${profile?.ownerName || 'Esnaf'}, ${profile?.storeName || 'Dükkanınız'} için mahallede müşteri çekim gücünü artıracak 3 öncelikli adım:
1. **Google Haritalar & Tabela:** Dükkan tabelanızda ve Google Haritalar profilinizde "${profile?.businessField}" anahtar kelimesini ve çalışma saatlerinizi güncelleyin. Fotoğraflı profiller %45 daha çok müşteri çeker.
2. **Kasa Önü Hızlı Ürün Alanı:** Kasa yanına sakız, atıştırmalık, kolonya gibi anlık satın alınan 10-50 TL'lik sepet genişletici ürünler yerleştirin.
3. **Müşteri Hitap Sloganı:** Vitrininize "${profile?.slogan || 'Güler yüzlü hizmet, bereketli alışveriş'}" afişi asarak samimiyeti ön plana çıkarın.`,
          suggestions: [
            'Google Haritalar açıklamasını optimize et',
            'Fiyat etiketlerini ve vitrini yenile',
            'Kasa önü sepet kampanyası yap',
          ],
        };
      }
      if (t === 'expenses') {
        return {
          title: 'Giderleri Azaltma & Toptancı Tasarrufu',
          advice: `Mevcut finansal durumunuza göre bugün ${cash.todayExpense} TL dükkan masrafınız oldu. Kârlılığı artırmak için:
1. **Toptancı ile Peşin İndirimi:** Toptancı alımlarında nakit veya 3 gün içinde ödeme taahhüdüyle %4 ila %8 iskonto talep edin.
2. **POS Komisyon Yönetimi:** Kartlı satış oranınız (${cash.todayCard} TL) arttıkça bankanızla görüşüp bloke süresini ertesi güne çekerek komisyonu %1.99 altına düşürün ya da FAST/IBAN karekodunu öne çıkarın.
3. **Fatura & Sarf Malzeme Kontrolü:** Dükkan aydınlatmalarını LED'e çevirin, poşet ve ambalajı toptan kilo ile alın.`,
          suggestions: [
            'POS komisyonunu bankayla pazarlık et',
            'Toptancı peşin iskontosu iste',
            'Karekod / IBAN ile komisyonsuz tahsilat yap',
          ],
        };
      }

      // Default or custom question
      return {
        title: 'VIP Esnaf Danışmanı Yanıtı',
        advice: userMsg
          ? `Sayın ${profile?.ownerName || 'Esnaf'}, sorunuz için esnaf tecrübemizle önerimiz: Küçük işletmelerde en önemli kural günlük nakit akışını sıkı tutmak ve gereksiz masrafı önlemektir. Bugünkü ${cash.todayTotalIncome} TL cironuz hedefinize (${profile?.dailyTarget} TL) oranla aktif bir gün geçirdiğinizi gösteriyor. Müşterilerinize güler yüzle yaklaşın ve ödemeleri günü gününe kasaya işleyin.`
          : `Sayın ${profile?.ownerName || 'Esnaf'}, ${profile?.storeName || 'Dükkanınız'} bugün ${cash.todayTotalIncome} TL ciro yaptı. Net kasa kârınız ${cash.todayTotalIncome - cash.todayExpense} TL seviyesinde. Dükkanınızın sektörüne (${profile?.businessField}) özel VIP optimizasyonlar aktif.`,
        suggestions: [
          'Günlük ciro hedefimi nasıl artırırım?',
          'Toptancıya borçlanmadan nasıl mal çekerim?',
          'Sadık mahalle müşterisi nasıl kazanılır?',
        ],
      };
    };

    if (!process.env.GEMINI_API_KEY) {
      const fallback = getSmartFallback(topic || 'chat', message);
      return res.json({ success: true, ...fallback, source: 'smart_advisor' });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemPrompt = `Sen Türkiye'de 30 yıllık tecrübeye sahip, modern dijital araçları iyi bilen, çok samimi, babacan, esnaf dostu bir "VIP Esnaf Danışmanı"sın.
Dükkan Bilgileri:
${shopContext}

Kullanıcı Konusu / Talebi:
Konu: ${topic || 'Genel Danışmanlık'}
Esnafın Sorusu / Notu: ${message || 'Dükkanımı büyütmek ve profili iyileştirmek için öneriler ver.'}

Kurallar:
1. Türkçe olarak, esnafın dilinden konuş; samimi, motive edici, pratik ve hemen uygulanabilir 3-4 somut tavsiye ver.
2. Dükkan adı (${profile?.storeName}) ve sektörüne (${profile?.businessField}) doğrudan atıf yap.
3. Gereksiz akademik laflar etme; toptancı, kasa, ciro, müşteri iletişimi, vitrin gibi gerçek hayata dokunan şeyler söyle.
4. Çıktını temiz ve maddeli hazırla.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: systemPrompt,
      });

      const adviceText = response.text ? response.text.trim() : getSmartFallback(topic || 'chat', message).advice;

      res.json({
        success: true,
        title: topic === 'profile' ? 'Profil & Vitrin Tavsiyeleri' : topic === 'expenses' ? 'Gider & Tasarruf Planı' : 'VIP Danışman Yanıtı',
        advice: adviceText,
        suggestions: [
          'Dükkan vitrin ve tabelasını nasıl yenilerim?',
          'Giderleri %15 kısmak için ne yapayım?',
          'Müşteriyi veresiyeden nakite nasıl alıştırırım?',
        ],
        source: 'gemini-2.5-flash',
      });
    } catch (err) {
      console.error('VIP AI Consultant error:', err);
      const fallback = getSmartFallback(topic || 'chat', message);
      res.json({ success: true, ...fallback, source: 'smart_fallback' });
    }
  });
}
