import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/dashboard/Header";
import { AdminDashboard } from "./AdminDashboard";
import { redirect } from "next/navigation";

async function getAdminData(organizationId?: string, role?: string) {
  // SaaS admins see all data, company admins see only their org
  const isSaaSAdmin = role === "saas_admin" || role === "saas_subscriber_manager";

  const [organizations, users, systemStats] = await Promise.all([
    // Get organizations (only for SaaS admins)
    isSaaSAdmin
      ? prisma.organization.findMany({
          include: {
            _count: {
              select: { users: true, vehicles: true, drivers: true },
            },
          },
          orderBy: { createdAt: "desc" },
        })
      : [],

    // Get users
    prisma.user.findMany({
      where: organizationId && !isSaaSAdmin ? { organizationId } : {},
      include: {
        organization: true,
      },
      orderBy: { createdAt: "desc" },
    }),

    // System stats
    {
      totalOrganizations: await prisma.organization.count(),
      totalUsers: organizationId && !isSaaSAdmin
        ? await prisma.user.count({ where: { organizationId } })
        : await prisma.user.count(),
      totalVehicles: organizationId && !isSaaSAdmin
        ? await prisma.vehicle.count({ where: { organizationId } })
        : await prisma.vehicle.count(),
      totalDrivers: organizationId && !isSaaSAdmin
        ? await prisma.driver.count({ where: { organizationId } })
        : await prisma.driver.count(),
    },
  ]);

  return { organizations, users, systemStats, isSaaSAdmin };
}

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const allowedRoles = ["saas_admin", "saas_subscriber_manager", "company_admin"];
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/dashboard");
  }

  const data = await getAdminData(session.user.organizationId, session.user.role);

  return (
    <>
      <Header
        title="Admin Panel"
        subtitle={data.isSaaSAdmin ? "Platform Administration" : "Organization Management"}
      />
      <div className="p-6">
        <AdminDashboard {...data} userRole={session.user.role} />
      </div>
    </>
  );
}
