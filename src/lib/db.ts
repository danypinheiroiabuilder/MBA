import Dexie, { type Table } from "dexie";

import type { Category, Transaction } from "./types";

export class FluxoDB extends Dexie {
  categories!: Table<Category, string>;
  transactions!: Table<Transaction, string>;

  constructor() {
    super("fluxo_db");
    this.version(1).stores({
      categories: "id, type, name, createdAt",
      transactions: "id, type, date, categoryId, createdAt",
    });
  }
}

export const db = new FluxoDB();

