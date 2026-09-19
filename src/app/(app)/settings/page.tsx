import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const user = await requireUser();
  const [company, users] = await Promise.all([
    prisma.companySettings.findUnique({ where: { id: "default" } }),
    user.role === "ADMIN"
      ? prisma.user.findMany({ orderBy: { name: "asc" } })
      : Promise.resolve([]),
  ]);

  return (
    <SettingsForm
      user={user}
      company={
        company ?? {
          id: "default",
          name: "ZelQ Solutions",
          tagline: "Build. Automate. Scale.",
          logoUrl: null,
          email: "contact@zelq.com",
          phone: "+1 (872) 212-2691",
        }
      }
      users={users}
    />
  );
}
