"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const EMPTY = "__empty__";

type Option = { value: string; label: ReactNode; disabled?: boolean };

function readOptions(children: ReactNode): Option[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child)) return [];
    const type = (child as ReactElement).type;
    const props = child.props as {
      value?: string | number;
      children?: ReactNode;
      disabled?: boolean;
    };
    if (type === "optgroup") return readOptions(props.children);
    if (type === "option") {
      return [
        {
          value: String(props.value ?? ""),
          label: props.children,
          disabled: props.disabled,
        },
      ];
    }
    return [];
  });
}

export function AppSelect({
  className,
  children,
  value,
  defaultValue,
  onChange,
  name,
  required,
  disabled,
  id,
}: SelectHTMLAttributes<HTMLSelectElement>) {
  const options = useMemo(() => readOptions(children), [children]);
  const initial = String(defaultValue ?? options[0]?.value ?? "");
  const [uncontrolled, setUncontrolled] = useState(initial);
  const current = value !== undefined ? String(value) : uncontrolled;

  useEffect(() => {
    if (value !== undefined) return;
    if (options.length === 0) return;
    if (options.some((option) => option.value === uncontrolled)) return;
    setUncontrolled(String(options[0]?.value ?? ""));
  }, [options, uncontrolled, value]);

  function commit(next: string) {
    const resolved = next === EMPTY ? "" : next;
    if (value === undefined) setUncontrolled(resolved);
    onChange?.({
      target: { value: resolved, name: name ?? "" },
    } as React.ChangeEvent<HTMLSelectElement>);
  }

  return (
    <>
      {name ? <input type="hidden" name={name} value={current} required={required} /> : null}
      <Select value={current === "" ? EMPTY : current} onValueChange={commit} disabled={disabled}>
        <SelectTrigger id={id} className={cn("h-9 w-full min-w-0 text-[13px]", className)}>
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent position="popper" align="start" className="z-[120]">
          {options.map((option, index) => (
            <SelectItem
              key={`${option.value}-${index}`}
              value={option.value === "" ? EMPTY : option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
