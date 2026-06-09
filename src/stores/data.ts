"use client";

import { create } from "zustand";

import type { Category, Transaction } from "@/lib/types";
import { createCategory, deleteCategory, listCategories } from "@/services/categories";
import {
  deleteTransaction,
  listMonthlyCashflow,
  listTransactionsByMonth,
  upsertTransaction,
  type MonthlyCashflowPoint,
} from "@/services/transactions";

type DataState = {
  categories: Category[];
  categoriesLoading: boolean;

  monthKey: string | null;
  transactions: Transaction[];
  transactionsLoading: boolean;

  cashflow12m: MonthlyCashflowPoint[];
  cashflowLoading: boolean;

  refreshCategories: () => Promise<void>;
  refreshTransactions: (monthKey: string) => Promise<void>;
  refreshCashflow12m: () => Promise<void>;

  addCategory: (input: Parameters<typeof createCategory>[0], userId: string) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;

  saveTransaction: (
    input: Parameters<typeof upsertTransaction>[0],
    userId: string,
    editingId?: string,
  ) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
};

export const useDataStore = create<DataState>((set, get) => ({
  categories: [],
  categoriesLoading: false,

  monthKey: null,
  transactions: [],
  transactionsLoading: false,

  cashflow12m: [],
  cashflowLoading: false,

  refreshCategories: async () => {
    set({ categoriesLoading: true });
    try {
      const categories = await listCategories();
      set({ categories });
    } finally {
      set({ categoriesLoading: false });
    }
  },

  refreshTransactions: async (monthKey: string) => {
    set({ transactionsLoading: true, monthKey });
    try {
      const transactions = await listTransactionsByMonth(monthKey);
      set({ transactions });
    } finally {
      set({ transactionsLoading: false });
    }
  },

  refreshCashflow12m: async () => {
    set({ cashflowLoading: true });
    try {
      const cashflow12m = await listMonthlyCashflow(12);
      set({ cashflow12m });
    } finally {
      set({ cashflowLoading: false });
    }
  },

  addCategory: async (input, userId) => {
    await createCategory(input, userId);
    await get().refreshCategories();
  },

  removeCategory: async (id) => {
    await deleteCategory(id);
    await get().refreshCategories();
  },

  saveTransaction: async (input, userId, editingId) => {
    await upsertTransaction(input, userId, editingId);
    const monthKey = get().monthKey;
    if (monthKey) await get().refreshTransactions(monthKey);
    await get().refreshCashflow12m();
  },

  removeTransaction: async (id) => {
    await deleteTransaction(id);
    const monthKey = get().monthKey;
    if (monthKey) await get().refreshTransactions(monthKey);
    await get().refreshCashflow12m();
  },
}));

