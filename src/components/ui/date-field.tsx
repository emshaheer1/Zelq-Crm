"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function DateField({
  name,
  value,
  defaultValue,
  onChange,
  required,
  className,
  id,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (event: { target: { value: string; name: string } }) => void;
  required?: boolean;
  className?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(value ?? defaultValue ?? "");
  const current = value !== undefined ? value : internal;
  const selected = current ? parseISO(current) : undefined;
  const valid = selected && !Number.isNaN(selected.getTime()) ? selected : undefined;

  function commit(date?: Date) {
    const next = date ? format(date, "yyyy-MM-dd") : "";
    if (value === undefined) setInternal(next);
    onChange?.({ target: { value: next, name: name ?? "" } });
    setOpen(false);
  }

  return (
    <>
      {name ? <input type="hidden" name={name} value={current} required={required} /> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            aria-expanded={open}
            className={cn(
              "flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-white px-2 text-left text-[13px] text-foreground outline-none",
              "hover:border-[#98A2B3] focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/15",
              "aria-expanded:border-ring aria-expanded:ring-2 aria-expanded:ring-ring/15",
              !valid && "text-muted-foreground",
              className,
            )}
          >
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-md",
                open ? "bg-[#B7FF00] text-[#111111]" : "bg-[#F4F6F8] text-[#667085]",
              )}
            >
              <CalendarDays className="size-3.5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1 truncate">
              {valid ? format(valid, "MMM d, yyyy") : "Select date"}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          className="z-[70] w-[292px] overflow-hidden rounded-2xl border border-[#EAECF0] bg-white p-0 shadow-[0_16px_40px_rgba(16,24,40,0.12)]"
        >
          <div className="flex items-center justify-between bg-[#111111] px-3.5 py-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B7FF00]">
              Date
            </span>
            <span className="text-[12px] font-medium text-white">
              {valid ? format(valid, "EEE, MMM d") : "Pick a day"}
            </span>
          </div>
          <div className="px-3 pt-3 pb-1">
            <Calendar
              mode="single"
              selected={valid}
              onSelect={commit}
              defaultMonth={valid}
            />
          </div>
          <div className="flex items-center justify-between border-t border-[#EAECF0] bg-[#F8FAFC] px-3 py-2">
            <button
              type="button"
              className="text-[12px] font-semibold text-[#111111] hover:text-[#344054]"
              onClick={() => commit(new Date())}
            >
              Today
            </button>
            <button
              type="button"
              className="text-[12px] font-medium text-[#667085] hover:text-[#111111]"
              onClick={() => commit(undefined)}
            >
              Clear
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
