"use client"

import * as React from "react"
import { cn } from "cn"
import {
  DayPicker,
  DayButton,
  type Locale,
} from "react-day-picker"
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "lucide-react"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  locale,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-0", className)}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatWeekdayName: (weekday) =>
          weekday.toLocaleDateString(locale?.code, { weekday: "short" }).slice(0, 2),
        ...formatters,
      }}
      classNames={{
        root: "w-fit",
        months: "flex flex-col",
        month: "flex w-full flex-col gap-3",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous:
          "inline-flex size-7 items-center justify-center rounded-full text-[#344054] hover:bg-[#EEF1F4] hover:text-[#111111] aria-disabled:opacity-30",
        button_next:
          "inline-flex size-7 items-center justify-center rounded-full text-[#344054] hover:bg-[#EEF1F4] hover:text-[#111111] aria-disabled:opacity-30",
        month_caption: "flex h-7 items-center justify-center px-8",
        caption_label: "text-[13px] font-semibold tracking-tight text-[#101828]",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "flex-1 pb-1 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[#98A2B3] select-none",
        week: "mt-0.5 flex w-full",
        day: "relative p-0 text-center",
        today: "",
        selected: "",
        outside: "",
        disabled: "opacity-30",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => (
          <div
            data-slot="calendar"
            ref={rootRef}
            className={cn("relative", className)}
            {...props}
          />
        ),
        Chevron: ({ className, orientation, ...props }) => {
          const Icon =
            orientation === "left"
              ? ChevronLeftIcon
              : orientation === "right"
                ? ChevronRightIcon
                : ChevronDownIcon
          return <Icon className={cn("size-3.5", className)} {...props} />
        },
        DayButton: (props) => <CalendarDayButton locale={locale} {...props} />,
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <button
      ref={ref}
      type="button"
      data-day={day.date.toLocaleDateString(locale?.code)}
      className={cn(
        "mx-auto flex size-8 items-center justify-center rounded-full text-[12px] font-medium text-[#101828] outline-none",
        "hover:bg-[#EEF1F4]",
        modifiers.outside && "text-[#98A2B3]",
        modifiers.today && !modifiers.selected && "ring-1 ring-[#B7FF00] ring-inset",
        modifiers.selected && "bg-[#B7FF00] text-[#111111] hover:bg-[#a8ee00]",
        modifiers.disabled && "pointer-events-none opacity-30",
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
