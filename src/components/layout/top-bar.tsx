"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  CheckSquare,
  Eye,
  FolderKanban,
  Menu,
  Plus,
  Search,
  UserRound,
  LogOut,
  ChevronDown,
} from "lucide-react";
import type { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";
import { UserAvatar } from "@/components/shared/user-avatar";
import { apiJson } from "@/lib/client-api";
import { logoutAction } from "@/server/actions/auth";
import { formatDateTime } from "@/lib/dates";
import { roleLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";

const titles: Record<string, { title: string; description: string }> = {
  "/dashboard": { title: "Dashboard", description: "Here's what's happening with your team today." },
  "/tasks": { title: "Tasks", description: "Manage and track your team's work." },
  "/projects": { title: "Projects", description: "Organize work by client and deadline." },
  "/clients": { title: "Clients", description: "Internal records for ZelQ projects." },
  "/calendar": { title: "Calendar", description: "Deadlines, reviews, and meetings." },
  "/employees": { title: "Employees", description: "Workload and monthly work history." },
  "/reports": { title: "Reports", description: "Monthly performance and completion." },
  "/notifications": { title: "Notifications", description: "Assignments, reviews, and deadlines." },
  "/settings": { title: "Settings", description: "Account and company preferences." },
};

type SearchResult = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  type: string;
};

export function TopBar({
  user,
  unread,
  notifications,
}: {
  user: {
    id: string;
    name: string;
    role: Role;
    designation: string | null;
    avatarUrl: string | null;
    email: string;
  };
  unread: number;
  notifications: {
    id: string;
    title: string;
    body: string | null;
    href: string | null;
    read: boolean;
    createdAt?: Date | string;
  }[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const page =
    Object.entries(titles).find(([href]) => pathname === href || pathname.startsWith(`${href}/`))?.[1] ??
    { title: "ZelQ CRM", description: "Internal work management." };
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [pending, setPending] = useState(false);
  const staff = user.role !== "EMPLOYEE";

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      setPending(true);
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((response) => (response.ok ? response.json() : []))
        .then((data) => setResults(Array.isArray(data) ? data : []))
        .catch(() => setResults([]))
        .finally(() => setPending(false));
    }, 200);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-5 md:px-7">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" showCloseButton={false} className="w-[260px] gap-0 border-sidebar-border bg-sidebar p-0">
            <Sidebar user={user} unread={unread} />
          </SheetContent>
        </Sheet>

        <div className="min-w-0 lg:hidden">
          <p className="truncate text-[13px] font-semibold text-foreground">{page.title}</p>
        </div>

        <div className="relative hidden min-w-0 flex-1 md:block md:max-w-md lg:max-w-lg">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tasks, projects, people"
            className="h-9 w-full rounded-lg border border-transparent bg-muted/80 pr-3 pl-9 text-[13px] outline-none placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-ring/15"
          />
          {query.trim().length >= 2 ? (
            <div className="absolute top-11 z-30 w-full rounded-xl border border-border bg-white p-1.5 shadow-[0_12px_32px_rgba(16,24,40,0.12)]">
              {pending ? (
                <p className="px-2.5 py-3 text-[13px] text-muted-foreground">Searching…</p>
              ) : results.length === 0 ? (
                <p className="px-2.5 py-3 text-[13px] text-muted-foreground">No matches.</p>
              ) : (
                results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    className="flex w-full flex-col rounded-lg px-2.5 py-2 text-left transition-colors duration-150 hover:bg-muted"
                    onClick={() => {
                      setQuery("");
                      router.push(result.href);
                    }}
                  >
                    <span className="text-[13px] font-medium text-foreground">{result.title}</span>
                    <span className="text-[12px] text-muted-foreground">{result.subtitle}</span>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-9 px-3">
                <Plus className="size-3.5" />
                <span className="hidden sm:inline">New</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {staff ? (
                <>
                  <DropdownMenuItem onClick={() => router.push("/tasks?new=1")}>
                    <CheckSquare className="size-4" /> New Task
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/projects?new=1")}>
                    <FolderKanban className="size-4" /> New Project
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/clients?new=1")}>
                    <UserRound className="size-4" /> New Client
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/calendar?new=1")}>
                    <CalendarDays className="size-4" /> New Calendar Event
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem disabled>Ask a manager to create work items</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative size-9" aria-label="Notifications">
                <Bell className="size-4" />
                {unread > 0 ? (
                  <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary ring-2 ring-white" />
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-2">
              <div className="flex items-center justify-between px-2 py-1.5">
                <p className="text-xs font-semibold text-muted-foreground">Notifications</p>
                {unread > 0 ? (
                  <button className="text-xs font-medium text-foreground" onClick={() => apiJson("/api/notifications", { method: "PATCH", json: { all: true } })}>
                    Mark all as read
                  </button>
                ) : null}
              </div>
              {notifications.length === 0 ? (
                <p className="px-2 py-8 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
              ) : (
                notifications.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    className="items-start gap-3 py-2.5"
                    onClick={async () => {
                      await apiJson("/api/notifications", { method: "PATCH", json: { id: item.id } }).catch(() => {});
                      if (item.href) router.push(item.href);
                    }}
                  >
                    <span className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
                      <Eye className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-sm", item.read ? "text-muted-foreground" : "font-medium text-foreground")}>
                        {item.title}
                      </span>
                      {item.body ? <span className="mt-0.5 block text-xs text-muted-foreground">{item.body}</span> : null}
                      {item.createdAt ? (
                        <span className="mt-1 block text-[11px] text-muted-foreground">{formatDateTime(item.createdAt)}</span>
                      ) : null}
                    </span>
                    {!item.read ? <span className="mt-1.5 size-1.5 rounded-full bg-primary" /> : null}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="hidden h-6 w-px bg-border sm:block" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 rounded-lg py-1 pr-2 pl-1 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/20"
                aria-label="Account menu"
              >
                <UserAvatar name={user.name} src={user.avatarUrl} className="size-8" />
                <span className="hidden min-w-0 text-left sm:block">
                  <span className="block max-w-[140px] truncate text-[13px] font-medium leading-tight text-foreground">
                    {user.name}
                  </span>
                  <span className="block max-w-[140px] truncate text-[11px] leading-tight text-muted-foreground">
                    {user.designation || roleLabel[user.role]}
                  </span>
                </span>
                <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 p-0">
              <div className="flex items-center gap-3 px-3.5 py-3">
                <UserAvatar name={user.name} src={user.avatarUrl} className="size-10" />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-foreground">{user.name}</p>
                  <p className="truncate text-[12px] text-muted-foreground">
                    {user.designation || roleLabel[user.role]}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator className="my-0" />
              <div className="p-1.5">
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <UserRound className="size-4" /> My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logoutAction()}>
                  <LogOut className="size-4" /> Logout
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
