import { useLiveQuery } from "dexie-react-hooks";

import { db } from "./db";
import type { CashflowType } from "./types";

export function useCategories(type?: CashflowType) {
  return useLiveQuery(async () => {
    const all = await db.categories.orderBy("name").toArray();
    return type ? all.filter((c) => c.type === type) : all;
  }, [type]);
}

export function useTransactionsByMonth(monthKey: string) {
  return useLiveQuery(async () => {
    const from = `${monthKey}-01`;
    const to = `${monthKey}-31`;
    const items = await db.transactions.where("date").between(from, to, true, true).toArray();
    items.sort((a, b) => (a.date < b.date ? 1 : -1));
    return items;
  }, [monthKey]);
}

export function useAllTransactions() {
  return useLiveQuery(async () => {
    return await db.transactions.toArray();
  }, []);
}

