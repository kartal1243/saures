import type { Express, Request, Response } from 'express';
import type { DailyClosing } from '../../shared/types';
import { S, saveState } from '../context';
import { calculateCashRegister } from '../cash';
import { broadcast } from '../realtime';
import { addDaysStr, localDay } from '../day';

export function registerClosingRoutes(app: Express): void {
  // 10. Daily Closings Routes (Gün Sonu Z Raporları)
  app.get('/api/daily-closings', (_req, res) => {
    res.json({ closings: S().dailyClosings || [] });
  });

  app.post('/api/daily-closings', (req: Request, res: Response) => {
    const { note, closedBy } = req.body;
    const cash = calculateCashRegister();

    // Kapanışta patron TOPLAM CİROYU bildirir (nakit + POS + havale), sadece nakit değil.
    // Eski istemciler actualCashCount gönderiyordu — geriye dönük kabul.
    const reported = req.body.actualTotalIncome !== undefined ? req.body.actualTotalIncome : req.body.actualCashCount;
    const expectedTotalIncome = cash.todayTotalIncome;
    const actualTotalIncome = Number(reported) || 0;
    const totalDiff = actualTotalIncome - expectedTotalIncome;

    // Kapanan gün = açık olan iş günü; kapanışla yeni iş günü açılır (Z-raporu)
    const closingDay = S().businessDate || localDay();
    const todayStr = closingDay;
    const newClosing: DailyClosing = {
      id: `close_${Date.now()}`,
      date: todayStr,
      closedAt: new Date().toISOString(),
      // Eski alanlar da toplam ciro mantığıyla doldurulur (aynı üçlü, tek hesap)
      expectedCash: expectedTotalIncome,
      actualCashCount: actualTotalIncome,
      diffAmount: totalDiff,
      totalIncomeToday: cash.todayTotalIncome,
      todayCash: cash.todayCash,
      todayCard: cash.todayCard,
      todayBank: cash.todayBank,
      todayExpense: cash.todayExpense,
      netProfitToday: cash.todayTotalIncome - cash.todayExpense,
      expectedTotalIncome,
      actualTotalIncome,
      totalDiff,
      note: note || '',
      closedBy: closedBy || S().shopProfile?.ownerName || 'Kasiyer / Esnaf',
    };

    if (!S().dailyClosings) {
      S().dailyClosings = [];
    }

    // Replace if closing already exists for today or unshift
    const existingIdx = S().dailyClosings.findIndex((c) => c.date === todayStr);
    if (existingIdx !== -1) {
      S().dailyClosings[existingIdx] = newClosing;
    } else {
      S().dailyClosings.unshift(newClosing);
    }

    // Günü devret: yeni iş günü açılır, kasa sıfırlanır
    S().businessDate = addDaysStr(closingDay, 1);
    saveState();
    const newCash = calculateCashRegister();
    broadcast({ type: 'DAILY_CLOSING_CREATED', payload: newClosing });
    broadcast({ type: 'CASH_UPDATED', payload: newCash });
    res.json({ success: true, closing: newClosing, cash: newCash, businessDate: S().businessDate });
  });
}
