import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Surface, SectionTitle } from "@/components/shared/surface";
import { ClientNotes } from "./client-notes";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: { projects: { include: { manager: true, tasks: true } } },
  });
  if (!client) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={client.name} description={client.companyName || "Client record"} />
      <Surface>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Meta label="Email">{client.email || "—"}</Meta>
          <Meta label="Phone">{client.phone || "—"}</Meta>
          <Meta label="Country">{client.country || "—"}</Meta>
          <Meta label="Status"><StatusBadge value={client.status} /></Meta>
        </div>
      </Surface>
      <ClientNotes client={client} />
      <section className="space-y-3">
        <SectionTitle title="Related projects" />
        {client.projects.length === 0 ? (
          <EmptyState title="No active projects." icon={Building2} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {client.projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-colors duration-150 hover:border-[#D0D5DD]"
              >
                <p className="font-semibold text-[#111827]">{project.name}</p>
                <p className="mt-1 text-sm text-[#667085]">
                  {project.manager.name} · {project.tasks.length} tasks
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#667085]">{label}</p>
      <div className="mt-1 text-sm text-[#111827]">{children}</div>
    </div>
  );
}
