import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <header className="main-header">
          <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-heading)" }}>
            JHOSTON TEC Piscinas
          </h2>
          <div className="flex-gap-12">
            <span style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 500 }}>
              Painel de Controle
            </span>
          </div>
        </header>
        <div className="main-body">{children}</div>
      </main>
    </div>
  );
}
