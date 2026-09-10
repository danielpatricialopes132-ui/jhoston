"use client";

import { useEffect, useState, startTransition } from "react";
import { getPlanoContas, getCentrosCusto, seedPlanoContasPadrao, syncObrasComoCentrosCusto, criarPlanoConta, criarCentroCusto, deleteCentroCusto, deletePlanoConta } from "./actions";

export default function ContabilidadeDashboard() {
  const [contas, setContas] = useState<any[]>([]);
  const [centros, setCentros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // States para forms
  const [novaConta, setNovaConta] = useState({ codigo: "", descricao: "", tipo: "DESPESA" });
  const [novoCentro, setNovoCentro] = useState({ codigo: "", nome: "" });

  const carregarDados = async () => {
    setLoading(true);
    const [c, cc] = await Promise.all([getPlanoContas(), getCentrosCusto()]);
    setContas(c);
    setCentros(cc);
    setLoading(false);
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleSeedContas = () => {
    startTransition(async () => {
      await seedPlanoContasPadrao();
      await carregarDados();
    });
  };

  const handleSyncObras = () => {
    startTransition(async () => {
      await syncObrasComoCentrosCusto();
      await carregarDados();
    });
  };

  const handleCriarConta = async (e: React.FormEvent) => {
    e.preventDefault();
    await criarPlanoConta({ ...novaConta });
    setNovaConta({ codigo: "", descricao: "", tipo: "DESPESAS" });
    await carregarDados();
  };

  const handleCriarCentro = async (e: React.FormEvent) => {
    e.preventDefault();
    await criarCentroCusto({ ...novoCentro });
    setNovoCentro({ codigo: "", nome: "" });
    await carregarDados();
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-heading)" }}>
            Configuração Contábil
          </h2>
          <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>
            Gerencie seu Plano de Contas e Centros de Custo
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <a href="/financeiro" className="btn btn-secondary">
            &larr; Voltar para Financeiro
          </a>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
        {/* COLUNA PLANO DE CONTAS */}
        <div style={{ backgroundColor: "var(--bg-card)", padding: "24px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600 }}>Plano de Contas</h3>
            <button className="btn btn-secondary btn-sm" onClick={handleSeedContas}>
              Gerar Contas Padrão
            </button>
          </div>

          <form onSubmit={handleCriarConta} style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <input required placeholder="Cód (ex: 2.1)" className="form-control" value={novaConta.codigo} onChange={(e) => setNovaConta({ ...novaConta, codigo: e.target.value })} style={{ width: "100px" }} />
            <input required placeholder="Descrição (ex: Combustível)" className="form-control" value={novaConta.descricao} onChange={(e) => setNovaConta({ ...novaConta, descricao: e.target.value })} style={{ flex: 1 }} />
            <select className="form-control" value={novaConta.tipo} onChange={(e) => setNovaConta({ ...novaConta, tipo: e.target.value })} style={{ width: "120px" }}>
              <option value="DESPESA">Despesa</option>
              <option value="RECEITA">Receita</option>
            </select>
            <button type="submit" className="btn btn-primary">+</button>
          </form>

          {loading ? <p>Carregando...</p> : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
              {contas.map(conta => (
                <li key={conta.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px", border: "1px solid var(--border-color)", borderRadius: "4px" }}>
                  <div>
                    <strong>{conta.codigo}</strong> - {conta.descricao}
                    <span style={{ marginLeft: "8px", fontSize: "12px", color: "var(--text-muted)", border: "1px solid var(--border-color)", padding: "2px 6px", borderRadius: "10px" }}>{conta.tipo}</span>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={async () => { await deletePlanoConta(conta.id); carregarDados(); }}>X</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* COLUNA CENTROS DE CUSTO */}
        <div style={{ backgroundColor: "var(--bg-card)", padding: "24px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600 }}>Centros de Custo</h3>
            <button className="btn btn-secondary btn-sm" onClick={handleSyncObras}>
              Sincronizar Obras Ativas
            </button>
          </div>

          <form onSubmit={handleCriarCentro} style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <input placeholder="Cód (opc)" className="form-control" value={novoCentro.codigo} onChange={(e) => setNovoCentro({ ...novoCentro, codigo: e.target.value })} style={{ width: "100px" }} />
            <input required placeholder="Nome (ex: Administrativo Matriz)" className="form-control" value={novoCentro.nome} onChange={(e) => setNovoCentro({ ...novoCentro, nome: e.target.value })} style={{ flex: 1 }} />
            <button type="submit" className="btn btn-primary">+</button>
          </form>

          {loading ? <p>Carregando...</p> : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
              {centros.map(cc => (
                <li key={cc.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px", border: "1px solid var(--border-color)", borderRadius: "4px" }}>
                  <div>
                    <strong>{cc.codigo || "S/C"}</strong> - {cc.nome}
                    {cc.obraId && <span style={{ marginLeft: "8px", fontSize: "12px", color: "var(--success)" }}>[Vinculado a Obra]</span>}
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={async () => { await deleteCentroCusto(cc.id); carregarDados(); }}>X</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
