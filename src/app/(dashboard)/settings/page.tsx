import { auth } from "@/lib/auth";
import { Header } from "@/components/dashboard/Header";
import { SettingsPage } from "./SettingsPage";
import { redirect } from "next/navigation";

export default async function Settings() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <>
      <Header title="Settings" subtitle="Manage your account and preferences" />
      <div className="p-6">
        <SettingsPage user={session.user} />
      </div>
    </>
  );
}
