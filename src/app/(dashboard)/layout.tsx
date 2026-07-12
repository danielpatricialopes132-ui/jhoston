import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import PopUpCalculator from "@/components/PopUpCalculator";

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
          <div className="flex-gap-12" style={{ alignItems: "center" }}>
            <Link
              href="/calculadora?tab=obra"
              className="btn btn-secondary btn-sm"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                fontSize: "13px",
                fontWeight: 600,
                borderRadius: "6px",
                backgroundColor: "rgba(2, 132, 199, 0.08)",
                color: "var(--primary)",
                border: "1px solid rgba(2, 132, 199, 0.2)",
                transition: "var(--transition)"
              }}
              title="Atalho para Calculadora de Obra"
            >
              📐 Calc. de Obra
            </Link>
            <Link
              href="/calculadora?tab=financeira"
              className="btn btn-secondary btn-sm"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                fontSize: "13px",
                fontWeight: 600,
                borderRadius: "6px",
                backgroundColor: "rgba(13, 148, 136, 0.08)",
                color: "var(--secondary)",
                border: "1px solid rgba(13, 148, 136, 0.2)",
                transition: "var(--transition)"
              }}
              title="Atalho para Calculadora Financeira"
            >
              💰 Calc. Financeira
            </Link>
            <span style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 500, marginLeft: "12px" }}>
              Painel de Controle
            </span>
          </div>
        </header>
        <div className="main-body">{children}</div>
      </main>
      <PopUpCalculator />
    </div>
  );
}

