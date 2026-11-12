import type { Express, Request, Response } from 'express';
import crypto from 'crypto';
import type {
  CommunityPost,
  CommunityComment,
  CommunityReply,
  CommunityCategory,
  DirectMessage,
  CommunityShopDirectory,
} from '../../shared/types';
import { als } from '../context';
import { findAccountById, getAccounts } from '../accounts';
import { loadShopState } from '../shopState';
import { COMMUNITY_POSTS_FILE, COMMUNITY_MESSAGES_FILE } from '../config';
import { readJsonFile, writeJsonFile } from '../fsdb';
import { createRateLimiter } from '../guards';
import { isAdminSession } from './admin';
import {
  broadcastToAll,
  broadcastToAccount,
  recordLiveActivity,
  getConnectedAccounts,
} from '../realtime';

// ============================================================================
// 1. GÜVENLİK FİLTRESİ: Küfür, Hakaret, Phishing & Sahte Link Doğrulaması
// ============================================================================

// Yasaklı kaba sözcükler ve hakaret kalıpları (Türkçe argo / taciz filtresi)
const PROFANITY_PATTERNS = [
  /\b(amk|aq|orospu|pic|piç|siktir|sik|yarrak|yarrk|pezevenk|got|göt|ibne|kahpe|kancik|kançık|amcık|amcik|taşak|tasak|puşt|pust)\b/i,
  /\b(ananı|anani|bacını|bacini|ebeni)\b/i,
  /\b(salak|aptal|gerizekalı|gerizekali|ahmak|haysiyetsiz|şerefsiz|serefsiz)\b/i,
];

// Oltalama (Phishing), Sahte Link ve Kötü Amaçlı Kısa URL Servisleri
const SUSPICIOUS_DOMAINS = [
  /bit\.ly/i,
  /tinyurl\.com/i,
  /t\.co/i,
  /is\.gd/i,
  /cutt\.ly/i,
  /ow\.ly/i,
  /grabify\.link/i,
  /iplogger\./i,
  /\.xyz\b/i,
  /\.top\b/i,
  /\.ru\b/i,
  /\.cn\b/i,
  /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i, // IP adresli URL'ler
];

// Oltalama & Dolandırıcılık Cümle Kalıpları
const PHISHING_KEYWORDS = [
  /hesabınız\s+kilitlendi/i,
  /şifrenizi\s+girin/i,
  /sifrenizi\s+girin/i,
  /tıkla\s+kazan/i,
  /tikla\s+kazan/i,
  /hediye\s+çeki\s+kazandınız/i,
  /kredi\s+kartı\s+bilgileri/i,
  /kart\s+numaranızı/i,
  /giriş\s+yapmak\s+için\s+tıklayın/i,
  /ücretsiz\s+para\s+dağıtımı/i,
];

// XSS & Zararlı HTML Enjeksiyon Kalıpları
const DANGEROUS_HTML_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  /<iframe\b/gi,
  /<object\b/gi,
  /<embed\b/gi,
];

export function validateCommunityContent(rawContent: string): { valid: boolean; error?: string; cleanContent?: string } {
  if (!rawContent || typeof rawContent !== 'string') {
    return { valid: false, error: 'Mesaj içeriği boş olamaz.' };
  }

  const trimmed = rawContent.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: 'Mesaj içeriği en az 2 karakter olmalıdır.' };
  }
  if (trimmed.length > 2000) {
    return { valid: false, error: 'Mesaj içeriği en fazla 2000 karakter olabilir.' };
  }

  // 1. Zararlı Script / HTML Enjeksiyonu Kontrolü
  for (const dangerous of DANGEROUS_HTML_PATTERNS) {
    if (dangerous.test(trimmed)) {
      return { valid: false, error: 'Güvenlik ihlali: Zararlı kod veya script etiketleri tespit edildi.' };
    }
  }

  // 2. Küfür & Hakaret Kontrolü
  for (const regex of PROFANITY_PATTERNS) {
    if (regex.test(trimmed)) {
      return { valid: false, error: 'Topluluk kuralları ihlali: Mesajınızda uygunsuz, kırıcı veya hakaret içeren ifadeler tespit edildi.' };
    }
  }

  // 3. Şüpheli Oltalama / Kısaltılmış URL Kontrolü
  for (const domain of SUSPICIOUS_DOMAINS) {
    if (domain.test(trimmed)) {
      return { valid: false, error: 'Güvenlik uyarısı: Esnaf güvenliği için şüpheli veya kısaltılmış dış bağlantı paylaşımı yasaktır.' };
    }
  }

  // 4. Dolandırıcılık Kalıpları
  for (const kw of PHISHING_KEYWORDS) {
    if (kw.test(trimmed)) {
      return { valid: false, error: 'Güvenlik ihlali: Şüpheli hesap çalma veya dolandırıcılık benzeri metin içeriği tespit edildi.' };
    }
  }

  // Temiz metin (Basit HTML entity kaçışı)
  const cleanContent = trimmed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  return { valid: true, cleanContent };
}

// ============================================================================
// 2. RATE LIMITING: Spam ve DoS Koruması
// ============================================================================
export const communityPostRateLimit = createRateLimiter(60 * 60 * 1000, 10);
export const communityMessageRateLimit = createRateLimiter(60 * 1000, 10);

// ============================================================================
// 3. TOHUM GÖNDERİLERİ (Başlangıç Dayanışma Örnekleri)
// ============================================================================
const SEED_POSTS: CommunityPost[] = [
  {
    id: 'post_seed_1',
    authorAccountId: 'seed_acc_1',
    authorShopName: 'Moda Makas Berber',
    authorOwnerName: 'Ahmet Usta',
    authorCity: 'İstanbul',
    authorDistrict: 'Kadıköy',
    authorSector: 'Berber & Kuaför',
    title: 'Acil 100 TL ve 200 TL bozuk para değişimi lazım',
    content: 'Komşular selam, kasada hiç 10 TL ve 20 TL kalmadı. 2000 TL tüm banknot verip bozuk para alabilecek müsait dükkan var mı? Çaylar benden!',
    category: 'kasa_bozuk',
    urgent: true,
    resolved: false,
    likesCount: 5,
    likedAccountIds: [],
    commentsCount: 2,
    comments: [
      {
        id: 'comm_seed_1',
        postId: 'post_seed_1',
        authorAccountId: 'seed_acc_2',
        authorShopName: 'Kadıköy Çınar Büfe',
        authorOwnerName: 'Mustafa Bey',
        authorCity: 'İstanbul / Kadıköy',
        authorSector: 'Market & Büfe',
        content: 'Ahmet Ustam gel hemen, bende 1000 TL madeni ve 10-20lik var, halledelim.',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
    replies: [],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'post_seed_2',
    authorAccountId: 'seed_acc_3',
    authorShopName: 'Kordon Kahvecisi',
    authorOwnerName: 'Deniz Baran',
    authorCity: 'İzmir',
    authorDistrict: 'Alsancak',
    authorSector: 'Kafe & Restoran',
    title: 'Hafta sonu için yedek barista & salon yardımcısı arıyoruz',
    content: 'Cuma-Cumartesi akşamı yoğunluk için yarı zamanlı servis ve kahve hazırlığında destek olabilecek arkadaş arıyoruz. Tavsiyeniz varsa çok sevinirim.',
    category: 'personel',
    urgent: false,
    resolved: false,
    likesCount: 3,
    likedAccountIds: [],
    commentsCount: 0,
    comments: [],
    replies: [],
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    updatedAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: 'post_seed_3',
    authorAccountId: 'seed_acc_4',
    authorShopName: 'Çankaya Hızlı Bilişim & Teknik',
    authorOwnerName: 'Serkan Bey',
    authorCity: 'Ankara',
    authorDistrict: 'Çankaya',
    authorSector: 'Teknik Servis',
    title: 'Kaliteli termal macun ve lehim teli toptancı önerisi',
    content: 'Esnaf dostlar merhaba, son sevkiyatta gelen lehim tellerinin kalitesi çok düşüktü. Güvenilir ve uygun fiyatlı toptancı çalışan esnaf tavsiyelerinizi bekliyorum.',
    category: 'toptanci',
    urgent: false,
    resolved: false,
    likesCount: 4,
    likedAccountIds: [],
    commentsCount: 1,
    comments: [
      {
        id: 'comm_seed_2',
        postId: 'post_seed_3',
        authorAccountId: 'seed_acc_5',
        authorShopName: 'Kızılay Elektronik',
        authorOwnerName: 'Erol Demir',
        authorCity: 'Ankara / Kızılay',
        authorSector: 'Teknik Servis',
        content: 'Serkan Bey, Ulus Konya Sokak ta Yıldız Elektronik Mehmet Abi var, dükkanım yanımda selamıyla gidin en iyi partiyi verir.',
        createdAt: new Date(Date.now() - 5400000).toISOString(),
      },
    ],
    replies: [],
    createdAt: new Date(Date.now() - 28800000).toISOString(),
    updatedAt: new Date(Date.now() - 5400000).toISOString(),
  },
];

// ============================================================================
// 4. VERİ DEPOSU (In-Memory + JSON Dosyası)
// ============================================================================
let postsCache: CommunityPost[] = readJsonFile<CommunityPost[]>(COMMUNITY_POSTS_FILE, []);
if (postsCache.length === 0) {
  postsCache = SEED_POSTS;
  writeJsonFile(COMMUNITY_POSTS_FILE, postsCache);
}

let messagesCache: DirectMessage[] = readJsonFile<DirectMessage[]>(COMMUNITY_MESSAGES_FILE, []);

function persistPosts(): void {
  writeJsonFile(COMMUNITY_POSTS_FILE, postsCache);
}

function persistMessages(): void {
  writeJsonFile(COMMUNITY_MESSAGES_FILE, messagesCache);
}

// ============================================================================
// 5. COMMUNITY ROUTES (Yalnızca apiGuard ile korunan oturumlu esnaflar)
// ============================================================================
export function registerCommunityRoutes(app: Express): void {
  // 1. Gönderileri Listeleme (Filtreleme, İl-İlçe & Arama)
  app.get('/api/community/posts', (req: Request, res: Response) => {
    const ctx = als.getStore();
    if (!ctx) return res.status(401).json({ error: 'Oturum gerekli.' });

    const category = req.query.category as string;
    const city = req.query.city as string;
    const district = req.query.district as string;
    const search = req.query.search as string;
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    let filtered = postsCache;

    if (category && category !== 'tum' && category !== 'all') {
      filtered = filtered.filter((p) => p.category === category);
    }

    if (city && city !== 'tum' && city !== 'all') {
      filtered = filtered.filter((p) => (p.authorCity || '').toLowerCase().includes(city.toLowerCase()));
    }

    if (district && district !== 'tum' && district !== 'all') {
      filtered = filtered.filter((p) => (p.authorDistrict || '').toLowerCase().includes(district.toLowerCase()));
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          (p.title && p.title.toLowerCase().includes(q)) ||
          p.content.toLowerCase().includes(q) ||
          p.authorShopName.toLowerCase().includes(q) ||
          (p.authorCity && p.authorCity.toLowerCase().includes(q)) ||
          (p.authorDistrict && p.authorDistrict.toLowerCase().includes(q))
      );
    }

    const posts = filtered.slice(0, limit);
    res.json({
      success: true,
      total: filtered.length,
      posts,
      currentAccountId: ctx.accountId,
    });
  });

  // 2. Yeni Gönderi Oluşturma (Saatte max 10 gönderi + Katı Tenant İzolasyonu + WS Broadcast)
  app.post('/api/community/posts', communityPostRateLimit, (req: Request, res: Response) => {
    const ctx = als.getStore();
    if (!ctx) return res.status(401).json({ error: 'Oturum gerekli.' });

    const acc = findAccountById(ctx.accountId);
    if (!acc) return res.status(401).json({ error: 'Esnaf hesabı bulunamadı.' });

    const { content, title, category, urgent } = req.body || {};

    const validation = validateCommunityContent(content);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Title doğrulaması
    let cleanTitle = 'Esnaf Dayanışma Çağrısı';
    if (title && typeof title === 'string' && title.trim()) {
      const titleValidation = validateCommunityContent(title);
      if (!titleValidation.valid) {
        return res.status(400).json({ error: 'Başlık: ' + titleValidation.error });
      }
      cleanTitle = (titleValidation.cleanContent || title).slice(0, 120);
    }

    const validCategories: CommunityCategory[] = [
      'malzeme',
      'kasa_bozuk',
      'personel',
      'toptanci',
      'genel',
      'yardimlasma',
      'duyuru',
      'tavsiye',
    ];
    const chosenCategory: CommunityCategory = validCategories.includes(category) ? category : 'genel';

    const shopProfile = ctx.state?.shopProfile;
    const cityDistrict = (shopProfile?.cityDistrict || '').trim();
    const cityParts = cityDistrict.split(/[\/\-,]/).map((p) => p.trim());
    const authorCity = cityParts[0] || '';
    const authorDistrict = cityParts[1] || '';

    const newPost: CommunityPost = {
      id: `post_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      authorAccountId: ctx.accountId,
      authorShopName: shopProfile?.storeName || acc.shopName || 'Esnaf',
      authorOwnerName: shopProfile?.ownerName || acc.ownerName || 'Esnaf',
      authorCity,
      authorDistrict,
      authorSector: shopProfile?.businessField || 'Esnaf',
      title: cleanTitle,
      content: validation.cleanContent!,
      category: chosenCategory,
      urgent: Boolean(urgent),
      resolved: false,
      likesCount: 0,
      likedAccountIds: [],
      commentsCount: 0,
      comments: [],
      replies: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    postsCache.unshift(newPost);
    if (postsCache.length > 500) {
      postsCache = postsCache.slice(0, 500);
    }
    persistPosts();

    // WebSocket ile tüm bağlı esnaflara anında yeni gönderi bildir
    broadcastToAll({ type: 'COMMUNITY_NEW_POST', payload: newPost });

    recordLiveActivity({
      accountId: ctx.accountId,
      shopName: newPost.authorShopName,
      type: 'system',
      title: 'Yeni Esnaf Paylaşımı',
      description: `${newPost.authorShopName}: ${newPost.title}`,
    });

    res.json({ success: true, post: newPost });
  });

  // Ortak Yorum/Yanıt Ekleme Mantığı
  const handleAddCommentOrReply = (req: Request, res: Response) => {
    const ctx = als.getStore();
    if (!ctx) return res.status(401).json({ error: 'Oturum gerekli.' });

    const acc = findAccountById(ctx.accountId);
    if (!acc) return res.status(401).json({ error: 'Esnaf hesabı bulunamadı.' });

    const post = postsCache.find((p) => p.id === req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Gönderi bulunamadı.' });
    }

    const { content } = req.body || {};
    const validation = validateCommunityContent(content);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const shopProfile = ctx.state?.shopProfile;

    const newComment: CommunityComment = {
      id: `comm_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      postId: post.id,
      authorAccountId: ctx.accountId,
      authorShopName: shopProfile?.storeName || acc.shopName || 'Esnaf',
      authorOwnerName: shopProfile?.ownerName || acc.ownerName || 'Esnaf',
      authorCity: shopProfile?.cityDistrict || '',
      authorSector: shopProfile?.businessField || 'Esnaf',
      content: validation.cleanContent!,
      createdAt: new Date().toISOString(),
    };

    if (!Array.isArray(post.comments)) post.comments = [];
    if (!Array.isArray(post.replies)) post.replies = [];

    post.comments.push(newComment);
    post.replies.push(newComment as CommunityReply);
    post.commentsCount = post.comments.length;
    post.updatedAt = new Date().toISOString();

    persistPosts();

    // Tüm bağlı istemcilere post güncellemesi yayını
    broadcastToAll({ type: 'COMMUNITY_POST_UPDATED', payload: post });

    res.json({ success: true, reply: newComment, comment: newComment, post });
  };

  // 3a. Yorum Ekleme (`/api/community/posts/:id/comments`)
  app.post('/api/community/posts/:id/comments', communityMessageRateLimit, handleAddCommentOrReply);

  // 3b. Yanıt Ekleme (`/api/community/posts/:id/reply`)
  app.post('/api/community/posts/:id/reply', communityMessageRateLimit, handleAddCommentOrReply);

  // 4. Beğeni (Like / Unlike Toggle)
  app.post('/api/community/posts/:id/like', (req: Request, res: Response) => {
    const ctx = als.getStore();
    if (!ctx) return res.status(401).json({ error: 'Oturum gerekli.' });

    const post = postsCache.find((p) => p.id === req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Gönderi bulunamadı.' });
    }

    if (!Array.isArray(post.likedAccountIds)) post.likedAccountIds = [];

    const alreadyLikedIndex = post.likedAccountIds.indexOf(ctx.accountId);
    let isLiked = false;

    if (alreadyLikedIndex >= 0) {
      post.likedAccountIds.splice(alreadyLikedIndex, 1);
      isLiked = false;
    } else {
      post.likedAccountIds.push(ctx.accountId);
      isLiked = true;
    }

    post.likesCount = post.likedAccountIds.length;
    persistPosts();

    broadcastToAll({ type: 'COMMUNITY_POST_UPDATED', payload: post });

    res.json({ success: true, likesCount: post.likesCount, isLiked });
  });

  // 5. Gönderi Silme (Yalnızca yazar esnaf veya Super Admin silebilir)
  app.delete('/api/community/posts/:id', (req: Request, res: Response) => {
    const ctx = als.getStore();
    if (!ctx) return res.status(401).json({ error: 'Oturum gerekli.' });

    const postIndex = postsCache.findIndex((p) => p.id === req.params.id);
    if (postIndex === -1) {
      return res.status(404).json({ error: 'Gönderi bulunamadı.' });
    }

    const post = postsCache[postIndex];
    const isOwner = post.authorAccountId === ctx.accountId;
    const isAdmin = isAdminSession(req);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Bu gönderiyi silme yetkiniz yok. Yalnızca gönderi sahibi veya yönetici silebilir.' });
    }

    postsCache.splice(postIndex, 1);
    persistPosts();

    broadcastToAll({ type: 'COMMUNITY_POST_DELETED', payload: { id: req.params.id } });

    res.json({ success: true, deletedPostId: req.params.id });
  });

  // 6. Yorum Silme
  app.delete('/api/community/posts/:postId/comments/:commentId', (req: Request, res: Response) => {
    const ctx = als.getStore();
    if (!ctx) return res.status(401).json({ error: 'Oturum gerekli.' });

    const post = postsCache.find((p) => p.id === req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Gönderi bulunamadı.' });
    }

    const comments = post.comments || [];
    const commIndex = comments.findIndex((c) => c.id === req.params.commentId);
    if (commIndex === -1) {
      return res.status(404).json({ error: 'Yorum bulunamadı.' });
    }

    const comm = comments[commIndex];
    const isAuthor = comm.authorAccountId === ctx.accountId;
    const isPostOwner = post.authorAccountId === ctx.accountId;
    const isAdmin = isAdminSession(req);

    if (!isAuthor && !isPostOwner && !isAdmin) {
      return res.status(403).json({ error: 'Bu yorumu silme yetkiniz yok.' });
    }

    comments.splice(commIndex, 1);
    post.comments = comments;
    post.replies = comments as CommunityReply[];
    post.commentsCount = comments.length;
    persistPosts();

    broadcastToAll({ type: 'COMMUNITY_POST_UPDATED', payload: post });

    res.json({ success: true, deletedCommentId: req.params.commentId, post });
  });

  // ==========================================================================
  // BİREBİR MESAJLAŞMA (DIRECT MESSAGES) & ESNAF REHBERİ
  // ==========================================================================

  // 7. Aktif Esnafın Birebir Sohbetlerini Getir
  app.get('/api/community/messages', (req: Request, res: Response) => {
    const ctx = als.getStore();
    if (!ctx) return res.status(401).json({ error: 'Oturum gerekli.' });

    const withAccountId = req.query.withAccountId as string;
    let userMessages = messagesCache.filter(
      (m) => m.fromAccountId === ctx.accountId || m.toAccountId === ctx.accountId
    );

    if (withAccountId) {
      userMessages = userMessages.filter(
        (m) =>
          (m.fromAccountId === ctx.accountId && m.toAccountId === withAccountId) ||
          (m.toAccountId === ctx.accountId && m.fromAccountId === withAccountId)
      );
    }

    res.json({ success: true, messages: userMessages });
  });

  // 8. Başka Bir Dükkana Güvenli Mesaj Gönder
  app.post('/api/community/messages', communityMessageRateLimit, (req: Request, res: Response) => {
    const ctx = als.getStore();
    if (!ctx) return res.status(401).json({ error: 'Oturum gerekli.' });

    const senderAcc = findAccountById(ctx.accountId);
    if (!senderAcc) return res.status(401).json({ error: 'Esnaf hesabı bulunamadı.' });

    const { toAccountId, text } = req.body || {};
    if (!toAccountId || typeof toAccountId !== 'string') {
      return res.status(400).json({ error: 'Alıcı dükkan seçilmelidir.' });
    }

    if (toAccountId === ctx.accountId) {
      return res.status(400).json({ error: 'Kendi dükkanınıza mesaj gönderemezsiniz.' });
    }

    const recipientAcc = findAccountById(toAccountId);
    if (!recipientAcc) {
      return res.status(404).json({ error: 'Alıcı dükkan bulunamadı.' });
    }

    const validation = validateCommunityContent(text);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const senderShopProfile = ctx.state?.shopProfile;
    const recipientShopState = loadShopState(toAccountId);
    const recipientShopName =
      recipientShopState.shopProfile?.storeName || recipientAcc.shopName || 'Esnaf';

    const newMsg: DirectMessage = {
      id: `dm_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      fromAccountId: ctx.accountId,
      fromShopName: senderShopProfile?.storeName || senderAcc.shopName || 'Esnaf',
      toAccountId,
      toShopName: recipientShopName,
      text: validation.cleanContent!,
      createdAt: new Date().toISOString(),
      read: false,
    };

    messagesCache.push(newMsg);
    if (messagesCache.length > 2000) {
      messagesCache = messagesCache.slice(-2000);
    }
    persistMessages();

    // Alıcıya ve gönderene WebSocket üzerinden ilet
    broadcastToAccount(toAccountId, { type: 'COMMUNITY_NEW_MESSAGE', payload: newMsg });
    broadcastToAccount(ctx.accountId, { type: 'COMMUNITY_NEW_MESSAGE', payload: newMsg });

    res.json({ success: true, message: newMsg });
  });

  // 9. Esnaf Rehberi (Sistemdeki Diğer Onaylı Dükkanlar)
  app.get('/api/community/shops', (req: Request, res: Response) => {
    const ctx = als.getStore();
    if (!ctx) return res.status(401).json({ error: 'Oturum gerekli.' });

    const accounts = getAccounts();
    const connectedAccounts = getConnectedAccounts();
    const connectedMap = new Set(connectedAccounts.map((c) => c.accountId));

    const shops: CommunityShopDirectory[] = [];

    for (const acc of accounts) {
      if ((acc.role || 'owner') !== 'owner') continue;
      if (acc.id === ctx.accountId) continue; // Kendini hariç tut

      const st = loadShopState(acc.id);
      const prof = st.shopProfile;
      const shopName = prof?.storeName || acc.shopName;
      if (!shopName || shopName.trim().length < 2) continue;

      const cityDistrict = (prof?.cityDistrict || '').trim();
      const parts = cityDistrict.split(/[\/\-,]/).map((p) => p.trim());
      const city = parts[0] || '';
      const district = parts[1] || '';

      shops.push({
        id: acc.id,
        shopName: shopName.trim(),
        ownerName: prof?.ownerName || acc.ownerName,
        sectorKey: prof?.sectorKey || 'genel_esnaf',
        city,
        district,
        isOnline: connectedMap.has(acc.id),
        lastActive: connectedMap.has(acc.id) ? new Date().toISOString() : undefined,
      });
    }

    res.json({ success: true, shops });
  });
}
