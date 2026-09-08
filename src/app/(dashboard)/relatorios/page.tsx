"use client";

import { useEffect, useState, startTransition } from "react";
import { getRelatoriosMetadata, getFolhaPontoObra, getPagamentoFuncionarios, getLucratividadeObras, getAndamentoObraReport as getAndamentoObra, getRelatorioGerencialContabil, getLivroCaixa, gerarLinkCompartilhado } from "./actions";
import { getCompanyBranding } from "@/lib/branding";

interface Obra {
  id: number;
  nome: string;
  clienteNome?: string | null;
  progressoEscavacao?: number;
  progressoEstrutura?: number;
  progressoHidraulica?: number;
  progressoRevestimento?: number;
  progressoAcabamento?: number;
  createdAt?: string | Date;
  empresa?: string;
}

interface Funcionario {
  id: number;
  nome: string;
  cargo: string | null;
  pix?: string | null;
}

interface Ponto {
  id: number;
  funcionarioId: number;
  data: string;
  tipoDia: string;
  observacoes: string | null;
}

interface PagamentoItem {
  funcionario: Funcionario;
  pontosContagem: number;
  valorTotalPonto: number;
  diariasViagemCount: number;
  valorTotalViagem: number;
  valorViagemPendente: number;
  valesCount: number;
  valorTotalVales: number;
  valorValesPendentes: number;
  valorValesDescontados: number;
  valesDetails?: any[];
  bonusCount: number;
  valorTotalBonus: number;
  valorBonusPendentes: number;
  valorBonusPagos: number;
  bonusDetails?: any[];
  valorLiquidoPendente: number;
}

export default function RelatoriosPage() {
  const [activeTab, setActiveTab] = useState<"ponto" | "pagamento" | "lucratividade" | "andamento" | "gerencial" | "livro_caixa">("ponto");
  const [obras, setObras] = useState<Obra[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [empresaFilter, setEmpresaFilter] = useState("TODOS");

  // States: Aba 1 (Ponto por Obra)
  const [selectedObraId, setSelectedObraId] = useState("");
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth() + 1);
  const [selectedAno, setSelectedAno] = useState(new Date().getFullYear());
  const [folhaPontoData, setFolhaPontoData] = useState<{ pontos: Ponto[]; funcionarios: Funcionario[] } | null>(null);

  // States: Aba 2 (Pagamento de Colaboradores)
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
  });
  const [dataFim, setDataFim] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
  });
  const [pagamentosReport, setPagamentosReport] = useState<PagamentoItem[]>([]);
  const [selectedHoleriteFunc, setSelectedHoleriteFunc] = useState<PagamentoItem | null>(null);
  const [isHoleriteModalOpen, setIsHoleriteModalOpen] = useState(false);

  // States: Aba 3 (Lucratividade)
  const [lucratividadeReport, setLucratividadeReport] = useState<any[]>([]);

  // States: Aba 4 (Andamento de Obra)
  const [andamentoObraId, setAndamentoObraId] = useState("");
  const [dataInicioAndamento, setDataInicioAndamento] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
  });
  const [dataFimAndamento, setDataFimAndamento] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
  });
  const [andamentoReport, setAndamentoReport] = useState<any | null>(null);

  // States: Aba 5 (Gerencial Contábil)
  const [gerencialReport, setGerencialReport] = useState<any[]>([]);

  // States: Aba 6 (Livro Caixa)
  const [dataInicioLivro, setDataInicioLivro] = useState("2026-09-05");
  const [dataFimLivro, setDataFimLivro] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
  });
  const [livroCaixaReport, setLivroCaixaReport] = useState<any | null>(null);

  // Opções de Meses
  const mesesOptions = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" },
  ];

  // Carregar metadados iniciais (obras, colaboradores)
  useEffect(() => {
    getRelatoriosMetadata().then((res) => {
      setObras(res.obras as any);
      setFuncionarios(res.funcionarios);
    });
  }, []);

  // 1. Gerar Relatório de Frequência de Ponto
  const gerarRelatorioPonto = () => {
    if (!selectedObraId) {
      alert("Selecione uma obra.");
      return;
    }
    setIsLoading(true);
    getFolhaPontoObra(parseInt(selectedObraId), selectedAno, selectedMes).then((res) => {
      const mappedPontos = res.pontos.map((p) => ({
        ...p,
        data: new Date(p.data).toISOString().split("T")[0],
      }));
      setFolhaPontoData({ pontos: mappedPontos as any, funcionarios: res.funcionarios });
      setIsLoading(false);
    });
  };

  // 2. Gerar Relatório de Pagamentos
  const gerarRelatorioPagamentos = () => {
    setIsLoading(true);
    getPagamentoFuncionarios(dataInicio, dataFim).then((res) => {
      setPagamentosReport(res as any);
      setIsLoading(false);
    });
  };

  // 3. Gerar Relatório de Lucratividade
  const gerarRelatorioLucratividade = () => {
    setIsLoading(true);
    getLucratividadeObras().then((res) => {
      setLucratividadeReport(res);
      setIsLoading(false);
    });
  };

  // 4. Gerar Relatório de Andamento de Obra
  const gerarRelatorioAndamento = () => {
    if (!andamentoObraId) {
      alert("Selecione uma obra.");
      return;
    }
    setIsLoading(true);
    getAndamentoObra(parseInt(andamentoObraId), dataInicioAndamento, dataFimAndamento).then((res: any) => {
      setAndamentoReport(res);
      setIsLoading(false);
    });
  };

  // 5. Gerar Relatório Gerencial
  const gerarRelatorioGerencial = () => {
    setIsLoading(true);
    getRelatorioGerencialContabil(empresaFilter).then((res) => {
      setGerencialReport(res);
      setIsLoading(false);
    });
  };

  // 6. Gerar Livro Caixa
  const gerarLivroCaixa = () => {
    setIsLoading(true);
    getLivroCaixa(dataInicioLivro, dataFimLivro, empresaFilter).then((res) => {
      setLivroCaixaReport(res);
      setIsLoading(false);
    });
  };

  const handleCopyLink = async (tipo: string) => {
    try {
      const payload = {
        tipo,
        empresa: empresaFilter,
        ...(tipo === "livro_caixa" ? { dataInicio: dataInicioLivro, dataFim: dataFimLivro } : {})
      };
      const token = await gerarLinkCompartilhado(payload);
      const url = `${window.location.origin}/public/relatorios/${token}`;
      await navigator.clipboard.writeText(url);
      alert("Link copiado para a área de transferência!");
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar link compartilhado.");
    }
  };

  // Disparar geradores dependendo da aba
  useEffect(() => {
    if (activeTab === "lucratividade") {
      gerarRelatorioLucratividade();
    } else if (activeTab === "gerencial") {
      gerarRelatorioGerencial();
    }
  }, [activeTab, empresaFilter]);

  // Auxiliares de Data e Moeda
  const daysInMonth = (month: number, year: number) => new Date(year, month, 0).getDate();
  const totalDays = folhaPontoData ? daysInMonth(selectedMes, selectedAno) : 0;
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

  const formatDateBR = (dateInput: string | Date | any) => {
    if (!dateInput) return "";
    
    if (dateInput instanceof Date) {
      return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(dateInput);
    }
    
    try {
      if (typeof dateInput === 'string') {
        const parts = dateInput.split("T")[0].split("-");
        if (parts.length === 3) {
          const [year, month, day] = parts;
          return `${day}/${month}/${year}`;
        }
      }
      return String(dateInput);
    } catch {
      return String(dateInput);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  return (
    <div>
      <div style={{ marginBottom: "20px" }} className="no-print">
        <h3 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-heading)" }}>
          Central de Relatórios & Fechamentos
        </h3>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
          Consolide a frequência dos diaristas, gere folhas de pagamentos com bônus e vales, emita holerites individuais e acompanhe custos físicos/financeiros de projetos.
        </p>
      </div>

      {/* Seletor de Empresa */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", padding: "12px", backgroundColor: "var(--bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", alignItems: "center" }} className="no-print">
        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-heading)" }}>Filtrar Empresa:</span>
        <div style={{ display: "inline-flex", gap: "8px" }}>
          {[
            { id: "TODOS", name: "Consolidado" },
            { id: "JHOSTON", name: "Jhoston Pools" },
            { id: "ECO_STONE", name: "Eco Stone" },
            { id: "JHOSTON_REVEST", name: "Jhoston Revest" }
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setEmpresaFilter(c.id);
                setSelectedObraId("");
                setAndamentoObraId("");
                if (activeTab === "livro_caixa" && dataInicioLivro && dataFimLivro) {
                  // We'll let a manual refresh or effect handle it, but wait, the effect doesn't handle livro_caixa automatically yet
                }
              }}
              className={`btn btn-sm ${empresaFilter === c.id ? "btn-primary" : "btn-secondary"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--border-color)", marginBottom: "24px", overflowX: "auto", paddingBottom: "4px" }} className="no-print">
        <button
          className={`btn ${activeTab === "ponto" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("ponto")}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, whiteSpace: "nowrap" }}
        >
          Ponto por Obra
        </button>
        <button
          className={`btn ${activeTab === "pagamento" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("pagamento")}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, whiteSpace: "nowrap" }}
        >
          Pagamento de Colaboradores
        </button>
        <button
          className={`btn ${activeTab === "lucratividade" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("lucratividade")}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, whiteSpace: "nowrap" }}
        >
          Lucratividade Sintética
        </button>
        <button
          className={`btn ${activeTab === "andamento" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("andamento")}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, whiteSpace: "nowrap" }}
        >
          Andamento Diário
        </button>
        <button
          className={`btn ${activeTab === "gerencial" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("gerencial")}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, whiteSpace: "nowrap" }}
        >
          Gerencial Contábil
        </button>
        <button
          className={`btn ${activeTab === "livro_caixa" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => { setActiveTab("livro_caixa"); gerarLivroCaixa(); }}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, whiteSpace: "nowrap" }}
        >
          Livro Caixa
        </button>
      </div>

      {/* --- ABA 1: FOLHA DE PONTO POR OBRA --- */}
      {activeTab === "ponto" && (
        <div>
          <div className="filters-bar">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Obra</label>
              <select
                className="form-control"
                value={selectedObraId}
                onChange={(e) => setSelectedObraId(e.target.value)}
              >
                <option value="">Selecione uma Obra</option>
                {obras.filter(o => empresaFilter === "TODOS" || (o as any).empresa === empresaFilter).map((o) => (
                  <option key={o.id} value={o.id}>{o.nome}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Mês</label>
              <select
                className="form-control"
                value={selectedMes}
                onChange={(e) => setSelectedMes(parseInt(e.target.value))}
              >
                {mesesOptions.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Ano</label>
              <select
                className="form-control"
                value={selectedAno}
                onChange={(e) => setSelectedAno(parseInt(e.target.value))}
              >
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
                <option value={2028}>2028</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={gerarRelatorioPonto} style={{ height: "42px" }}>
              Gerar Relatório
            </button>
          </div>

          {isLoading ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>Carregando dados...</p>
          ) : folhaPontoData ? (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {(() => {
                const currentObra = obras.find((o) => o.id === parseInt(selectedObraId));
                const branding = getCompanyBranding(currentObra?.empresa || empresaFilter);
                return (
                  <div className="report-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `3px solid ${branding.primaryColor}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <img
                        src={branding.logo}
                        alt={branding.name}
                        style={{ height: "46px", maxWidth: "130px", objectFit: "contain" }}
                      />
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: branding.primaryColor, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {branding.name} — {branding.subtitle}
                        </span>
                        <h4 style={{ fontSize: "17px", fontWeight: 800, marginTop: "2px", color: "var(--text-heading)" }}>Folha Mensal de Frequência de Ponto</h4>
                        <p className="report-subtitle" style={{ fontSize: "12px", marginTop: "2px", color: "var(--text-muted)" }}>
                          Obra: <strong>{currentObra?.nome}</strong> | Período: <strong>{mesesOptions.find(m => m.value === selectedMes)?.label} / {selectedAno}</strong>
                        </p>
                      </div>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                      Gerar PDF (WhatsApp)
                    </button>
                  </div>
                );
              })()}

              <div className="table-container" style={{ margin: 0, border: "none", borderRadius: 0, overflowX: "auto" }}>
                <table className="table" style={{ borderCollapse: "collapse", fontSize: "12px", width: "100%", minWidth: "900px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc" }}>
                      <th style={{ padding: "8px 12px", border: "1px solid #e2e8f0", zIndex: 10, position: "sticky", left: 0, backgroundColor: "#f8fafc", width: "150px" }}>Colaborador</th>
                      {daysArray.map((day) => (
                        <th key={day} style={{ padding: "6px", border: "1px solid #e2e8f0", textAlign: "center", width: "25px" }}>{day}</th>
                      ))}
                      <th style={{ padding: "8px 12px", border: "1px solid #e2e8f0", textAlign: "center", width: "60px" }}>Dias Trab.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {folhaPontoData.funcionarios.length === 0 ? (
                      <tr>
                        <td colSpan={totalDays + 2} style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
                          Nenhum ponto registrado para esta obra no mês selecionado.
                        </td>
                      </tr>
                    ) : (
                      folhaPontoData.funcionarios.map((f) => {
                        let totalDiasTrabalhados = 0;
                        return (
                          <tr key={f.id}>
                            <td style={{ padding: "8px 12px", border: "1px solid #e2e8f0", fontWeight: 600, position: "sticky", left: 0, backgroundColor: "white", boxShadow: "2px 0 5px -2px rgba(0,0,0,0.1)" }}>
                              {f.nome}
                            </td>
                            {daysArray.map((day) => {
                              const ponto = folhaPontoData.pontos.find((p) => {
                                const pDate = new Date(p.data);
                                return p.funcionarioId === f.id && pDate.getUTCDate() === day;
                              });

                              let label = "-";
                              let color = "var(--text-muted)";
                              let bg = "transparent";

                              if (ponto) {
                                if (ponto.tipoDia === "TRABALHO") {
                                  label = "T";
                                  color = "var(--success)";
                                  bg = "var(--success-bg)";
                                  totalDiasTrabalhados++;
                                } else if (ponto.tipoDia === "VIAGEM") {
                                  label = "V";
                                  color = "#7c3aed";
                                  bg = "#f5f3ff";
                                  totalDiasTrabalhados++;
                                } else if (ponto.tipoDia === "CHUVA") {
                                  label = "CH";
                                  color = "var(--warning)";
                                  bg = "var(--warning-bg)";
                                  totalDiasTrabalhados++;
                                } else if (ponto.tipoDia === "NA") {
                                  label = "-";
                                  color = "var(--text-muted)";
                                  bg = "#f1f5f9";
                                }
                              }

                              return (
                                <td
                                  key={day}
                                  style={{
                                    padding: "6px 2px",
                                    border: "1px solid #e2e8f0",
                                    textAlign: "center",
                                    fontWeight: 700,
                                    color,
                                    backgroundColor: bg,
                                  }}
                                  title={ponto?.observacoes || ""}
                                >
                                  {label}
                                </td>
                              );
                            })}
                            <td style={{ padding: "8px 12px", border: "1px solid #e2e8f0", textAlign: "center", fontWeight: 700 }}>
                              {totalDiasTrabalhados}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-color)", backgroundColor: "#f8fafc", display: "flex", flexWrap: "wrap", gap: "16px", fontSize: "12px", fontWeight: 500 }}>
                <div>Legenda:</div>
                <div style={{ color: "var(--success)" }}><strong>T</strong> = Dia Trabalhado</div>
                <div style={{ color: "#7c3aed" }}><strong>V</strong> = Viagem</div>
                <div style={{ color: "var(--warning)" }}><strong>CH</strong> = Dia Chuvoso</div>
                <div style={{ color: "var(--text-muted)" }}><strong>-</strong> = Não Aplicável (Sem Lançamento / N/A)</div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
              Selecione os parâmetros e clique em Gerar Relatório.
            </div>
          )}
        </div>
      )}

      {/* --- ABA 2: FOLHA DE PAGAMENTO --- */}
      {activeTab === "pagamento" && (
        <div>
          <div className="filters-bar">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Data Início</label>
              <input
                type="date"
                className="form-control"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Data Fim</label>
              <input
                type="date"
                className="form-control"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={gerarRelatorioPagamentos} style={{ height: "42px" }}>
              Gerar Folha
            </button>
          </div>

          {isLoading ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>Carregando dados...</p>
          ) : pagamentosReport.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
              Nenhum dado encontrado no período. Ajuste as datas e gere o relatório.
            </div>
          ) : (
            <div className="card" style={{ padding: 24 }}>
              {(() => {
                const branding = getCompanyBranding(empresaFilter);
                return (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: `3px solid ${branding.primaryColor}`, paddingBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <img
                        src={branding.logo}
                        alt={branding.name}
                        style={{ height: "46px", maxWidth: "130px", objectFit: "contain" }}
                      />
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: branding.primaryColor, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {empresaFilter === "TODOS" ? "CONSOLIDADO GERAL" : `${branding.name} — ${branding.subtitle}`}
                        </span>
                        <h4 style={{ fontSize: "17px", fontWeight: 800, marginTop: "2px", color: "var(--text-heading)" }}>Resumo de Pagamento por Período</h4>
                        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
                          Cálculo líquido de diárias de ponto, viagens, vales e bônus no período de {formatDateBR(dataInicio)} a {formatDateBR(dataFim)}.
                        </p>
                      </div>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                      Gerar PDF (WhatsApp)
                    </button>
                  </div>
                );
              })()}

              <div className="table-container" style={{ margin: 0, boxShadow: "none", border: "none" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Colaborador</th>
                      <th>Cargo</th>
                      <th>Ganhos Ponto</th>
                      <th>Ganhos Viagem</th>
                      <th>Bônus (+)</th>
                      <th>Vales Descontar (-)</th>
                      <th style={{ fontWeight: 700 }}>Línguido a Pagar</th>
                      <th>PIX</th>
                      <th style={{ textAlign: "right" }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagamentosReport.map((p) => (
                      <tr key={p.funcionario.id}>
                        <td>
                          <strong style={{ color: "var(--text-heading)" }}>{p.funcionario.nome}</strong>
                        </td>
                        <td>{p.funcionario.cargo}</td>
                        <td style={{ color: "var(--text-main)" }}>
                          {formatCurrency(p.valorTotalPonto)}
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>({p.pontosContagem} dia(s))</div>
                        </td>
                        <td>
                          <span style={{ color: "var(--text-heading)", fontWeight: 500 }}>
                            {formatCurrency(p.valorTotalViagem)}
                          </span>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            Pendentes: <strong style={{ color: "var(--warning)" }}>{formatCurrency(p.valorViagemPendente)}</strong>
                          </div>
                        </td>
                        <td style={{ color: "var(--success)", fontWeight: 600 }}>
                          + {formatCurrency(p.valorTotalBonus)}
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>({p.bonusCount} bônus)</div>
                        </td>
                        <td style={{ color: "var(--error)", fontWeight: 500 }}>
                          - {formatCurrency(p.valorValesPendentes)}
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            (Total descontado: {formatCurrency(p.valorValesDescontados)})
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, fontSize: "15px", color: p.valorLiquidoPendente >= 0 ? "var(--primary)" : "var(--error)" }}>
                          {formatCurrency(p.valorLiquidoPendente)}
                        </td>
                        <td>
                          {p.funcionario.pix ? (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontFamily: "monospace", fontSize: "11px", backgroundColor: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
                                {p.funcionario.pix}
                              </span>
                              <button
                                className="copy-pix-btn"
                                onClick={() => {
                                  navigator.clipboard.writeText(p.funcionario.pix || "");
                                  alert("PIX copiado!");
                                }}
                              >
                                Copiar
                              </button>
                            </div>
                          ) : (
                            <em style={{ color: "var(--text-muted)", fontSize: "11px" }}>Não informado</em>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setSelectedHoleriteFunc(p);
                              setIsHoleriteModalOpen(true);
                            }}
                          >
                            Gerar RPA
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- ABA 3: LUCRATIVIDADE POR OBRA --- */}
      {activeTab === "lucratividade" && (
        <div>
          {isLoading ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>Carregando dados...</p>
          ) : lucratividadeReport.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
              Nenhuma obra cadastrada para avaliação financeira.
            </div>
          ) : (
            <div className="card" style={{ padding: 24 }}>
              {(() => {
                const branding = getCompanyBranding(empresaFilter);
                return (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: `3px solid ${branding.primaryColor}`, paddingBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <img
                        src={branding.logo}
                        alt={branding.name}
                        style={{ height: "46px", maxWidth: "130px", objectFit: "contain" }}
                      />
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: branding.primaryColor, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {empresaFilter === "TODOS" ? "CONSOLIDADO GERAL" : `${branding.name} — ${branding.subtitle}`}
                        </span>
                        <h4 style={{ fontSize: "17px", fontWeight: 800, marginTop: "2px", color: "var(--text-heading)" }}>Avaliação de Margem e Lucro por Projeto</h4>
                        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
                          Detalhamento de faturamento vs. custos diretos (fornecedores) e mão de obra (diárias e viagens).
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="btn btn-secondary btn-sm" onClick={gerarRelatorioLucratividade}>
                        Atualizar Dados
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                        Gerar PDF (WhatsApp)
                      </button>
                    </div>
                  </div>
                );
              })()}

              <div className="table-container" style={{ margin: 0, boxShadow: "none", border: "none" }}>
                <table className="table" style={{ fontSize: "13px" }}>
                  <thead>
                    <tr>
                      <th>Nome da Obra</th>
                      <th>Status</th>
                      <th>Faturamento (Receita)</th>
                      <th>Custos Diretos (Fornecedores)</th>
                      <th>Mão de Obra (Diárias/Viagem)</th>
                      <th>Custo Total</th>
                      <th style={{ fontWeight: 700 }}>Lucro Líquido</th>
                      <th style={{ fontWeight: 700 }}>Margem (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lucratividadeReport.filter(item => empresaFilter === "TODOS" || item.obra.empresa === empresaFilter).map((item) => {
                      const margemColor =
                        item.margem > 20
                          ? "var(--success)"
                          : item.margem >= 0
                          ? "var(--warning)"
                          : "var(--error)";
                      return (
                        <tr key={item.obra.id}>
                          <td>
                            <strong style={{ color: "var(--text-heading)" }}>{item.obra.nome}</strong>
                          </td>
                          <td>
                            <span className={`badge ${item.obra.status === "ATIVA" ? "badge-success" : "badge-secondary"}`}>
                              {item.obra.status}
                            </span>
                          </td>
                          <td style={{ color: "var(--success)", fontWeight: 600 }}>{formatCurrency(item.faturamentoTotal)}</td>
                          <td style={{ color: "var(--text-muted)" }}>{formatCurrency(item.custoDireto)}</td>
                          <td style={{ color: "var(--text-muted)" }}>{formatCurrency(item.custoMaoDeObraTotal)}</td>
                          <td style={{ fontWeight: 600 }}>{formatCurrency(item.custoTotal)}</td>
                          <td style={{ fontWeight: 700, color: item.lucroLiquido >= 0 ? "var(--primary)" : "var(--error)" }}>
                            {formatCurrency(item.lucroLiquido)}
                          </td>
                          <td style={{ fontWeight: 800, color: margemColor }}>
                            {item.margem.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- ABA 4: ANDAMENTO DE OBRA --- */}
      {activeTab === "andamento" && (
        <div>
          <div className="filters-bar">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Obra</label>
              <select
                className="form-control"
                value={andamentoObraId}
                onChange={(e) => setAndamentoObraId(e.target.value)}
              >
                <option value="">Selecione uma Obra</option>
                {obras.filter(o => empresaFilter === "TODOS" || (o as any).empresa === empresaFilter).map((o) => (
                  <option key={o.id} value={o.id}>{o.nome}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Data Início</label>
              <input
                type="date"
                className="form-control"
                value={dataInicioAndamento}
                onChange={(e) => setDataInicioAndamento(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Data Fim</label>
              <input
                type="date"
                className="form-control"
                value={dataFimAndamento}
                onChange={(e) => setDataFimAndamento(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={gerarRelatorioAndamento} style={{ height: "42px" }}>
              Filtrar
            </button>
          </div>

          {isLoading ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>Carregando dados...</p>
          ) : andamentoReport ? (
            <div className="card printable-report-card" style={{ padding: 24 }}>
              {(() => {
                const branding = getCompanyBranding(andamentoReport.obra.empresa);
                return (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: `3px solid ${branding.primaryColor}`, paddingBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <img
                        src={branding.logo}
                        alt={branding.name}
                        style={{ height: "46px", maxWidth: "130px", objectFit: "contain" }}
                      />
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: branding.primaryColor, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {branding.name} — {branding.subtitle}
                        </span>
                        <h4 style={{ fontSize: "17px", fontWeight: 800, marginTop: "2px", color: "var(--text-heading)" }}>Histórico de Diário e Andamento</h4>
                        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
                          Histórico cronológico de relatos do Diário de Obra para <strong>{andamentoReport.obra.nome}</strong>.
                        </p>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                          Cliente: <strong>{andamentoReport.obra.clienteNome}</strong> | Início: <strong>{andamentoReport.obra.createdAt ? formatDateBR(new Date(andamentoReport.obra.createdAt).toISOString().split("T")[0]) : "Não cadastrado"}</strong> | Período: {formatDateBR(dataInicioAndamento)} a {formatDateBR(dataFimAndamento)}
                        </p>
                      </div>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                      Gerar PDF (WhatsApp)
                    </button>
                  </div>
                );
              })()}

              {/* Barra de progresso das 5 etapas da piscina */}
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  padding: "16px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  marginBottom: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 700, color: "var(--text-heading)" }}>
                  <span>Progresso Físico de Instalação ({andamentoReport.obra.empresa === "ECO_STONE" ? "Cascata" : "Piscina"})</span>
                  <span>Geral: {Math.round((
                    andamentoReport.obra.progressoEscavacao +
                    andamentoReport.obra.progressoEstrutura +
                    andamentoReport.obra.progressoHidraulica +
                    andamentoReport.obra.progressoRevestimento +
                    andamentoReport.obra.progressoAcabamento
                  ) / 5)}%</span>
                </div>
                
                {/* 5 barras de progresso */}
                <div className="progress-print-stack" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginTop: "8px" }}>
                  {(andamentoReport.obra.empresa === "ECO_STONE" ? [
                    { label: "1. Vistoria e Proteção", val: andamentoReport.obra.progressoEscavacao },
                    { label: "2. Adequação Hidráulica", val: andamentoReport.obra.progressoHidraulica },
                    { label: "3. Estrutura e Impermeab.", val: andamentoReport.obra.progressoEstrutura },
                    { label: "4. Modelagem e Acabamento", val: andamentoReport.obra.progressoRevestimento },
                    { label: "5. Testes e Entrega", val: andamentoReport.obra.progressoAcabamento }
                  ] : [
                    { label: "1. Escavação", val: andamentoReport.obra.progressoEscavacao },
                    { label: "2. Alvenaria/Estrutura", val: andamentoReport.obra.progressoEstrutura },
                    { label: "3. Hidráulica/Instalações", val: andamentoReport.obra.progressoHidraulica },
                    { label: "4. Revestimento/Azulejo", val: andamentoReport.obra.progressoRevestimento },
                    { label: "5. Acabamento/Entrega", val: andamentoReport.obra.progressoAcabamento }
                  ]).map((fase) => (
                    <div key={fase.label} style={{ fontSize: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", color: "var(--text-main)", fontWeight: 600 }}>
                        <span>{fase.label}</span>
                        <span>{fase.val}%</span>
                      </div>
                      <div style={{ backgroundColor: "#e2e8f0", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ backgroundColor: "var(--primary)", width: `${fase.val}%`, height: "100%" }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lista de Diários */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {andamentoReport.relatos.length === 0 ? (
                  <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px" }}>Nenhum relato registrado neste período.</p>
                ) : (
                  andamentoReport.relatos.map((d: any) => (
                    <div key={d.id} style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "16px", backgroundColor: "#fff" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", borderBottom: "1px dashed var(--border-color)", paddingBottom: "6px" }}>
                        <strong style={{ color: "var(--primary)" }}>{formatDateBR(new Date(d.data).toISOString().split("T")[0])}</strong>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Registrado por: {d.usuario?.nome || "Sistema"}</span>
                      </div>
                      <p style={{ fontSize: "14px", color: "var(--text-main)", lineHeight: "1.5", margin: 0 }}>{d.conteudo}</p>
                      
                      {d.fotos && d.fotos.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                          {d.fotos.map((f: any) => (
                            <img 
                              key={f.id} 
                              src={f.base64Data} 
                              alt="Progresso da Obra" 
                              style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e2e8f0" }} 
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
              Selecione a Obra e o período para gerar o relatório.
            </div>
          )}
        </div>
      )}

      {/* --- ABA 5: GERENCIAL CONTÁBIL --- */}
      {activeTab === "gerencial" && (
        <div>
          <div className="card no-print" style={{ padding: "20px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 style={{ margin: 0, color: "var(--text-heading)", fontSize: "16px" }}>Relatório Gerencial Contábil</h4>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn btn-secondary" onClick={() => window.print()}>
                  Gerar PDF / Imprimir
                </button>
                <button className="btn btn-secondary" onClick={() => handleCopyLink("gerencial")}>
                  🔗 Gerar Link Compartilhado
                </button>
              </div>
            </div>
          </div>
          {isLoading ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>Gerando relatório gerencial contábil...</p>
          ) : gerencialReport.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
              Nenhuma obra encontrada ou com transações financeiras pagas.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {(() => {
                const branding = getCompanyBranding(empresaFilter);
                return (
                  <div className="card" style={{ padding: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", borderBottom: `3px solid ${branding.primaryColor}`, paddingBottom: "12px" }}>
                      <img src={branding.logo} alt={branding.name} style={{ height: "46px", maxWidth: "130px", objectFit: "contain" }} />
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: branding.primaryColor, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {empresaFilter === "TODOS" ? "CONSOLIDADO GERAL" : `${branding.name} — ${branding.subtitle}`}
                        </span>
                        <h4 style={{ fontSize: "17px", fontWeight: 800, margin: "2px 0 0 0", color: "var(--text-heading)" }}>Relatório Gerencial Contábil (Analítico)</h4>
                      </div>
                    </div>
                  </div>
                );
              })()}
              {gerencialReport.map((obra: any) => (
                <div key={obra.obraId} className="card" style={{ padding: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--primary)", paddingBottom: "12px", marginBottom: "20px" }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "18px", color: "var(--primary)" }}>{obra.obraNome}</h4>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Status: {obra.obraStatus}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <strong style={{ fontSize: "14px", display: "block" }}>Lucro Caixa: <span style={{ color: obra.saldoObra >= 0 ? "var(--success)" : "var(--error)" }}>{formatCurrency(obra.saldoObra)}</span></strong>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Margem: {obra.margemRealizada.toFixed(2)}%</span>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                    {/* ENTRADAS */}
                    <div>
                      <h5 style={{ color: "var(--success)", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px" }}>Entradas (Faturamento)</h5>
                      <div style={{ marginBottom: "12px", fontSize: "14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>Contrato Base (Previsto: {formatCurrency(obra.faturamentoContratoBase)})</span>
                          <strong>{formatCurrency(obra.receitasContratoBase)}</strong>
                        </div>
                      </div>
                      
                      {obra.detalheAdendos.length > 0 && (
                        <div style={{ marginBottom: "12px" }}>
                          <strong style={{ fontSize: "13px", color: "var(--text-muted)" }}>Adendos:</strong>
                          <ul style={{ listStyle: "none", padding: 0, margin: "4px 0", fontSize: "13px" }}>
                            {obra.detalheAdendos.map((ad: any) => (
                              <li key={ad.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px dashed #e2e8f0" }}>
                                <span>{ad.descricao} (Prev: {formatCurrency(ad.valorPrevisto)})</span>
                                <strong>{formatCurrency(ad.recebido)}</strong>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px", paddingTop: "8px", borderTop: "1px solid #e2e8f0", fontWeight: 700, fontSize: "15px" }}>
                        <span>Total Realizado:</span>
                        <span style={{ color: "var(--success)" }}>{formatCurrency(obra.entradasRealizadas)}</span>
                      </div>
                      <div style={{ fontSize: "11px", textAlign: "right", color: "var(--text-muted)" }}>
                        {obra.percentualRecebimento.toFixed(1)}% do Previsto Total ({formatCurrency(obra.faturamentoPrevisto)})
                      </div>
                    </div>

                    {/* SAÍDAS */}
                    <div>
                      <h5 style={{ color: "var(--error)", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px" }}>Saídas (Custos / Despesas)</h5>
                      
                      {obra.detalheColaboradores.length > 0 && (
                        <div style={{ marginBottom: "12px" }}>
                          <strong style={{ fontSize: "13px", color: "var(--text-muted)" }}>Folha de Pagamento (Colaboradores):</strong>
                          <ul style={{ listStyle: "none", padding: 0, margin: "4px 0", fontSize: "13px" }}>
                            {obra.detalheColaboradores.map((col: any, idx: number) => (
                              <li key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px dashed #e2e8f0" }}>
                                <span>{col.nome}</span>
                                <strong>{formatCurrency(col.valor)}</strong>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div style={{ marginBottom: "12px", fontSize: "14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>Outras Despesas (Fornecedores/Gerais)</span>
                          <strong>{formatCurrency(obra.outrasDespesasRealizadas)}</strong>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px", paddingTop: "8px", borderTop: "1px solid #e2e8f0", fontWeight: 700, fontSize: "15px" }}>
                        <span>Total Realizado:</span>
                        <span style={{ color: "var(--error)" }}>{formatCurrency(obra.despesasRealizadas)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- ABA 6: LIVRO CAIXA --- */}
      {activeTab === "livro_caixa" && (
        <div>
          <div className="card no-print" style={{ padding: "20px", marginBottom: "20px" }}>
            <h4 style={{ margin: "0 0 16px 0", fontSize: "16px", color: "var(--text-heading)" }}>Filtrar Período do Livro Caixa</h4>
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <label className="form-label">Data Início (Corte Inicial)</label>
                <input
                  type="date"
                  className="form-input"
                  value={dataInicioLivro}
                  onChange={(e) => setDataInicioLivro(e.target.value)}
                />
              </div>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <label className="form-label">Data Fim</label>
                <input
                  type="date"
                  className="form-input"
                  value={dataFimLivro}
                  onChange={(e) => setDataFimLivro(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn btn-primary" onClick={gerarLivroCaixa} disabled={isLoading}>
                  {isLoading ? "Gerando..." : "Gerar Livro Caixa"}
                </button>
                <button className="btn btn-secondary" onClick={() => window.print()}>
                  Imprimir Extrato
                </button>
                <button className="btn btn-secondary" onClick={() => handleCopyLink("livro_caixa")}>
                  🔗 Gerar Link Compartilhado
                </button>
              </div>
            </div>
          </div>

          {livroCaixaReport && (
            <div className="card" style={{ padding: "24px" }}>
              <style>{`
                @media print {
                  @page {
                    size: landscape;
                    margin: 10mm;
                  }
                  .livro-caixa-table th, .livro-caixa-table td {
                    font-size: 11px !important;
                    padding: 6px !important;
                    word-break: normal !important;
                  }
                  .livro-caixa-table {
                    width: 100% !important;
                  }
                }
              `}</style>
              {(() => {
                const branding = getCompanyBranding(empresaFilter);
                return (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px", borderBottom: `2px solid ${branding.primaryColor}`, paddingBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <img src={branding.logo} alt={branding.name} style={{ height: "46px", maxWidth: "130px", objectFit: "contain" }} />
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: branding.primaryColor, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {empresaFilter === "TODOS" ? "CONSOLIDADO GERAL" : `${branding.name} — ${branding.subtitle}`}
                        </span>
                        <h4 style={{ margin: "2px 0 4px 0", fontSize: "18px", color: "var(--text-heading)", fontWeight: 800 }}>Livro Caixa (Extrato Financeiro)</h4>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Período: {formatDateBR(dataInicioLivro)} a {formatDateBR(dataFimLivro)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div style={{ overflowX: "auto" }}>
                <table className="table livro-caixa-table" style={{ fontSize: "13px", minWidth: "800px" }}>
                  <thead>
                    <tr>
                      <th>Data Pagamento</th>
                      <th>Descrição do Lançamento</th>
                      <th>Cliente / Fornecedor</th>
                      <th>Plano de Contas</th>
                      <th>Obra Relacionada</th>
                      <th style={{ textAlign: "right" }}>Entrada</th>
                      <th style={{ textAlign: "right" }}>Saída</th>
                      <th style={{ textAlign: "right" }}>Saldo Acumulado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let saldoAcumulado = livroCaixaReport.saldoInicial;
                      return livroCaixaReport.transacoes.map((t: any) => {
                        if (t.tipo === "RECEITA") saldoAcumulado += t.valor;
                        else if (t.tipo === "DESPESA") saldoAcumulado -= t.valor;
                        
                        return (
                          <tr key={t.id}>
                            <td style={{ whiteSpace: "nowrap" }}>{formatDateBR(t.dataPagamento)}</td>
                            <td>
                              {t.descricao}
                              {t.adendo && (
                                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                                  Adendo: {t.adendo.descricao}
                                </div>
                              )}
                            </td>
                            <td>
                              {t.clienteFornecedor ? (
                                <strong style={{ fontSize: "12px" }}>{t.clienteFornecedor}</strong>
                              ) : (
                                <em style={{ color: "var(--text-muted)", fontSize: "11px" }}>--</em>
                              )}
                            </td>
                            <td>
                              <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)" }}>
                                {t.planoConta?.codigo} - {t.planoConta?.descricao}
                              </span>
                            </td>
                            <td>{t.obra?.nome || <em style={{ color: "var(--text-muted)", fontSize: "11px" }}>--</em>}</td>
                            <td style={{ textAlign: "right", color: "var(--success)" }}>
                              {t.tipo === "RECEITA" ? formatCurrency(t.valor) : "-"}
                            </td>
                            <td style={{ textAlign: "right", color: "var(--error)" }}>
                              {t.tipo === "DESPESA" ? formatCurrency(t.valor) : "-"}
                            </td>
                            <td style={{ textAlign: "right", fontWeight: 600, color: saldoAcumulado >= 0 ? "var(--primary)" : "var(--error)" }}>
                              {formatCurrency(saldoAcumulado)}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                    {livroCaixaReport.transacoes.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>
                          Nenhuma movimentação encontrada neste período.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- MODAL DO RPA IMPRIMÍVEL --- */}
      {isHoleriteModalOpen && selectedHoleriteFunc && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content" style={{ width: "95%", maxWidth: "700px" }}>
            <div className="modal-header">
              <h4 style={{ fontSize: "18px", fontWeight: 700 }}>Recibo de Pagamento de Autônomo (RPA)</h4>
              <button
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }}
                onClick={() => setIsHoleriteModalOpen(false)}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body printable-holerite">
              {(() => {
                const branding = getCompanyBranding(empresaFilter);
                return (
                  <div style={{ border: "1px solid #ccc", padding: "24px", borderRadius: "8px", backgroundColor: "#fff" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `2px solid ${branding.primaryColor}`, paddingBottom: "16px", marginBottom: "20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <img
                          src={branding.logo}
                          alt={branding.name}
                          style={{ height: "56px", maxWidth: "140px", objectFit: "contain" }}
                        />
                        <div>
                          <h3 style={{ margin: 0, textTransform: "uppercase", color: branding.primaryColor, fontSize: "18px", fontWeight: 800 }}>
                            {branding.name}
                          </h3>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{branding.corporateName} — CNPJ: {branding.cnpj}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", border: "2px solid #e2e8f0", padding: "8px 16px", borderRadius: "6px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", display: "block", textTransform: "uppercase" }}>RECIBO - RPA</span>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Nº {new Date().getTime().toString().slice(-6)}</span>
                      </div>
                    </div>

                <div style={{ padding: "16px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", marginBottom: "20px" }}>
                  <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.6", textAlign: "justify" }}>
                    Recebi(emos) de <strong>{branding.corporateName}</strong>, inscrita no CNPJ sob o nº <strong>{branding.cnpj}</strong>, a importância líquida de 
                    <strong style={{ fontSize: "16px" }}> {formatCurrency(selectedHoleriteFunc.valorLiquidoPendente)}</strong>, 
                    referente à prestação de serviços sem vínculo empregatício, atuando como <strong>{selectedHoleriteFunc.funcionario.cargo || "Profissional Autônomo"}</strong>, durante o período de <strong>{formatDateBR(dataInicio)}</strong> a <strong>{formatDateBR(dataFim)}</strong>.
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px", marginBottom: "20px" }}>
                  <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "4px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Nome do Prestador:</span>
                    <strong style={{ display: "block", fontSize: "14px" }}>{selectedHoleriteFunc.funcionario.nome}</strong>
                  </div>
                  <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "4px" }}>
                    <span style={{ color: "var(--text-muted)" }}>CPF / RG:</span>
                    <strong style={{ display: "block", fontSize: "14px" }}>___________________________</strong>
                  </div>
                  <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "4px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Chave PIX:</span>
                    <strong style={{ display: "block", fontSize: "14px" }}>{selectedHoleriteFunc.funcionario.pix || "___________________________"}</strong>
                  </div>
                  <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "4px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Assinatura:</span>
                    <strong style={{ display: "block", fontSize: "14px" }}>___________________________</strong>
                  </div>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "16px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#e2e8f0", borderBottom: "2px solid #cbd5e1" }}>
                      <th style={{ textAlign: "left", padding: "6px" }}>Descrição do Item</th>
                      <th style={{ textAlign: "center", padding: "6px" }}>Ref / Quant.</th>
                      <th style={{ textAlign: "right", padding: "6px" }}>Proventos (+)</th>
                      <th style={{ textAlign: "right", padding: "6px" }}>Descontos (-)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "6px" }}>Diárias de Ponto (Trabalho/Chuva)</td>
                      <td style={{ textAlign: "center", padding: "6px" }}>{selectedHoleriteFunc.pontosContagem} dia(s)</td>
                      <td style={{ textAlign: "right", padding: "6px" }}>{formatCurrency(selectedHoleriteFunc.valorTotalPonto)}</td>
                      <td style={{ textAlign: "right", padding: "6px" }}>-</td>
                    </tr>
                    
                    {selectedHoleriteFunc.valorTotalViagem > 0 && (
                      <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "6px" }}>Diárias de Viagem (Dirigindo/Passageiro)</td>
                        <td style={{ textAlign: "center", padding: "6px" }}>{selectedHoleriteFunc.diariasViagemCount} dia(s)</td>
                        <td style={{ textAlign: "right", padding: "6px" }}>{formatCurrency(selectedHoleriteFunc.valorTotalViagem)}</td>
                        <td style={{ textAlign: "right", padding: "6px" }}>-</td>
                      </tr>
                    )}

                    {selectedHoleriteFunc.bonusDetails && selectedHoleriteFunc.bonusDetails.map((b: any) => (
                      <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9", fontStyle: "italic" }}>
                        <td style={{ padding: "6px" }}>Bônus: {b.descricao} ({formatDateBR(b.data)})</td>
                        <td style={{ textAlign: "center", padding: "6px" }}>1</td>
                        <td style={{ textAlign: "right", padding: "6px", fontWeight: "600", color: "var(--success)" }}>{formatCurrency(b.valor)}</td>
                        <td style={{ textAlign: "right", padding: "6px" }}>-</td>
                      </tr>
                    ))}

                    {selectedHoleriteFunc.valesDetails && selectedHoleriteFunc.valesDetails.map((v: any) => (
                      <tr key={v.id} style={{ borderBottom: "1px solid #f1f5f9", fontStyle: "italic" }}>
                        <td style={{ padding: "6px" }}>Vale: {v.descricao} ({formatDateBR(v.data)})</td>
                        <td style={{ textAlign: "center", padding: "6px" }}>1</td>
                        <td style={{ textAlign: "right", padding: "6px" }}>-</td>
                        <td style={{ textAlign: "right", padding: "6px", fontWeight: "600", color: "var(--error)" }}>{formatCurrency(v.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", borderTop: "2px solid #ccc", paddingTop: "12px", fontSize: "13px" }}>
                  <div>
                    <strong>Total Proventos:</strong> {formatCurrency(selectedHoleriteFunc.valorTotalPonto + selectedHoleriteFunc.valorTotalViagem + selectedHoleriteFunc.valorTotalBonus)}
                  </div>
                  <div>
                    <strong>Total Descontos:</strong> {formatCurrency(selectedHoleriteFunc.valorValesPendentes)}
                  </div>
                  <div style={{ gridColumn: "span 2", borderTop: "1px dashed #ccc", paddingTop: "8px", marginTop: "4px", fontSize: "15px" }}>
                    <strong style={{ color: "var(--primary)" }}>VALOR LÍQUIDO A PAGAR: {formatCurrency(selectedHoleriteFunc.valorLiquidoPendente)}</strong>
                  </div>
                </div>


              </div>
            );
          })()}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsHoleriteModalOpen(false)}>
                Fechar
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  document.body.classList.add("printing-holerite");
                  window.print();
                  document.body.classList.remove("printing-holerite");
                }}
              >
                Gerar PDF (RPA)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
