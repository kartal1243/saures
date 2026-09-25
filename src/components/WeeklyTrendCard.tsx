import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Sparkles,
  BarChart3,
  LineChart as LineChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface WeeklyTrendCardProps {
  transactions: Transaction[];
}

interface DayData {
  dateStr: string;
  dayShort: string;
  dayFull: string;
  isToday: boolean;
  earnings: number;
  expenditure: number;
  net: number;
}

export const WeeklyTrendCard: React.FC<WeeklyTrendCardProps> = ({ transactions }) => {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  // Compute current week's days (Monday to Sunday)
  const { weekDays, totalWeekEarnings, totalWeekExpenditure, netWeekBalance, bestDay } = useMemo(() => {
    const now = new Date();
    // In JS: 0=Sun, 1=Mon, ..., 6=Sat
    // Convert to Monday as start:
    const dayOfWeek = (now.getDay() + 6) % 7; // 0 for Monday, 6 for Sunday
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek);
    monday.setHours(0, 0, 0, 0);

    const todayStr = now.toISOString().split('T')[0];

    const dayNames = [
      { short: 'Pzt', full: 'Pazartesi' },
      { short: 'Sal', full: 'Salı' },
      { short: 'Çar', full: 'Çarşamba' },
      { short: 'Per', full: 'Perşembe' },
      { short: 'Cum', full: 'Cuma' },
      { short: 'Cmt', full: 'Cumartesi' },
      { short: 'Paz', full: 'Pazar' },
    ];

    const days: DayData[] = [];
    let weekEarnings = 0;
    let weekExpenditure = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const isToday = dateStr === todayStr;

      let dayEarnings = 0;
      let dayExpenditure = 0;

      for (const tx of transactions) {
        if (tx.date && tx.date.startsWith(dateStr)) {
          if (tx.type === 'tahsilat') {
            dayEarnings += tx.amount;
          } else if (tx.type === 'gider' || tx.type === 'masraf') {
            dayExpenditure += tx.amount;
          }
        }
      }

      weekEarnings += dayEarnings;
      weekExpenditure += dayExpenditure;

      days.push({
        dateStr,
        dayShort: dayNames[i].short,
        dayFull: dayNames[i].full,
        isToday,
        earnings: dayEarnings,
        expenditure: dayExpenditure,
        net: dayEarnings - dayExpenditure,
      });
    }

    // Find best earning day
    let best: DayData | null = null;
    for (const d of days) {
      if (!best || d.earnings > best.earnings) {
        if (d.earnings > 0) best = d;
      }
    }

    return {
      weekDays: days,
      totalWeekEarnings: weekEarnings,
      totalWeekExpenditure: weekExpenditure,
      netWeekBalance: weekEarnings - weekExpenditure,
      bestDay: best,
    };
  }, [transactions]);

  // Formatter for date range label
  const weekRangeLabel = useMemo(() => {
    if (weekDays.length < 7) return 'Bu Hafta';
    const first = new Date(weekDays[0].dateStr);
    const last = new Date(weekDays[6].dateStr);
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return `${first.getDate()} ${months[first.getMonth()]} - ${last.getDate()} ${months[last.getMonth()]} (Bu Hafta)`;
  }, [weekDays]);

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DayData = payload[0].payload;
      return (
        <div className="bg-stone-900 text-white p-3 rounded-xl shadow-lg border border-stone-800 text-xs min-w-[170px] space-y-1.5 pointer-events-none">
          <div className="flex items-center justify-between border-b border-stone-800 pb-1 font-bold">
            <span>{data.dayFull}</span>
            {data.isToday && (
              <span className="bg-amber-500 text-stone-900 text-[10px] font-black px-1.5 py-0.5 rounded">
                Bugün
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-emerald-400">
            <span className="flex items-center gap-1 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" /> Kazanç:
            </span>
            <span className="font-bold">{formatCurrency(data.earnings)}</span>
          </div>
          <div className="flex items-center justify-between text-rose-400">
            <span className="flex items-center gap-1 font-medium">
              <ArrowDownRight className="w-3.5 h-3.5" /> Harcama:
            </span>
            <span className="font-bold">{formatCurrency(data.expenditure)}</span>
          </div>
          <div className="border-t border-stone-800 pt-1 flex items-center justify-between font-semibold">
            <span className="text-stone-400">Net Kasa:</span>
            <span className={data.net >= 0 ? 'text-stone-100 font-bold' : 'text-rose-400 font-bold'}>
              {formatCurrency(data.net)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="card-weekly-trend-summary"
      className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-xs overflow-hidden"
    >
      {/* Top Header of the Summary Card */}
      <div className="p-4 sm:p-5 border-b border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
                Haftalık Kazanç &amp; Harcama Trendi
                {bestDay && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    En yüksek: {bestDay.dayShort} ({formatCurrency(bestDay.earnings)})
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
                <span>{weekRangeLabel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart View Toggle & Legend */}
        <div className="flex items-center gap-2.5 self-start md:self-center">
          <div className="flex items-center gap-3 text-xs mr-2">
            <span className="inline-flex items-center gap-1.5 font-medium text-stone-700 dark:text-stone-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Kazanç
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-stone-700 dark:text-stone-300">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              Harcama
            </span>
          </div>

          <div className="inline-flex items-center bg-stone-200/70 dark:bg-stone-800 p-0.5 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                chartType === 'area'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
              title="Alan Trend Grafiği"
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Trend</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
              title="Çubuk Karşılaştırma Grafiği"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Çubuk</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Metric Pills: Haftalık Kazanç, Haftalık Harcama, Net Kasa */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-stone-200/80 dark:divide-stone-800 border-b border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900">
        {/* 1. Toplam Kazanç */}
        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 block mb-0.5">
              Haftalık Toplam Kazanç (Ciro)
            </span>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
              {formatCurrency(totalWeekEarnings)}
            </div>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">
              Bu hafta kasaya giren tahsilatlar
            </p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
          </span>
        </div>

        {/* 2. Toplam Harcama */}
        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 block mb-0.5">
              Haftalık Toplam Harcama (Gider)
            </span>
            <div className="text-2xl font-black text-rose-700 dark:text-rose-400 tracking-tight">
              {formatCurrency(totalWeekExpenditure)}
            </div>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">
              Toptancı, fatura ve dükkan masrafları
            </p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0">
            <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
          </span>
        </div>

        {/* 3. Net Kasa */}
        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 block mb-0.5">
              Haftalık Net Kasa Durumu
            </span>
            <div
              className={`text-2xl font-black tracking-tight ${
                netWeekBalance >= 0 ? 'text-stone-900 dark:text-white' : 'text-rose-700 dark:text-rose-400'
              }`}
            >
              {formatCurrency(netWeekBalance)}
            </div>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">
              {netWeekBalance >= 0
                ? 'Harcamalar düşüldükten sonra kalan net'
                : 'Harcama ciroyu aştı'}
            </p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </span>
        </div>
      </div>

      {/* Simple Data Visualization (Recharts) */}
      <div className="p-4 sm:p-5 bg-stone-50/20 dark:bg-stone-800/20">
        <div className="h-56 sm:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart
                data={weekDays}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorExpenditure" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                <XAxis
                  dataKey="dayShort"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#78716c', fontWeight: 600 }}
                  tickFormatter={(val, idx) => {
                    const d = weekDays[idx];
                    return d?.isToday ? `${val} (Bugün)` : val;
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#a8a29e' }}
                  tickFormatter={(val) => `${val}₺`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="earnings"
                  name="Kazanç"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorEarnings)"
                  activeDot={{ r: 5, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="expenditure"
                  name="Harcama"
                  stroke="#e11d48"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorExpenditure)"
                  activeDot={{ r: 4, fill: '#e11d48', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            ) : (
              <BarChart
                data={weekDays}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                <XAxis
                  dataKey="dayShort"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#78716c', fontWeight: 600 }}
                  tickFormatter={(val, idx) => {
                    const d = weekDays[idx];
                    return d?.isToday ? `${val} (Bugün)` : val;
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#a8a29e' }}
                  tickFormatter={(val) => `${val}₺`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="earnings"
                  name="Kazanç"
                  fill="#059669"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="expenditure"
                  name="Harcama"
                  fill="#e11d48"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Small Daily Breakdown Pills */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mt-3 pt-3 border-t border-stone-200/80 dark:border-stone-800 text-center">
          {weekDays.map((d) => (
            <div
              key={d.dateStr}
              className={`p-1.5 sm:p-2 rounded-xl border transition-all ${
                d.isToday
                  ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 ring-1 ring-amber-300/40'
                  : 'bg-white dark:bg-stone-800 border-stone-200/80 dark:border-stone-700'
              }`}
            >
              <div className="text-[11px] font-bold text-stone-600 dark:text-stone-300 flex items-center justify-center gap-1">
                <span>{d.dayShort}</span>
                {d.isToday && <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>}
              </div>
              <div className="text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                {d.earnings > 0 ? `${d.earnings}₺` : '0₺'}
              </div>
              <div className="text-[10px] text-stone-400 dark:text-stone-500 font-medium">
                {d.expenditure > 0 ? `-${d.expenditure}₺` : '0₺'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
