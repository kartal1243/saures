import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import {
  TrendingUp,
  BarChart3,
  LineChart as LineChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  Calendar,
  Sparkles,
  Percent,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';

interface RevenueVsExpensesChartProps {
  transactions: Transaction[];
}

interface DayComparisonData {
  dateStr: string;
  dayShort: string;
  dayFull: string;
  formattedDate: string;
  isToday: boolean;
  revenue: number;
  expenses: number;
  netProfit: number;
  profitMargin: number;
}

export const RevenueVsExpensesChart: React.FC<RevenueVsExpensesChartProps> = ({ transactions }) => {
  const [viewMode, setViewMode] = useState<'last7days' | 'currentWeek'>('last7days');
  const [chartType, setChartType] = useState<'bars' | 'area' | 'profit'>('bars');

  // Compute 7-day data
  const {
    daysData,
    totalRevenue,
    totalExpenses,
    netProfit,
    profitMargin,
    averageDailyProfit,
    profitableDaysCount,
    bestRevenueDay,
  } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const dayShortNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const dayFullNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

    const datesList: Date[] = [];

    if (viewMode === 'last7days') {
      // Rolling 7 days: 6 days ago through today
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        datesList.push(d);
      }
    } else {
      // Current calendar week (Monday to Sunday)
      const dayOfWeek = (now.getDay() + 6) % 7; // 0=Mon, 6=Sun
      const monday = new Date(now);
      monday.setDate(now.getDate() - dayOfWeek);
      monday.setHours(0, 0, 0, 0);

      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        datesList.push(d);
      }
    }

    const calculatedDays: DayComparisonData[] = [];
    let sumRevenue = 0;
    let sumExpenses = 0;
    let profitableCount = 0;

    for (const dateObj of datesList) {
      const dateStr = dateObj.toISOString().split('T')[0];
      const isToday = dateStr === todayStr;
      const dayIndex = dateObj.getDay();

      let dayRev = 0;
      let dayExp = 0;

      for (const tx of transactions) {
        if (tx.date && tx.date.startsWith(dateStr)) {
          if (tx.type === 'tahsilat') {
            dayRev += tx.amount;
          } else if (tx.type === 'gider') {
            dayExp += tx.amount;
          }
        }
      }

      sumRevenue += dayRev;
      sumExpenses += dayExp;
      const dayNet = dayRev - dayExp;
      if (dayNet > 0) profitableCount++;

      const dayMargin = dayRev > 0 ? Math.round((dayNet / dayRev) * 100) : dayExp > 0 ? -100 : 0;

      calculatedDays.push({
        dateStr,
        dayShort: dayShortNames[dayIndex],
        dayFull: dayFullNames[dayIndex],
        formattedDate: `${dateObj.getDate()} ${monthNames[dateObj.getMonth()]}`,
        isToday,
        revenue: dayRev,
        expenses: dayExp,
        netProfit: dayNet,
        profitMargin: dayMargin,
      });
    }

    const totalNet = sumRevenue - sumExpenses;
    const overallMargin = sumRevenue > 0 ? Math.round((totalNet / sumRevenue) * 100) : 0;
    const avgProfit = Math.round(totalNet / calculatedDays.length);

    let bestDay: DayComparisonData | null = null;
    for (const d of calculatedDays) {
      if (!bestDay || d.revenue > bestDay.revenue) {
        if (d.revenue > 0) bestDay = d;
      }
    }

    return {
      daysData: calculatedDays,
      totalRevenue: sumRevenue,
      totalExpenses: sumExpenses,
      netProfit: totalNet,
      profitMargin: overallMargin,
      averageDailyProfit: avgProfit,
      profitableDaysCount: profitableCount,
      bestRevenueDay: bestDay,
    };
  }, [transactions, viewMode]);

  // Date range label
  const rangeHeaderLabel = useMemo(() => {
    if (daysData.length === 0) return 'Son 7 Gün';
    const first = daysData[0];
    const last = daysData[daysData.length - 1];
    return `${first.formattedDate} - ${last.formattedDate} (${viewMode === 'last7days' ? 'Son 7 Gün' : 'Bu Hafta'})`;
  }, [daysData, viewMode]);

  // Custom Chart Tooltip
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DayComparisonData = payload[0].payload;
      return (
        <div className="bg-stone-900 text-white p-3.5 rounded-xl shadow-xl border border-stone-800 text-xs min-w-[200px] space-y-2 pointer-events-none">
          <div className="flex items-center justify-between border-b border-stone-800 pb-1.5 font-bold">
            <span className="text-stone-200">
              {data.dayFull} ({data.formattedDate})
            </span>
            {data.isToday && (
              <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-1.5 py-0.5 rounded">
                Bugün
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="flex items-center gap-1 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" /> Gelir (Revenue):
              </span>
              <span className="font-bold">{formatCurrency(data.revenue)}</span>
            </div>

            <div className="flex items-center justify-between text-rose-400">
              <span className="flex items-center gap-1 font-medium">
                <ArrowDownRight className="w-3.5 h-3.5" /> Gider (Expenses):
              </span>
              <span className="font-bold">{formatCurrency(data.expenses)}</span>
            </div>

            <div className="border-t border-stone-800 pt-1.5 flex items-center justify-between font-bold">
              <span className="text-stone-400">Net Kâr (Profit):</span>
              <span className={data.netProfit >= 0 ? 'text-emerald-300' : 'text-rose-400'}>
                {formatCurrency(data.netProfit)}
              </span>
            </div>

            {data.revenue > 0 && (
              <div className="flex items-center justify-between text-[11px] text-stone-400 pt-0.5">
                <span>Kâr Marjı:</span>
                <span className="font-bold text-amber-300">%{data.profitMargin}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="card-revenue-vs-expenses-summary"
      className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-xs overflow-hidden transition-colors"
    >
      {/* 1. Header Bar: Title, Range, Range Switcher & View Switcher */}
      <div className="p-4 sm:p-5 border-b border-stone-200/80 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold shrink-0">
            <Scale className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white">
                Gelir vs Gider &amp; Kârlılık Karşılaştırması
              </h2>
              {profitMargin > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />%{profitMargin} Net Kârlılık
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>{rangeHeaderLabel}</span>
              <span className="text-stone-300 dark:text-stone-700">•</span>
              <span>{profitableDaysCount}/7 Gün Kârlı Kapanış</span>
            </div>
          </div>
        </div>

        {/* Controls: Date range toggle & Chart mode toggle */}
        <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
          {/* Time range selector */}
          <div className="inline-flex items-center bg-stone-200/70 dark:bg-stone-800 p-0.5 rounded-lg text-xs font-semibold">
            <button
              id="btn-range-last7days"
              type="button"
              onClick={() => setViewMode('last7days')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'last7days'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              Son 7 Gün
            </button>
            <button
              id="btn-range-thisweek"
              type="button"
              onClick={() => setViewMode('currentWeek')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'currentWeek'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              Bu Hafta
            </button>
          </div>

          {/* Chart format switcher */}
          <div className="inline-flex items-center bg-stone-200/70 dark:bg-stone-800 p-0.5 rounded-lg text-xs font-semibold">
            <button
              id="btn-chart-bars"
              type="button"
              onClick={() => setChartType('bars')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                chartType === 'bars'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
              title="Karşılaştırmalı Çift Çubuk Grafiği"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Çift Çubuk</span>
            </button>
            <button
              id="btn-chart-area"
              type="button"
              onClick={() => setChartType('area')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                chartType === 'area'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
              title="Trend Eğrisi Grafiği"
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Trend</span>
            </button>
            <button
              id="btn-chart-profit"
              type="button"
              onClick={() => setChartType('profit')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                chartType === 'profit'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
              title="Net Kâr & Marj Grafiği"
            >
              <Percent className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Net Kâr</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Profitability Overview Metrics (Revenue, Expenses, Net Profit, Profit Margin) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-stone-200/80 dark:divide-stone-800 border-b border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900">
        {/* Metric 1: Toplam Gelir (Revenue) */}
        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 block mb-0.5">
              Toplam Gelir (Revenue)
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              7 günlük tahsilat &amp; satış
            </p>
          </div>
          <span className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
          </span>
        </div>

        {/* Metric 2: Toplam Gider (Expenses) */}
        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 block mb-0.5">
              Toplam Gider (Expenses)
            </span>
            <div className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-400 tracking-tight">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              Toptancı, fatura ve dükkan masrafı
            </p>
          </div>
          <span className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
            <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
          </span>
        </div>

        {/* Metric 3: Net Kâr (Net Profit) */}
        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 block mb-0.5">
              Net Kâr (Net Profit)
            </span>
            <div
              className={`text-xl sm:text-2xl font-black tracking-tight ${
                netProfit >= 0 ? 'text-stone-900 dark:text-white' : 'text-rose-700 dark:text-rose-400'
              }`}
            >
              {formatCurrency(netProfit)}
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              Gelirden masraflar düşüldükten sonra
            </p>
          </div>
          <span
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              netProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
          </span>
        </div>

        {/* Metric 4: Kârlılık Oranı & Günlük Ortalama */}
        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 block mb-0.5">
              Kârlılık Oranı (Profit Margin)
            </span>
            <div className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight flex items-baseline gap-1.5">
              <span className={profitMargin >= 40 ? 'text-emerald-700 dark:text-emerald-400' : profitMargin > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'}>
                %{profitMargin}
              </span>
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                (Ort. {formatCurrency(averageDailyProfit)}/gün)
              </span>
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              {profitMargin >= 50
                ? 'Yüksek kârlılıkla sağlıklı büyüme'
                : profitMargin > 20
                ? 'Dengeli işletme performansı'
                : 'Masraf baskısı yüksek'}
            </p>
          </div>
          <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Percent className="w-5 h-5" />
          </span>
        </div>
      </div>

      {/* 3. The Comparison Chart Container */}
      <div className="p-4 sm:p-5 bg-stone-50/20">
        {/* Legend */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4 text-xs font-semibold">
            {chartType !== 'profit' ? (
              <>
                <span className="inline-flex items-center gap-1.5 text-stone-700">
                  <span className="w-3 h-3 rounded-md bg-emerald-600"></span>
                  Gelir (Revenue)
                </span>
                <span className="inline-flex items-center gap-1.5 text-stone-700">
                  <span className="w-3 h-3 rounded-md bg-rose-600"></span>
                  Gider (Expenses)
                </span>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-stone-700">
                <span className="w-3 h-3 rounded-md bg-emerald-600"></span>
                Günlük Net Kâr (Revenue - Expenses)
              </span>
            )}
          </div>

          {bestRevenueDay && (
            <span className="hidden md:inline-flex items-center gap-1 text-xs text-stone-500 font-medium">
              En yüksek ciro günü: <strong>{bestRevenueDay.dayShort} ({formatCurrency(bestRevenueDay.revenue)})</strong>
            </span>
          )}
        </div>

        {/* Chart View */}
        <div className="h-60 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bars' ? (
              // Side-by-side Dual Bar Chart for Revenue vs Expenses
              <BarChart
                data={daysData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                <XAxis
                  dataKey="dayShort"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#78716c', fontWeight: 600 }}
                  tickFormatter={(val, idx) => {
                    const d = daysData[idx];
                    return d?.isToday ? `${val} (Bugün)` : val;
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#a8a29e' }}
                  tickFormatter={(val) => `${val}₺`}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar
                  dataKey="revenue"
                  name="Gelir"
                  fill="#059669"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="expenses"
                  name="Gider"
                  fill="#e11d48"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            ) : chartType === 'area' ? (
              // Area Chart for Revenue vs Expenses Trend
              <AreaChart
                data={daysData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="areaRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="areaExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                <XAxis
                  dataKey="dayShort"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#78716c', fontWeight: 600 }}
                  tickFormatter={(val, idx) => {
                    const d = daysData[idx];
                    return d?.isToday ? `${val} (Bugün)` : val;
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#a8a29e' }}
                  tickFormatter={(val) => `${val}₺`}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Gelir"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#areaRev)"
                  activeDot={{ r: 5, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name="Gider"
                  stroke="#e11d48"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#areaExp)"
                  activeDot={{ r: 4, fill: '#e11d48', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            ) : (
              // Net Profit Comparison Bar Chart
              <BarChart
                data={daysData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                <ReferenceLine y={0} stroke="#78716c" strokeWidth={1} />
                <XAxis
                  dataKey="dayShort"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#78716c', fontWeight: 600 }}
                  tickFormatter={(val, idx) => {
                    const d = daysData[idx];
                    return d?.isToday ? `${val} (Bugün)` : val;
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#a8a29e' }}
                  tickFormatter={(val) => `${val}₺`}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar
                  dataKey="netProfit"
                  name="Net Kâr"
                  fill="#059669"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* 4. Day-by-Day Comparative Profitability Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 mt-4 pt-3.5 border-t border-stone-200/80">
          {daysData.map((d) => (
            <div
              key={d.dateStr}
              className={`p-2 sm:p-2.5 rounded-xl border transition-all text-center flex flex-col justify-between ${
                d.isToday
                  ? 'bg-amber-50/90 border-amber-300 ring-1 ring-amber-300/40 shadow-xs'
                  : 'bg-white border-stone-200/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-stone-600">
                  <span>{d.dayShort}</span>
                  <span className="text-[10px] text-stone-400 font-normal">({d.formattedDate})</span>
                  {d.isToday && <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>}
                </div>

                <div className="text-xs sm:text-sm font-black text-emerald-700 mt-1">
                  {d.revenue > 0 ? formatCurrency(d.revenue) : '0 ₺'}
                </div>
                <div className="text-[11px] text-rose-600 font-medium">
                  {d.expenses > 0 ? `-${formatCurrency(d.expenses)}` : '0 ₺'}
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-stone-100">
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    d.netProfit > 0
                      ? 'bg-emerald-50 text-emerald-800'
                      : d.netProfit === 0
                      ? 'bg-stone-100 text-stone-600'
                      : 'bg-rose-50 text-rose-800'
                  }`}
                >
                  {d.netProfit > 0
                    ? `+${formatCurrency(d.netProfit)}`
                    : formatCurrency(d.netProfit)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
