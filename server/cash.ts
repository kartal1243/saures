import type { CashRegister } from '../src/types';
import { S } from './context';

// Canlı kasa & bakiye hesabı (günün tarihi UTC gün sınırına göre)
export function calculateCashRegister(): CashRegister {
  const todayStr = new Date().toISOString().split('T')[0];
  let todayCash = 0;
  let todayCard = 0;
  let todayBank = 0;
  let todayExpense = 0;

  for (const tx of S().transactions) {
    if (tx.date.startsWith(todayStr)) {
      if (tx.type === 'tahsilat') {
        if (tx.paymentMethod === 'nakit') todayCash += tx.amount;
        else if (tx.paymentMethod === 'kart') todayCard += tx.amount;
        else if (tx.paymentMethod === 'havale') todayBank += tx.amount;
      } else if (tx.type === 'gider' || tx.type === 'masraf') {
        todayExpense += tx.amount;
      }
    }
  }

  const todayTotalIncome = todayCash + todayCard + todayBank;
  const netTodayCash = todayCash - todayExpense;

  let totalReceivables = 0;
  let overdueCount = 0;
  let dueTodayCount = 0;

  for (const c of S().customers) {
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
