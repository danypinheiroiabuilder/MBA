"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { motion } from "framer-motion";

import type { Transaction } from "@/lib/types";
import { transactionSchema, type TransactionInput } from "@/lib/types";
import { clampMonthKey, monthLabelFromKey, shiftMonthKey } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAuthStore } from "@/stores/auth";
import { useDataStore } from "@/stores/data";

export default function TransacoesPage() {
  const { user } = useAuthStore();
  const [monthKey, setMonthKey] = useState(() => format(new Date(), "yyyy-MM"));
  const safeMonthKey = clampMonthKey(monthKey);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const {
    categories: allCategories,
    transactions: tx,
    refreshCategories,
    refreshTransactions,
    saveTransaction,
    removeTransaction,
  } = useDataStore();

  useEffect(() => {
    void refreshCategories();
  }, [refreshCategories]);

  useEffect(() => {
    void refreshTransactions(safeMonthKey);
  }, [refreshTransactions, safeMonthKey]);

  const categoryById = useMemo(() => {
    const map = new Map<string, { name: string; color: string; type: string }>();
    for (const c of allCategories) map.set(c.id, { name: c.name, color: c.color, type: c.type });
    return map;
  }, [allCategories]);

  const form = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: "",
      type: "expense",
      categoryId: "",
      amount: 0,
      date: format(new Date(), "yyyy-MM-dd"),
      tag: "",
    },
  });

  const selectedType = useWatch({ control: form.control, name: "type" });
  const categoriesForType = useMemo(() => {
    return allCategories.filter((c) => c.type === selectedType);
  }, [allCategories, selectedType]);

  function openNew() {
    setEditing(null);
    form.reset({
      description: "",
      type: "expense",
      categoryId: "",
      amount: 0,
      date: format(new Date(), "yyyy-MM-dd"),
      tag: "",
    });
    setOpen(true);
  }

  function openEdit(t: Transaction) {
    setEditing(t);
    form.reset({
      description: t.description,
      type: t.type,
      categoryId: t.categoryId,
      amount: t.amount,
      date: t.date,
      tag: t.tag ?? "",
    });
    setOpen(true);
  }

  async function onSubmit(values: TransactionInput) {
    if (!user) return;
    await saveTransaction(values, user.id, editing?.id);

    setOpen(false);
    setEditing(null);
  }

  async function removeTx(id: string) {
    await removeTransaction(id);
  }

  const totals = useMemo(() => {
    const income = tx.filter((t) => t.type === "income").reduce((a, b) => a + b.amount, 0);
    const expense = tx.filter((t) => t.type === "expense").reduce((a, b) => a + b.amount, 0);
    return { income, expense, balance: income - expense };
  }, [tx]);

  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterTag, setFilterTag] = useState("");

  const filteredTx = useMemo(() => {
    const tag = filterTag.trim().replace(/^#/, "").toLowerCase();
    return tx.filter((t) => {
      if (filterCategoryId && t.categoryId !== filterCategoryId) return false;
      if (tag) {
        const has = (t.tag ?? "").toLowerCase().includes(tag);
        if (!has) return false;
      }
      return true;
    });
  }, [tx, filterCategoryId, filterTag]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-sm font-medium text-muted">Cadastros</div>
          <div className="text-2xl font-semibold tracking-tight text-text">
            Receitas &amp; Despesas
          </div>
          <div className="mt-1 text-sm text-muted">{monthLabelFromKey(safeMonthKey)}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => setMonthKey(shiftMonthKey(safeMonthKey, -1))}>
            Mês anterior
          </Button>
          <Button variant="ghost" onClick={() => setMonthKey(format(new Date(), "yyyy-MM"))}>
            Hoje
          </Button>
          <Button variant="ghost" onClick={() => setMonthKey(shiftMonthKey(safeMonthKey, 1))}>
            Próximo mês
          </Button>
          <Button variant="primary" onClick={openNew}>
            Novo lançamento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <div className="text-sm font-medium text-muted">Receitas</div>
          <div className="mt-1 text-xl font-semibold text-income">{formatBRL(totals.income)}</div>
        </Card>
        <Card>
          <div className="text-sm font-medium text-muted">Despesas</div>
          <div className="mt-1 text-xl font-semibold text-expense">{formatBRL(totals.expense)}</div>
        </Card>
        <Card>
          <div className="text-sm font-medium text-muted">Saldo</div>
          <div className="mt-1 text-xl font-semibold text-text">{formatBRL(totals.balance)}</div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-muted">Lançamentos</div>
            <div className="text-base font-semibold tracking-tight text-text">
              Lista do mês
            </div>
          </div>
          <div className="text-xs text-muted">{filteredTx.length} itens</div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted">Filtrar por categoria</div>
            <Select value={filterCategoryId} onChange={(e) => setFilterCategoryId(e.target.value)}>
              <option value="">Todas</option>
              {allCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted">Buscar por tag</div>
            <Input
              placeholder="Ex.: mercado"
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {filteredTx.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card/30 p-4 text-sm text-muted">
              Nenhum lançamento com os filtros atuais.
            </div>
          ) : (
            filteredTx
              .slice()
              .sort((a, b) => (a.date < b.date ? 1 : -1))
              .map((t) => {
                const c = categoryById.get(t.categoryId);
                return (
                  <motion.div
                    key={t.id}
                    layout
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/30 px-3 py-2"
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

                    <div className="flex shrink-0 items-center gap-2">
                      <div
                        className={[
                          "text-sm font-semibold",
                          t.type === "income" ? "text-income" : "text-expense",
                        ].join(" ")}
                      >
                        {t.type === "income" ? "+" : "-"}
                        {formatBRL(t.amount)}
                      </div>
                      <Button variant="ghost" className="px-3" onClick={() => openEdit(t)}>
                        Editar
                      </Button>
                      <Button variant="ghost" className="px-3" onClick={() => void removeTx(t.id)}>
                        Excluir
                      </Button>
                    </div>
                  </motion.div>
                );
              })
          )}
        </div>
      </Card>

      <Dialog
        open={open}
        title={editing ? "Editar lançamento" : "Novo lançamento"}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        footer={
          <div className="flex gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setOpen(false);
                setEditing(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="primary" type="button" onClick={form.handleSubmit(onSubmit)}>
              Salvar
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted">Descrição</div>
            <Input placeholder="Ex.: Compra no mercado" {...form.register("description")} />
            {form.formState.errors.description && (
              <div className="text-xs text-expense">{form.formState.errors.description.message}</div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted">Tipo</div>
              <Select
                {...form.register("type")}
                onChange={(e) => {
                  form.setValue(
                    "type",
                    e.target.value as TransactionInput["type"],
                    { shouldValidate: true },
                  );
                  form.setValue("categoryId", "", { shouldValidate: true });
                }}
              >
                <option value="income">Receita</option>
                <option value="expense">Despesa</option>
              </Select>
              {form.formState.errors.type && (
                <div className="text-xs text-expense">{form.formState.errors.type.message}</div>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-muted">Data</div>
              <Input type="date" {...form.register("date")} />
              {form.formState.errors.date && (
                <div className="text-xs text-expense">{form.formState.errors.date.message}</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted">Categoria</div>
              <Select {...form.register("categoryId")}>
                <option value="">Selecione...</option>
                {categoriesForType.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              {form.formState.errors.categoryId && (
                <div className="text-xs text-expense">{form.formState.errors.categoryId.message}</div>
              )}
              {categoriesForType.length === 0 && (
                <div className="text-xs text-muted">
                  Não há categorias para este tipo. Cadastre em{" "}
                  <span className="text-text">Categorias</span>.
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-muted">Valor</div>
              <Input
                type="number"
                step="0.01"
                inputMode="decimal"
                {...form.register("amount", { valueAsNumber: true })}
              />
              {form.formState.errors.amount && (
                <div className="text-xs text-expense">{form.formState.errors.amount.message}</div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-medium text-muted">Tag (opcional)</div>
            <Input placeholder="Ex.: mercado" {...form.register("tag")} />
            {form.formState.errors.tag && (
              <div className="text-xs text-expense">{form.formState.errors.tag.message}</div>
            )}
          </div>
        </form>
      </Dialog>
    </div>
  );
}

