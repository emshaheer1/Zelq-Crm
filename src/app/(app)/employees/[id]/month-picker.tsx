"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { fieldSelectClass } from "@/lib/styles";
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
    <div className="flex gap-2">
      <AppSelect
        className={fieldSelectClass}
        value={month}
        onChange={(event) => update(year, Number(event.target.value))}
      >
        {Array.from({ length: 12 }, (_, index) => (
          <option key={index + 1} value={index + 1}>
            {new Date(2026, index, 1).toLocaleString("en", { month: "long" })}
          </option>
        ))}
      </AppSelect>
      <AppSelect
        className={fieldSelectClass}
        value={year}
        onChange={(event) => update(Number(event.target.value), month)}
      >
        {[2025, 2026, 2027].map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </AppSelect>
    </div>
  );
}
