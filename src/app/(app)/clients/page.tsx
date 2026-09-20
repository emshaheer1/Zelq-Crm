import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/permissions";
import { ClientsWorkspace } from "./clients-workspace";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  await requireStaff();
  const params = await searchParams;
  const clients = await prisma.client.findMany({
    include: { projects: true },
    orderBy: { name: "asc" },
  }).catch((error) => {
    console.error("clients.page", error);
    return [];
  });

  return <ClientsWorkspace clients={clients} openCreate={params.new === "1"} />;
}
