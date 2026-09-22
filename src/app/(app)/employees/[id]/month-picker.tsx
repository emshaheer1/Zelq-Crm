"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AppSelect } from "@/components/ui/app-select";

export function MonthPicker({ year, month }: { year: number; month: number }) {
  const router = useRouter();
  const params = useSearchParams();

  const update = (nextYear: number, nextMonth: number) => {
    const search = new URLSearchParams(params.toString());
    search.set("year", String(nextYear));
    search.set("month", String(nextMonth));
    router.push(`?${search.toString()}`);
  };

  return (
    <div className="flex shrink-0 items-center gap-2">
      <AppSelect
        className="h-9 w-[138px] min-w-[138px] shrink-0"
        value={String(month)}
        onChange={(event) => update(year, Number(event.target.value))}
      >
        {Array.from({ length: 12 }, (_, index) => (
          <option key={index + 1} value={String(index + 1)}>
            {new Date(2026, index, 1).toLocaleString("en", { month: "long" })}
          </option>
        ))}
      </AppSelect>
      <AppSelect
        className="h-9 w-[92px] min-w-[92px] shrink-0"
        value={String(year)}
        onChange={(event) => update(Number(event.target.value), month)}
      >
        {[2025, 2026, 2027].map((value) => (
          <option key={value} value={String(value)}>
            {value}
          </option>
        ))}
      </AppSelect>
    </div>
  );
}
