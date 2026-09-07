"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSession } from "@/app/login/actions";

interface DashboardHeaderProps {
  initialEmpresa?: string;
}

export function getCompanyDisplay(empresa?: string | null) {
  if (!empresa) return { name: "JHOSTON TEC", icon: "🏢", color: "#0f766e", tag: "JHOSTON" };

  const norm = empresa.toUpperCase().trim();
  if (norm === "ECO_STONE" || norm.includes("ECO")) {
    return { name: "ECO STONE", icon: "🌿", color: "#16a34a", tag: "ECO STONE" };
  }
  if (norm === "JHOSTON_REVEST" || norm.includes("REVEST")) {
    return { name: "JHOSTON REVEST", icon: "✨", color: "#d97706", tag: "REVEST" };
  }
  return { name: "JHOSTON TEC", icon: "🏢", color: "#0f766e", tag: "JHOSTON" };
}

export default function DashboardHeader({ initialEmpresa = "JHOSTON" }: DashboardHeaderProps) {
  const [empresa, setEmpresa] = useState(initialEmpresa);

  useEffect(() => {
    // Sincroniza com evento disparado pela Sidebar
    const handleContextChange = (e: CustomEvent<string>) => {
      if (e.detail) {
        setEmpresa(e.detail);
      }
    };

    window.addEventListener("empresaContextChanged" as any, handleContextChange);

    // Também verifica a sessão atual
    getSession().then((sess) => {
      if (sess?.userEmpresa) {
        setEmpresa(sess.userEmpresa);
      }
    });

    return () => {
      window.removeEventListener("empresaContextChanged" as any, handleContextChange);
    };
  }, []);

  const info = getCompanyDisplay(empresa);

  return (
    <header className="main-header">
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "22px" }}>{info.icon}</span>
        <div>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: info.color,
              lineHeight: 1.2,
              margin: 0,
              letterSpacing: "-0.3px",
              transition: "color 0.2s ease",
            }}
          >
            {info.name}
          </h2>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--text-muted)",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            Contexto Ativo
          </span>
        </div>
      </div>

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
            transition: "var(--transition)",
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
            transition: "var(--transition)",
          }}
          title="Atalho para Calculadora Financeira"
        >
          💰 Calc. Financeira
        </Link>
        <span
          style={{
            fontSize: "14px",
            color: "var(--text-muted)",
            fontWeight: 500,
            marginLeft: "12px",
          }}
        >
          Painel de Controle
        </span>
      </div>
    </header>
  );
}
