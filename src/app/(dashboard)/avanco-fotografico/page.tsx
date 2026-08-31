"use client";

import { useEffect, useState } from "react";
import { getObras } from "../obras/actions";
import { useRouter } from "next/navigation";

export default function GlobalAvancoFotograficoPage() {
  const [obras, setObras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getObras().then((data) => {
      setObras(data as any);
      setLoading(false);
    });
  }, []);

  const handleSelectObra = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val) {
      router.push(`/obras/${val}/avanco-fotografico`);
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-heading)" }}>
          Avanço Fotográfico
        </h2>
        <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>
          Acompanhe a evolução das obras através de comparativos Antes e Depois.
        </p>
      </div>

      <div style={{ backgroundColor: "var(--bg-card)", padding: "24px", borderRadius: "8px", border: "1px solid var(--border-color)", marginBottom: "30px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>Selecione uma Obra para visualizar ou criar relatórios</h3>
        
        {loading ? (
          <p>Carregando obras...</p>
        ) : (
          <div className="form-group" style={{ maxWidth: "400px" }}>
            <select className="form-control" onChange={handleSelectObra} defaultValue="">
              <option value="" disabled>-- Selecione uma Obra --</option>
              {obras.map(obra => (
                <option key={obra.id} value={obra.id}>
                  {obra.nome} {obra.status === "FINALIZADA" ? "(Finalizada)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
