import React from 'react';
import type {
  CashRegister,
  Customer,
  DailyClosing,
  Product,
  ReminderLog,
  ServiceItem,
  ShopProfile,
  StockMovement,
  Supplier,
  Transaction,
  TransactionType,
} from '../../types';
import { ShopProfileModal } from '../shop/ShopProfileModal';
import { MoneyInModal } from '../shop/MoneyInModal';
import { ServicesModal } from '../sector/ServicesModal';
import { MoneyOutModal } from '../shop/MoneyOutModal';
import { SupplierModal, type SupplierModalMode } from '../stock/SupplierModal';
import { DailyClosingModal } from '../shop/DailyClosingModal';
import { VipAiConsultantModal } from '../shop/VipAiConsultantModal';
import { ChangePasswordModal } from '../shop/ChangePasswordModal';
import { StaffModal } from '../shop/StaffModal';
import { CustomerDetailModal } from '../customers/CustomerDetailModal';
import { QuickTransactionModal } from '../customers/QuickTransactionModal';
import { NewCustomerModal } from '../customers/NewCustomerModal';
import { WhatsAppReminderModal } from '../customers/WhatsAppReminderModal';
import { StockAdjustmentModal } from '../stock/StockAdjustmentModal';
import { ProductFormModal } from '../stock/ProductFormModal';
import type { PaymentMethod } from '../../types';

interface AppModalsProps {
  // 1. Dükkan profili
  isShopProfileModalOpen: boolean;
  onCloseShopProfile: () => void;
  shopProfile: ShopProfile;
  onSaveShopProfile: (p: ShopProfile) => Promise<void>;
  onRestoreBackup: (f: File) => void;
  // 2. Para Al
  isMoneyInModalOpen: boolean;
  onCloseMoneyIn: () => void;
  customers: Customer[];
  onMoneyIn: (data: {
    amount: number;
    paymentMethod: PaymentMethod;
    category: string;
    customerId?: string;
    description: string;
  }) => Promise<void>;
  serviceList: ServiceItem[];
  isBarber: boolean;
  // 2b. Hizmetler
  isServicesModalOpen: boolean;
  onCloseServices: () => void;
  services: ServiceItem[];
  onSaveService: (data: { id?: string; name: string; price: number }) => Promise<void>;
  onDeleteService: (id: string) => void;
  // 3. Para Ver
  isMoneyOutModalOpen: boolean;
  onCloseMoneyOut: () => void;
  onMoneyOut: (data: {
    amount: number;
    paymentMethod: PaymentMethod;
    category: string;
    description: string;
  }) => Promise<void>;
  // 3b. Tedarikçi
  isSupplierModalOpen: boolean;
  onCloseSupplier: () => void;
  supplierModalMode: SupplierModalMode;
  activeSupplier: Supplier | null;
  onSaveSupplier: (data: { id?: string; name: string; phone: string; notes: string }) => Promise<void>;
  onSupplierPurchase: (id: string, amount: number) => Promise<void>;
  onSupplierPay: (id: string, amount: number, paymentMethod: PaymentMethod) => Promise<void>;
  // 4. Gün sonu
  isDailyClosingModalOpen: boolean;
  onCloseDailyClosing: () => void;
  cash: CashRegister;
  dailyClosings: DailyClosing[];
  onSaveDailyClosing: (data: { actualCashCount: number; note: string; closedBy?: string }) => Promise<void>;
  // 5. VIP
  isVipModalOpen: boolean;
  onCloseVip: () => void;
  onApplySlogan: (slogan: string) => Promise<void>;
  // Şifre + personel
  isChangePasswordOpen: boolean;
  onCloseChangePassword: () => void;
  isStaffModalOpen: boolean;
  onCloseStaff: () => void;
  // 6. Müşteri detay
  isDetailModalOpen: boolean;
  selectedCustomer: Customer | null;
  transactions: Transaction[];
  reminderLogs: ReminderLog[];
  onCloseDetail: () => void;
  onOpenTransaction: (cust: Customer, type: TransactionType) => void;
  onOpenWhatsApp: (cust: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  // 7. Hızlı işlem
  isTransactionModalOpen: boolean;
  onCloseTransaction: () => void;
  transactionModalType: TransactionType;
  transactionTargetCustomer: Customer | null;
  onQuickTransactionSubmit: (data: {
    customerId?: string;
    type: TransactionType;
    amount: number;
    paymentMethod: PaymentMethod;
    description: string;
  }) => Promise<void>;
  // 8. Yeni müşteri
  isNewCustomerModalOpen: boolean;
  onCloseNewCustomer: () => void;
  onCreateCustomer: (data: Partial<Customer> & { initialBalance?: number }) => Promise<void>;
  // 9. WhatsApp
  isWhatsAppModalOpen: boolean;
  whatsAppTargetCustomer: Customer | null;
  whatsAppReminderType: 'veresiye' | 'aidat' | 'bakim';
  onCloseWhatsApp: () => void;
  onReminderSent: (log: {
    customerId: string;
    channel: 'whatsapp' | 'sms';
    message: string;
    type: string;
  }) => void;
  // 10. Stok hareket
  isStockAdjustmentModalOpen: boolean;
  onCloseStockAdjustment: () => void;
  selectedProductForAdjustment: Product | null;
  products: Product[];
  adjustmentType: 'giris' | 'cikis';
  onStockAdjustment: (productId: string, type: 'giris' | 'cikis', quantity: number, reason: string) => Promise<void>;
  // 11. Ürün formu
  isProductFormModalOpen: boolean;
  onCloseProductForm: () => void;
  productToEdit: Product | null;
  onSaveProduct: (data: Partial<Product>) => Promise<void>;
}

export const AppModals: React.FC<AppModalsProps> = (p) => {
  return (
    <>
      {/* 1. Dükkan Kayıt & Profil Modal (Onboarding & Settings) */}
      <ShopProfileModal
        isOpen={p.isShopProfileModalOpen}
        onClose={p.onCloseShopProfile}
        currentProfile={p.shopProfile}
        onSaveProfile={p.onSaveShopProfile}
        isFirstTime={!p.shopProfile.isConfigured}
        onRestoreBackup={p.onRestoreBackup}
      />

      {/* 2. Para Al (Satış / Kasa Girişi) Modal */}
      <MoneyInModal
        isOpen={p.isMoneyInModalOpen}
        onClose={p.onCloseMoneyIn}
        customers={p.customers}
        onSubmit={p.onMoneyIn}
        services={p.serviceList}
        showServices={p.isBarber}
      />

      {/* 2b. Hizmet tarifeleri (berber) */}
      <ServicesModal
        isOpen={p.isServicesModalOpen}
        onClose={p.onCloseServices}
        services={p.services}
        onSave={p.onSaveService}
        onDelete={p.onDeleteService}
      />

      {/* 3. Para Ver (Dükkan Masrafı / Gider) Modal */}
      <MoneyOutModal
        isOpen={p.isMoneyOutModalOpen}
        onClose={p.onCloseMoneyOut}
        onSubmit={p.onMoneyOut}
      />

      {/* 3b. Tedarikçi cari hesap Modal */}
      <SupplierModal
        isOpen={p.isSupplierModalOpen}
        mode={p.supplierModalMode}
        supplier={p.activeSupplier}
        onClose={p.onCloseSupplier}
        onSave={p.onSaveSupplier}
        onPurchase={p.onSupplierPurchase}
        onPay={p.onSupplierPay}
      />

      {/* 4. Gün Sonu Kasa Kapatma & Z Raporu Modal */}
      <DailyClosingModal
        isOpen={p.isDailyClosingModalOpen}
        onClose={p.onCloseDailyClosing}
        cash={p.cash}
        shopProfile={p.shopProfile}
        closings={p.dailyClosings}
        onSaveClosing={p.onSaveDailyClosing}
      />

      {/* 5. VIP Esnaf Kulübü & AI Dükkan Danışmanı Modal */}
      <VipAiConsultantModal
        isOpen={p.isVipModalOpen}
        onClose={p.onCloseVip}
        shopProfile={p.shopProfile}
        cash={p.cash}
        onApplyProfileTip={p.onApplySlogan}
      />

      <ChangePasswordModal
        isOpen={p.isChangePasswordOpen}
        onClose={p.onCloseChangePassword}
      />

      <StaffModal
        isOpen={p.isStaffModalOpen}
        onClose={p.onCloseStaff}
      />

      {/* 6. Customer Detail Modal */}
      {p.isDetailModalOpen && p.selectedCustomer && (
        <CustomerDetailModal
          customer={p.customers.find((c) => c.id === p.selectedCustomer!.id) || p.selectedCustomer}
          transactions={p.transactions}
          reminderLogs={p.reminderLogs}
          onClose={p.onCloseDetail}
          onOpenTransaction={(cust, type) => {
            p.onCloseDetail();
            p.onOpenTransaction(cust, type);
          }}
          onOpenWhatsApp={(cust) => {
            p.onCloseDetail();
            p.onOpenWhatsApp(cust);
          }}
          onDeleteCustomer={p.onDeleteCustomer}
        />
      )}

      {/* 7. Quick Transaction (Veresiye/Tahsilat for Customer) */}
      {p.isTransactionModalOpen && (
        <QuickTransactionModal
          initialType={p.transactionModalType}
          selectedCustomer={p.transactionTargetCustomer}
          customers={p.customers}
          onClose={p.onCloseTransaction}
          onSubmit={p.onQuickTransactionSubmit}
        />
      )}

      {/* 8. New Customer Modal */}
      {p.isNewCustomerModalOpen && (
        <NewCustomerModal
          onClose={p.onCloseNewCustomer}
          onSubmit={p.onCreateCustomer}
        />
      )}

      {/* 9. WhatsApp Reminder Modal */}
      {p.isWhatsAppModalOpen && p.whatsAppTargetCustomer && (
        <WhatsAppReminderModal
          customer={p.whatsAppTargetCustomer}
          defaultType={p.whatsAppReminderType}
          onClose={p.onCloseWhatsApp}
          onReminderSent={p.onReminderSent}
        />
      )}

      {/* 10. Stok Giriş / Çıkış Hareketi Modal */}
      <StockAdjustmentModal
        isOpen={p.isStockAdjustmentModalOpen}
        onClose={p.onCloseStockAdjustment}
        product={p.selectedProductForAdjustment}
        products={p.products}
        initialType={p.adjustmentType}
        onSubmit={p.onStockAdjustment}
      />

      {/* 11. Yeni Ürün Ekleme / Düzenleme Modal */}
      <ProductFormModal
        isOpen={p.isProductFormModalOpen}
        onClose={p.onCloseProductForm}
        productToEdit={p.productToEdit}
        onSubmit={p.onSaveProduct}
      />
    </>
  );
};
