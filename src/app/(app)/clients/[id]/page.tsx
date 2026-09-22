import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, CalendarDays, UsersRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/permissions";
import { projectProgress } from "@/server/queries";
import { formatDate } from "@/lib/dates";
import { PageHeader } from "@/components/shared/page-header";
import { PriorityBadge, StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Surface, SectionTitle } from "@/components/shared/surface";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Progress } from "@/components/ui/progress";
import { ClientNotes } from "./client-notes";
import { ClientDrive } from "./client-drive";
import { ClientLogo } from "./client-logo";
import { ClientDeleteButton } from "./client-delete-button";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      companyName: true,
      email: true,
      phone: true,
      country: true,
      status: true,
      notes: true,
      logoUrl: true,
      driveUrl: true,
      projects: {
        select: {
          id: true,
          name: true,
          status: true,
          priority: true,
          deadline: true,
          members: {
            select: {
              id: true,
              user: { select: { name: true, avatarUrl: true } },
            },
          },
          tasks: { select: { status: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });
  if (!client) notFound();

  const projects = client.projects.map((project) => ({
    ...project,
    progress: projectProgress(project.tasks),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <ClientLogo id={client.id} name={client.name} logoUrl={client.logoUrl} />
        <div className="min-w-0 flex-1">
          <PageHeader
            title={client.name}
            description={client.companyName || "Client record"}
            actions={<ClientDeleteButton id={client.id} />}
          />
        </div>
      </div>
      <Surface>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Meta label="Email">{client.email || "—"}</Meta>
          <Meta label="Phone">{client.phone || "—"}</Meta>
          <Meta label="Country">{client.country || "—"}</Meta>
          <Meta label="Status">
            <StatusBadge value={client.status} />
          </Meta>
        </div>
      </Surface>
      <ClientDrive id={client.id} driveUrl={client.driveUrl} />
      <ClientNotes id={client.id} notes={client.notes} />
      <section className="space-y-3">
        <SectionTitle title="Related projects" />
        {projects.length === 0 ? (
          <EmptyState title="No active projects." icon={Building2} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="rounded-xl border border-border bg-card p-5 transition-colors duration-150 hover:border-[#d0d5dd]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/projects/${project.id}`}
                      className="block truncate text-sm font-semibold text-[#111827] hover:text-[#111111]"
                    >
                      {project.name}
                    </Link>
                    <p className="mt-1 truncate text-[13px] text-[#667085]">
                      {client.name}
                      {client.companyName ? ` · ${client.companyName}` : ""}
                    </p>
                  </div>
                  <StatusBadge value={project.status} />
                </div>
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-[13px]">
                    <span className="text-[#667085]">Progress</span>
                    <span className="font-semibold text-[#027A48]">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-1.5" />
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#111827]">
                    <CalendarDays className="size-4 text-[#667085]" />
                    Due {formatDate(project.deadline)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UsersRound className="size-4 text-[#98A2B3]" />
                    <div className="flex -space-x-2">
                      {project.members.slice(0, 3).map((member) => (
                        <UserAvatar
                          key={member.id}
                          name={member.user.name}
                          src={member.user.avatarUrl}
                          className="size-6 border-white"
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <PriorityBadge value={project.priority} />
                </div>
              </div>
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
