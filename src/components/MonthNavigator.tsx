"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/Button";
import { shiftMonthKey } from "@/lib/dates";

interface MonthNavigatorProps {
  monthKey: string;
  onMonthChange: (monthKey: string) => void;
}

export function MonthNavigator({ monthKey, onMonthChange }: MonthNavigatorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="ghost"
        onClick={() => onMonthChange(shiftMonthKey(monthKey, -1))}
      >
        Mês anterior
      </Button>
      <Button
        variant="ghost"
        onClick={() => onMonthChange(format(new Date(), "yyyy-MM"))}
      >
        Hoje
      </Button>
      <Button
        variant="ghost"
        onClick={() => onMonthChange(shiftMonthKey(monthKey, 1))}
      >
        Próximo mês
      </Button>
    </div>
  );
}
