import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/dashboard/Header";
import { VehiclesList } from "./VehiclesList";
import { redirect } from "next/navigation";

async function getVehicles(organizationId?: string) {
  const where = organizationId ? { organizationId } : {};

  const vehicles = await prisma.vehicle.findMany({
    where,
    include: {
      currentDriver: {
        include: {
          user: true,
        },
      },
      iotDevice: true,
      _count: {
        select: {
          trips: true,
          incidents: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return vehicles;
}

export default async function VehiclesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check role permissions
  const allowedRoles = ["saas_admin", "company_admin", "fleet_manager"];
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/dashboard");
  }

  const vehicles = await getVehicles(session.user.organizationId);

  return (
    <>
      <Header
        title="Vehicles"
        subtitle={`Manage your fleet of ${vehicles.length} vehicles`}
      />
      <div className="p-6">
        <VehiclesList vehicles={vehicles} userRole={session.user.role} />
      </div>
    </>
  );
}
