import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { AppState, Customer, Transaction, ReminderLog, CashRegister, WSEvent, ShopProfile, DailyClosing, Product, StockMovement } from './src/types';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial realistic seed data for Turkish local businesses (Esnaf & KOBİ)
function getInitialData(): AppState {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  // Helper for rolling past days (0 = today, 1 = yesterday, etc.)
  const getPastDate = (daysAgo: number) => {
    const d = new Date(now.getTime() - daysAgo * 86400000);
    return d.toISOString().split('T')[0];
  };

  // Helper for current week days (Monday = 0 to Sunday = 6)
  const dayOfWeek = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek);
  const getWeekDate = (offset: number) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + offset);
    return d.toISOString().split('T')[0];
  };

  const customers: Customer[] = [
    {
      id: 'cust_1',
      name: 'Ahmet Yılmaz (Marangoz Ahmet Usta)',
      phone: '05321112233',
      businessCategory: 'bakkal_market',
      balance: 1450,
      notes: 'Haftalık ekmek, peynir ve çay alışverişi. Ay başında kapatır.',
      createdAt: twoDaysAgo,
      updatedAt: yesterday,
      lastPaymentDate: twoDaysAgo,
    },
    {
      id: 'cust_2',
      name: 'Merve Demir',
      phone: '05442223344',
      businessCategory: 'spor_salonu',
      balance: 950,
      notes: 'Haftada 3 gün pilates ve fitness paketi.',
      subscriptionPlan: {
        enabled: true,
        interval: 'aylik',
        amount: 950,
        nextDueDate: today, // Due today!
        title: 'Aylık Fitness & Pilates Üyeliği',
      },
      createdAt: twoDaysAgo,
      updatedAt: today,
    },
    {
      id: 'cust_3',
      name: 'Mehmet Ali Kaya (Veli)',
      phone: '05553334455',
      businessCategory: 'ozel_ders',
      balance: 1800,
      notes: 'Oğlu Kerem için haftada 2 saat LGS Matematik.',
      subscriptionPlan: {
        enabled: true,
        interval: 'aylik',
        amount: 1800,
        nextDueDate: yesterday, // Gecikmiş ödeme!
        title: 'LGS Matematik 8 Saatlik Paket',
      },
      createdAt: twoDaysAgo,
      updatedAt: yesterday,
    },
    {
      id: 'cust_4',
      name: 'Canan Öztürk (Klima Servisi)',
      phone: '05054445566',
      businessCategory: 'teknik_servis',
      balance: 650,
      notes: 'Daikin inverter klima gaz dolumu ve filtre temizliği yapıldı.',
      subscriptionPlan: {
        enabled: true,
        interval: 'periyodik_bakim',
        amount: 650,
        nextDueDate: nextWeek,
        title: '6 Aylık Klima Periyodik Bakımı',
      },
      createdAt: twoDaysAgo,
      updatedAt: yesterday,
    },
    {
      id: 'cust_5',
      name: 'Hasan Bey (Apartman Yöneticisi)',
      phone: '05337778899',
      businessCategory: 'bakkal_market',
      balance: 2800,
      notes: 'Apartman temizlik malzemeleri ve görevli erzağı veresiyesi.',
      createdAt: twoDaysAgo,
      updatedAt: today,
    },
    {
      id: 'cust_6',
      name: 'Dr. Selim Arslan',
      phone: '05389990011',
      businessCategory: 'spor_salonu',
      balance: 0,
      notes: 'Yıllık peşin ödemeli gold üye. Ödemesi güncel.',
      subscriptionPlan: {
        enabled: true,
        interval: 'yillik',
        amount: 8500,
        nextDueDate: '2026-11-15',
        title: 'Yıllık VIP Üyelik',
      },
      createdAt: twoDaysAgo,
      updatedAt: today,
      lastPaymentDate: today,
    }
  ];

  const transactions: Transaction[] = [
    // Past 6 days transactions to guarantee full 7-day revenue vs expense comparison
    {
      id: 'tx_p6_1',
      customerId: 'cust_2',
      customerName: 'Merve Demir',
      type: 'tahsilat' as const,
      amount: 1250,
      paymentMethod: 'kart' as const,
      description: 'Pilates paketi ödemesi (Kredi Kartı Pos)',
      date: `${getPastDate(6)} 11:20`,
      createdAt: `${getPastDate(6)}T11:20:00.000Z`,
    },
    {
      id: 'tx_p6_2',
      customerId: '',
      customerName: 'Dükkan Temizlik & Çay Ocağı',
      type: 'gider' as const,
      amount: 320,
      paymentMethod: 'nakit' as const,
      description: 'Dükkan temizlik malzemesi ve çay ocağı',
      date: `${getPastDate(6)} 15:40`,
      createdAt: `${getPastDate(6)}T15:40:00.000Z`,
    },
    {
      id: 'tx_p5_1',
      customerId: 'cust_3',
      customerName: 'Mehmet Ali Kaya (Veli)',
      type: 'tahsilat' as const,
      amount: 1800,
      paymentMethod: 'havale' as const,
      description: 'LGS Matematik ders paketi (Havale/IBAN)',
      date: `${getPastDate(5)} 14:15`,
      createdAt: `${getPastDate(5)}T14:15:00.000Z`,
    },
    {
      id: 'tx_p5_2',
      customerId: '',
      customerName: 'Toptancı Masrafı',
      type: 'gider' as const,
      amount: 450,
      paymentMethod: 'nakit' as const,
      description: 'Toptancıdan bakliyat ve gıda sevkiyatı',
      date: `${getPastDate(5)} 16:30`,
      createdAt: `${getPastDate(5)}T16:30:00.000Z`,
    },
    {
      id: 'tx_p4_1',
      customerId: 'cust_4',
      customerName: 'Canan Öztürk (Klima Servisi)',
      type: 'tahsilat' as const,
      amount: 1150,
      paymentMethod: 'kart' as const,
      description: 'Periyodik bakım ve filtre değişimi',
      date: `${getPastDate(4)} 10:45`,
      createdAt: `${getPastDate(4)}T10:45:00.000Z`,
    },
    {
      id: 'tx_p4_2',
      customerId: '',
      customerName: 'Elektrik & Su Faturası',
      type: 'gider' as const,
      amount: 520,
      paymentMethod: 'nakit' as const,
      description: 'Dükkan elektrik ve su faturası ödemesi',
      date: `${getPastDate(4)} 13:00`,
      createdAt: `${getPastDate(4)}T13:00:00.000Z`,
    },
    {
      id: 'tx_p3_1',
      customerId: 'cust_6',
      customerName: 'Dr. Selim Arslan',
      type: 'tahsilat' as const,
      amount: 2400,
      paymentMethod: 'kart' as const,
      description: 'Spor ve özel ders paketi peşinatı',
      date: `${getPastDate(3)} 17:30`,
      createdAt: `${getPastDate(3)}T17:30:00.000Z`,
    },
    {
      id: 'tx_p3_2',
      customerId: '',
      customerName: 'Kargo & Ambalaj Gideri',
      type: 'gider' as const,
      amount: 380,
      paymentMethod: 'nakit' as const,
      description: 'Müşteri sipariş poşetleri ve ambalaj koli',
      date: `${getPastDate(3)} 18:10`,
      createdAt: `${getPastDate(3)}T18:10:00.000Z`,
    },
    {
      id: 'tx_p2_1',
      customerId: 'cust_1',
      customerName: 'Ahmet Yılmaz (Marangoz Ahmet Usta)',
      type: 'tahsilat' as const,
      amount: 1450,
      paymentMethod: 'nakit' as const,
      description: 'Haftalık veresiye borcu elden kapatıldı',
      date: `${getPastDate(2)} 12:15`,
      createdAt: `${getPastDate(2)}T12:15:00.000Z`,
    },
    {
      id: 'tx_p2_2',
      customerId: '',
      customerName: 'Dükkan Masrafı',
      type: 'gider' as const,
      amount: 550,
      paymentMethod: 'nakit' as const,
      description: 'Toptancıya ara ödeme ve sarf malzeme',
      date: `${getPastDate(2)} 16:45`,
      createdAt: `${getPastDate(2)}T16:45:00.000Z`,
    },
    {
      id: 'tx_p1_1',
      customerId: 'cust_5',
      customerName: 'Hasan Bey (Apartman Yöneticisi)',
      type: 'tahsilat' as const,
      amount: 1600,
      paymentMethod: 'havale' as const,
      description: 'Apartman ortak gider erzak tahsilatı',
      date: `${getPastDate(1)} 13:20`,
      createdAt: `${getPastDate(1)}T13:20:00.000Z`,
    },
    {
      id: 'tx_p1_2',
      customerId: '',
      customerName: 'Araç Yakıt & Lojistik',
      type: 'gider' as const,
      amount: 420,
      paymentMethod: 'nakit' as const,
      description: 'Dükkan servis aracı mazot harcaması',
      date: `${getPastDate(1)} 17:00`,
      createdAt: `${getPastDate(1)}T17:00:00.000Z`,
    },
    // Today's live transactions
    {
      id: 'tx_1',
      customerId: 'cust_1',
      customerName: 'Ahmet Yılmaz (Marangoz Ahmet Usta)',
      type: 'veresiye',
      amount: 450,
      paymentMethod: 'veresiye',
      description: 'Zeytin, çay, deterjan ve 5 ekmek',
      date: `${today} 09:15`,
      createdAt: `${today}T09:15:00.000Z`,
    },
    {
      id: 'tx_2',
      customerId: 'cust_6',
      customerName: 'Dr. Selim Arslan',
      type: 'tahsilat',
      amount: 1200,
      paymentMethod: 'kart',
      description: 'Eski bakiye kapatma (Kredi Kartı Pos)',
      date: `${today} 10:30`,
      createdAt: `${today}T10:30:00.000Z`,
    },
    {
      id: 'tx_3',
      customerId: 'cust_5',
      customerName: 'Hasan Bey (Apartman Yöneticisi)',
      type: 'veresiye',
      amount: 800,
      paymentMethod: 'veresiye',
      description: 'Kireç çözücü, mop seti ve çöp poşetleri',
      date: `${today} 11:45`,
      createdAt: `${today}T11:45:00.000Z`,
    },
    {
      id: 'tx_4',
      customerId: '',
      customerName: 'Toptancı & Dükkan Masrafı',
      type: 'gider',
      amount: 250,
      paymentMethod: 'nakit',
      description: 'Toptancıya sebze-meyve ara ödemesi',
      date: `${today} 12:10`,
      createdAt: `${today}T12:10:00.000Z`,
    }
  ];

  const reminderLogs: ReminderLog[] = [
    {
      id: 'rem_1',
      customerId: 'cust_3',
      customerName: 'Mehmet Ali Kaya (Veli)',
      phone: '05553334455',
      channel: 'whatsapp',
      message: 'İyi günler Mehmet Ali Bey, Kerem için LGS Matematik 8 saatlik ders dönemi tamamlanmıştır. Bilginize sunar, hayırlı günler dileriz.',
      status: 'gonderildi',
      sentAt: `${yesterday} 14:20`,
      type: 'aidat',
    }
  ];

  const defaultProfile: ShopProfile = {
    storeName: 'Bereket Mahalle Esnafı',
    ownerName: 'Usta Ahmet',
    businessField: 'Bakkal / Market',
    employeeCount: '1',
    phone: '0532 123 45 67',
    cityDistrict: 'İstanbul / Kadıköy',
    dailyTarget: 2500,
    slogan: 'Mahallenin Güvenilir ve Samimi Esnafı',
    isConfigured: true,
    isVip: true,
  };

  const defaultClosings: DailyClosing[] = [
    {
      id: 'closing_yest',
      date: yesterday,
      closedAt: `${yesterday}T20:45:00.000Z`,
      expectedCash: 1180,
      actualCashCount: 1180,
      diffAmount: 0,
      totalIncomeToday: 2780,
      todayCash: 1600,
      todayCard: 1180,
      todayBank: 0,
      todayExpense: 420,
      netProfitToday: 2360,
      note: 'Dükkan zamanında kapatıldı, kasa kuruşu kuruşuna denk çıktı.',
      closedBy: 'Usta Ahmet',
    },
  ];

  const defaultProducts: Product[] = [
    {
      id: 'prod_1',
      name: 'Çaykur Tiryaki Çay 1 Kg',
      category: 'Gıda & Bakliyat',
      currentStock: 4, // Critical alert! (Threshold 10)
      unit: 'Paket',
      criticalThreshold: 10,
      purchasePrice: 155,
      salePrice: 195,
      barcode: '8690637012345',
      updatedAt: today,
    },
    {
      id: 'prod_2',
      name: 'Tam Yağlı Süt 1 Litre (Sütaş)',
      category: 'Süt & Kahvaltılık',
      currentStock: 3, // Critical alert! (Threshold 8)
      unit: 'Adet',
      criticalThreshold: 8,
      purchasePrice: 28,
      salePrice: 38,
      barcode: '8690555023456',
      updatedAt: today,
    },
    {
      id: 'prod_3',
      name: 'Somun Ekmek (200 gr)',
      category: 'Unlu Mamül',
      currentStock: 25,
      unit: 'Adet',
      criticalThreshold: 15,
      purchasePrice: 8,
      salePrice: 10,
      updatedAt: today,
    },
    {
      id: 'prod_4',
      name: 'Kristal Toz Şeker 5 Kg',
      category: 'Gıda & Bakliyat',
      currentStock: 2, // Critical alert! (Threshold 5)
      unit: 'Torba',
      criticalThreshold: 5,
      purchasePrice: 140,
      salePrice: 175,
      barcode: '8690123456789',
      updatedAt: today,
    },
    {
      id: 'prod_5',
      name: 'Yudum Ayçiçek Yağı 5 Litre',
      category: 'Sıvı Yağ',
      currentStock: 12,
      unit: 'Teneke',
      criticalThreshold: 6,
      purchasePrice: 280,
      salePrice: 340,
      barcode: '8690888999123',
      updatedAt: today,
    },
    {
      id: 'prod_6',
      name: 'Bulaşık Deterjanı 750 ml (Fairy)',
      category: 'Temizlik & Hijyen',
      currentStock: 7,
      unit: 'Şişe',
      criticalThreshold: 5,
      purchasePrice: 55,
      salePrice: 75,
      barcode: '8690111222333',
      updatedAt: today,
    },
    {
      id: 'prod_7',
      name: 'Karton Bardak 7 oz (50\'li Paket)',
      category: 'Sarf Malzeme',
      currentStock: 1, // Critical alert! (Threshold 4)
      unit: 'Paket',
      criticalThreshold: 4,
      purchasePrice: 22,
      salePrice: 35,
      updatedAt: today,
    },
  ];

  const defaultStockMovements: StockMovement[] = [
    {
      id: 'sm_1',
      productId: 'prod_1',
      productName: 'Çaykur Tiryaki Çay 1 Kg',
      type: 'giris',
      quantity: 20,
      previousStock: 4,
      newStock: 24,
      reason: 'Toptancı Mal Alımı (Bereket Toptan)',
      date: `${yesterday} 11:30`,
    },
    {
      id: 'sm_2',
      productId: 'prod_1',
      productName: 'Çaykur Tiryaki Çay 1 Kg',
      type: 'cikis',
      quantity: 20,
      previousStock: 24,
      newStock: 4,
      reason: 'Günlük Perakende Tezgâh Satışı',
      date: `${today} 14:15`,
    },
    {
      id: 'sm_3',
      productId: 'prod_2',
      productName: 'Tam Yağlı Süt 1 Litre (Sütaş)',
      type: 'cikis',
      quantity: 5,
      previousStock: 8,
      newStock: 3,
      reason: 'Günlük Perakende Tezgâh Satışı',
      date: `${today} 16:45`,
    },
  ];

  return {
    storeName: 'Bereket Mahalle Esnafı',
    shopProfile: defaultProfile,
    dailyClosings: defaultClosings,
    customers,
    transactions,
    reminderLogs,
    products: defaultProducts,
    stockMovements: defaultStockMovements,
    lastUpdated: new Date().toISOString(),
  };
}

// Load or initialize state
let state: AppState = (function () {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.transactions) && parsed.transactions.some((t: any) => t.id === 'tx_p6_1')) {
        if (!parsed.shopProfile) {
          parsed.shopProfile = {
            storeName: parsed.storeName || 'Bereket Mahalle Esnafı',
            ownerName: 'Usta Ahmet',
            businessField: 'Bakkal / Market',
            employeeCount: '1',
            phone: '0532 123 45 67',
            cityDistrict: 'İstanbul / Kadıköy',
            dailyTarget: 2500,
            slogan: 'Mahallenin Güvenilir ve Samimi Esnafı',
            isConfigured: true,
            isVip: true,
          };
        }
        if (!parsed.dailyClosings) {
          parsed.dailyClosings = [];
        }
        if (!parsed.products || !Array.isArray(parsed.products) || parsed.products.length === 0) {
          const fresh = getInitialData();
          parsed.products = fresh.products;
          parsed.stockMovements = fresh.stockMovements;
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading store.json, re-initializing:', err);
  }
  const initial = getInitialData();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write initial store:', e);
  }
  return initial;
})();

function saveState() {
  state.lastUpdated = new Date().toISOString();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save state to disk:', err);
  }
}

// Calculate Live Cash & Balances
function calculateCashRegister(): CashRegister {
  const todayStr = new Date().toISOString().split('T')[0];
  let todayCash = 0;
  let todayCard = 0;
  let todayBank = 0;
  let todayExpense = 0;

  for (const tx of state.transactions) {
    if (tx.date.startsWith(todayStr)) {
      if (tx.type === 'tahsilat') {
        if (tx.paymentMethod === 'nakit') todayCash += tx.amount;
        else if (tx.paymentMethod === 'kart') todayCard += tx.amount;
        else if (tx.paymentMethod === 'havale') todayBank += tx.amount;
      } else if (tx.type === 'gider') {
        todayExpense += tx.amount;
      }
    }
  }

  const todayTotalIncome = todayCash + todayCard + todayBank;
  const netTodayCash = todayCash - todayExpense;

  let totalReceivables = 0;
  let overdueCount = 0;
  let dueTodayCount = 0;

  for (const c of state.customers) {
    if (c.balance > 0) {
      totalReceivables += c.balance;
    }
    if (c.subscriptionPlan?.enabled && c.subscriptionPlan.nextDueDate) {
      if (c.subscriptionPlan.nextDueDate < todayStr) {
        overdueCount++;
      } else if (c.subscriptionPlan.nextDueDate === todayStr) {
        dueTodayCount++;
      }
    }
  }

  return {
    todayCash,
    todayCard,
    todayBank,
    todayTotalIncome,
    todayExpense,
    netTodayCash,
    totalReceivables,
    overdueCount,
    dueTodayCount,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const server = http.createServer(app);

  // WebSocket Server setup
  const wss = new WebSocketServer({ server });
  const clients = new Set<WebSocket>();

  function broadcast(event: WSEvent) {
    const payload = JSON.stringify(event);
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(payload);
        } catch (e) {
          console.error('Error sending WS message:', e);
        }
      }
    }
  }

  wss.on('connection', (ws) => {
    clients.add(ws);
    // Send immediate initial sync
    const initEvent: WSEvent = {
      type: 'INIT',
      payload: {
        customers: state.customers,
        transactions: state.transactions,
        cash: calculateCashRegister(),
        reminderLogs: state.reminderLogs,
        shopProfile: state.shopProfile,
        dailyClosings: state.dailyClosings,
        products: state.products || [],
        stockMovements: state.stockMovements || [],
      },
    };
    ws.send(JSON.stringify(initEvent));

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', () => {
      clients.delete(ws);
    });
  });

  // REST API Routes

  // 1. Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), clientsCount: clients.size });
  });

  // 2. Full state fetch
  app.get('/api/data', (_req, res) => {
    res.json({
      storeName: state.storeName,
      shopProfile: state.shopProfile,
      dailyClosings: state.dailyClosings,
      customers: state.customers,
      transactions: state.transactions,
      reminderLogs: state.reminderLogs,
      products: state.products || [],
      stockMovements: state.stockMovements || [],
      cash: calculateCashRegister(),
      lastUpdated: state.lastUpdated,
    });
  });

  // 3. Create or update customer
  app.post('/api/customers', (req: Request, res: Response) => {
    const data = req.body;
    if (!data.name || !data.phone) {
      return res.status(400).json({ error: 'Müşteri adı ve telefon numarası zorunludur.' });
    }

    let customer: Customer;
    const now = new Date().toISOString();

    if (data.id) {
      // Update
      const index = state.customers.findIndex((c) => c.id === data.id);
      if (index === -1) {
        return res.status(404).json({ error: 'Müşteri bulunamadı.' });
      }
      customer = {
        ...state.customers[index],
        ...data,
        updatedAt: now,
      };
      state.customers[index] = customer;
    } else {
      // Create
      customer = {
        id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: data.name.trim(),
        phone: data.phone.trim(),
        businessCategory: data.businessCategory || 'bakkal_market',
        balance: Number(data.initialBalance || 0),
        notes: data.notes || '',
        subscriptionPlan: data.subscriptionPlan || undefined,
        createdAt: now,
        updatedAt: now,
      };

      // If initial balance > 0, create an initial veresiye transaction
      if (customer.balance > 0) {
        const todayStr = new Date().toISOString().split('T')[0];
        const initialTx: Transaction = {
          id: `tx_${Date.now()}`,
          customerId: customer.id,
          customerName: customer.name,
          type: 'veresiye',
          amount: customer.balance,
          paymentMethod: 'veresiye',
          description: 'Açılış veresiye devir bakiyesi',
          date: `${todayStr} ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`,
          createdAt: now,
        };
        state.transactions.unshift(initialTx);
      }

      state.customers.unshift(customer);
    }

    saveState();
    const cash = calculateCashRegister();
    broadcast({ type: 'CUSTOMER_UPDATED', payload: { customer, cash } });

    res.json({ success: true, customer, cash });
  });

  // 4. Delete customer
  app.delete('/api/customers/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    state.customers = state.customers.filter((c) => c.id !== id);
    saveState();
    const cash = calculateCashRegister();
    broadcast({ type: 'CUSTOMER_DELETED', payload: { customerId: id, cash } });
    res.json({ success: true, customerId: id, cash });
  });

  // 5. Create Transaction (Veresiye ekle, Tahsilat al, Kasa çıkışı yap)
  app.post('/api/transactions', (req: Request, res: Response) => {
    const { customerId, type, amount, paymentMethod, description } = req.body;
    const parsedAmount = Number(amount);

    if (!type || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Geçerli bir işlem türü ve tutar giriniz.' });
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    let customer: Customer | undefined;
    let customerName = 'Genel Kasa Hareketi';

    if (customerId) {
      customer = state.customers.find((c) => c.id === customerId);
      if (customer) {
        customerName = customer.name;
        if (type === 'veresiye') {
          // Add to debt
          customer.balance += parsedAmount;
        } else if (type === 'tahsilat') {
          // Pay off debt
          customer.balance -= parsedAmount;
          customer.lastPaymentDate = todayStr;

          // If this customer has an active subscription and paid their subscription amount, auto-advance nextDueDate
          if (customer.subscriptionPlan?.enabled && customer.subscriptionPlan.nextDueDate) {
            const currentDue = new Date(customer.subscriptionPlan.nextDueDate);
            if (customer.subscriptionPlan.interval === 'aylik') {
              currentDue.setMonth(currentDue.getMonth() + 1);
            } else if (customer.subscriptionPlan.interval === 'haftalik') {
              currentDue.setDate(currentDue.getDate() + 7);
            } else if (customer.subscriptionPlan.interval === '3_aylik') {
              currentDue.setMonth(currentDue.getMonth() + 3);
            } else if (customer.subscriptionPlan.interval === 'yillik') {
              currentDue.setFullYear(currentDue.getFullYear() + 1);
            } else if (customer.subscriptionPlan.interval === 'periyodik_bakim') {
              currentDue.setMonth(currentDue.getMonth() + 6);
            }
            customer.subscriptionPlan.nextDueDate = currentDue.toISOString().split('T')[0];
          }
        }
        customer.updatedAt = now.toISOString();
      }
    }

    const transaction: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      customerId: customerId || '',
      customerName,
      type,
      amount: parsedAmount,
      paymentMethod: paymentMethod || 'nakit',
      description: description || (type === 'veresiye' ? 'Veresiye Borç Yazıldı' : type === 'tahsilat' ? 'Ödeme Alındı' : 'Dükkan Masrafı'),
      date: `${todayStr} ${timeStr}`,
      createdAt: now.toISOString(),
    };

    state.transactions.unshift(transaction);
    saveState();

    const cash = calculateCashRegister();
    if (customer) {
      broadcast({
        type: 'TRANSACTION_CREATED',
        payload: { transaction, customer, cash },
      });
    } else {
      broadcast({
        type: 'CASH_UPDATED',
        payload: cash,
      });
    }

    res.json({ success: true, transaction, customer, cash });
  });

  // 6. Record Reminder Sent (WhatsApp / SMS)
  app.post('/api/reminders/send', (req: Request, res: Response) => {
    const { customerId, channel, message, type } = req.body;
    const customer = state.customers.find((c) => c.id === customerId);

    const reminderLog: ReminderLog = {
      id: `rem_${Date.now()}`,
      customerId: customerId || '',
      customerName: customer ? customer.name : 'Müşteri',
      phone: customer ? customer.phone : '',
      channel: channel || 'whatsapp',
      message: message || '',
      status: 'gonderildi',
      sentAt: new Date().toLocaleString('tr-TR'),
      type: type || 'veresiye',
    };

    state.reminderLogs.unshift(reminderLog);
    saveState();

    broadcast({ type: 'REMINDER_SENT', payload: reminderLog });
    res.json({ success: true, reminderLog });
  });

  // 7. Gemini AI Smart Reminder Crafter
  app.post('/api/reminders/gemini-craft', async (req: Request, res: Response) => {
    const { customerName, balance, businessType, reminderType, tone, customNote, nextDueDate } = req.body;

    // Fallback template generator if no API key or on error
    const fallbackMessage = (t: string) => {
      if (reminderType === 'aidat') {
        return `İyi günler ${customerName}, ${nextDueDate ? `${nextDueDate} tarihli ` : ''}üyelik aidat dönemi gelmiştir. Kalan tutar: ${balance} TL'dir. Kolaylıklar dileriz.`;
      } else if (reminderType === 'bakim') {
        return `Merhaba ${customerName}, periyodik cihaz bakım ve kontrol zamanınız gelmiştir. Randevu için bize bu numaradan ulaşabilirsiniz. Hayırlı günler dileriz.`;
      }
      if (t === 'esnaf') {
        return `Selamlar ${customerName}, dükkan hesabınızda ${balance} TL bakiyeniz bulunmaktadır. Müsait olduğunuzda uğrarsanız seviniriz, hayırlı işler, bereketli günler.`;
      } else if (t === 'resmi') {
        return `Sayın ${customerName}, işletmemizde kayıtlı ${balance} TL tutarındaki cari bakiyenizi bilginize sunar, iyi çalışmalar dileriz.`;
      }
      return `Merhaba ${customerName}, hesabınızda kalan ${balance} TL bakiyeyi hatırlatmak istedik. Gösterdiğiniz ilgiye teşekkür eder, hayırlı günler dileriz.`;
    };

    if (!process.env.GEMINI_API_KEY) {
      return res.json({ message: fallbackMessage(tone || 'kibar') });
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

      const prompt = `Sen Türkiye'deki samimi, saygılı ve dürüst bir mahalle esnafı veya KOBİ işletmecisisin.
Aşağıdaki müşteri için WhatsApp veya SMS üzerinden gönderilecek, kaba olmayan, müşteriyi kırmayacak ama borcunu veya periyodik ödemesini/bakımını hatırlatacak bir mesaj hazırla.

Bilgiler:
- Müşteri Adı: ${customerName}
- Kalan Bakiye: ${balance} TL
- İşletme Türü: ${businessType || 'Mahalle İşletmesi'}
- Hatırlatma Konusu: ${reminderType || 'Veresiye / Bakiye'}
- İstenen Üslup / Ton: ${tone || 'Kibar & Samimi'} (seçenekler: esnaf_samimiyeti, kibar, resmi)
- Özel Not / Detay: ${customNote || 'Yok'}
${nextDueDate ? `- Son Ödeme / Randevu Tarihi: ${nextDueDate}` : ''}

Kurallar:
1. Sadece doğrudan gönderilecek Türkçe mesaj metnini üret. Tırnak işareti, başlık veya açıklama ekleme.
2. Mesaj 2-3 cümleyi geçmesin, WhatsApp'ta kolay okunabilir ve sıcak olsun.
3. Kaba, icra dili gibi soğuk ifadeler ASLA kullanma; esnaf nezaketiyle yaz.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const generated = response.text ? response.text.trim() : fallbackMessage(tone);
      res.json({ message: generated });
    } catch (err) {
      console.error('Gemini crafting error, using fallback:', err);
      res.json({ message: fallbackMessage(tone || 'kibar') });
    }
  });

  // 8. Excel / CSV Export
  app.get('/api/export/csv', (_req, res) => {
    let csv = 'Müşteri Adı;Telefon;İşletme Kategorisi;Güncel Bakiye (TL);Abonelik/Periyot;Son Ödeme Tarihi;Notlar\r\n';
    for (const c of state.customers) {
      const sub = c.subscriptionPlan?.enabled ? `${c.subscriptionPlan.title} (${c.subscriptionPlan.interval})` : '-';
      csv += `"${c.name}";"${c.phone}";"${c.businessCategory}";"${c.balance}";"${sub}";"${c.lastPaymentDate || '-'}";"${(c.notes || '').replace(/"/g, '""')}"\r\n`;
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="veresiye_ve_musteri_listesi.csv"');
    // UTF-8 BOM so Excel opens Turkish characters correctly
    res.send('\uFEFF' + csv);
  });

  // 9. Shop Profile Routes (Dükkan Kayıt & Profil Bilgileri)
  app.get('/api/shop-profile', (_req, res) => {
    res.json({ profile: state.shopProfile });
  });

  app.post('/api/shop-profile', (req: Request, res: Response) => {
    const data = req.body;
    if (!data.storeName) {
      return res.status(400).json({ error: 'Dükkan adı zorunludur.' });
    }

    const updatedProfile: ShopProfile = {
      storeName: data.storeName.trim(),
      ownerName: (data.ownerName || 'Esnaf').trim(),
      businessField: data.businessField || 'Bakkal / Market',
      employeeCount: data.employeeCount || '1',
      phone: (data.phone || '').trim(),
      cityDistrict: (data.cityDistrict || '').trim(),
      dailyTarget: Number(data.dailyTarget) || 2500,
      slogan: (data.slogan || '').trim(),
      isConfigured: true,
      isVip: data.isVip !== undefined ? Boolean(data.isVip) : (state.shopProfile?.isVip ?? true),
    };

    state.shopProfile = updatedProfile;
    state.storeName = updatedProfile.storeName;
    saveState();

    broadcast({ type: 'SHOP_PROFILE_UPDATED', payload: updatedProfile });
    res.json({ success: true, profile: updatedProfile });
  });

  // 10. Daily Closings Routes (Gün Sonu Z Raporları)
  app.get('/api/daily-closings', (_req, res) => {
    res.json({ closings: state.dailyClosings || [] });
  });

  app.post('/api/daily-closings', (req: Request, res: Response) => {
    const { actualCashCount, note, closedBy } = req.body;
    const cash = calculateCashRegister();

    const expectedCash = cash.netTodayCash;
    const actual = Number(actualCashCount) || 0;
    const diff = actual - expectedCash;

    const todayStr = new Date().toISOString().split('T')[0];
    const newClosing: DailyClosing = {
      id: `close_${Date.now()}`,
      date: todayStr,
      closedAt: new Date().toISOString(),
      expectedCash,
      actualCashCount: actual,
      diffAmount: diff,
      totalIncomeToday: cash.todayTotalIncome,
      todayCash: cash.todayCash,
      todayCard: cash.todayCard,
      todayBank: cash.todayBank,
      todayExpense: cash.todayExpense,
      netProfitToday: cash.todayTotalIncome - cash.todayExpense,
      note: note || '',
      closedBy: closedBy || state.shopProfile?.ownerName || 'Kasiyer / Esnaf',
    };

    if (!state.dailyClosings) {
      state.dailyClosings = [];
    }

    // Replace if closing already exists for today or unshift
    const existingIdx = state.dailyClosings.findIndex((c) => c.date === todayStr);
    if (existingIdx !== -1) {
      state.dailyClosings[existingIdx] = newClosing;
    } else {
      state.dailyClosings.unshift(newClosing);
    }

    saveState();
    broadcast({ type: 'DAILY_CLOSING_CREATED', payload: newClosing });
    res.json({ success: true, closing: newClosing });
  });

  // 11. VIP AI Shop Consultant & Live Support (Yapay Zeka Esnaf Danışmanı)
  app.post('/api/vip/ai-consultant', async (req: Request, res: Response) => {
    const { message, topic } = req.body;
    const profile = state.shopProfile;
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

  // 12. Products & Stock Management Endpoints
  app.get('/api/products', (_req, res) => {
    const products = state.products || [];
    const criticalCount = products.filter((p) => p.currentStock <= p.criticalThreshold).length;
    res.json({ products, criticalCount });
  });

  app.post('/api/products', (req: Request, res: Response) => {
    const data = req.body;
    if (!data.name || !data.name.trim()) {
      return res.status(400).json({ error: 'Ürün adı zorunludur.' });
    }

    if (!state.products) state.products = [];

    const now = new Date().toISOString();
    let product: Product;

    if (data.id) {
      // Update existing
      const idx = state.products.findIndex((p) => p.id === data.id);
      if (idx === -1) {
        return res.status(404).json({ error: 'Ürün bulunamadı.' });
      }
      product = {
        ...state.products[idx],
        name: data.name.trim(),
        category: data.category || 'Genel',
        currentStock: Number(data.currentStock) >= 0 ? Number(data.currentStock) : state.products[idx].currentStock,
        unit: data.unit || 'Adet',
        criticalThreshold: Number(data.criticalThreshold) >= 0 ? Number(data.criticalThreshold) : state.products[idx].criticalThreshold,
        purchasePrice: data.purchasePrice !== undefined ? Number(data.purchasePrice) : state.products[idx].purchasePrice,
        salePrice: data.salePrice !== undefined ? Number(data.salePrice) : state.products[idx].salePrice,
        barcode: data.barcode !== undefined ? data.barcode.trim() : state.products[idx].barcode,
        updatedAt: now,
      };
      state.products[idx] = product;
    } else {
      // Create new
      product = {
        id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: data.name.trim(),
        category: data.category || 'Genel',
        currentStock: Math.max(0, Number(data.currentStock) || 0),
        unit: data.unit || 'Adet',
        criticalThreshold: Math.max(1, Number(data.criticalThreshold) || 5),
        purchasePrice: data.purchasePrice ? Number(data.purchasePrice) : undefined,
        salePrice: data.salePrice ? Number(data.salePrice) : undefined,
        barcode: data.barcode ? data.barcode.trim() : undefined,
        updatedAt: now,
      };
      state.products.unshift(product);
    }

    saveState();
    broadcast({ type: 'PRODUCT_UPDATED', payload: product });
    res.json({ success: true, product });
  });

  app.delete('/api/products/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    if (!state.products) state.products = [];
    state.products = state.products.filter((p) => p.id !== id);
    saveState();
    broadcast({ type: 'PRODUCT_DELETED', payload: { productId: id } });
    res.json({ success: true, productId: id });
  });

  // Stock Movement: Giriş veya Çıkış
  app.post('/api/products/:id/movement', (req: Request, res: Response) => {
    const productId = req.params.id;
    const { type, quantity, reason } = req.body;
    const parsedQty = Math.abs(Number(quantity));

    if (!type || (type !== 'giris' && type !== 'cikis') || isNaN(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({ error: 'Geçerli bir hareket türü (giris/cikis) ve adet giriniz.' });
    }

    if (!state.products) state.products = [];
    const product = state.products.find((p) => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: 'Ürün bulunamadı.' });
    }

    const previousStock = product.currentStock;
    let newStock = previousStock;

    if (type === 'giris') {
      newStock = previousStock + parsedQty;
    } else {
      if (previousStock < parsedQty) {
        // Warning or allow partial/zero
        newStock = Math.max(0, previousStock - parsedQty);
      } else {
        newStock = previousStock - parsedQty;
      }
    }

    product.currentStock = newStock;
    product.updatedAt = new Date().toISOString();

    const now = new Date();
    const dateStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;

    const movement: StockMovement = {
      id: `sm_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      productId: product.id,
      productName: product.name,
      type,
      quantity: parsedQty,
      previousStock,
      newStock,
      reason: reason || (type === 'giris' ? 'Stok Girişi (Toptancı/İkmal)' : 'Stok Çıkışı (Satış/Fire)'),
      date: dateStr,
    };

    if (!state.stockMovements) state.stockMovements = [];
    state.stockMovements.unshift(movement);

    saveState();

    broadcast({
      type: 'STOCK_MOVEMENT_CREATED',
      payload: { movement, product },
    });

    const isCritical = product.currentStock <= product.criticalThreshold;

    res.json({
      success: true,
      movement,
      product,
      isCritical,
    });
  });

  app.get('/api/products/movements', (_req, res) => {
    res.json({ movements: state.stockMovements || [] });
  });

  // 13. Reset Demo Data
  app.post('/api/reset-demo', (_req, res) => {
    state = getInitialData();
    saveState();
    const cash = calculateCashRegister();
    broadcast({
      type: 'INIT',
      payload: {
        customers: state.customers,
        transactions: state.transactions,
        cash,
        reminderLogs: state.reminderLogs,
        shopProfile: state.shopProfile,
        dailyClosings: state.dailyClosings,
        products: state.products || [],
        stockMovements: state.stockMovements || [],
      },
    });
    res.json({ success: true, message: 'Veriler başarıyla başlangıç haline sıfırlandı.' });
  });

  // Vite middleware in development vs static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Bereket Esnaf Portalı running at http://localhost:${PORT}`);
  });
}

startServer();
