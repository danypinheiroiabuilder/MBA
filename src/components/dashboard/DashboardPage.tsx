"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { motion } from "framer-motion";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { clampMonthKey, monthLabelFromKey, shiftMonthKey } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { useAuthStore } from "@/stores/auth";
import { useDataStore } from "@/stores/data";

function sumBy<T>(items: T[], pick: (t: T) => number) {
  return items.reduce((acc, t) => acc + pick(t), 0);
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const [monthKey, setMonthKey] = useState(() => format(new Date(), "yyyy-MM"));
  const [mounted, setMounted] = useState(false);
  const safeMonthKey = clampMonthKey(monthKey);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  const {
    categories,
    transactions: monthTx,
    cashflow12m,
    refreshCategories,
    refreshTransactions,
    refreshCashflow12m,
  } = useDataStore();

  useEffect(() => {
    if (!user) return;
    void refreshCategories();
    void refreshTransactions(safeMonthKey);
    void refreshCashflow12m();
  }, [user, refreshCategories, refreshTransactions, refreshCashflow12m, safeMonthKey]);

  const categoryById = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    for (const c of categories) map.set(c.id, { name: c.name, color: c.color });
    return map;
  }, [categories]);

  const monthTotals = useMemo(() => {
    const incomes = monthTx.filter((t) => t.type === "income");
    const expenses = monthTx.filter((t) => t.type === "expense");
    const totalIncome = sumBy(incomes, (t) => t.amount);
    const totalExpense = sumBy(expenses, (t) => t.amount);
    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      latest: [...monthTx]
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, 8),
    };
  }, [monthTx]);

  const chartData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) =>
      shiftMonthKey(safeMonthKey, -11 + i),
    );
    const map = new Map(cashflow12m.map((p) => [p.monthKey, p]));

    return months.map((m) => {
      const p = map.get(m);
      return {
        month: m.slice(5),
        monthKey: m,
        income: p?.income ?? 0,
        expense: p?.expense ?? 0,
        balance: p?.balance ?? 0,
      };
    });
  }, [cashflow12m, safeMonthKey]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-sm font-medium text-muted">Dashboard</div>
          <div className="text-2xl font-semibold tracking-tight text-text">
            {monthLabelFromKey(safeMonthKey)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => setMonthKey(shiftMonthKey(safeMonthKey, -1))}
          >
            Mês anterior
          </Button>
          <Button
            variant="ghost"
            onClick={() => setMonthKey(format(new Date(), "yyyy-MM"))}
          >
            Hoje
          </Button>
          <Button
            variant="ghost"
            onClick={() => setMonthKey(shiftMonthKey(safeMonthKey, 1))}
          >
            Próximo mês
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-muted">Receitas</div>
              <div className="mt-1 text-2xl font-semibold tracking-tight text-text">
                <AnimatedNumber value={monthTotals.totalIncome} />
              </div>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-income/15 ring-1 ring-income/25" />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-muted">Despesas</div>
              <div className="mt-1 text-2xl font-semibold tracking-tight text-text">
                <AnimatedNumber value={monthTotals.totalExpense} />
              </div>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-expense/15 ring-1 ring-expense/25" />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-muted">Saldo</div>
              <div className="mt-1 text-2xl font-semibold tracking-tight text-text">
                <AnimatedNumber value={monthTotals.balance} />
              </div>
              <div className="mt-2 text-xs text-muted">
                {monthTotals.balance >= 0 ? "Positivo" : "Negativo"}
              </div>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-primary/15 ring-1 ring-primary/25" />
          </div>
        </Card>
      </div>

      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
          <div>
            <div className="text-sm font-medium text-muted">Fluxo de caixa</div>
            <div className="text-base font-semibold tracking-tight text-text">
              Últimos 12 meses (linha/coluna)
            </div>
          </div>
        </div>

        <div className="h-[340px] px-2 pb-4 pt-4 sm:px-6">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ left: 8, right: 8 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "rgba(233,238,255,0.62)", fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  tick={{ fill: "rgba(233,238,255,0.62)", fontSize: 12 }}
                  tickFormatter={(v) =>
                    new Intl.NumberFormat("pt-BR", {
                      notation: "compact",
                      maximumFractionDigits: 1,
                    }).format(v as number)
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(11,18,36,0.92)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 16,
                    color: "rgba(233,238,255,0.92)",
                  }}
                  formatter={(value: unknown, name: unknown) => {
                    const n = String(name);
                    const label =
                      n === "income"
                        ? "Receitas"
                        : n === "expense"
                          ? "Despesas"
                          : "Saldo";
                    return [formatBRL(Number(value) || 0), label];
                  }}
                  labelFormatter={(
                    label: unknown,
                    payload: readonly { payload?: { monthKey?: string } }[],
                  ) => {
                    const key = payload?.[0]?.payload?.monthKey;
                    return key ? monthLabelFromKey(key) : String(label);
                  }}
                />

                <Bar
                  dataKey="income"
                  name="income"
                  fill="rgba(46,229,157,0.85)"
                  radius={[10, 10, 4, 4]}
                  animationDuration={650}
                />
                <Bar
                  dataKey="expense"
                  name="expense"
                  fill="rgba(255,91,138,0.85)"
                  radius={[10, 10, 4, 4]}
                  animationDuration={650}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  name="balance"
                  stroke="rgba(110,123,255,0.95)"
                  strokeWidth={2.5}
                  dot={false}
                  animationDuration={650}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full animate-pulse rounded-3xl bg-card/25" />
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-muted">Atividades</div>
              <div className="text-base font-semibold tracking-tight text-text">
                Últimos lançamentos
              </div>
            </div>
            <div className="text-xs text-muted">
              {monthTotals.latest.length} itens
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {monthTotals.latest.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card/30 p-4 text-sm text-muted">
                Nenhuma movimentação neste mês ainda.
              </div>
            ) : (
              monthTotals.latest.map((t) => {
                const c = categoryById.get(t.categoryId);
                return (
                  <motion.div
                    key={t.id}
                    layout
                    className="flex items-center justify-between rounded-2xl border border-border bg-card/30 px-3 py-2"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: c?.color ?? "rgba(255,255,255,0.25)" }}
                        />
                        <div className="truncate text-sm font-medium text-text">
                          {t.description}
                        </div>
                      </div>
                      <div className="mt-0.5 text-xs text-muted">
                        {c?.name ?? "Sem categoria"} • {t.date}
                        {t.tag ? ` • #${t.tag}` : ""}
                      </div>
                    </div>

                    <div
                      className={[
                        "shrink-0 text-sm font-semibold",
                        t.type === "income" ? "text-income" : "text-expense",
                      ].join(" ")}
                    >
                      {t.type === "income" ? "+" : "-"}
                      {formatBRL(t.amount)}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </Card>

        <Card>
          <div className="text-sm font-medium text-muted">Dica</div>
          <div className="mt-1 text-base font-semibold tracking-tight text-text">
            Cadastre por categoria e acompanhe o saldo mês a mês
          </div>
          <div className="mt-3 text-sm text-muted">
            Vá em <span className="text-text">Receitas &amp; Despesas</span> para
            lançar valores. Você pode adicionar novas{" "}
            <span className="text-text">Categorias</span> com cor para facilitar a
            leitura.
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => (window.location.href = "/transacoes")}>
              Lançar agora
            </Button>
            <Button variant="ghost" onClick={() => (window.location.href = "/categorias")}>
              Gerenciar categorias
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

