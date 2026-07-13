"use client";

import { useState, useEffect } from "react";
import ObraTab from "./components/ObraTab";
import FinanceiraTab from "./components/FinanceiraTab";

export default function CalculadoraPage() {
  const [mainTab, setMainTab] = useState("OBRA"); // "OBRA" ou "FINANCEIRA"

  // Sync tab with search parameters on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "financeira") {
        setMainTab("FINANCEIRA");
      } else if (tabParam === "obra") {
        setMainTab("OBRA");
      }
    }
  }, []);

  return (
    <div>
      {/* Abas Principais (Estilo Premium Glassmorphism) */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "28px",
          padding: "6px",
          backgroundColor: "rgba(0, 0, 0, 0.03)",
          borderRadius: "10px",
          maxWidth: "600px",
        }}
      >
        <button
          style={{
            flex: 1,
            padding: "10px 16px",
            fontSize: "14px",
            fontWeight: 700,
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            backgroundColor: mainTab === "OBRA" ? "var(--primary)" : "transparent",
            color: mainTab === "OBRA" ? "#fff" : "var(--text-muted)",
            transition: "var(--transition)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: mainTab === "OBRA" ? "var(--shadow-sm)" : "none",
          }}
          onClick={() => setMainTab("OBRA")}
        >
          📐 Calculadora de Obra
        </button>
        <button
          style={{
            flex: 1,
            padding: "10px 16px",
            fontSize: "14px",
            fontWeight: 700,
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            backgroundColor: mainTab === "FINANCEIRA" ? "var(--secondary)" : "transparent",
            color: mainTab === "FINANCEIRA" ? "#fff" : "var(--text-muted)",
            transition: "var(--transition)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: mainTab === "FINANCEIRA" ? "var(--shadow-sm)" : "none",
          }}
          onClick={() => setMainTab("FINANCEIRA")}
        >
          💰 Calculadora Financeira
        </button>
      </div>

      {mainTab === "OBRA" ? <ObraTab /> : <FinanceiraTab />}
    </div>
  );
}
