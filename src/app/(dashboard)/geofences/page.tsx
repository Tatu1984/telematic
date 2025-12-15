import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/dashboard/Header";
import { GeofenceManager } from "./GeofenceManager";
import { redirect } from "next/navigation";

async function getGeofences(organizationId?: string) {
  const where = organizationId ? { organizationId } : {};

  const geofences = await prisma.geofence.findMany({
    where,
    include: {
      _count: {
        select: { alerts: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return geofences;
}

export default async function GeofencesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const allowedRoles = ["saas_admin", "company_admin", "fleet_manager"];
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/dashboard");
  }

  const geofences = await getGeofences(session.user.organizationId);

  return (
    <>
      <Header
        title="Geofences"
        subtitle="Define geographic boundaries for vehicle monitoring"
      />
      <div className="p-6">
        <GeofenceManager geofences={geofences} />
      </div>
    </>
  );
}
