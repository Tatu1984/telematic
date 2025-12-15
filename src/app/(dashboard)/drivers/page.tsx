import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/dashboard/Header";
import { DriversList } from "./DriversList";
import { redirect } from "next/navigation";

async function getDrivers(organizationId?: string) {
  const where = organizationId ? { organizationId } : {};

  const drivers = await prisma.driver.findMany({
    where,
    include: {
      user: true,
      currentVehicle: true,
      _count: {
        select: {
          trips: true,
          incidents: true,
          safetyEvents: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return drivers;
}

export default async function DriversPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const allowedRoles = ["saas_admin", "company_admin", "fleet_manager"];
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/dashboard");
  }

  const drivers = await getDrivers(session.user.organizationId);

  return (
    <>
      <Header
        title="Drivers"
        subtitle={`Manage ${drivers.length} drivers in your fleet`}
      />
      <div className="p-6">
        <DriversList drivers={drivers} userRole={session.user.role} />
      </div>
    </>
  );
}
