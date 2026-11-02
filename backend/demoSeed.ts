import { localDay } from './day';
import {
  findAccountByPhone,
  addAccount,
  hashPassword,
  type Account,
} from './accounts';
import {
  loadShopState,
  setShopState,
  demoBarberStaff,
  demoBarberServices,
  defaultBarberSettings,
} from './shopState';
import type { AppState } from '../shared/types';

export const DEMO_PHONE = '05900000011';
export const DEMO_PASSWORD = 'Demo1234!';
export const DEMO_ACCOUNT_ID = 'acc_demo_dukkan';

export function createDemoState(): AppState {
  const today = localDay();
  const now = new Date().toISOString();

  return {
    storeName: 'Makas & Tarak Erkek Kuaförü',
    shopProfile: {
      storeName: 'Makas & Tarak Erkek Kuaförü',
      ownerName: 'Ahmet Usta (Demo)',
      businessField: 'Berber / Kuaför / Güzellik',
      sectorKey: 'berber_kuafor',
      employeeCount: '3',
      phone: DEMO_PHONE,
      cityDistrict: 'İstanbul / Kadıköy',
      dailyTarget: 4500,
      slogan: 'Usta ellerde tarzına değer kat — Dükkanım Yanımda Demo',
      slug: 'demo',
      isConfigured: true,
      isVip: true,
    },
    customers: [
      {
        id: 'cust_demo_1',
        name: 'Ahmet Yılmaz',
        phone: '0532 111 22 33',
        businessCategory: 'diger',
        notes: 'Daimi müşteri, cuma günleri gelir',
        balance: 350,
        createdAt: '2026-09-10T10:00:00.000Z',
        updatedAt: now,
      },
      {
        id: 'cust_demo_2',
        name: 'Mehmet Kaya',
        phone: '0542 222 33 44',
        businessCategory: 'diger',
        notes: 'Peşin öder',
        balance: 0,
        createdAt: '2026-09-12T11:00:00.000Z',
        updatedAt: now,
      },
      {
        id: 'cust_demo_3',
        name: 'Burak Çelik',
        phone: '0544 555 66 77',
        businessCategory: 'diger',
        notes: 'Veresiye ödemesi gecikti, WhatsApp hatırlatması hazır',
        balance: 550,
        createdAt: '2026-08-20T09:30:00.000Z',
        updatedAt: now,
      },
      {
        id: 'cust_demo_4',
        name: 'Selim Demir',
        phone: '0535 666 77 88',
        businessCategory: 'diger',
        notes: 'Öğrenci, kartla öder',
        balance: 0,
        createdAt: '2026-09-28T16:00:00.000Z',
        updatedAt: now,
      },
      {
        id: 'cust_demo_5',
        name: 'Caner Aydın',
        phone: '0533 444 55 66',
        businessCategory: 'diger',
        notes: 'Randevulu çalışır',
        balance: 180,
        createdAt: '2026-10-01T12:00:00.000Z',
        updatedAt: now,
      },
    ],
    transactions: [
      {
        id: 'tx_demo_1',
        customerId: 'cust_demo_1',
        customerName: 'Ahmet Yılmaz',
        type: 'veresiye',
        amount: 350,
        paymentMethod: 'veresiye',
        description: 'Saç & Sakal Tıraşı (Ahmet Yılmaz)',
        category: 'Hizmet',
        date: today,
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 'tx_demo_2',
        customerId: 'cust_demo_2',
        customerName: 'Mehmet Kaya',
        type: 'tahsilat',
        amount: 250,
        paymentMethod: 'kart',
        description: 'Saç Kesimi (Mehmet Kaya)',
        category: 'Hizmet',
        date: today,
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: 'tx_demo_3',
        customerId: 'cust_demo_4',
        customerName: 'Selim Demir',
        type: 'tahsilat',
        amount: 180,
        paymentMethod: 'kart',
        description: 'Mat Wax Satışı',
        category: 'Ürün Satışı',
        date: today,
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'tx_demo_4',
        customerId: 'cust_demo_5',
        customerName: 'Caner Aydın',
        type: 'tahsilat',
        amount: 400,
        paymentMethod: 'havale',
        description: 'Özel Bakım & Damat Tıraşı (Havale/FAST)',
        category: 'Hizmet',
        date: today,
        createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      },
      {
        id: 'tx_demo_5',
        customerId: '',
        customerName: 'Genel Gider',
        type: 'masraf',
        amount: 120,
        paymentMethod: 'nakit',
        description: 'Dükkan Çay & Şeker & İkram Sarfiyatı',
        category: 'Dükkan Masrafı',
        date: today,
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: 'tx_demo_6',
        customerId: '',
        customerName: 'Kadıköy Kozmetik Toptancısı',
        type: 'gider',
        amount: 450,
        paymentMethod: 'kart',
        description: 'Toptancıdan Şampuan & Kolonya Alımı',
        category: 'Toptancı & Malzeme',
        date: today,
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
    ],
    services: [
      { id: 'srv_1', name: 'Saç Kesimi', price: 250, createdAt: now, updatedAt: now },
      { id: 'srv_2', name: 'Sakal Tıraşı', price: 150, createdAt: now, updatedAt: now },
      { id: 'srv_3', name: 'Saç & Sakal Bakım', price: 350, createdAt: now, updatedAt: now },
      { id: 'srv_4', name: 'Çocuk Saç Kesimi', price: 180, createdAt: now, updatedAt: now },
      { id: 'srv_5', name: 'Saç Yıkama & Fön', price: 120, createdAt: now, updatedAt: now },
      { id: 'srv_6', name: 'Cilt Maskesi & Buhar', price: 200, createdAt: now, updatedAt: now },
    ],
    appointments: [
      {
        id: 'apt_1',
        customerName: 'Caner Aydın',
        phone: '0533 444 55 66',
        serviceName: 'Saç Kesimi',
        staffName: 'Ahmet Usta',
        appointmentDate: today,
        timeSlot: '14:00',
        status: 'tamamlandi',
        price: 250,
        notes: 'Yanlar kısa, üstler kalsın',
        createdAt: now,
      },
      {
        id: 'apt_2',
        customerName: 'Selim Demir',
        phone: '0535 666 77 88',
        serviceName: 'Saç & Sakal Bakım',
        staffName: 'Mehmet Kalfa',
        appointmentDate: today,
        timeSlot: '16:30',
        status: 'bekliyor',
        price: 350,
        notes: 'İlk kez geliyor',
        createdAt: now,
      },
      {
        id: 'apt_3',
        customerName: 'Burak Çelik',
        phone: '0544 555 66 77',
        serviceName: 'Saç Kesimi & Yıkama',
        staffName: 'Ahmet Usta',
        appointmentDate: today,
        timeSlot: '18:00',
        status: 'bekliyor',
        price: 300,
        createdAt: now,
      },
    ],
    products: [
      {
        id: 'prd_1',
        name: 'Mat Saç Waxı 150ml',
        barcode: '869000100201',
        salePrice: 180,
        purchasePrice: 90,
        currentStock: 14,
        criticalThreshold: 5,
        category: 'Kozmetik',
        unit: 'Adet',
        updatedAt: now,
      },
      {
        id: 'prd_2',
        name: 'Sakal Bakım Yağı 50ml',
        barcode: '869000100202',
        salePrice: 220,
        purchasePrice: 110,
        currentStock: 8,
        criticalThreshold: 3,
        category: 'Kozmetik',
        unit: 'Adet',
        updatedAt: now,
      },
      {
        id: 'prd_3',
        name: 'Doğal Saç Şampuanı 1000ml',
        barcode: '869000100203',
        salePrice: 190,
        purchasePrice: 95,
        currentStock: 15,
        criticalThreshold: 5,
        category: 'Sarf Malzeme',
        unit: 'Adet',
        updatedAt: now,
      },
      {
        id: 'prd_4',
        name: 'Geleneksel Tıraş Kolonyası 400ml',
        barcode: '869000100204',
        salePrice: 95,
        purchasePrice: 45,
        currentStock: 2, // Kritik seviyede
        criticalThreshold: 5,
        category: 'Sarf Malzeme',
        unit: 'Adet',
        updatedAt: now,
      },
    ],
    stockMovements: [
      {
        id: 'sm_1',
        productId: 'prd_1',
        productName: 'Mat Saç Waxı 150ml',
        type: 'cikis',
        quantity: 1,
        previousStock: 15,
        newStock: 14,
        reason: 'Tezgah satışı',
        date: today,
      },
    ],
    tables: [
      {
        id: 'tbl_1',
        name: 'Masa 1 (Cam Kenarı)',
        isOccupied: true,
        guestCount: 2,
        orders: [
          { id: 'ord_1', name: '2x Çay', unitPrice: 20, quantity: 2, total: 40 },
          { id: 'ord_2', name: '1x Tost', unitPrice: 90, quantity: 1, total: 90 },
        ],
        totalAmount: 130,
        openedAt: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 'tbl_2',
        name: 'Masa 2',
        isOccupied: false,
        orders: [],
        totalAmount: 0,
      },
      {
        id: 'tbl_3',
        name: 'Masa 3 (Bahçe)',
        isOccupied: true,
        guestCount: 2,
        orders: [
          { id: 'ord_3', name: 'Türk Kahvesi', unitPrice: 30, quantity: 2, total: 60 },
        ],
        totalAmount: 60,
        openedAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
    repairTickets: [
      {
        id: 'rep_1',
        customerName: 'Burak Çelik',
        phone: '0544 555 66 77',
        deviceOrVehicle: 'Philips Tıraş Makinesi',
        complaint: 'Bıçak dönmüyor, şarj almıyor',
        status: 'tamirde',
        estimatedCost: 350,
        partCost: 120,
        createdAt: now,
      },
      {
        id: 'rep_2',
        customerName: 'Mehmet Kaya',
        phone: '0542 222 33 44',
        deviceOrVehicle: 'Moser Saç Kesim Cihazı',
        complaint: 'Kablo temassızlığı, genel temizlik',
        status: 'teslime_hazir',
        estimatedCost: 200,
        partCost: 40,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    suppliers: [
      {
        id: 'sup_1',
        name: 'Kadıköy Kozmetik & Kuaför Toptancısı',
        phone: '0216 333 44 55',
        notes: 'Her salı sevkiyat yapar, vadeli çalışır',
        balance: 1450,
        createdAt: '2026-09-01T09:00:00.000Z',
        updatedAt: now,
      },
    ],
    dailyClosings: [
      {
        id: 'cls_1',
        date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
        closedAt: new Date(Date.now() - 86400000).toISOString(),
        expectedCash: 1800,
        actualCashCount: 1800,
        diffAmount: 0,
        totalIncomeToday: 3200,
        todayCash: 1800,
        todayCard: 1000,
        todayBank: 400,
        todayExpense: 400,
        netProfitToday: 2800,
        expectedTotalIncome: 3200,
        actualTotalIncome: 3200,
        totalDiff: 0,
        note: 'Dün akşam kasası eksiksiz kapatıldı.',
        closedBy: 'Ahmet Usta',
      },
    ],
    reminderLogs: [],
    cases: [],
    custody: [],
    barberStaff: demoBarberStaff,
    barberServices: demoBarberServices,
    barberTimeBlocks: [],
    customerPackages: [],
    barberSettings: {
      ...defaultBarberSettings,
      slug: 'demo',
    },
    businessDate: today,
    lastUpdated: now,
  };
}

export function ensureDemoAccount(): Account {
  let acc = findAccountByPhone(DEMO_PHONE);

  if (!acc) {
    acc = {
      id: DEMO_ACCOUNT_ID,
      shopName: 'Makas & Tarak Erkek Kuaförü',
      ownerName: 'Ahmet Usta (Demo)',
      phone: DEMO_PHONE,
      passwordHash: hashPassword(DEMO_PASSWORD),
      createdAt: '2026-09-01T08:00:00.000Z',
      createdIp: '127.0.0.1',
      loginCount: 1,
    };
    addAccount(acc);
  }

  // Demo dükkanının verisi silinmiş veya bozulmuşsa (vandalizm koruması) otomatik yenile
  const existing = loadShopState(acc.id);
  const isVandalized =
    !existing ||
    !Array.isArray(existing.customers) ||
    existing.customers.length < 3 ||
    existing.shopProfile?.storeName !== 'Makas & Tarak Erkek Kuaförü' ||
    !existing.shopProfile?.isVip;

  if (isVandalized) {
    const demoState = createDemoState();
    setShopState(acc.id, demoState);
  }

  return acc;
}

export const MASTER_USERNAME = 'patron';
export const MASTER_PHONE = '05559998877';
export const MASTER_PASSWORD = '123456';
export const MASTER_ACCOUNT_ID = 'acc_master_patron';

export function ensureMasterAccount(): Account {
  let acc = findAccountByPhone(MASTER_PHONE);

  if (!acc) {
    acc = {
      id: MASTER_ACCOUNT_ID,
      username: MASTER_USERNAME,
      shopName: 'Ömer Yaman - Çoklu Meslek Portalı',
      ownerName: 'Ömer Yaman',
      phone: MASTER_PHONE,
      email: 'patron@dukkanimyanimda.com.tr',
      passwordHash: hashPassword(MASTER_PASSWORD),
      createdAt: '2026-11-01T00:00:00.000Z',
      createdIp: '127.0.0.1',
      loginCount: 1,
    };
    addAccount(acc);
  } else {
    acc.username = MASTER_USERNAME;
    acc.passwordHash = hashPassword(MASTER_PASSWORD);
  }

  // Master hesaba sınırsız Patron VIP ve tüm sektör örnek verilerini yükle
  const existing = loadShopState(acc.id);
  const now = new Date().toISOString();
  const expiry2099 = '2099-12-31T23:59:59.000Z';

  const updatedState = existing ? { ...existing } : createDemoState();
  updatedState.storeName = updatedState.storeName || 'Ömer Yaman - Çoklu Meslek Portalı';
  if (!updatedState.shopProfile) updatedState.shopProfile = {} as any;
  updatedState.shopProfile = {
    ...updatedState.shopProfile,
    storeName: 'Ömer Yaman - Çoklu Meslek Portalı',
    ownerName: 'Ömer Yaman',
    phone: MASTER_PHONE,
    cityDistrict: 'İstanbul / Kadıköy',
    isConfigured: true,
    isVip: true,
    vipTier: 'patron',
    vipPlan: 'patron_lifetime',
    vipUntil: expiry2099,
    vipExpiresAt: expiry2099,
    slug: 'patron',
    sectorKey: updatedState.shopProfile.sectorKey || 'berber_kuafor',
    businessField: updatedState.shopProfile.businessField || 'Kuaför & Berber Salonu',
  };

  // Restoran masaları hazır olsun
  if (!Array.isArray(updatedState.tables) || updatedState.tables.length === 0) {
    updatedState.tables = [
      { id: 'tbl_1', name: 'Masa 1 (Cam Kenarı)', status: 'bos', capacity: 4, orders: [], currentTotal: 0, createdAt: now },
      { id: 'tbl_2', name: 'Masa 2 (Bahçe)', status: 'bos', capacity: 6, orders: [], currentTotal: 0, createdAt: now },
      { id: 'tbl_3', name: 'Masa 3 (Salon)', status: 'bos', capacity: 2, orders: [], currentTotal: 0, createdAt: now },
    ];
  }

  // Market ürünleri hazır olsun
  if (!Array.isArray(updatedState.products) || updatedState.products.length === 0) {
    updatedState.products = [
      { id: 'prod_1', name: 'Çay 1 Kg (Rize Turist)', price: 160, cost: 120, stock: 45, barcode: '8690555001015', unit: 'adet', createdAt: now },
      { id: 'prod_2', name: 'Küp Şeker 1 Kg', price: 50, cost: 35, stock: 30, barcode: '8690555001022', unit: 'adet', createdAt: now },
      { id: 'prod_3', name: 'Salkım Domates (Yerli)', price: 40, cost: 25, stock: 100, barcode: '2700101000000', unit: 'kg', isWeighable: true, pluCode: '00101', createdAt: now },
    ];
  }

  // Berber çizelgesi hazır olsun
  if (!Array.isArray(updatedState.barberStaff) || updatedState.barberStaff.length === 0) {
    updatedState.barberStaff = demoBarberStaff;
    updatedState.barberServices = demoBarberServices;
  }

  setShopState(acc.id, updatedState);
  return acc;
}
