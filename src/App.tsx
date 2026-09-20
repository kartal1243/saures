import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Customer, Transaction, ReminderLog, CashRegister, WSEvent, TransactionType, PaymentMethod } from './types';
import { Header } from './components/Header';
import { RevenueVsExpensesChart } from './components/RevenueVsExpensesChart';
import { CashSummary } from './components/CashSummary';
import { QuickActionBar } from './components/QuickActionBar';
import { UpcomingReminders } from './components/UpcomingReminders';
import { CustomerList } from './components/CustomerList';
import { CustomerDetailModal } from './components/CustomerDetailModal';
import { WhatsAppReminderModal } from './components/WhatsAppReminderModal';
import { QuickTransactionModal } from './components/QuickTransactionModal';
import { NewCustomerModal } from './components/NewCustomerModal';
import { formatCurrency } from './utils/formatters';
import { Activity, Clock, ArrowUpRight, ArrowDownLeft, Banknote, CreditCard } from 'lucide-react';

export default function App() {
  const [storeName, setStoreName] = useState('Bereket Esnaf & KOBİ Portalı');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([]);
  const [cash, setCash] = useState<CashRegister>({
    todayCash: 0,
    todayCard: 0,
    todayBank: 0,
    todayTotalIncome: 0,
    todayExpense: 0,
    netTodayCash: 0,
    totalReceivables: 0,
    overdueCount: 0,
    dueTodayCount: 0,
  });
  const [connected, setConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'customers' | 'activity'>('customers');

  // Modals state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionModalType, setTransactionModalType] = useState<TransactionType>('veresiye');
  const [transactionTargetCustomer, setTransactionTargetCustomer] = useState<Customer | null>(null);

  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);

  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppTargetCustomer, setWhatsAppTargetCustomer] = useState<Customer | null>(null);
  const [whatsAppReminderType, setWhatsAppReminderType] = useState<'veresiye' | 'aidat' | 'bakim'>('veresiye');

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Initial HTTP data fetch fallback
  const fetchInitialData = async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        setStoreName(data.storeName || 'Bereket Esnaf & KOBİ Portalı');
        setCustomers(data.customers || []);
        setTransactions(data.transactions || []);
        setReminderLogs(data.reminderLogs || []);
        if (data.cash) setCash(data.cash);
      }
    } catch (e) {
      console.error('Error fetching initial data:', e);
    }
  };

  // WebSocket Connection with Auto-reconnect
  const connectWebSocket = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const wsEvent: WSEvent = JSON.parse(event.data);
          if (wsEvent.type === 'INIT') {
            setCustomers(wsEvent.payload.customers);
            setTransactions(wsEvent.payload.transactions);
            setCash(wsEvent.payload.cash);
            setReminderLogs(wsEvent.payload.reminderLogs);
          } else if (wsEvent.type === 'TRANSACTION_CREATED') {
            setTransactions((prev) => [wsEvent.payload.transaction, ...prev]);
            setCustomers((prev) =>
              prev.map((c) => (c.id === wsEvent.payload.customer.id ? wsEvent.payload.customer : c))
            );
            setCash(wsEvent.payload.cash);
          } else if (wsEvent.type === 'CUSTOMER_UPDATED') {
            setCustomers((prev) => {
              const exists = prev.some((c) => c.id === wsEvent.payload.customer.id);
              if (exists) {
                return prev.map((c) => (c.id === wsEvent.payload.customer.id ? wsEvent.payload.customer : c));
              }
              return [wsEvent.payload.customer, ...prev];
            });
            setCash(wsEvent.payload.cash);
          } else if (wsEvent.type === 'CUSTOMER_DELETED') {
            setCustomers((prev) => prev.filter((c) => c.id !== wsEvent.payload.customerId));
            setCash(wsEvent.payload.cash);
          } else if (wsEvent.type === 'REMINDER_SENT') {
            setReminderLogs((prev) => [wsEvent.payload, ...prev]);
          } else if (wsEvent.type === 'CASH_UPDATED') {
            setCash(wsEvent.payload);
          }
        } catch (err) {
          console.error('Failed to parse WS message:', err);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        // Attempt reconnection after 3 seconds
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };

      ws.onerror = () => {
        setConnected(false);
      };
    } catch (err) {
      console.error('WebSocket connection error:', err);
      setConnected(false);
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connectWebSocket();
      }, 3000);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // Handler: Submit transaction
  const handleCreateTransaction = async (data: {
    customerId?: string;
    type: TransactionType;
    amount: number;
    paymentMethod: PaymentMethod;
    description: string;
  }) => {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'İşlem kaydedilemedi.');
    }
  };

  // Handler: Submit new customer
  const handleCreateCustomer = async (data: Partial<Customer> & { initialBalance?: number }) => {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Müşteri kaydedilemedi.');
    }
  };

  // Handler: Delete customer
  const handleDeleteCustomer = async (id: string) => {
    const res = await fetch(`/api/customers/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      alert('Müşteri silinemedi.');
    }
  };

  // Handler: Log reminder sent
  const handleReminderSent = (log: {
    customerId: string;
    channel: 'whatsapp' | 'sms';
    message: string;
    type: string;
  }) => {
    fetch('/api/reminders/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    }).catch((e) => console.error('Error logging reminder:', e));
  };

  // Handler: Export CSV
  const handleExportCsv = () => {
    window.location.href = '/api/export/csv';
  };

  // Handler: Reset demo data
  const handleResetDemo = async () => {
    if (confirm('Tüm verileri varsayılan örnek verilere sıfırlamak istiyor musunuz?')) {
      try {
        await fetch('/api/reset-demo', { method: 'POST' });
      } catch (e) {
        console.error('Reset error:', e);
      }
    }
  };

  // Quick Open Modal Helpers
  const openTransactionForCustomer = (cust: Customer, type: TransactionType) => {
    setTransactionTargetCustomer(cust);
    setTransactionModalType(type);
    setIsTransactionModalOpen(true);
  };

  const openWhatsAppForCustomer = (cust: Customer, type?: 'aidat' | 'bakim' | 'veresiye') => {
    setWhatsAppTargetCustomer(cust);
    setWhatsAppReminderType(
      type || (cust.businessCategory === 'teknik_servis' ? 'bakim' : cust.subscriptionPlan?.enabled ? 'aidat' : 'veresiye')
    );
    setIsWhatsAppModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans pb-12">
      {/* 1. Header */}
      <Header
        storeName={storeName}
        connected={connected}
        onResetDemo={handleResetDemo}
        onExportCsv={handleExportCsv}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 flex-1 w-full">
        {/* Revenue vs Expenses Comparison Chart & Profitability Summary (Last 7 Days) */}
        <RevenueVsExpensesChart transactions={transactions} />

        {/* 2. Quick Action Bar */}
        <QuickActionBar
          onOpenTransaction={(type) => {
            setTransactionTargetCustomer(null);
            setTransactionModalType(type);
            setIsTransactionModalOpen(true);
          }}
          onOpenNewCustomer={() => setIsNewCustomerModalOpen(true)}
        />

        {/* 3. Live Cash Registers */}
        <CashSummary
          cash={cash}
          onOpenUpcomingModal={() => {
            // Scroll to upcoming reminders or focus
            const el = document.getElementById('section-upcoming-reminders');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* 4. Upcoming Due Subscriptions / Veresiye Reminders */}
        <div id="section-upcoming-reminders">
          <UpcomingReminders
            customers={customers}
            onOpenWhatsApp={(cust, type) => openWhatsAppForCustomer(cust, type)}
            onOpenPayment={(cust) => openTransactionForCustomer(cust, 'tahsilat')}
          />
        </div>

        {/* Tab switcher: Müşteri & Veresiye Defteri vs Canlı Kasa ve Defter Hareketleri */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              id="tab-view-customers"
              type="button"
              onClick={() => setActiveTab('customers')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                activeTab === 'customers'
                  ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Müşteri &amp; Veresiye Defteri ({customers.length})
            </button>
            <button
              id="tab-view-activity"
              type="button"
              onClick={() => setActiveTab('activity')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'activity'
                  ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-amber-600" />
              <span>Canlı Kasa &amp; Defter Akışı ({transactions.length})</span>
            </button>
          </div>
        </div>

        {/* 5. Main View: Customers or Live Activity Feed */}
        {activeTab === 'customers' ? (
          <CustomerList
            customers={customers}
            onSelectCustomer={(cust) => {
              setSelectedCustomer(cust);
              setIsDetailModalOpen(true);
            }}
            onOpenTransaction={(cust, type) => openTransactionForCustomer(cust, type)}
            onOpenWhatsApp={(cust) => openWhatsAppForCustomer(cust)}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-stone-900">
                  Canlı Kasa &amp; Defter Akışı
                </h2>
                <p className="text-xs text-stone-500">
                  Dükkandaki tüm satış, ödeme alma ve masraf hareketleri
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                Canlı Eşzamanlı
              </span>
            </div>

            {transactions.length === 0 ? (
              <p className="text-center text-xs text-stone-400 py-8">Henüz kaydedilmiş bir hareket bulunmuyor.</p>
            ) : (
              <div className="divide-y divide-stone-100">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="py-3 sm:py-3.5 flex items-center justify-between gap-3 text-xs sm:text-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                          tx.type === 'veresiye'
                            ? 'bg-amber-100 text-amber-800'
                            : tx.type === 'tahsilat'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {tx.type === 'veresiye' ? (
                          <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                        ) : tx.type === 'tahsilat' ? (
                          <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          <Banknote className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-stone-900">
                          {tx.customerName || 'Genel Dükkan Masrafı'}
                        </div>
                        <div className="text-xs text-stone-500 mt-0.5">
                          {tx.description}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {tx.date}
                          </span>
                          <span>•</span>
                          <span className="font-medium text-stone-600 capitalize">
                            {tx.paymentMethod === 'nakit'
                              ? 'Nakit Elden'
                              : tx.paymentMethod === 'kart'
                              ? 'Kredi Kartı Pos'
                              : tx.paymentMethod === 'havale'
                              ? 'Havale/IBAN'
                              : 'Veresiye Yazıldı'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`font-black text-sm sm:text-base ${
                          tx.type === 'veresiye'
                            ? 'text-amber-700'
                            : tx.type === 'tahsilat'
                            ? 'text-emerald-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {tx.type === 'veresiye' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-stone-400">
                        {tx.type === 'veresiye'
                          ? 'Veresiye Borç'
                          : tx.type === 'tahsilat'
                          ? 'Ödeme Alındı'
                          : 'Dükkan Masrafı'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODALS */}

      {/* 1. Customer Detail / Ledger Modal */}
      {isDetailModalOpen && selectedCustomer && (
        <CustomerDetailModal
          customer={customers.find((c) => c.id === selectedCustomer.id) || selectedCustomer}
          transactions={transactions}
          reminderLogs={reminderLogs}
          onClose={() => setIsDetailModalOpen(false)}
          onOpenTransaction={(cust, type) => {
            setIsDetailModalOpen(false);
            openTransactionForCustomer(cust, type);
          }}
          onOpenWhatsApp={(cust) => {
            setIsDetailModalOpen(false);
            openWhatsAppForCustomer(cust);
          }}
          onDeleteCustomer={handleDeleteCustomer}
        />
      )}

      {/* 2. Quick Transaction Modal */}
      {isTransactionModalOpen && (
        <QuickTransactionModal
          initialType={transactionModalType}
          selectedCustomer={transactionTargetCustomer}
          customers={customers}
          onClose={() => {
            setIsTransactionModalOpen(false);
            setTransactionTargetCustomer(null);
          }}
          onSubmit={handleCreateTransaction}
        />
      )}

      {/* 3. New Customer Modal */}
      {isNewCustomerModalOpen && (
        <NewCustomerModal
          onClose={() => setIsNewCustomerModalOpen(false)}
          onSubmit={handleCreateCustomer}
        />
      )}

      {/* 4. WhatsApp & SMS Reminder Modal */}
      {isWhatsAppModalOpen && whatsAppTargetCustomer && (
        <WhatsAppReminderModal
          customer={whatsAppTargetCustomer}
          defaultType={whatsAppReminderType}
          onClose={() => {
            setIsWhatsAppModalOpen(false);
            setWhatsAppTargetCustomer(null);
          }}
          onReminderSent={handleReminderSent}
        />
      )}
    </div>
  );
}
