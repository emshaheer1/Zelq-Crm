import { AppChrome } from "@/components/layout/app-chrome";
import { requireUser } from "@/lib/permissions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <AppChrome user={user}>{children}</AppChrome>;
}
