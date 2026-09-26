import React from 'react';
import type { ActiveTab } from '../App';
import type {
  Appointment,
  BusinessSector,
  CaseFile,
  CustodyTicket,
  Customer,
  Product,
  RepairTicket,
  RestaurantTable,
  ServiceItem,
} from '../types';
import { BarberAppointmentsView } from './BarberAppointmentsView';
import { RestaurantTablesView } from './RestaurantTablesView';
import { FastRetailCounterView } from './FastRetailCounterView';
import { RepairTicketsView } from './RepairTicketsView';
import { LawyerCasesView, type LawyerTab } from './LawyerCasesView';
import { CustodyTicketsView } from './CustodyTicketsView';

/**
 * SectorModuleSwitch — dükkan çeşidine (business_type/sectorKey) göre
 * ilgili sektör modülünü render eder. Mevcut sayfa düzenini değiştirmez;
 * sadece hangi sektör bileşeninin gösterileceğine karar verir.
 */
interface SectorModuleSwitchProps {
  sector: BusinessSector;
  activeTab: ActiveTab;
  // Berber
  appointments: Appointment[];
  services: ServiceItem[];
  onAddAppointment: (data: Partial<Appointment>) => Promise<void>;
  onCompleteAppointment: (id: string, paymentMethod: 'nakit' | 'kart') => Promise<void>;
  onUpdateAppointmentStatus: (id: string, status: Appointment['status']) => Promise<void>;
  onDeleteAppointment: (id: string) => Promise<void>;
  onFastWalkinCash: (serviceName: string, price: number, staffName: string) => Promise<void>;
  // Kafe / Restoran
  tables: RestaurantTable[];
  onAddOrderToTable: (
    tableId: string,
    item: { name: string; quantity: number; unitPrice: number }
  ) => Promise<void>;
  onCheckoutTable: (tableId: string, paymentMethod: 'nakit' | 'kart') => Promise<void>;
  onResetTable: (tableId: string) => Promise<void>;
  onAddQuickExpense: (description: string, amount: number) => Promise<void>;
  // Bakkal / Market (POS)
  products: Product[];
  customers: Customer[];
  onQuickPosSale: (
    items: Array<{ productId?: string; name: string; quantity: number; unitPrice: number; total: number }>,
    paymentMethod: 'nakit' | 'kart'
  ) => Promise<void>;
  onCreditSaleToCustomer: (customerId: string, amount: number, description: string) => Promise<void>;
  // Teknik servis
  repairTickets: RepairTicket[];
  onAddRepairTicket: (data: Partial<RepairTicket>) => Promise<void>;
  onUpdateRepairStatus: (id: string, status: RepairTicket['status']) => Promise<void>;
  onCompleteRepairTicket: (id: string, paymentMethod: 'nakit' | 'kart', deductPartCost: boolean) => Promise<void>;
  onDeleteRepairTicket: (id: string) => Promise<void>;
  // Avukat / Danışman
  cases: CaseFile[];
  lawyerTab: LawyerTab;
  onLawyerTabChange: (tab: LawyerTab) => void;
  onSaveCase: (data: Partial<CaseFile>) => Promise<void>;
  onDeleteCase: (id: string) => Promise<void>;
  // Terzi / Kuru temizleme (emanet)
  custody: CustodyTicket[];
  onSaveCustody: (data: Partial<CustodyTicket>) => Promise<void>;
  onUpdateCustodyStatus: (id: string, status: CustodyTicket['status']) => Promise<void>;
  onCompleteCustody: (id: string, paymentMethod: 'nakit' | 'kart') => Promise<void>;
  onDeleteCustody: (id: string) => Promise<void>;
}

export const SectorModuleSwitch: React.FC<SectorModuleSwitchProps> = (props) => {
  const { sector, activeTab } = props;
  if (activeTab !== 'sector_view') return null;

  if (sector === 'berber_kuafor') {
    return (
      <BarberAppointmentsView
        appointments={props.appointments}
        services={props.services}
        onAddAppointment={props.onAddAppointment}
        onCompleteAppointment={props.onCompleteAppointment}
        onUpdateStatus={props.onUpdateAppointmentStatus}
        onDeleteAppointment={props.onDeleteAppointment}
        onFastWalkinCash={props.onFastWalkinCash}
      />
    );
  }
  if (sector === 'kafe_restoran') {
    return (
      <RestaurantTablesView
        tables={props.tables}
        onAddOrderToTable={props.onAddOrderToTable}
        onCheckoutTable={props.onCheckoutTable}
        onResetTable={props.onResetTable}
        onAddQuickExpense={props.onAddQuickExpense}
      />
    );
  }
  if (sector === 'bakkal_market') {
    return (
      <FastRetailCounterView
        products={props.products}
        customers={props.customers}
        onQuickPosSale={props.onQuickPosSale}
        onCreditSaleToCustomer={props.onCreditSaleToCustomer}
      />
    );
  }
  if (sector === 'teknik_servis') {
    return (
      <RepairTicketsView
        repairTickets={props.repairTickets}
        onAddTicket={props.onAddRepairTicket}
        onUpdateStatus={props.onUpdateRepairStatus}
        onCompleteTicket={props.onCompleteRepairTicket}
        onDeleteTicket={props.onDeleteRepairTicket}
      />
    );
  }
  if (sector === 'avukat_danisman') {
    return (
      <LawyerCasesView
        cases={props.cases}
        customers={props.customers}
        initialTab={props.lawyerTab}
        onTabChange={props.onLawyerTabChange}
        onSaveCase={props.onSaveCase}
        onDeleteCase={props.onDeleteCase}
      />
    );
  }
  if (sector === 'terzi_kurutemizleme') {
    return (
      <CustodyTicketsView
        tickets={props.custody}
        customers={props.customers}
        onSaveTicket={props.onSaveCustody}
        onUpdateStatus={props.onUpdateCustodyStatus}
        onCompleteTicket={props.onCompleteCustody}
        onDeleteTicket={props.onDeleteCustody}
      />
    );
  }
  return null;
};
