import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { DriverELDLog } from "./DriverELDLog";

interface PageProps {
  params: Promise<{ driverId: string }>;
  searchParams: Promise<{ date?: string }>;
}

export default async function DriverELDPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { driverId } = await params;
  const { date } = await searchParams;

  const selectedDate = date ? new Date(date) : new Date();
  selectedDate.setHours(0, 0, 0, 0);

  const endDate = new Date(selectedDate);
  endDate.setHours(23, 59, 59, 999);

  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      currentVehicle: {
        select: {
          id: true,
          licensePlate: true,
          make: true,
          model: true,
        },
      },
      organization: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!driver) {
    redirect("/eld");
  }

  // Get ELD logs for the selected date
  const eldLogs = await prisma.eLDLog.findMany({
    where: {
      driverId,
      date: {
        gte: selectedDate,
        lte: endDate,
      },
    },
    orderBy: { startTime: "asc" },
  });

  // Get logs for the past 7 days for the weekly summary
  const weekAgo = new Date(selectedDate);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const weeklyLogs = await prisma.eLDLog.findMany({
    where: {
      driverId,
      date: {
        gte: weekAgo,
        lte: endDate,
      },
    },
    orderBy: { startTime: "asc" },
  });

  return (
    <div className="space-y-6">
      <DriverELDLog
        driver={driver}
        eldLogs={eldLogs}
        weeklyLogs={weeklyLogs}
        selectedDate={selectedDate.toISOString()}
      />
    </div>
  );
}
