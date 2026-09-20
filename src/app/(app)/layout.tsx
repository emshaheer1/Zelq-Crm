import { requireUser } from "@/lib/permissions";
import { AppChrome } from "@/components/layout/app-chrome";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <AppChrome user={user}>{children}</AppChrome>;
}
