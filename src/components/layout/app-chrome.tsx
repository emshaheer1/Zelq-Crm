"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Role } from "@prisma/client";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { getNotifications } from "@/server/actions/notifications";

type ShellUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  designation: string | null;
  avatarUrl: string | null;
};

export function AppChrome({ user, children }: { user: ShellUser; children: ReactNode }) {
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState<
    {
      id: string;
      title: string;
      body: string | null;
      href: string | null;
      read: boolean;
      createdAt?: Date | string;
    }[]
  >([]);

  useEffect(() => {
    getNotifications()
      .then((data) => {
        setUnread(data.unread);
        setNotifications(data.notifications);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar user={user} unread={unread} />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar user={user} unread={unread} notifications={notifications} />
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 py-5 md:px-7 md:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
