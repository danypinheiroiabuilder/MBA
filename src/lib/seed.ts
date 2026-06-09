import { nanoid } from "nanoid";

import { db } from "./db";
import type { Category } from "./types";

const SEED_KEY = "fluxo_seed_v1";

const seedCategories: Omit<Category, "id" | "createdAt">[] = [
  { name: "Salário", type: "income", color: "#6E7BFF" },
  { name: "Freelas", type: "income", color: "#3DE0C2" },
  { name: "Investimentos", type: "income", color: "#2EE59D" },

  { name: "Moradia", type: "expense", color: "#FF5B8A" },
  { name: "Alimentação", type: "expense", color: "#FF8A3D" },
  { name: "Transporte", type: "expense", color: "#A78BFA" },
  { name: "Saúde", type: "expense", color: "#60A5FA" },
  { name: "Lazer", type: "expense", color: "#FBBF24" },
];

export async function seedIfNeeded() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEED_KEY) === "1") return;

  const count = await db.categories.count();
  if (count > 0) {
    localStorage.setItem(SEED_KEY, "1");
    return;
  }

  const now = new Date().toISOString();
  await db.categories.bulkAdd(
    seedCategories.map((c) => ({
      id: nanoid(),
      createdAt: now,
      ...c,
    })),
  );

  localStorage.setItem(SEED_KEY, "1");
}

