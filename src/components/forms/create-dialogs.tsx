"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NewClientDialog,
  NewEventDialog,
  NewProjectDialog,
  NewTaskDialog,
} from "@/components/forms/entity-forms";

type Kind = "task" | "project" | "client" | "event";

type Option = { id: string; name: string };

type Options = {
  projects: Option[];
  clients: Option[];
  managers: Option[];
  employees: Option[];
};

const empty: Options = { projects: [], clients: [], managers: [], employees: [] };

const CreateDialogsContext = createContext<{
  open: (kind: Kind) => void;
  prefetch: () => void;
}>({
  open: () => {},
  prefetch: () => {},
});

export function useCreateDialogs() {
  return useContext(CreateDialogsContext);
}

export function CreateDialogsProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const [kind, setKind] = useState<Kind | null>(null);
  const [options, setOptions] = useState<Options>(empty);

  const prefetch = useCallback(() => {
    if (!enabled) return;
    fetch("/api/options")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data) setOptions(data as Options);
      })
      .catch(() => {});
  }, [enabled]);

  useEffect(() => {
    prefetch();
  }, [prefetch]);

  const open = useCallback(
    (next: Kind) => {
      setKind(next);
      prefetch();
    },
    [prefetch],
  );

  const value = useMemo(() => ({ open, prefetch }), [open, prefetch]);

  return (
    <CreateDialogsContext.Provider value={value}>
      {children}
      {enabled ? (
        <>
          <NewTaskDialog
            open={kind === "task"}
            onOpenChange={(next) => {
              if (!next) setKind(null);
            }}
            projects={options.projects}
            employees={options.employees}
          />
          <NewProjectDialog
            open={kind === "project"}
            onOpenChange={(next) => {
              if (!next) setKind(null);
            }}
            clients={options.clients}
            managers={options.managers}
            employees={options.employees}
          />
          <NewClientDialog
            open={kind === "client"}
            onOpenChange={(next) => {
              if (!next) setKind(null);
            }}
          />
          <NewEventDialog
            open={kind === "event"}
            onOpenChange={(next) => {
              if (!next) setKind(null);
            }}
            projects={options.projects}
            clients={options.clients}
            employees={options.employees}
          />
        </>
      ) : null}
    </CreateDialogsContext.Provider>
  );
}

export function CreateButton({
  kind,
  children,
  className,
}: {
  kind: Kind;
  children: ReactNode;
  className?: string;
}) {
  const { open, prefetch } = useCreateDialogs();
  return (
    <Button
      className={className}
      onPointerEnter={prefetch}
      onFocus={prefetch}
      onClick={() => open(kind)}
    >
      <Plus className="size-4" />
      {children}
    </Button>
  );
}
