import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/dashboard/Header";
import { TrackingDashboard } from "./TrackingDashboard";
import { redirect } from "next/navigation";

async function getTrackingData(organizationId?: string) {
  const where = organizationId ? { organizationId } : {};

  const vehicles = await prisma.vehicle.findMany({
    where: {
      ...where,
      status: "active",
    },
    include: {
      currentDriver: {
        include: { user: true },
      },
      iotDevice: true,
      locations: {
        orderBy: { timestamp: "desc" },
        take: 1,
      },
    },
  });

  const geofences = await prisma.geofence.findMany({
    where: { ...where, status: "active" },
  });

  return { vehicles, geofences };
}

export default async function TrackingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const data = await getTrackingData(session.user.organizationId);

  return (
    <>
      <Header
        title="Live Tracking"
        subtitle="Real-time vehicle location and status monitoring"
      />
      <div className="p-6">
        <TrackingDashboard
          vehicles={data.vehicles}
          geofences={data.geofences}
        />
      </div>
    </>
  );
}
