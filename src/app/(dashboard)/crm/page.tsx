"use client";

import { useEffect, useState, startTransition } from "react";
import { getOportunidadesList, salvarOportunidade, deleteOportunidade, converterParaObra, getActiveContasBancarias } from "./actions";
import Link from "next/link";

interface ContaBancaria {
  id: number;
  banco: string;
  titular: string;
  empresa: string;
  ativa: boolean;
}

interface Oportunidade {
  id: number;
  clienteNome: string;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  descricaoPiscina: string | null;
  produto: "PREMIUM" | "SUPER_PREMIUM" | "CASCATA" | "REVESTIMENTO";
  areaPiscina: number;
  valorProposta: number;
  status: string; // PENDENTE, PROPOSTA_GERADA, PROPOSTA_ENVIADA, ACEITO, RECUSADO
  observacoes: string | null;
  precoUnitario?: number | null;
  precoAditivo?: number | null;
  empresa: string;
  createdAt: string;
  updatedAt: string;
  descricaoServico?: string | null;
  valorInsumos?: number | null;
  valorEstadia?: number | null;
  imposto?: number | null;
  desconto?: number | null;
  prazoAplicacao?: number | null;
  contaBancariaId?: number | null;
  contaBancaria?: ContaBancaria | null;
}


export default function CRMPage() {
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODAS");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [editingOportunidade, setEditingOportunidade] = useState<Oportunidade | null>(null);
  const [convertingOportunidade, setConvertingOportunidade] = useState<Oportunidade | null>(null);

  // Form states
  const [clienteNome, setClienteNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [descricaoPiscina, setDescricaoPiscina] = useState("");
  const [produto, setProduto] = useState<"PREMIUM" | "SUPER_PREMIUM" | "CASCATA" | "REVESTIMENTO">("PREMIUM");
  const [areaPiscina, setAreaPiscina] = useState<number>(0);
  const [status, setStatus] = useState("PENDENTE");
  const [observacoes, setObservacoes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [precoUnitario, setPrecoUnitario] = useState<number>(270);
  const [precoAditivo, setPrecoAditivo] = useState<number>(25);
  const [empresa, setEmpresa] = useState("JHOSTON");
  const [empresaFilter, setEmpresaFilter] = useState("TODOS");

  // Novos campos Jhoston Revest
  const [descricaoServico, setDescricaoServico] = useState("Aplicação de revestimento resinado Verano Pools");
  const [valorInsumos, setValorInsumos] = useState<number>(0);
  const [valorEstadia, setValorEstadia] = useState<number>(0);
  const [imposto, setImposto] = useState<number>(0);
  const [desconto, setDesconto] = useState<number>(0);
  const [prazoAplicacao, setPrazoAplicacao] = useState<number>(15);
  const [contaBancariaId, setContaBancariaId] = useState<number | null>(null);
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([]);

  const handleProdutoChange = (newProd: "PREMIUM" | "SUPER_PREMIUM" | "CASCATA" | "REVESTIMENTO") => {
    setProduto(newProd);
    if (newProd === "SUPER_PREMIUM" && (precoUnitario === 270 || precoUnitario === 18000 || precoUnitario === 120)) {
      setPrecoUnitario(350);
      setPrecoAditivo(25);
      setEmpresa("JHOSTON");
    } else if (newProd === "PREMIUM" && (precoUnitario === 350 || precoUnitario === 18000 || precoUnitario === 120)) {
      setPrecoUnitario(270);
      setPrecoAditivo(25);
      setEmpresa("JHOSTON");
    } else if (newProd === "CASCATA") {
      setPrecoUnitario(18000);
      setPrecoAditivo(5000);
      setAreaPiscina(1);
      setEmpresa("ECO_STONE");
    } else if (newProd === "REVESTIMENTO") {
      setPrecoUnitario(120);
      setPrecoAditivo(0);
      setEmpresa("JHOSTON_REVEST");
      setDescricaoServico("Aplicação de revestimento resinado Verano Pools");
      setValorInsumos(1640);
      setValorEstadia(3250);
      setPrazoAplicacao(15);
      const revestConta = contasBancarias.find(c => c.empresa === "JHOSTON_REVEST" || c.empresa === "AMBAS");
      if (revestConta) {
        setContaBancariaId(revestConta.id);
      }
    }
  };

  // Convert form states
  const [nomeObra, setNomeObra] = useState("");
  const [valorFechadoConvert, setValorFechadoConvert] = useState("");

  const refreshData = () => {
    getOportunidadesList().then((data) => {
      setOportunidades(data as any);
    });
    getActiveContasBancarias().then((data) => {
      setContasBancarias(data as any);
    });
  };

  useEffect(() => {
    refreshData();
  }, []);

  const openNewModal = () => {
    setEditingOportunidade(null);
    setClienteNome("");
    setTelefone("");
    setEmail("");
    setEndereco("");
    setDescricaoPiscina("");
    setProduto("PREMIUM");
    setAreaPiscina(0);
    setStatus("PENDENTE");
    setObservacoes("");
    setPrecoUnitario(270);
    setPrecoAditivo(25);
    setEmpresa("JHOSTON");
    setDescricaoServico("Aplicação de revestimento resinado Verano Pools");
    setValorInsumos(0);
    setValorEstadia(0);
    setImposto(0);
    setDesconto(0);
    setPrazoAplicacao(15);
    setContaBancariaId(null);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (op: Oportunidade) => {
    setEditingOportunidade(op);
    setClienteNome(op.clienteNome);
    setTelefone(op.telefone || "");
    setEmail(op.email || "");
    setEndereco(op.endereco || "");
    setDescricaoPiscina(op.descricaoPiscina || "");
    setProduto(op.produto);
    setAreaPiscina(op.areaPiscina);
    setStatus(op.status);
    setObservacoes(op.observacoes || "");
    setPrecoUnitario(op.precoUnitario ?? (op.produto === "SUPER_PREMIUM" ? 350 : (op.produto === "REVESTIMENTO" ? 120 : 270)));
    setPrecoAditivo(op.precoAditivo ?? (op.produto === "REVESTIMENTO" ? 0 : 25));
    setEmpresa(op.empresa || "JHOSTON");
    setDescricaoServico(op.descricaoServico || "Aplicação de revestimento resinado Verano Pools");
    setValorInsumos(op.valorInsumos ?? 0);
    setValorEstadia(op.valorEstadia ?? 0);
    setImposto(op.imposto ?? 0);
    setDesconto(op.desconto ?? 0);
    setPrazoAplicacao(op.prazoAplicacao ?? 15);
    setContaBancariaId(op.contaBancariaId ?? null);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openConvertModal = (op: Oportunidade) => {
    setConvertingOportunidade(op);
    setNomeObra(`Obra de ${op.clienteNome}`);
    setValorFechadoConvert(op.valorProposta ? op.valorProposta.toString() : "0");
    setIsConvertModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingOportunidade(null);
  };

  const closeConvertModal = () => {
    setIsConvertModalOpen(false);
    setConvertingOportunidade(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNome.trim()) {
      setErrorMsg("O nome do cliente é obrigatório.");
      return;
    }
    if (areaPiscina < 0) {
      setErrorMsg("A área da piscina não pode ser negativa.");
      return;
    }

    const payload = {
      id: editingOportunidade?.id,
      clienteNome,
      telefone,
      email,
      endereco,
      descricaoPiscina,
      produto,
      areaPiscina,
      status,
      observacoes,
      precoUnitario,
      precoAditivo,
      empresa,
      descricaoServico,
      valorInsumos,
      valorEstadia,
      imposto,
      desconto,
      prazoAplicacao,
      contaBancariaId: contaBancariaId ? Number(contaBancariaId) : null,
    };

    startTransition(async () => {
      const res = await salvarOportunidade(payload);
      if (res.success) {
        refreshData();
        closeModal();
      } else {
        setErrorMsg(res.error || "Erro ao salvar oportunidade.");
      }
    });
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingOportunidade) return;

    const val = parseFloat(valorFechadoConvert) || 0;

    startTransition(async () => {
      const res = await converterParaObra(convertingOportunidade.id, nomeObra, val);
      if (res.success) {
        refreshData();
        closeConvertModal();
        alert("Cliente convertido em ativo com sucesso! Uma nova obra foi criada.");
      } else {
        alert(res.error || "Erro ao converter cliente.");
      }
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Deseja realmente remover esta oportunidade? Esta ação não pode ser desfeita.")) {
      const res = await deleteOportunidade(id);
      if (res.success) {
        refreshData();
      } else {
        alert(res.error);
      }
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  const formatArea = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2 }).format(val) + " m²";
  };

  const getStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case "PENDENTE":
        return <span className="status-badge" style={{ backgroundColor: "rgba(234, 179, 8, 0.15)", color: "var(--warning)" }}>Pendente</span>;
      case "PROPOSTA_GERADA":
        return <span className="status-badge" style={{ backgroundColor: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}>Proposta Gerada</span>;
      case "PROPOSTA_ENVIADA":
        return <span className="status-badge" style={{ backgroundColor: "rgba(99, 102, 241, 0.15)", color: "#818cf8" }}>Proposta Enviada</span>;
      case "ACEITO":
        return <span className="status-badge" style={{ backgroundColor: "rgba(34, 197, 94, 0.15)", color: "var(--success)" }}>Aceito (Ativo)</span>;
      case "RECUSADO":
        return <span className="status-badge" style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", color: "var(--error)" }}>Recusado</span>;
      default:
        return <span className="status-badge">{statusStr}</span>;
    }
  };

  // Filtragem inicial por empresa para KPIs
  const oportunidadesFiltradasEmpresa = oportunidades.filter(
    (op) => empresaFilter === "TODOS" || op.empresa === empresaFilter
  );

  // KPIs
  const totalOps = oportunidadesFiltradasEmpresa.length;
  const inNegotiation = oportunidadesFiltradasEmpresa.filter(o => o.status !== "ACEITO" && o.status !== "RECUSADO");
  const valNegotiation = inNegotiation.reduce((acc, o) => acc + o.valorProposta, 0);
  const acceptedOps = oportunidadesFiltradasEmpresa.filter(o => o.status === "ACEITO");
  const totalAccepted = acceptedOps.length;
  const valAccepted = acceptedOps.reduce((acc, o) => acc + o.valorProposta, 0);
  const conversionRate = totalOps > 0 ? Math.round((totalAccepted / totalOps) * 100) : 0;

  // Filtragem
  const filteredOportunidades = oportunidades.filter((op) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      op.clienteNome.toLowerCase().includes(term) ||
      (op.endereco && op.endereco.toLowerCase().includes(term)) ||
      (op.email && op.email.toLowerCase().includes(term)) ||
      (op.telefone && op.telefone.includes(term));

    const matchesStatus = statusFilter === "TODAS" || op.status === statusFilter;
    const matchesEmpresa = empresaFilter === "TODOS" || op.empresa === empresaFilter;

    return matchesSearch && matchesStatus && matchesEmpresa;
  });

  // Calculation based on custom unit price + aditive price + insumos + estadia
  const liveValorCalculado = produto === "REVESTIMENTO"
    ? (areaPiscina * precoUnitario) + valorInsumos + valorEstadia + imposto - desconto
    : areaPiscina * (precoUnitario + precoAditivo);

  return (
    <div>
      <div className="flex-row-between">
        <div>
          <h3 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-heading)" }}>
            Painel CRM & Oportunidades
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
            Acompanhe o funil de vendas, envie propostas comerciais automatizadas em Word (.docx) e converta oportunidades em obras.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNewModal}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px" }}><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
          Nova Oportunidade
        </button>
      </div>

      {/* Seletor de Empresa */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", padding: "12px", backgroundColor: "var(--bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", alignItems: "center" }}>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-heading)" }}>Filtrar Funil:</span>
        <div style={{ display: "inline-flex", gap: "8px" }}>
          {[
            { id: "TODOS", name: "Consolidado" },
            { id: "JHOSTON", name: "Jhoston Pools" },
            { id: "ECO_STONE", name: "Eco Stone" },
            { id: "JHOSTON_REVEST", name: "Jhoston Revest" }
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => setEmpresaFilter(c.id)}
              className={`btn btn-sm ${empresaFilter === c.id ? "btn-primary" : "btn-secondary"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Cards de KPIs */}
      <div className="grid-cols-4" style={{ marginBottom: "20px", marginTop: "20px" }}>
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>Total de Oportunidades</span>
          <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-heading)" }}>{totalOps}</span>
        </div>
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>Em Negociação (Valor)</span>
          <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--warning)" }}>{formatCurrency(valNegotiation)}</span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{inNegotiation.length} propostas ativas</span>
        </div>
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>Fechado / Ganho (Valor)</span>
          <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--success)" }}>{formatCurrency(valAccepted)}</span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{totalAccepted} obras criadas</span>
        </div>
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>Taxa de Conversão</span>
          <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--primary)" }}>{conversionRate}%</span>
          <div style={{ height: "4px", width: "100%", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden", marginTop: "4px" }}>
            <div style={{ width: `${conversionRate}%`, height: "100%", background: "var(--primary-color)" }}></div>
          </div>
        </div>
      </div>

      {/* Controles de Filtros e Abas */}
      <div className="card" style={{ padding: "16px", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            className="form-control"
            placeholder="Pesquisar por cliente, endereço, e-mail ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: "450px" }}
          />
        </div>

        {/* Abas de Status */}
        <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "10px", flexWrap: "wrap" }}>
          {["TODAS", "PENDENTE", "PROPOSTA_GERADA", "PROPOSTA_ENVIADA", "ACEITO", "RECUSADO"].map((statusOption) => {
            const isActive = statusFilter === statusOption;
            const count = statusOption === "TODAS"
              ? oportunidades.length
              : oportunidades.filter(o => o.status === statusOption).length;

            return (
              <button
                key={statusOption}
                onClick={() => setStatusFilter(statusOption)}
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  background: isActive ? "var(--primary-color)" : "rgba(255,255,255,0.03)",
                  color: isActive ? "#ffffff" : "var(--text-muted)",
                  transition: "all 0.2s"
                }}
              >
                {statusOption === "TODAS" ? "Todas" : statusOption.replace("_", " ")} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Listagem de Oportunidades */}
      <div className="table-container">
        {filteredOportunidades.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            Nenhuma oportunidade cadastrada ou encontrada para os filtros aplicados.
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Cliente / Contato</th>
                <th>Endereço da Obra</th>
                <th>Produto / Área</th>
                <th style={{ textAlign: "right" }}>Valor Proposta</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ textAlign: "center", width: "360px" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredOportunidades.map((op) => (
                <tr key={op.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", backgroundColor: "rgba(0,0,0,0.05)", color: "var(--text-muted)" }} title="Indexador/ID da Proposta">
                        PROP-{op.id}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "1px 4px",
                          backgroundColor: op.empresa === "ECO_STONE" ? "rgba(34, 197, 94, 0.12)" : "rgba(59, 130, 246, 0.12)",
                          color: op.empresa === "ECO_STONE" ? "#4ade80" : "#60a5fa",
                          borderRadius: "4px",
                          fontWeight: 600,
                        }}
                      >
                        {op.empresa === "ECO_STONE" ? "Eco Stone" : op.empresa === "JHOSTON_REVEST" ? "Jhoston Revest" : "Jhoston"}
                      </span>
                      <div style={{ fontWeight: 600, color: "var(--text-heading)" }}>{op.clienteNome}</div>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {op.telefone ? `📞 ${op.telefone}` : ""} {op.email ? ` | ✉ ${op.email}` : ""}
                    </div>
                  </td>
                  <td style={{ fontSize: "13px" }}>{op.endereco || "-"}</td>
                  <td>
                    <span
                      style={{
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 600,
                        backgroundColor: 
                          op.produto === "CASCATA" ? "rgba(34, 197, 94, 0.15)" :
                          op.produto === "SUPER_PREMIUM" ? "rgba(168, 85, 247, 0.15)" :
                          op.produto === "REVESTIMENTO" ? "rgba(249, 115, 22, 0.15)" : "rgba(59, 130, 246, 0.15)",
                        color: 
                          op.produto === "CASCATA" ? "#4ade80" :
                          op.produto === "SUPER_PREMIUM" ? "#c084fc" :
                          op.produto === "REVESTIMENTO" ? "#fdba74" : "#60a5fa",
                        marginRight: "6px"
                      }}
                    >
                      {op.produto === "CASCATA" ? "Cascata" : op.produto === "SUPER_PREMIUM" ? "Super Premium" : op.produto === "REVESTIMENTO" ? "Revestimento" : "Premium"}
                    </span>
                    <span style={{ fontSize: "13px" }}>
                      {op.produto === "CASCATA" ? `${op.areaPiscina} un` : formatArea(op.areaPiscina)}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 700, color: "var(--text-heading)" }}>
                    {formatCurrency(op.valorProposta)}
                  </td>
                  <td style={{ textAlign: "center" }}>{getStatusBadge(op.status)}</td>
                  <td>
                    <div className="flex-gap-12" style={{ justifyContent: "center", flexWrap: "wrap" }}>
                      {/* Gerar Proposta */}
                      <Link
                        href={`/crm/propostas/${op.id}`}
                        className="btn btn-sm btn-secondary"
                        style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                        title="Visualizar Proposta (Preview e PDF)"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        Proposta
                      </Link>

                      {/* Converter em Obra */}
                      {op.status !== "ACEITO" ? (
                        <button
                          onClick={() => openConvertModal(op)}
                          className="btn btn-sm btn-success"
                          style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                          Aceitar Obra
                        </button>
                      ) : (
                        <button className="btn btn-sm btn-secondary" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
                          ✓ Convertido
                        </button>
                      )}

                      <button onClick={() => openEditModal(op)} className="btn btn-sm btn-secondary">
                        Editar
                      </button>
                      <button onClick={() => handleDelete(op.id)} className="btn btn-sm btn-danger">
                        Remover
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: "680px", width: "95%" }}>
            <div className="modal-header">
              <h4 style={{ fontSize: "16px", color: "var(--text-heading)" }}>
                {editingOportunidade ? "Editar Oportunidade" : "Nova Oportunidade comercial"}
              </h4>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ maxHeight: "75vh", overflowY: "auto" }}>
                {errorMsg && (
                  <div className="error-alert" style={{ marginBottom: "12px", padding: "10px", backgroundColor: "rgba(239, 68, 68, 0.1)", borderLeft: "3px solid var(--error)", color: "var(--error)", fontSize: "13px", borderRadius: "4px" }}>
                    {errorMsg}
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <label className="form-label">Nome do Cliente / Prospect *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Hotel Fazenda Vale Verde, João Silva..."
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                    required
                  />
                </div>

                <div className="grid-cols-2" style={{ gap: "12px", marginBottom: "12px" }}>
                  <div className="form-group">
                    <label className="form-label">Telefone de Contato</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="(00) 99999-9999"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">E-mail</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="cliente@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <label className="form-label">Endereço da Piscina / Obra</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Rua, Número, Bairro, Cidade..."
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <label className="form-label">Descrição Breve da Piscina</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Piscina retangular 10x5m com prainha"
                    value={descricaoPiscina}
                    onChange={(e) => setDescricaoPiscina(e.target.value)}
                  />
                </div>

                <div className="grid-cols-3" style={{ gap: "12px", marginBottom: "12px", alignItems: "flex-end" }}>
                  <div className="form-group">
                    <label className="form-label">Produto / Linha</label>
                    <select
                      className="form-control"
                      value={produto}
                      onChange={(e) => handleProdutoChange(e.target.value as any)}
                    >
                      <option value="PREMIUM">Premium (Resina PU)</option>
                      <option value="SUPER_PREMIUM">Super Premium (Poliaspártica)</option>
                      <option value="CASCATA">Cascata (Eco Stone)</option>
                      <option value="REVESTIMENTO">Revestimento (Jhoston Revest)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      {produto === "CASCATA" ? "Quantidade de Cascatas *" : produto === "REVESTIMENTO" ? "Área de Aplicação (m²) *" : "Área da Piscina (m²) *"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder="0.00"
                      value={areaPiscina || ""}
                      onChange={(e) => setAreaPiscina(parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                </div>

                <div className="grid-cols-2" style={{ gap: "12px", marginBottom: "12px" }}>
                  <div className="form-group">
                    <label className="form-label">
                      {produto === "CASCATA" ? "Valor de Mão de Obra (R$)" : "Valor Unitário do Produto (R$/m²)"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={precoUnitario || ""}
                      onChange={(e) => setPrecoUnitario(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      {produto === "CASCATA" ? "Previsão de Material (R$)" : "Valor Unitário do Aditivo (R$/m²)"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={precoAditivo || ""}
                      onChange={(e) => setPrecoAditivo(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status da Negociação</label>
                    <select
                      className="form-control"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="PENDENTE">Pendente</option>
                      <option value="PROPOSTA_GERADA">Proposta Gerada</option>
                      <option value="PROPOSTA_ENVIADA">Proposta Enviada</option>
                      <option value="ACEITO">Aceito (Obra Ativa)</option>
                      <option value="RECUSADO">Recusado</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Empresa Vinculada *</label>
                    <select
                      className="form-control"
                      value={empresa}
                      onChange={(e) => setEmpresa(e.target.value)}
                      required
                    >
                      <option value="JHOSTON">Jhoston Pools</option>
                      <option value="ECO_STONE">Eco Stone</option>
                      <option value="JHOSTON_REVEST">Jhoston Revest</option>
                    </select>
                  </div>
                </div>

                {/* Planilha de orçamento Jhoston Revest se selecionado */}
                {produto === "REVESTIMENTO" && (
                  <div style={{
                    border: "1px solid rgba(249, 115, 22, 0.2)",
                    backgroundColor: "rgba(249, 115, 22, 0.02)",
                    padding: "14px",
                    borderRadius: "6px",
                    marginBottom: "12px",
                    display: "grid",
                    gap: "12px"
                  }}>
                    <h5 style={{ fontSize: "13px", fontWeight: 700, color: "#fdba74", margin: "0 0 4px 0" }}>
                      Planilha de Orçamento - Jhoston Revest
                    </h5>
                    
                    <div className="form-group">
                      <label className="form-label" style={{ color: "var(--text-heading)" }}>Descrição do Serviço na Proposta</label>
                      <input
                        type="text"
                        className="form-control"
                        value={descricaoServico}
                        onChange={(e) => setDescricaoServico(e.target.value)}
                      />
                    </div>

                    <div className="grid-cols-2" style={{ gap: "12px" }}>
                      <div className="form-group">
                        <label className="form-label">Valor de Insumos (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={valorInsumos}
                          onChange={(e) => setValorInsumos(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Estadia e Deslocamento (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={valorEstadia}
                          onChange={(e) => setValorEstadia(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    <div className="grid-cols-3" style={{ gap: "12px" }}>
                      <div className="form-group">
                        <label className="form-label">Imposto (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={imposto}
                          onChange={(e) => setImposto(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Desconto (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={desconto}
                          onChange={(e) => setDesconto(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Prazo Aplicação (dias)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={prazoAplicacao}
                          onChange={(e) => setPrazoAplicacao(parseInt(e.target.value, 10) || 15)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ color: "var(--text-heading)" }}>Conta Bancária para a Proposta *</label>
                      <select
                        className="form-control"
                        value={contaBancariaId || ""}
                        onChange={(e) => setContaBancariaId(e.target.value ? Number(e.target.value) : null)}
                        required
                      >
                        <option value="">-- Selecione uma conta --</option>
                        {contasBancarias.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.banco} - {c.titular} ({c.empresa === "JHOSTON" ? "Jhoston" : c.empresa === "ECO_STONE" ? "Eco Stone" : c.empresa === "JHOSTON_REVEST" ? "Jhoston Revest" : "Ambas"})
                          </option>
                        ))}
                      </select>
                      {contasBancarias.length === 0 && (
                        <p style={{ fontSize: "11px", color: "var(--warning)", marginTop: "4px" }}>
                          Atenção: Nenhuma conta bancária cadastrada. Cadastre uma conta ativa primeiro!
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Previsualização Financeira */}
                <div
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    border: "1px dashed rgba(255,255,255,0.08)",
                    padding: "12px",
                    borderRadius: "6px",
                    marginBottom: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Cálculo Comercial Estimado:</span>
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-heading)" }}>
                      {produto === "CASCATA" ? (
                        <>
                          {areaPiscina} cascata(s) &times; ({formatCurrency(precoUnitario)} mão de obra + {formatCurrency(precoAditivo)} material)
                        </>
                      ) : produto === "REVESTIMENTO" ? (
                        <>
                          Revestimento: {areaPiscina} m² &times; {formatCurrency(precoUnitario)}/m²
                          <br />
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            (+ {formatCurrency(valorInsumos)} Insumos) (+ {formatCurrency(valorEstadia)} Deslocamento)
                            {imposto > 0 && ` (+ ${formatCurrency(imposto)} Imposto)`}
                            {desconto > 0 && ` (- ${formatCurrency(desconto)} Desconto)`}
                          </span>
                        </>
                      ) : (
                        <>
                          {areaPiscina} m² &times; {formatCurrency(precoUnitario + precoAditivo)}/m²
                          <br />
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            ({formatCurrency(precoUnitario)} produto + {formatCurrency(precoAditivo)} aditivo)
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Valor Proposta:</span>
                    <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--success)" }}>
                      {formatCurrency(liveValorCalculado)}
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Observações / Notas Internas</label>
                  <textarea
                    className="form-control"
                    placeholder="Insira detalhes da negociação, condições de pagamento acertadas..."
                    style={{ minHeight: "70px", resize: "vertical" }}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer flex-gap-12" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingOportunidade ? "Salvar Alterações" : "Criar Oportunidade"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONVERSÃO EM CLIENTE ATIVO (OBRA) */}
      {isConvertModalOpen && convertingOportunidade && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: "480px", width: "95%" }}>
            <div className="modal-header">
              <h4 style={{ fontSize: "16px", color: "var(--text-heading)" }}>Aceitar Proposta e Criar Obra</h4>
              <button className="close-btn" onClick={closeConvertModal}>&times;</button>
            </div>
            <form onSubmit={handleConvert}>
              <div className="modal-body">
                <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "15px" }}>
                  A proposta foi aceita! O status deste prospect mudará para <strong>ACEITO</strong> e o sistema criará uma nova obra com status ativa.
                </p>

                <div className="form-group">
                  <label className="form-label">Nome da Obra (Projeto) *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={nomeObra}
                    onChange={(e) => setNomeObra(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Valor Fechado (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={valorFechadoConvert}
                    onChange={(e) => setValorFechadoConvert(e.target.value)}
                    required
                  />
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                    Iniciado automaticamente com o valor da proposta comercial. Você pode alterá-lo se necessário.
                  </p>
                </div>

                <div style={{ marginTop: "12px", fontSize: "13px", color: "var(--text-muted)" }}>
                  <div><strong>Cliente:</strong> {convertingOportunidade.clienteNome}</div>
                  <div><strong>Endereço:</strong> {convertingOportunidade.endereco || "-"}</div>
                </div>
              </div>
              <div className="modal-footer flex-gap-12" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={closeConvertModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success">
                  Confirmar e Iniciar Obra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
