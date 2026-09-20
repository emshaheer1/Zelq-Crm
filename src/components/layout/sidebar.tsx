"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Bell,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  Settings,
  Users,
} from "lucide-react";
import type { Role } from "@prisma/client";
import { ZelqLogo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const workLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/clients", label: "Clients", icon: Building2 },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
];

const manageLinks = [
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/reports", label: "Reports", icon: ChartNoAxesCombined },
];

const accountLinks = [
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  user,
  unread,
}: {
  user: { id: string; name: string; role: Role; designation: string | null; avatarUrl: string | null };
  unread: number;
}) {
  const pathname = usePathname();
  const staff = user.role !== "EMPLOYEE";

  return (
    <aside className="flex h-full w-[260px] flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-5">
        <ZelqLogo inverted />
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-3">
        <NavGroup title="Workspace">
          {workLinks
            .filter((link) => staff || link.href !== "/clients")
            .map((link) => (
              <NavLink key={link.href} {...link} pathname={pathname} unread={unread} />
            ))}
        </NavGroup>
        {staff ? (
          <NavGroup title="Manage">
            {manageLinks.map((link) => (
              <NavLink key={link.href} {...link} pathname={pathname} unread={unread} />
            ))}
          </NavGroup>
        ) : null}
        <NavGroup title="Account">
          {accountLinks.map((link) => (
            <NavLink key={link.href} {...link} pathname={pathname} unread={unread} />
          ))}
        </NavGroup>
      </nav>
    </aside>
  );
}

function NavGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="px-3 pb-2 text-[11px] font-semibold tracking-[0.14em] text-white/35 uppercase">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  pathname,
  unread,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  pathname: string;
  unread: number;
}) {
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      prefetch
      className={cn(
        "relative flex h-9 items-center gap-3 rounded-lg px-3 text-xs font-medium transition-colors duration-150",
        active ? "bg-sidebar-accent text-white" : "text-white/60 hover:bg-white/5 hover:text-white",
      )}
    >
      {active ? (
        <span className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
      ) : null}
      <Icon className={cn("size-[18px]", active ? "text-primary" : "text-white/45")} aria-hidden="true" />
      <span className="flex-1">{label}</span>
      {href === "/notifications" && unread > 0 ? (
        <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
          {unread}
        </span>
      ) : null}
    </Link>
  );
}
