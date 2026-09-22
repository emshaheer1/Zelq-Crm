"use client";

import { useState, type ReactNode } from "react";
import type { Role } from "@prisma/client";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { CreateDialogsProvider } from "@/components/forms/create-dialogs";
import { ActionPopup } from "@/components/shared/action-popup";
import { LiveSync, type LiveNotice } from "@/components/layout/live-sync";

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
  const [notifications, setNotifications] = useState<LiveNotice[]>([]);

  return (
    <CreateDialogsProvider enabled={user.role !== "EMPLOYEE"}>
      <LiveSync
        onData={({ unread: nextUnread, notifications: next }) => {
          setUnread(nextUnread);
          setNotifications(next);
        }}
      />
      <div className="flex min-h-screen bg-background">
        <div className="hidden lg:block">
          <div className="sticky top-0 h-screen">
            <Sidebar user={user} unread={unread} />
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar
            user={user}
            unread={unread}
            notifications={notifications}
            onUnreadChange={setUnread}
            onNotificationsChange={setNotifications}
          />
          <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 py-5 md:px-7 md:py-6">
            {children}
          </main>
        </div>
        <ActionPopup />
      </div>
    </CreateDialogsProvider>
  );
}
