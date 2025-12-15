import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/dashboard/Header";
import { IncidentsList } from "./IncidentsList";
import { redirect } from "next/navigation";

async function getIncidents(organizationId?: string) {
  const where = organizationId ? { organizationId } : {};

  const incidents = await prisma.incident.findMany({
    where,
    include: {
      vehicle: true,
      driver: {
        include: { user: true },
      },
      videos: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return incidents;
}

export default async function IncidentsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const incidents = await getIncidents(session.user.organizationId);

  return (
    <>
      <Header
        title="Incidents"
        subtitle={`${incidents.filter((i) => i.status === "open").length} open incidents requiring attention`}
      />
      <div className="p-6">
        <IncidentsList incidents={incidents} userRole={session.user.role} />
      </div>
    </>
  );
}
