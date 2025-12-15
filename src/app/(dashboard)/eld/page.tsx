import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/dashboard/Header";
import { ELDDashboard } from "./ELDDashboard";
import { redirect } from "next/navigation";

async function getELDData(organizationId?: string, userId?: string, role?: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // For drivers, only show their own data
  if (role === "driver") {
    const driver = await prisma.driver.findFirst({
      where: { userId },
      include: {
        user: true,
        eldLogs: {
          where: {
            date: {
              gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
            },
          },
          orderBy: { startTime: "desc" },
        },
      },
    });

    return {
      drivers: driver ? [driver] : [],
      todayLogs: driver?.eldLogs.filter(
        (log) => log.date.getTime() === today.getTime()
      ) || [],
    };
  }

  // For fleet managers and admins
  const where = organizationId ? { organizationId } : {};

  const drivers = await prisma.driver.findMany({
    where,
    include: {
      user: true,
      currentVehicle: true,
      eldLogs: {
        where: {
          date: {
            gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { startTime: "desc" },
      },
    },
    orderBy: { user: { lastName: "asc" } },
  });

  const todayLogs = await prisma.eLDLog.findMany({
    where: {
      date: today,
      driver: organizationId ? { organizationId } : {},
    },
    include: {
      driver: {
        include: { user: true },
      },
    },
    orderBy: { startTime: "desc" },
  });

  return { drivers, todayLogs };
}

export default async function ELDPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const data = await getELDData(
    session.user.organizationId,
    session.user.id,
    session.user.role
  );

  return (
    <>
      <Header
        title="ELD Compliance"
        subtitle="Electronic Logging Device - Hours of Service tracking"
      />
      <div className="p-6">
        <ELDDashboard
          drivers={data.drivers}
          todayLogs={data.todayLogs}
          userRole={session.user.role}
        />
      </div>
    </>
  );
}
