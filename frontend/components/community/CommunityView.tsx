import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Users,
  MessageSquare,
  Handshake,
  Send,
  Plus,
  Search,
  Heart,
  MessageCircle,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Trash2,
  X,
  Sparkles,
  Store,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Coins,
  Wrench,
  UserCheck,
  Truck,
  Megaphone,
} from 'lucide-react';
import type {
  CommunityPost,
  CommunityReply,
  CommunityCategory,
  DirectMessage,
  CommunityShopDirectory,
  ShopProfile,
} from '../../../shared/types';

interface CommunityViewProps {
  currentShopProfile?: ShopProfile;
}

const CATEGORIES: { key: CommunityCategory | 'tum'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'tum', label: 'Tüm Çağrılar', icon: Handshake },
  { key: 'kasa_bozuk', label: 'Bozuk Para / Kasa', icon: Coins },
  { key: 'malzeme', label: 'Malzeme & Alet', icon: Wrench },
  { key: 'personel', label: 'Personel & Yardımcı', icon: UserCheck },
  { key: 'toptanci', label: 'Toptancı Tavsiyesi', icon: Truck },
  { key: 'yardimlasma', label: 'Genel Yardımlaşma', icon: Handshake },
  { key: 'duyuru', label: 'Duyurular', icon: Megaphone },
];

function formatTimeAgo(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Az önce';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} dk önce`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} saat önce`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} gün önce`;
    return new Date(isoString).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  } catch {
    return 'Az önce';
  }
}

export const CommunityView: React.FC<CommunityViewProps> = ({ currentShopProfile }) => {
  const [activeTab, setActiveTab] = useState<'wall' | 'chat'>('wall');

  // Posts State
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<CommunityCategory | 'tum'>('tum');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [currentAccountId, setCurrentAccountId] = useState<string>('');

  // Modal State
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState<boolean>(false);
  const [newPostTitle, setNewPostTitle] = useState<string>('');
  const [newPostContent, setNewPostContent] = useState<string>('');
  const [newPostCategory, setNewPostCategory] = useState<CommunityCategory>('kasa_bozuk');
  const [newPostUrgent, setNewPostUrgent] = useState<boolean>(false);
  const [submittingPost, setSubmittingPost] = useState<boolean>(false);
  const [postError, setPostError] = useState<string>('');

  // Direct Messages & Directory State
  const [shops, setShops] = useState<CommunityShopDirectory[]>([]);
  const [selectedShop, setSelectedShop] = useState<CommunityShopDirectory | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [shopSearchQuery, setShopSearchQuery] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Gönderileri Yükle
  const fetchPosts = () => {
    setLoadingPosts(true);
    fetch('/api/community/posts')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.posts)) {
          setPosts(data.posts);
          if (data.currentAccountId) {
            setCurrentAccountId(data.currentAccountId);
          }
        }
        setLoadingPosts(false);
      })
      .catch((err) => {
        console.error('Gönderiler alınırken hata:', err);
        setLoadingPosts(false);
      });
  };

  // 2. Dükkan Rehberini Yükle
  const fetchShops = () => {
    fetch('/api/community/shops')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.shops)) {
          setShops(data.shops);
        }
      })
      .catch((err) => console.error('Esnaf rehberi hatası:', err));
  };

  // 3. Mesajları Yükle
  const fetchMessages = (withAccountId?: string) => {
    const url = withAccountId
      ? `/api/community/messages?withAccountId=${encodeURIComponent(withAccountId)}`
      : '/api/community/messages';
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      })
      .catch((err) => console.error('Mesajlar alınamadı:', err));
  };

  useEffect(() => {
    fetchPosts();
    fetchShops();
  }, []);

  useEffect(() => {
    if (activeTab === 'chat') {
      fetchMessages(selectedShop ? selectedShop.id : undefined);
    }
  }, [activeTab, selectedShop]);

  // Otomatik aşağı kaydırma
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // WebSocket Canlı Dinleyici
  useEffect(() => {
    const handleWsEvent = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      const ev = customEvent.detail;
      if (!ev || !ev.type) return;

      if (ev.type === 'COMMUNITY_NEW_POST') {
        const newPost: CommunityPost = ev.payload;
        setPosts((prev) => {
          if (prev.some((p) => p.id === newPost.id)) return prev;
          return [newPost, ...prev];
        });
      } else if (ev.type === 'COMMUNITY_POST_UPDATED') {
        const updatedPost: CommunityPost = ev.payload;
        setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
      } else if (ev.type === 'COMMUNITY_POST_DELETED') {
        const { id } = ev.payload;
        setPosts((prev) => prev.filter((p) => p.id !== id));
      } else if (ev.type === 'COMMUNITY_NEW_MESSAGE') {
        const newMsg: DirectMessage = ev.payload;
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    };

    window.addEventListener('community_ws_event', handleWsEvent);
    return () => {
      window.removeEventListener('community_ws_event', handleWsEvent);
    };
  }, []);

  // Yeni Gönderi Oluştur
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) {
      setPostError('Lütfen mesaj içeriğini yazın.');
      return;
    }

    setSubmittingPost(true);
    setPostError('');

    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newPostTitle.trim() || 'Dayanışma Çağrısı',
          content: newPostContent.trim(),
          category: newPostCategory,
          urgent: newPostUrgent,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gönderi oluşturulamadı.');
      }

      setPosts((prev) => [data.post, ...prev]);
      setIsNewPostModalOpen(false);
      setNewPostTitle('');
      setNewPostContent('');
      setNewPostUrgent(false);
    } catch (err: any) {
      setPostError(err.message || 'Gönderi paylaşılırken bir hata oluştu.');
    } finally {
      setSubmittingPost(false);
    }
  };

  // Beğeni Yap / Kaldır
  const handleLikePost = async (postId: string) => {
    try {
      const res = await fetch(`/api/community/posts/${postId}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, likesCount: data.likesCount } : p))
        );
      }
    } catch (err) {
      console.error('Beğeni hatası:', err);
    }
  };

  // Yanıt Gönder
  const handleSendReply = async (postId: string) => {
    const replyText = replyInputs[postId]?.trim();
    if (!replyText) return;

    try {
      const res = await fetch(`/api/community/posts/${postId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText }),
      });

      if (res.ok) {
        const data = await res.json();
        setPosts((prev) => prev.map((p) => (p.id === postId ? data.post : p)));
        setReplyInputs((prev) => ({ ...prev, [postId]: '' }));
      }
    } catch (err) {
      console.error('Yanıt gönderme hatası:', err);
    }
  };

  // Gönderi Sil
  const handleDeletePost = async (postId: string) => {
    if (!confirm('Bu dayanışma çağrısını silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/community/posts/${postId}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    } catch (err) {
      console.error('Silme hatası:', err);
    }
  };

  // Birebir Mesaj Gönder
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShop || !chatInput.trim()) return;

    setSendingMessage(true);
    try {
      const res = await fetch('/api/community/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toAccountId: selectedShop.id,
          text: chatInput.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setChatInput('');
      } else {
        const data = await res.json();
        alert(data.error || 'Mesaj gönderilemedi.');
      }
    } catch (err) {
      console.error('Mesaj gönderme hatası:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  // Gönderiden Dükkana Hızlı Mesaj Başlat
  const handleStartChatWithAuthor = (authorAccountId: string, authorShopName: string) => {
    const existingShop = shops.find((s) => s.id === authorAccountId) || {
      id: authorAccountId,
      shopName: authorShopName,
      sectorKey: 'esnaf',
    };
    setSelectedShop(existingShop);
    setActiveTab('chat');
  };

  // Filtrelenmiş Gönderiler
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (selectedCategory !== 'tum' && post.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = post.title.toLowerCase().includes(q);
        const matchesContent = post.content.toLowerCase().includes(q);
        const matchesAuthor = post.authorShopName.toLowerCase().includes(q);
        const matchesCity = (post.authorCity || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesContent && !matchesAuthor && !matchesCity) {
          return false;
        }
      }
      return true;
    });
  }, [posts, selectedCategory, searchQuery]);

  // Filtrelenmiş Dükkan Rehberi
  const filteredShops = useMemo(() => {
    return shops.filter((s) => {
      if (!shopSearchQuery.trim()) return true;
      const q = shopSearchQuery.toLowerCase();
      return (
        s.shopName.toLowerCase().includes(q) ||
        (s.ownerName && s.ownerName.toLowerCase().includes(q)) ||
        (s.city && s.city.toLowerCase().includes(q)) ||
        (s.district && s.district.toLowerCase().includes(q))
      );
    });
  }, [shops, shopSearchQuery]);

  return (
    <div className="space-y-6">
      {/* Üst Bar: Başlık, Sekmeler ve Yeni Çağrı Butonu */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 text-xs font-black uppercase tracking-wider mb-2">
              <Handshake className="w-3.5 h-3.5" />
              Esnaf Dayanışma &amp; İletişim Ağı
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight">
              Esnaf Meydanı
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
              Mahalledeki esnaf komşularınızla bozuk para takas edin, malzeme ödünç alın, personel bulun veya anlık mesajlaşın.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsNewPostModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs sm:text-sm shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Yeni Dayanışma Çağrısı
            </button>
          </div>
        </div>

        {/* Sekme Butonları (Duvar vs Sohbet) */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-stone-100 dark:border-stone-800">
          <button
            type="button"
            onClick={() => setActiveTab('wall')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              activeTab === 'wall'
                ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Handshake className="w-4 h-4" />
            Dayanışma Duvarı ({posts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Esnaf Sohbeti &amp; Rehber ({shops.length})
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SEKME 1: DAYANIŞMA DUVARI                                              */}
      {/* ===================================================================== */}
      {activeTab === 'wall' && (
        <div className="space-y-4">
          {/* Kategori Hapları & Arama Kutusu */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Kategori Hapları */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Arama */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Çağrılarda ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs font-medium rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Gönderi Akışı */}
          {loadingPosts ? (
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-12 text-center">
              <RefreshCw className="w-6 h-6 mx-auto text-orange-500 animate-spin mb-3" />
              <p className="text-xs font-bold text-stone-500">Dayanışma çağrıları yükleniyor...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-12 text-center">
              <Handshake className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-700 mb-3" />
              <h3 className="text-sm font-black text-stone-700 dark:text-stone-300">
                Henüz bu kategoride bir çağrı bulunmuyor.
              </h3>
              <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                İlk dayanışma çağrısını başlatarak mahalledeki esnaf komşularınızla iletişime geçebilirsiniz.
              </p>
              <button
                type="button"
                onClick={() => setIsNewPostModalOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 text-white font-black text-xs"
              >
                <Plus className="w-4 h-4" /> Çağrı Başlat
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => {
                const isExpanded = Boolean(expandedComments[post.id]);
                const isAuthor = post.authorAccountId === currentAccountId;
                const comments = post.comments || post.replies || [];

                return (
                  <div
                    key={post.id}
                    className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border transition-all ${
                      post.urgent
                        ? 'border-rose-400/80 dark:border-rose-800/60 shadow-xs'
                        : 'border-stone-200 dark:border-stone-800 shadow-xs'
                    }`}
                  >
                    {/* Üst Kart Bilgisi */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 flex items-center justify-center font-black text-sm shrink-0 border border-stone-200 dark:border-stone-700 overflow-hidden">
                          {post.authorLogoUrl ? (
                            <img
                              src={post.authorLogoUrl}
                              alt={post.authorShopName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Store className="w-5 h-5 text-orange-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-black text-stone-900 dark:text-white">
                              {post.authorShopName}
                            </h4>
                            {post.authorCity && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                                <MapPin className="w-2.5 h-2.5 text-orange-500" />
                                {post.authorDistrict ? `${post.authorDistrict}, ` : ''}
                                {post.authorCity}
                              </span>
                            )}
                            {post.authorSector && (
                              <span className="text-[10px] font-bold text-stone-400">
                                • {post.authorSector}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-medium text-stone-400">
                            {formatTimeAgo(post.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {post.urgent && (
                          <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            Acil
                          </span>
                        )}
                        {isAuthor && (
                          <button
                            type="button"
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Gönderiyi Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Gönderi Başlığı ve İçeriği */}
                    <div className="mt-3">
                      <h3 className="text-sm sm:text-base font-black text-stone-900 dark:text-white">
                        {post.title}
                      </h3>
                      <p className="mt-1.5 text-xs sm:text-sm text-stone-700 dark:text-stone-300 whitespace-pre-line leading-relaxed">
                        {post.content}
                      </p>
                    </div>

                    {/* Aksiyon Barı (Beğen, Yanıtla, Birebir Mesaj At) */}
                    <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleLikePost(post.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 text-stone-700 dark:text-stone-300 font-bold transition-colors cursor-pointer"
                        >
                          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
                          <span>{post.likesCount || 0} Teşekkür</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 text-stone-700 dark:text-stone-300 font-bold transition-colors cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-sky-500" />
                          <span>{comments.length} Yanıt</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3 text-stone-400" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-stone-400" />
                          )}
                        </button>
                      </div>

                      {!isAuthor && (
                        <button
                          type="button"
                          onClick={() => handleStartChatWithAuthor(post.authorAccountId, post.authorShopName)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 text-orange-700 dark:text-orange-300 font-black transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5 text-orange-600" />
                          <span>Özelden Yaz</span>
                        </button>
                      )}
                    </div>

                    {/* Yanıtlar Akordeonu */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2.5">
                        {comments.length === 0 ? (
                          <p className="text-xs text-stone-400 py-1">Henüz yanıt yazılmadı.</p>
                        ) : (
                          comments.map((comm) => (
                            <div
                              key={comm.id}
                              className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-700/50 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-md bg-stone-200 dark:bg-stone-700 overflow-hidden flex items-center justify-center shrink-0">
                                    {comm.authorLogoUrl ? (
                                      <img
                                        src={comm.authorLogoUrl}
                                        alt={comm.authorShopName}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Store className="w-3 h-3 text-stone-500 dark:text-stone-300" />
                                    )}
                                  </div>
                                  <span className="font-black text-stone-800 dark:text-stone-200">
                                    {comm.authorShopName}
                                  </span>
                                </div>
                                <span className="text-[10px] text-stone-400">
                                  {formatTimeAgo(comm.createdAt)}
                                </span>
                              </div>
                              <p className="mt-1 text-stone-700 dark:text-stone-300 pl-7">
                                {comm.content}
                              </p>
                            </div>
                          ))
                        )}

                        {/* Yanıt Giriş Kutusu */}
                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="text"
                            placeholder="Yanıtınızı yazın..."
                            value={replyInputs[post.id] || ''}
                            onChange={(e) =>
                              setReplyInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSendReply(post.id);
                              }
                            }}
                            className="flex-1 px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleSendReply(post.id)}
                            className="px-3 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 cursor-pointer"
                          >
                            Yanıtla
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SEKME 2: BİREBİR ESNAF SOHBETİ & REHBER                                 */}
      {/* ===================================================================== */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[600px] items-stretch">
          {/* Sol Kolon: Dükkan Rehberi (4 Kolon) */}
          <div className="md:col-span-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs p-3.5 flex flex-col gap-3 h-full">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Dükkan veya ilçe ara..."
                value={shopSearchQuery}
                onChange={(e) => setShopSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              <span className="text-[10px] font-black uppercase text-stone-400 px-2 block mb-1">
                Kayıtlı Esnaflar ({filteredShops.length})
              </span>

              {filteredShops.length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-6">Dükkan bulunamadı.</p>
              ) : (
                filteredShops.map((shop) => {
                  const isSelected = selectedShop?.id === shop.id;
                  return (
                    <button
                      key={shop.id}
                      type="button"
                      onClick={() => setSelectedShop(shop)}
                      className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-orange-600 text-white shadow-xs'
                          : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-500 border border-stone-200 dark:border-stone-700'
                          }`}
                        >
                          {shop.logoUrl ? (
                            <img
                              src={shop.logoUrl}
                              alt={shop.shopName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Store className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                shop.isOnline ? 'bg-emerald-400' : 'bg-stone-400'
                              }`}
                              title={shop.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                            />
                            <h4 className="text-xs font-black truncate">{shop.shopName}</h4>
                          </div>
                          <p
                            className={`text-[10px] truncate ${
                              isSelected ? 'text-white/80' : 'text-stone-400'
                            }`}
                          >
                            {shop.district ? `${shop.district}, ` : ''}
                            {shop.city || 'Esnaf'}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase shrink-0 ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                        }`}
                      >
                        {shop.sectorKey.replace(/_/g, ' ')}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Sağ Kolon: Mesaj Akışı & Yazışma Alanı (8 Kolon) */}
          <div className="md:col-span-8 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col h-full overflow-hidden">
            {selectedShop ? (
              <>
                {/* Sohbet Başlığı */}
                <div className="p-3.5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-800/40">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-sm overflow-hidden shrink-0">
                      {selectedShop.logoUrl ? (
                        <img
                          src={selectedShop.logoUrl}
                          alt={selectedShop.shopName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-stone-900 dark:text-white flex items-center gap-1.5">
                        {selectedShop.shopName}
                        <span
                          className={`w-2 h-2 rounded-full ${
                            selectedShop.isOnline ? 'bg-emerald-500' : 'bg-stone-400'
                          }`}
                        />
                      </h3>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400">
                        {selectedShop.isOnline ? 'Canlı Çevrimiçi' : 'Son görülme yakın zamanda'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mesaj Balonları */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-16 text-stone-400">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-orange-500" />
                      <p className="text-xs font-bold text-stone-600 dark:text-stone-300">
                        {selectedShop.shopName} ile henüz bir mesajlaşmanız yok.
                      </p>
                      <p className="text-[11px] text-stone-400 mt-1">
                        Aşağıdaki alandan selam vererek sohbeti başlatabilirsiniz.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.fromAccountId === currentAccountId;
                      const partnerLogo = selectedShop.logoUrl || msg.fromLogoUrl;
                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-2 ${isMe ? 'flex-row-reverse items-end' : 'flex-row items-end'}`}
                        >
                          {!isMe && (
                            <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 overflow-hidden flex items-center justify-center shrink-0 mb-4">
                              {partnerLogo ? (
                                <img
                                  src={partnerLogo}
                                  alt={msg.fromShopName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Store className="w-3.5 h-3.5 text-orange-500" />
                              )}
                            </div>
                          )}
                          <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div
                              className={`max-w-[80vw] sm:max-w-md px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm shadow-xs ${
                                isMe
                                  ? 'bg-orange-600 text-white rounded-br-xs'
                                  : 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white rounded-bl-xs'
                              }`}
                            >
                              <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                            </div>
                            <span className="text-[9px] text-stone-400 mt-1 px-1">
                              {formatTimeAgo(msg.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Mesaj Gönderme Formu */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2 bg-white dark:bg-stone-900"
                >
                  <input
                    type="text"
                    placeholder={`${selectedShop.shopName} dükkanına mesaj yaz...`}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={sendingMessage}
                    className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage || !chatInput.trim()}
                    className="p-2.5 rounded-xl bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-400">
                <Store className="w-12 h-12 mb-3 text-stone-300 dark:text-stone-700" />
                <h3 className="text-sm font-black text-stone-700 dark:text-stone-300">
                  Sohbet Başlatmak İçin Bir Dükkan Seçin
                </h3>
                <p className="text-xs text-stone-500 mt-1 max-w-sm">
                  Soldaki rehberden mahallenizdeki herhangi bir esnafı seçerek anlık olarak özelden yazışabilirsiniz.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* YENİ DAYANIŞMA ÇAĞRISI MODALI                                           */}
      {/* ===================================================================== */}
      {isNewPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/80 text-orange-600 flex items-center justify-center font-black">
                  <Handshake className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-stone-900 dark:text-white">
                  Yeni Dayanışma Çağrısı
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewPostModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {postError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-800">
                {postError}
              </div>
            )}

            <form onSubmit={handleCreatePost} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black text-stone-700 dark:text-stone-300 mb-1">
                  Kategori
                </label>
                <select
                  value={newPostCategory}
                  onChange={(e) => setNewPostCategory(e.target.value as CommunityCategory)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="kasa_bozuk">🪙 Bozuk Para & Kasa Değişimi</option>
                  <option value="malzeme">🔧 Malzeme / Alet Ödünç</option>
                  <option value="personel">👥 Personel / Yardımcı Arayışı</option>
                  <option value="toptanci">📦 Toptancı / Tedarikçi Tavsiyesi</option>
                  <option value="yardimlasma">🤝 Genel Yardımlaşma</option>
                  <option value="duyuru">📢 Mahalle & Esnaf Duyurusu</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-stone-700 dark:text-stone-300 mb-1">
                  Çağrı Başlığı
                </label>
                <input
                  type="text"
                  placeholder="Örn: Acil 100 TL ve 200 TL bozuk para lazım"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-stone-700 dark:text-stone-300 mb-1">
                  Detaylı Açıklama
                </label>
                <textarea
                  rows={4}
                  placeholder="İhtiyacınızı veya çağrınızı net şekilde açıklayın..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="urgentCheck"
                  checked={newPostUrgent}
                  onChange={(e) => setNewPostUrgent(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded border-stone-300 focus:ring-orange-500 cursor-pointer"
                />
                <label
                  htmlFor="urgentCheck"
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 cursor-pointer flex items-center gap-1"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  Acil Çağrı (Kırmızı rozet ve bildirimle öne çıkar)
                </label>
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewPostModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={submittingPost}
                  className="px-5 py-2 text-xs font-black rounded-xl bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 cursor-pointer"
                >
                  {submittingPost ? 'Paylaşılıyor...' : 'Çağrıyı Yayınla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityView;
