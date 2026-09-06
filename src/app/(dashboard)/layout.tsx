import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import PopUpCalculator from "@/components/PopUpCalculator";
import EasterEggs from "@/components/EasterEggs";
import { getSession } from "@/app/login/actions";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <DashboardHeader initialEmpresa={session?.userEmpresa || "JHOSTON"} />
        <div className="main-body">{children}</div>
      </main>
      <PopUpCalculator />
      <EasterEggs />
    </div>
  );
}

