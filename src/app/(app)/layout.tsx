import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [unread, notifications] = await Promise.all([
    prisma.notification.count({ where: { userId: user.id, read: false } }),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

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
