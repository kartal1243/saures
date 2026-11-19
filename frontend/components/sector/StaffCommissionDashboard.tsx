import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Award,
  Banknote,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  CreditCard,
  Landmark,
  Pencil,
  Percent,
  Phone,
  Plus,
  Power,
  Printer,
  RefreshCw,
  Trash2,
  TrendingUp,
  UserCheck,
  UserX,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import type {
  Appointment,
  BarberStaff,
  StaffCommissionPayout,
} from '../../../shared/types.ts';

export type CommissionPeriod = 'today' | 'week' | 'month' | 'all';

export interface StaffCommissionDashboardProps {
  staffList: BarberStaff[];
  appointments: Appointment[];
  storeName: string;
  onEditStaff: (st: BarberStaff) => void;
  onDeleteStaff: (staffId: string) => void;
  onToggleStaffActive: (staffId: string) => void;
  onAddStaffClick: () => void;
}

interface RecentCommissionItem {
  id: string;
  date: string;
  timeSlot: string;
  customerName: string;
  serviceName: string;
  price: number;
  commissionAmount: number;
  commissionRate: number;
}

interface NormalizedStaffStat {
  staffId: string;
  staffName: string;
  commissionRate: number;
  completedCount: number;
  noShowCount: number;
  revenue: number;
  earnedCommission: number;
  paidCommission: number;
  payableBalance: number;
  allTimeEarned: number;
  allTimePaid: number;
  recentAppointments: RecentCommissionItem[];
  periodAppointments: RecentCommissionItem[];
}

interface CommissionSummaryTotals {
  totalRevenue: number;
  totalEarnedCommission: number;
  totalPaidCommission: number;
  totalPayableBalance: number;
}

const PERIOD_OPTIONS: Array<{ key: CommissionPeriod; label: string }> = [
  { key: 'today', label: 'Bugün' },
  { key: 'week', label: 'Bu Hafta' },
  { key: 'month', label: 'Bu Ay' },
  { key: 'all', label: 'Tümü' },
];

const DAYS_SHORT_TR: Record<number, string> = {
  1: 'Pzt',
  2: 'Sal',
  3: 'Çar',
  4: 'Per',
  5: 'Cum',
  6: 'Cmt',
  0: 'Paz',
};

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

function escapeHtml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function roundMoney(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function formatMoney(value: number): string {
  return roundMoney(value).toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isDateInPeriod(dateStr: string, period: CommissionPeriod): boolean {
  if (period === 'all') return true;
  if (!dateStr) return false;
  const cleanDate = dateStr.slice(0, 10);
  const now = new Date();
  const todayStr = toLocalDateStr(now);

  if (period === 'today') {
    return cleanDate === todayStr;
  }

  if (period === 'month') {
    return cleanDate.slice(0, 7) === todayStr.slice(0, 7);
  }

  // 'week': Pazartesi - Pazar arası mevcut hafta
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const mondayStr = toLocalDateStr(monday);
  const sundayStr = toLocalDateStr(sunday);
  return cleanDate >= mondayStr && cleanDate <= sundayStr;
}

function formatDateTr(dateStr?: string): string {
  if (!dateStr) return '-';
  const raw = String(dateStr).trim();
  const ymdMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    return `${ymdMatch[3]}.${ymdMatch[2]}.${ymdMatch[1]}`;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString('tr-TR');
}

function getDefaultPeriodLabel(): string {
  const raw = new Date().toLocaleDateString('tr-TR', {
    month: 'long',
    year: 'numeric',
  });
  const formatted = raw.charAt(0).toLocaleUpperCase('tr-TR') + raw.slice(1);
  return `${formatted} Prim Hakedişi`;
}

function formatOffDaysSummary(offDays?: number[]): string {
  if (!Array.isArray(offDays) || offDays.length === 0) {
    return 'İzin günü yok';
  }
  const unique = new Set(offDays.map(Number));
  const labels = WEEK_ORDER.filter((d) => unique.has(d)).map((d) => DAYS_SHORT_TR[d]);
  return labels.length > 0 ? labels.join(', ') : 'İzin günü yok';
}

function getStaffInitials(name: string): string {
  const parts = String(name || 'U').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toLocaleUpperCase('tr-TR');
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toLocaleUpperCase('tr-TR');
}

function paymentMethodBadge(method?: string): { label: string; className: string } {
  switch (method) {
    case 'kart':
      return {
        label: 'Kredi Kartı',
        className: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
      };
    case 'havale':
      return {
        label: 'Havale / EFT',
        className: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
      };
    case 'nakit':
    default:
      return {
        label: 'Nakit',
        className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      };
  }
}

function doesAppointmentBelongToStaff(apt: Appointment, staff: BarberStaff): boolean {
  if (Array.isArray(apt.commissionBreakdown) && apt.commissionBreakdown.some((b) => b.staffId === staff.id)) {
    return true;
  }
  if (apt.staffId && apt.staffId !== 'auto') {
    return apt.staffId === staff.id;
  }
  const aptStaffLower = (apt.staffName || '').trim().toLowerCase();
  const stNameLower = (staff.name || '').trim().toLowerCase();
  return Boolean(aptStaffLower && stNameLower && aptStaffLower.includes(stNameLower));
}

function computeLocalSnapshot(
  staffList: BarberStaff[],
  appointments: Appointment[],
  period: CommissionPeriod,
  payouts: StaffCommissionPayout[]
): {
  stats: NormalizedStaffStat[];
  summary: CommissionSummaryTotals;
} {
  const stats: NormalizedStaffStat[] = staffList.map((st) => {
    const staffRate = st.commissionRate ?? 30;
    const staffApts = appointments.filter((a) => doesAppointmentBelongToStaff(a, st));

    let periodRevenue = 0;
    let periodEarned = 0;
    let allTimeEarned = 0;
    let completedCount = 0;
    let noShowCount = 0;
    const completedItems: RecentCommissionItem[] = [];

    for (const apt of staffApts) {
      const inPeriod = isDateInPeriod(apt.appointmentDate, period);

      if (apt.status === 'gelmedi') {
        if (inPeriod) noShowCount += 1;
        continue;
      }

      if (apt.status !== 'tamamlandi') continue;

      let rev = 0;
      let earned = 0;
      let usedRate = apt.commissionRate ?? staffRate;

      const breakdownEntry = Array.isArray(apt.commissionBreakdown)
        ? apt.commissionBreakdown.find((b) => b.staffId === st.id)
        : undefined;

      if (breakdownEntry) {
        rev = Number(breakdownEntry.revenue) || 0;
        earned = Number(breakdownEntry.amount) || 0;
        usedRate = Number(breakdownEntry.rate) || usedRate;
      } else {
        const isPackageCovered = Boolean(apt.packageSession) || apt.paymentMethod === 'paket';
        rev = isPackageCovered ? 0 : Number(apt.price) || 0;
        earned =
          typeof apt.commissionAmount === 'number'
            ? apt.commissionAmount
            : roundMoney((rev * usedRate) / 100);
      }

      allTimeEarned += earned;

      if (inPeriod) {
        completedCount += 1;
        periodRevenue += rev;
        periodEarned += earned;
        completedItems.push({
          id: apt.id,
          date: apt.appointmentDate,
          timeSlot: apt.timeSlot || '',
          customerName: apt.customerName || 'Müşteri',
          serviceName: apt.serviceName || 'Hizmet',
          price: rev,
          commissionAmount: roundMoney(earned),
          commissionRate: usedRate,
        });
      }
    }

    completedItems.sort((a, b) => {
      const keyA = `${a.date} ${a.timeSlot}`;
      const keyB = `${b.date} ${b.timeSlot}`;
      return keyB.localeCompare(keyA);
    });

    const staffPayouts = payouts.filter((p) => p.staffId === st.id);
    const allTimePaid = staffPayouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const periodPaid = staffPayouts
      .filter((p) => isDateInPeriod(p.date || p.createdAt, period))
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const payableBalance = roundMoney(Math.max(0, allTimeEarned - allTimePaid));

    return {
      staffId: st.id,
      staffName: st.name,
      commissionRate: staffRate,
      completedCount,
      noShowCount,
      revenue: roundMoney(periodRevenue),
      earnedCommission: roundMoney(periodEarned),
      paidCommission: roundMoney(periodPaid),
      payableBalance,
      allTimeEarned: roundMoney(allTimeEarned),
      allTimePaid: roundMoney(allTimePaid),
      recentAppointments: completedItems.slice(0, 3),
      periodAppointments: completedItems,
    };
  });

  const summary: CommissionSummaryTotals = {
    totalRevenue: roundMoney(stats.reduce((s, x) => s + x.revenue, 0)),
    totalEarnedCommission: roundMoney(stats.reduce((s, x) => s + x.earnedCommission, 0)),
    totalPaidCommission: roundMoney(stats.reduce((s, x) => s + x.paidCommission, 0)),
    totalPayableBalance: roundMoney(stats.reduce((s, x) => s + x.payableBalance, 0)),
  };

  return { stats, summary };
}

export const StaffCommissionDashboard: React.FC<StaffCommissionDashboardProps> = ({
  staffList = [],
  appointments = [],
  storeName = 'Berber & Kuaför Salonu',
  onEditStaff,
  onDeleteStaff,
  onToggleStaffActive,
  onAddStaffClick,
}) => {
  const [period, setPeriod] = useState<CommissionPeriod>('month');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const [payouts, setPayouts] = useState<StaffCommissionPayout[]>([]);
  const [serverStats, setServerStats] = useState<NormalizedStaffStat[] | null>(null);
  const [serverSummary, setServerSummary] = useState<CommissionSummaryTotals | null>(null);

  // Prim Ödeme Modalı
  const [payingStaff, setPayingStaff] = useState<BarberStaff | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<'nakit' | 'kart' | 'havale'>('nakit');
  const [payPeriodLabel, setPayPeriodLabel] = useState<string>(getDefaultPeriodLabel);
  const [payNote, setPayNote] = useState<string>('');
  const [payError, setPayError] = useState<string | null>(null);
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [deletingPayoutId, setDeletingPayoutId] = useState<string | null>(null);

  const localFallback = useMemo(
    () => computeLocalSnapshot(staffList, appointments, period, payouts),
    [staffList, appointments, period, payouts]
  );

  const fetchCommissions = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const res = await fetch(`/api/barber/commissions?period=${encodeURIComponent(period)}`, {
        signal,
      });
      if (!res.ok) {
        if (res.status === 404) {
          // Backend endpoint hazır değilse yerel hesaplama ile kesintisiz devam et
          setServerStats(null);
          setServerSummary(null);
          return;
        }
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Prim verileri yüklenemedi.');
      }

      const data = await res.json();
      const rawPayouts: StaffCommissionPayout[] = Array.isArray(data.payouts)
        ? data.payouts
        : Array.isArray(data.recentPayouts)
        ? data.recentPayouts
        : Array.isArray(data.history)
        ? data.history
        : [];
      setPayouts(rawPayouts);

      const rawStaffRows: any[] = Array.isArray(data.staffStats)
        ? data.staffStats
        : Array.isArray(data.staffCommissions)
        ? data.staffCommissions
        : Array.isArray(data.staff)
        ? data.staff
        : Array.isArray(data.breakdown)
        ? data.breakdown
        : [];

      const localSnap = computeLocalSnapshot(staffList, appointments, period, rawPayouts);

      if (rawStaffRows.length > 0) {
        const mergedStats: NormalizedStaffStat[] = staffList.map((st) => {
          const localMatch = localSnap.stats.find((x) => x.staffId === st.id)!;
          const row = rawStaffRows.find(
            (r) => r.staffId === st.id || r.id === st.id || (r.staffName && r.staffName === st.name)
          );
          if (!row) return localMatch;

          const rawRecent: any[] = Array.isArray(row.recentAppointments)
            ? row.recentAppointments
            : Array.isArray(row.recentServices)
            ? row.recentServices
            : Array.isArray(row.items)
            ? row.items
            : [];

          const normalizedRecentAll: RecentCommissionItem[] =
            rawRecent.length > 0
              ? rawRecent.map((item: any, idx: number) => ({
                  id: String(item.id || `${st.id}_rec_${idx}`),
                  date: String(item.appointmentDate || item.date || ''),
                  timeSlot: String(item.timeSlot || item.time || ''),
                  customerName: String(item.customerName || 'Müşteri'),
                  serviceName: String(item.serviceName || item.service || 'Hizmet'),
                  price: Number(item.price ?? item.revenue ?? 0),
                  commissionAmount: roundMoney(
                    Number(item.commissionAmount ?? item.commission ?? item.amount ?? 0)
                  ),
                  commissionRate: Number(item.commissionRate ?? row.commissionRate ?? st.commissionRate ?? 30),
                }))
              : [];

          const normalizedRecent: RecentCommissionItem[] =
            normalizedRecentAll.length > 0
              ? normalizedRecentAll.slice(0, 3)
              : localMatch.recentAppointments;

          const rawPeriodItems: any[] = Array.isArray(row.periodAppointments)
            ? row.periodAppointments
            : Array.isArray(row.appointments)
            ? row.appointments
            : [];

          const normalizedPeriodItems: RecentCommissionItem[] =
            rawPeriodItems.length > 0
              ? rawPeriodItems.map((item: any, idx: number) => ({
                  id: String(item.id || `${st.id}_per_${idx}`),
                  date: String(item.appointmentDate || item.date || ''),
                  timeSlot: String(item.timeSlot || item.time || ''),
                  customerName: String(item.customerName || 'Müşteri'),
                  serviceName: String(item.serviceName || item.service || 'Hizmet'),
                  price: Number(item.price ?? item.revenue ?? 0),
                  commissionAmount: roundMoney(
                    Number(item.commissionAmount ?? item.commission ?? item.amount ?? 0)
                  ),
                  commissionRate: Number(item.commissionRate ?? row.commissionRate ?? st.commissionRate ?? 30),
                }))
              : normalizedRecentAll.length > 0
              ? normalizedRecentAll
              : localMatch.periodAppointments;

          return {
            staffId: st.id,
            staffName: st.name,
            commissionRate: Number(row.commissionRate ?? st.commissionRate ?? 30),
            completedCount: Number(row.completedCount ?? row.completedJobs ?? localMatch.completedCount),
            noShowCount: Number(row.noShowCount ?? row.gelmediCount ?? localMatch.noShowCount),
            revenue: roundMoney(Number(row.revenue ?? row.totalRevenue ?? localMatch.revenue)),
            earnedCommission: roundMoney(
              Number(
                row.earnedCommission ??
                  row.commissionEarned ??
                  row.totalCommissionEarned ??
                  row.earned ??
                  localMatch.earnedCommission
              )
            ),
            paidCommission: roundMoney(
              Number(
                row.paidCommission ??
                  row.commissionPaid ??
                  row.totalPaid ??
                  row.paid ??
                  localMatch.paidCommission
              )
            ),
            payableBalance: roundMoney(
              Number(
                row.payableBalance ??
                  row.remainingBalance ??
                  row.balance ??
                  row.netPayable ??
                  localMatch.payableBalance
              )
            ),
            allTimeEarned: roundMoney(Number(row.allTimeEarned ?? localMatch.allTimeEarned)),
            allTimePaid: roundMoney(Number(row.allTimePaid ?? localMatch.allTimePaid)),
            recentAppointments: normalizedRecent,
            periodAppointments: normalizedPeriodItems,
          };
        });
        setServerStats(mergedStats);
      } else {
        setServerStats(localSnap.stats);
      }

      const sumObj = data.summary || data.totals || data.kpi;
      if (sumObj && typeof sumObj === 'object') {
        setServerSummary({
          totalRevenue: roundMoney(
            Number(sumObj.totalRevenue ?? sumObj.revenue ?? localSnap.summary.totalRevenue)
          ),
          totalEarnedCommission: roundMoney(
            Number(
              sumObj.totalCommissionEarned ??
                sumObj.totalEarnedCommission ??
                sumObj.earnedCommission ??
                sumObj.totalEarned ??
                localSnap.summary.totalEarnedCommission
            )
          ),
          totalPaidCommission: roundMoney(
            Number(
              sumObj.totalPaidCommission ??
                sumObj.totalCommissionPaid ??
                sumObj.paidCommission ??
                sumObj.totalPaid ??
                localSnap.summary.totalPaidCommission
            )
          ),
          totalPayableBalance: roundMoney(
            Number(
              sumObj.totalPayableBalance ??
                sumObj.payableBalance ??
                sumObj.totalRemainingBalance ??
                sumObj.remainingBalance ??
                localSnap.summary.totalPayableBalance
            )
          ),
        });
      } else {
        setServerSummary(null);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setApiError(err?.message || 'Prim verileri alınırken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, [period, staffList, appointments]);

  useEffect(() => {
    const controller = new AbortController();
    fetchCommissions(controller.signal);
    return () => controller.abort();
  }, [fetchCommissions]);

  useEffect(() => {
    const handleCommissionUpdated = () => {
      fetchCommissions();
    };
    window.addEventListener('staff_commission_updated', handleCommissionUpdated);
    return () => {
      window.removeEventListener('staff_commission_updated', handleCommissionUpdated);
    };
  }, [fetchCommissions]);

  useEffect(() => {
    if (!successNotice) return;
    const timer = setTimeout(() => setSuccessNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [successNotice]);

  const effectiveStats = useMemo(() => {
    const baseStats = serverStats || localFallback.stats;
    return staffList.map((st) => {
      const found = baseStats.find((s) => s.staffId === st.id);
      if (found) return found;
      return (
        localFallback.stats.find((s) => s.staffId === st.id) || {
          staffId: st.id,
          staffName: st.name,
          commissionRate: st.commissionRate ?? 30,
          completedCount: 0,
          noShowCount: 0,
          revenue: 0,
          earnedCommission: 0,
          paidCommission: 0,
          payableBalance: 0,
          allTimeEarned: 0,
          allTimePaid: 0,
          recentAppointments: [],
          periodAppointments: [],
        }
      );
    });
  }, [serverStats, localFallback.stats, staffList]);

  const effectiveSummary = useMemo<CommissionSummaryTotals>(() => {
    if (serverSummary) return serverSummary;
    return {
      totalRevenue: roundMoney(effectiveStats.reduce((s, x) => s + x.revenue, 0)),
      totalEarnedCommission: roundMoney(effectiveStats.reduce((s, x) => s + x.earnedCommission, 0)),
      totalPaidCommission: roundMoney(effectiveStats.reduce((s, x) => s + x.paidCommission, 0)),
      totalPayableBalance: roundMoney(effectiveStats.reduce((s, x) => s + x.payableBalance, 0)),
    };
  }, [serverSummary, effectiveStats]);

  const openPayModal = (staff: BarberStaff, stat: NormalizedStaffStat) => {
    setPayingStaff(staff);
    setPayAmount(stat.payableBalance > 0 ? String(stat.payableBalance) : '0');
    setPayMethod('nakit');
    setPayPeriodLabel(getDefaultPeriodLabel());
    setPayNote('');
    setPayError(null);
  };

  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingStaff) return;

    const numericAmount = Number(payAmount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setPayError('Lütfen 0’dan büyük geçerli bir ödeme tutarı giriniz.');
      return;
    }

    setIsSubmittingPayout(true);
    setPayError(null);

    try {
      const res = await fetch(`/api/barber/staff/${encodeURIComponent(payingStaff.id)}/pay-commission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: roundMoney(numericAmount),
          paymentMethod: payMethod,
          periodLabel: payPeriodLabel.trim() || getDefaultPeriodLabel(),
          note: payNote.trim(),
          staffName: payingStaff.name,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Prim ödemesi kaydedilemedi.');
      }

      const paidStaffName = payingStaff.name;
      setPayingStaff(null);
      setSuccessNotice(
        `${paidStaffName} için ₺${formatMoney(numericAmount)} prim ödemesi kaydedildi ve kasa giderlerine işlendi.`
      );
      window.dispatchEvent(new CustomEvent('staff_commission_updated'));
      await fetchCommissions();
    } catch (err: any) {
      setPayError(err?.message || 'Ödeme kaydedilirken bir hata oluştu.');
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  const handleDeletePayout = async (payout: StaffCommissionPayout) => {
    if (
      !window.confirm(
        `${payout.staffName} için ₺${formatMoney(payout.amount)} tutarındaki prim ödemesini iptal edip silmek istiyor musunuz? (İlişkili kasa gider kaydı da geri alınacaktır.)`
      )
    ) {
      return;
    }

    setDeletingPayoutId(payout.id);
    try {
      const res = await fetch(`/api/barber/commissions/payout/${encodeURIComponent(payout.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Prim ödeme kaydı silinemedi.');
      }
      setSuccessNotice(`${payout.staffName} prim ödeme kaydı iptal edildi.`);
      window.dispatchEvent(new CustomEvent('staff_commission_updated'));
      await fetchCommissions();
    } catch (err: any) {
      alert(err?.message || 'Ödeme silinirken hata oluştu.');
    } finally {
      setDeletingPayoutId(null);
    }
  };

  const handlePrintSlip = (staff: BarberStaff, stat: NormalizedStaffStat) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
      window.print();
      return;
    }

    const periodTitle = PERIOD_OPTIONS.find((p) => p.key === period)?.label || 'Bu Ay';
    const itemsToPrint =
      stat.periodAppointments.length > 0 ? stat.periodAppointments : stat.recentAppointments;

    const rowsHtml =
      itemsToPrint.length === 0
        ? `<tr><td colspan="5" style="padding:16px;text-align:center;color:#78716c;">Seçili dönemde tamamlanan randevu kaydı bulunmuyor.</td></tr>`
        : itemsToPrint
            .map(
              (item) => `
              <tr>
                <td>${escapeHtml(formatDateTr(item.date))} ${escapeHtml(item.timeSlot)}</td>
                <td>${escapeHtml(item.customerName)}</td>
                <td>${escapeHtml(item.serviceName)}</td>
                <td style="text-align:right;">₺${escapeHtml(formatMoney(item.price))}</td>
                <td style="text-align:right;font-weight:800;color:#b45309;">₺${escapeHtml(
                  formatMoney(item.commissionAmount)
                )}</td>
              </tr>`
            )
            .join('');

    const html = `
      <!DOCTYPE html>
      <html lang="tr">
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(storeName)} - Prim Hesap Pusulası (${escapeHtml(staff.name)})</title>
          <style>
            @page { size: A4 portrait; margin: 14mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            body { background: #fff; color: #1c1917; padding: 12px; font-size: 12px; }
            .card { border: 2px solid #1c1917; border-radius: 16px; padding: 24px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e7e5e4; padding-bottom: 14px; margin-bottom: 16px; }
            .shop { font-size: 20px; font-weight: 900; color: #0c0a09; }
            .doc-title { font-size: 13px; font-weight: 800; color: #ea580c; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
            .meta-right { text-align: right; font-size: 11px; color: #57534e; }
            .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 12px; padding: 12px; margin-bottom: 18px; }
            .info-label { font-size: 10px; text-transform: uppercase; color: #78716c; font-weight: 700; margin-bottom: 2px; }
            .info-val { font-size: 13px; font-weight: 800; color: #1c1917; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 11px; }
            th { background: #f5f5f4; color: #44403c; text-align: left; padding: 9px 10px; border-bottom: 2px solid #d6d3d1; font-weight: 800; text-transform: uppercase; font-size: 10px; }
            td { padding: 8px 10px; border-bottom: 1px solid #e7e5e4; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 28px; }
            .sum-box { border: 1.5px solid #e7e5e4; border-radius: 12px; padding: 12px; background: #ffffff; }
            .sum-box.highlight { border-color: #ea580c; background: #fff7ed; }
            .sum-label { font-size: 10px; font-weight: 700; color: #78716c; text-transform: uppercase; margin-bottom: 4px; }
            .sum-val { font-size: 16px; font-weight: 900; color: #0c0a09; }
            .sum-box.highlight .sum-val { color: #c2410c; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 36px; margin-top: 28px; padding-top: 16px; border-top: 1px dashed #d6d3d1; }
            .sig-box { text-align: center; }
            .sig-title { font-size: 11px; font-weight: 800; color: #44403c; margin-bottom: 42px; }
            .sig-line { border-top: 1px solid #78716c; width: 80%; margin: 0 auto; padding-top: 6px; font-size: 10px; color: #78716c; }
            .footer-note { margin-top: 18px; text-align: center; font-size: 10px; color: #a8a29e; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div>
                <div class="shop">${escapeHtml(storeName)}</div>
                <div class="doc-title">Prim Hesap Pusulası</div>
              </div>
              <div class="meta-right">
                <div><strong>Dönem:</strong> ${escapeHtml(periodTitle)}</div>
                <div><strong>Tarih:</strong> ${escapeHtml(new Date().toLocaleDateString('tr-TR'))}</div>
              </div>
            </div>

            <div class="info-grid">
              <div>
                <div class="info-label">Personel / Usta</div>
                <div class="info-val">${escapeHtml(staff.name)}</div>
              </div>
              <div>
                <div class="info-label">Görev / Unvan</div>
                <div class="info-val">${escapeHtml(staff.role || staff.title || 'Usta')}</div>
              </div>
              <div>
                <div class="info-label">Prim Oranı</div>
                <div class="info-val">%${escapeHtml(String(stat.commissionRate))}</div>
              </div>
              <div>
                <div class="info-label">Tamamlanan İş</div>
                <div class="info-val">${escapeHtml(String(stat.completedCount))} Adet</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Tarih / Saat</th>
                  <th>Müşteri</th>
                  <th>Hizmet</th>
                  <th style="text-align:right;">İşlem Tutarı</th>
                  <th style="text-align:right;">Prim</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <div class="summary-grid">
              <div class="sum-box">
                <div class="sum-label">Üretilen Ciro</div>
                <div class="sum-val">₺${escapeHtml(formatMoney(stat.revenue))}</div>
              </div>
              <div class="sum-box">
                <div class="sum-label">Hak Edilen Prim</div>
                <div class="sum-val">₺${escapeHtml(formatMoney(stat.earnedCommission))}</div>
              </div>
              <div class="sum-box">
                <div class="sum-label">Ödenen Prim</div>
                <div class="sum-val">₺${escapeHtml(formatMoney(stat.paidCommission))}</div>
              </div>
              <div class="sum-box highlight">
                <div class="sum-label">Kalan Net Bakiye</div>
                <div class="sum-val">₺${escapeHtml(formatMoney(stat.payableBalance))}</div>
              </div>
            </div>

            <div class="signatures">
              <div class="sig-box">
                <div class="sig-title">İşletme Yetkilisi</div>
                <div class="sig-line">İmza / Kaşe</div>
              </div>
              <div class="sig-box">
                <div class="sig-title">${escapeHtml(staff.name)} (Teslim Alan)</div>
                <div class="sig-line">İmza</div>
              </div>
            </div>

            <div class="footer-note">
              Dükkanım Yanımda · Berber &amp; Kuaför Personel Prim Takip Sistemi
            </div>
          </div>
        </body>
      </html>
    `;

    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Pusula yazdırma hatası:', err);
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 3000);
      }
    }, 250);
  };

  return (
    <div className="space-y-6">
      {/* Üst Başlık, Dönem Seçici & Aksiyonlar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-stone-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-orange-600" />
            <span>Salon Ustaları, Performans &amp; Prim Hakedişleri</span>
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Usta çalışma saatleri, izin günleri, ciro katkıları ve kasadan otomatik gider düşen prim ödemeleri
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dönem Seçici */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setPeriod(opt.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  period === opt.key
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-700/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => fetchCommissions()}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 transition-colors disabled:opacity-60"
            title="Prim verilerini yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </button>

          <button
            type="button"
            onClick={onAddStaffClick}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black cursor-pointer inline-flex items-center gap-1.5 shadow-md shadow-orange-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Personel Ekle</span>
          </button>
        </div>
      </div>

      {/* Bildirim Mesajları */}
      {successNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successNotice}</span>
          </span>
          <button
            type="button"
            onClick={() => setSuccessNotice(null)}
            className="p-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {apiError && (
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{apiError} (Yerel randevu verilerinden hesaplanan özet gösteriliyor.)</span>
        </div>
      )}

      {/* 4 Özet KPI Kartı */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Seçili Dönem Ciro
            </p>
            <p className="text-xl font-black text-stone-900 dark:text-white mt-1">
              ₺{formatMoney(effectiveSummary.totalRevenue)}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Hak Edilen Prim
            </p>
            <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
              ₺{formatMoney(effectiveSummary.totalEarnedCommission)}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Ödenen Prim
            </p>
            <p className="text-xl font-black text-sky-600 dark:text-sky-400 mt-1">
              ₺{formatMoney(effectiveSummary.totalPaidCommission)}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-orange-200 dark:border-orange-900/60 rounded-3xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Ödenecek Kalan Bakiye
            </p>
            <p className="text-xl font-black text-orange-600 dark:text-orange-400 mt-1">
              ₺{formatMoney(effectiveSummary.totalPayableBalance)}
            </p>
            <p className="text-[10px] text-stone-400 mt-0.5">Tüm zamanlar net kalan</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Personel Kartları */}
      {staffList.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-black text-stone-900 dark:text-white">Henüz Personel / Usta Eklenmemiş</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Ekibinizdeki ustaları ekleyerek randevu takvimini, çalışma saatlerini ve prim hakedişlerini tek yerden yönetin.
          </p>
          <button
            type="button"
            onClick={onAddStaffClick}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>İlk Ustayı Ekle</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {staffList.map((st, idx) => {
            const stat = effectiveStats[idx] || {
              staffId: st.id,
              staffName: st.name,
              commissionRate: st.commissionRate ?? 30,
              completedCount: 0,
              noShowCount: 0,
              revenue: 0,
              earnedCommission: 0,
              paidCommission: 0,
              payableBalance: 0,
              allTimeEarned: 0,
              allTimePaid: 0,
              recentAppointments: [],
              periodAppointments: [],
            };

            const isActive = st.active !== false;
            const workStart = st.workStart || st.workingHours?.start || '09:00';
            const workEnd = st.workEnd || st.workingHours?.end || '21:00';
            const cleanTel = (st.phone || '').replace(/[^\d+]/g, '');

            return (
              <div
                key={st.id}
                className={`bg-white dark:bg-stone-900 border rounded-3xl p-5 shadow-xs space-y-4 transition-all ${
                  isActive
                    ? 'border-stone-200 dark:border-stone-800'
                    : 'border-rose-200/80 dark:border-rose-900/50 opacity-85'
                }`}
              >
                {/* Kart Başlığı */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-xs shrink-0"
                      style={{ backgroundColor: st.color || '#3b82f6' }}
                    >
                      {getStaffInitials(st.name)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-black text-stone-900 dark:text-white">{st.name}</h3>
                        <button
                          type="button"
                          onClick={() => onToggleStaffActive(st.id)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1 cursor-pointer border transition-colors ${
                            isActive
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/25'
                          }`}
                          title={isActive ? 'Pasife al (randevu alımını durdur)' : 'Aktifleştir'}
                        >
                          <Power className="w-2.5 h-2.5" />
                          <span>{isActive ? 'Aktif' : 'Pasif'}</span>
                        </button>
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {st.role || st.title || 'Usta'}
                      </p>
                    </div>
                  </div>

                  {/* Sağ Aksiyon İkonları */}
                  <div className="flex items-center gap-1">
                    {cleanTel ? (
                      <a
                        href={`tel:${cleanTel}`}
                        className="p-2 rounded-xl text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
                        title={`Ara: ${st.phone}`}
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onEditStaff(st)}
                      className="p-2 rounded-xl text-stone-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors cursor-pointer"
                      title="Usta Profilini Düzenle"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteStaff(st.id)}
                      className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Ustayı Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Çalışma Saatleri & İzin Günleri & Telefon */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 rounded-2xl px-3 py-2">
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    <span>
                      {workStart}-{workEnd}
                    </span>
                  </span>
                  <span className="text-stone-300 dark:text-stone-600">•</span>
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>İzin: {formatOffDaysSummary(st.offDays)}</span>
                  </span>
                  {cleanTel && (
                    <>
                      <span className="text-stone-300 dark:text-stone-600">•</span>
                      <a
                        href={`tel:${cleanTel}`}
                        className="inline-flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{st.phone}</span>
                      </a>
                    </>
                  )}
                </div>

                {/* Performans & Prim Gridi */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800">
                    <span className="text-[10px] font-bold uppercase text-stone-400 block">Prim Oranı</span>
                    <span className="font-black text-amber-600 dark:text-amber-400 text-sm">
                      %{stat.commissionRate}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800">
                    <span className="text-[10px] font-bold uppercase text-stone-400 block">Tamamlanan İş</span>
                    <span className="font-black text-stone-900 dark:text-white text-sm inline-flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                      {stat.completedCount}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800">
                    <span className="text-[10px] font-bold uppercase text-stone-400 block">Gelmedi</span>
                    <span
                      className={`font-black text-sm inline-flex items-center gap-1 ${
                        stat.noShowCount > 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      <UserX className="w-3.5 h-3.5" />
                      {stat.noShowCount}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800">
                    <span className="text-[10px] font-bold uppercase text-stone-400 block">Üretilen Ciro</span>
                    <span className="font-black text-stone-900 dark:text-white text-sm">
                      ₺{formatMoney(stat.revenue)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800">
                    <span className="text-[10px] font-bold uppercase text-stone-400 block">Hak Edilen Prim</span>
                    <span className="font-black text-amber-600 dark:text-amber-400 text-sm">
                      ₺{formatMoney(stat.earnedCommission)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800">
                    <span className="text-[10px] font-bold uppercase text-stone-400 block">Ödenen Prim</span>
                    <span className="font-black text-sky-600 dark:text-sky-400 text-sm">
                      ₺{formatMoney(stat.paidCommission)}
                    </span>
                  </div>
                </div>

                {/* Vurgulu Ödenecek Kalan Rozeti */}
                <div
                  className={`p-3 rounded-2xl border flex items-center justify-between ${
                    stat.payableBalance > 0
                      ? 'bg-orange-500/10 border-orange-500/30 text-orange-800 dark:text-orange-200'
                      : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-800 dark:text-emerald-200'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <Wallet className="w-4 h-4 shrink-0" />
                    <span>Ödenecek Kalan Bakiye</span>
                  </div>
                  <span className="text-base font-black">₺{formatMoney(stat.payableBalance)}</span>
                </div>

                {/* Son Tamamlanan İşlemlerden 3 Satır Önizleme */}
                {stat.recentAppointments.length > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-stone-100 dark:border-stone-800">
                    <p className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                      Son Tamamlanan İşlemler
                    </p>
                    <div className="space-y-1">
                      {stat.recentAppointments.slice(0, 3).map((rec) => (
                        <div
                          key={rec.id}
                          className="flex items-center justify-between gap-2 text-[11px] px-2.5 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 text-stone-700 dark:text-stone-300"
                        >
                          <div className="truncate">
                            <span className="font-bold text-stone-900 dark:text-white">{rec.customerName}</span>
                            <span className="text-stone-400 mx-1">·</span>
                            <span>{rec.serviceName}</span>
                            <span className="text-stone-400 ml-1.5 text-[10px]">
                              ({formatDateTr(rec.date)} {rec.timeSlot})
                            </span>
                          </div>
                          <div className="shrink-0 font-bold text-right">
                            <span className="text-stone-500 dark:text-stone-400 mr-1.5">
                              ₺{formatMoney(rec.price)}
                            </span>
                            <span className="text-amber-600 dark:text-amber-400">
                              +₺{formatMoney(rec.commissionAmount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Kart Alt Aksiyon Butonları */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => openPayModal(st, stat)}
                    className="py-2.5 px-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-sm shadow-orange-600/20 transition-all active:scale-98"
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Prim Öde</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePrintSlip(st, stat)}
                    className="py-2.5 px-3 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs cursor-pointer inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Pusula Yazdır</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Son Prim Ödemeleri Geçmişi */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-stone-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-orange-600" />
              <span>Son Prim Ödemeleri Geçmişi</span>
            </h3>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
              Yapılan tüm prim ödemeleri kasa giderlerine işlenir; hatalı kayıtlar buradan iptal edilebilir
            </p>
          </div>
          <span className="text-xs font-bold text-stone-400">{payouts.length} Kayıt</span>
        </div>

        {payouts.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500 dark:text-stone-400">
            Henüz kaydedilmiş prim ödemesi bulunmuyor.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  <th className="p-3.5">Tarih</th>
                  <th className="p-3.5">Usta / Personel</th>
                  <th className="p-3.5">Yöntem</th>
                  <th className="p-3.5">Dönem / Not</th>
                  <th className="p-3.5 text-right">Tutar</th>
                  <th className="p-3.5 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {payouts.map((p) => {
                  const badge = paymentMethodBadge(p.paymentMethod);
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors"
                    >
                      <td className="p-3.5 whitespace-nowrap text-stone-600 dark:text-stone-300 font-medium">
                        {formatDateTr(p.date || p.createdAt)}
                      </td>
                      <td className="p-3.5 font-bold text-stone-900 dark:text-white">{p.staffName}</td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="p-3.5 text-stone-600 dark:text-stone-300 max-w-xs">
                        {p.periodLabel && (
                          <span className="font-semibold text-stone-800 dark:text-stone-200 block">
                            {p.periodLabel}
                          </span>
                        )}
                        {p.note ? (
                          <span className="text-[11px] text-stone-400">{p.note}</span>
                        ) : !p.periodLabel ? (
                          '-'
                        ) : null}
                      </td>
                      <td className="p-3.5 text-right font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        ₺{formatMoney(p.amount)}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          disabled={deletingPayoutId === p.id}
                          onClick={() => handleDeletePayout(p)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-50"
                          title="Prim ödemesini iptal et / sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Prim Ödeme Modalı */}
      {payingStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full border border-stone-200 dark:border-stone-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
                <Banknote className="w-5 h-5 text-orange-600" />
                <span>Prim Öde — {payingStaff.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setPayingStaff(null)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-200">
              <strong>Bilgi:</strong> Bu prim ödemesi kaydedildiğinde tutar otomatik olarak işletme kasasından gider (masraf) olarak düşülür.
            </div>

            <form onSubmit={handleSubmitPayout} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Ödeme Tutarı (₺) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm font-black text-stone-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Ödeme Yöntemi
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'nakit' as const, label: 'Nakit', icon: Banknote },
                    { key: 'kart' as const, label: 'Kredi Kartı', icon: CreditCard },
                    { key: 'havale' as const, label: 'Havale / EFT', icon: Landmark },
                  ].map((item) => {
                    const Icon = item.icon;
                    const active = payMethod === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setPayMethod(item.key)}
                        className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          active
                            ? 'bg-orange-600 border-orange-600 text-white shadow-xs'
                            : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Dönem Etiketi
                </label>
                <input
                  type="text"
                  value={payPeriodLabel}
                  onChange={(e) => setPayPeriodLabel(e.target.value)}
                  placeholder="Örn: Kasım 2026 Prim Hakedişi"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold text-stone-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Not (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="Örn: Haftalık avans / kısmi ödeme"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-900 dark:text-white focus:outline-hidden"
                />
              </div>

              {payError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold">
                  {payError}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayingStaff(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayout}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black cursor-pointer shadow-md shadow-orange-600/20 disabled:opacity-60"
                >
                  {isSubmittingPayout ? 'Kaydediliyor...' : 'Ödemeyi Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
