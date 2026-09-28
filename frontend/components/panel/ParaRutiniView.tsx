import React, { useState } from 'react';
import type { Customer, Product, ShopProfile, Appointment, Transaction } from '../../../shared/types.ts';
import { HandCoins, FileBarChart, Wallet } from 'lucide-react';
import { CollectionPanel } from './CollectionPanel';
import { PatronReport } from './PatronReport';

interface ParaRutiniViewProps {
  transactions: Transaction[];
  customers: Customer[];
  products: Product[];
  appointments: Appointment[];
  shopProfile: ShopProfile;
  onOpenWhatsApp: (cust: Customer) => void;
  onOpenPayment: (cust: Customer) => void;
}

type RutinTab = 'tahsilat' | 'rapor';

const TABS: { id: RutinTab; label: string; Icon: typeof Wallet }[] = [
  { id: 'tahsilat', label: 'Tahsilat Turu', Icon: HandCoins },
  { id: 'rapor', label: 'Patron Raporu', Icon: FileBarChart },
];

export const ParaRutiniView: React.FC<ParaRutiniViewProps> = ({
  transactions,
  customers,
  products,
  appointments,
  shopProfile,
  onOpenWhatsApp,
  onOpenPayment,
}) => {
  // Sekme hafızalı: geri gelince aynı sekmede kalır
  const [tab, setTab] = useState<RutinTab>('tahsilat');

  return (
    <div className="space-y-5">
      {/* Sekmeler */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-stone-200/70 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              id={`btn-rutin-${id}`}
              type="button"
              onClick={() => setTab(id)}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-[13px] font-black transition-all cursor-pointer ${
                active
                  ? 'bg-white dark:bg-stone-800 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          );
        })}
      </div>

      {tab === 'tahsilat' ? (
        <CollectionPanel
          customers={customers}
          appointments={appointments}
          shopName={shopProfile.storeName}
          onOpenWhatsApp={onOpenWhatsApp}
          onOpenPayment={onOpenPayment}
        />
      ) : (
        <PatronReport
          transactions={transactions}
          customers={customers}
          products={products}
          shopProfile={shopProfile}
        />
      )}
    </div>
  );
};
