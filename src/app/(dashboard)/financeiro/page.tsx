"use client";

import { useEffect, useState, startTransition } from "react";
import { getFinanceiroData, salvarTransacao, deleteTransacao, alterarStatusTransacao, salvarTransferenciaIntercompany } from "./actions";
import { salvarFornecedor } from "../fornecedores/actions";
import { getSession } from "@/app/login/actions";
import Link from "next/link";

interface Session {
  userId: number;
  userName: string;
  userRole: "MASTER" | "ESCRITORIO" | "CAMPO";
}

interface Obra {
  id: number;
  nome: string;
  status: string;
  valorFechado: number;
  clienteNome: string;
}

interface Fornecedor {
  id: number;
  nome: string;
  cnpj: string | null;
  pix: string | null;
}

interface Transacao {
  id: number;
  tipo: "RECEITA" | "DESPESA";
  categoria: string;
  obraId: number | null;
  obra: Obra | null;
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataPagamento: string | null;
  status: string;
  clienteFornecedor: string | null;
  fornecedorId: number | null;
  fornecedor: Fornecedor | null;
  empresa: string;
}

export default function FinanceiroPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "transacoes">("dashboard");

  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("TODOS");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [obraFilter, setObraFilter] = useState("TODOS");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransacao, setEditingTransacao] = useState<Transacao | null>(null);

  // Form states
  const [tipo, setTipo] = useState<"RECEITA" | "DESPESA">("DESPESA");
  const [categoria, setCategoria] = useState("Fornecedores");
  const [selectedObraId, setSelectedObraId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [dataVencimento, setDataVencimento] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState("PENDENTE");
  const [dataPagamento, setDataPagamento] = useState("");
  const [clienteFornecedor, setClienteFornecedor] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [empresa, setEmpresa] = useState("JHOSTON");
  const [errorMsg, setErrorMsg] = useState("");
  const [empresaFilter, setEmpresaFilter] = useState("TODOS");

  // Intercompany Transfer Modal states
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferOrigem, setTransferOrigem] = useState<"JHOSTON" | "ECO_STONE">("JHOSTON");
  const [transferDestino, setTransferDestino] = useState<"JHOSTON" | "ECO_STONE">("ECO_STONE");
  const [transferValor, setTransferValor] = useState("");
  const [transferData, setTransferData] = useState(new Date().toISOString().split("T")[0]);
  const [transferDescricao, setTransferDescricao] = useState("");
  const [transferError, setTransferError] = useState("");
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  // Intercompany Acknowledgment states
  const [isReciboModalOpen, setIsReciboModalOpen] = useState(false);
  const [selectedTransferParaRecibo, setSelectedTransferParaRecibo] = useState<Transacao | null>(null);

  // Quick Fornecedor Modal states
  const [isQuickFornecedorOpen, setIsQuickFornecedorOpen] = useState(false);
  const [quickNome, setQuickNome] = useState("");
  const [quickPix, setQuickPix] = useState("");

  const loadData = () => {
    getFinanceiroData().then((res) => {
      setObras(res.obras);
      setFornecedores(res.fornecedores || []);
      const mapped = res.transacoes.map((t) => ({
        ...t,
        dataVencimento: new Date(t.dataVencimento).toISOString().split("T")[0],
        dataPagamento: t.dataPagamento ? new Date(t.dataPagamento).toISOString().split("T")[0] : null,
      }));
      setTransacoes(mapped as any);
    });
  };

  useEffect(() => {
    getSession().then((res) => {
      setSession(res as any);
      setIsSessionLoading(false);
    });
    loadData();
  }, []);

  const openNewModal = (initialTipo: "RECEITA" | "DESPESA" = "DESPESA") => {
    setEditingTransacao(null);
    setTipo(initialTipo);
    setCategoria(initialTipo === "RECEITA" ? "Cliente" : "Fornecedores");
    setSelectedObraId("");
    setDescricao("");
    setValor("");
    setDataVencimento(new Date().toISOString().split("T")[0]);
    setStatus("PENDENTE");
    setDataPagamento("");
    setClienteFornecedor("");
    setFornecedorId("");
    setEmpresa("JHOSTON");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (t: Transacao) => {
    setEditingTransacao(t);
    setTipo(t.tipo);
    setCategoria(t.categoria);
    setSelectedObraId(t.obraId ? t.obraId.toString() : "");
    setDescricao(t.descricao);
    setValor(t.valor.toString());
    setDataVencimento(t.dataVencimento);
    setStatus(t.status);
    setDataPagamento(t.dataPagamento || "");
    setClienteFornecedor(t.clienteFornecedor || "");
    setFornecedorId(t.fornecedorId ? t.fornecedorId.toString() : "");
    setEmpresa((t as any).empresa || "JHOSTON");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTransacao(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) {
      setErrorMsg("A descrição é obrigatória.");
      return;
    }
    if (!valor || parseFloat(valor) <= 0) {
      setErrorMsg("Insira um valor financeiro válido.");
      return;
    }

    // Se for despesa com fornecedores, valida se um fornecedor cadastrado foi selecionado
    if (tipo === "DESPESA" && categoria === "Fornecedores" && !fornecedorId) {
      setErrorMsg("Selecione um fornecedor para o lançamento.");
      return;
    }

    const payload = {
      id: editingTransacao?.id,
      tipo,
      categoria,
      obraId: selectedObraId ? parseInt(selectedObraId) : null,
      descricao,
      valor: parseFloat(valor),
      dataVencimento,
      dataPagamento: status === "PAGO" ? (dataPagamento || new Date().toISOString().split("T")[0]) : null,
      status,
      clienteFornecedor: tipo === "DESPESA" && categoria === "Fornecedores" ? "" : clienteFornecedor,
      fornecedorId: tipo === "DESPESA" && categoria === "Fornecedores" && fornecedorId ? parseInt(fornecedorId) : null,
      empresa,
    };

    startTransition(async () => {
      const res = await salvarTransacao(payload);
      if (res.success) {
        loadData();
        closeModal();
      } else {
        setErrorMsg("Erro ao salvar a transação.");
      }
    });
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (transferOrigem === transferDestino) {
      setTransferError("As empresas de origem e destino devem ser diferentes.");
      return;
    }
    const val = parseFloat(transferValor);
    if (isNaN(val) || val <= 0) {
      setTransferError("Insira um valor válido maior que zero.");
      return;
    }
    if (!transferDescricao.trim()) {
      setTransferError("A descrição do empréstimo é obrigatória.");
      return;
    }

    setTransferSubmitting(true);
    setTransferError("");

    startTransition(async () => {
      const res = await salvarTransferenciaIntercompany({
        origem: transferOrigem,
        destino: transferDestino,
        valor: val,
        dataVencimento: transferData,
        descricao: transferDescricao,
      });
      setTransferSubmitting(false);
      if (res.success) {
        loadData();
        setIsTransferModalOpen(false);
        setTransferValor("");
        setTransferDescricao("");
      } else {
        setTransferError(res.error || "Erro ao salvar transferência.");
      }
    });
  };

  const handleQuickFornecedorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNome.trim()) return;

    const res = await salvarFornecedor({ nome: quickNome, pix: quickPix });
    if (res.success && res.data) {
      // Recarregar fornecedores e selecionar o novo
      getFinanceiroData().then((resData) => {
        setFornecedores(resData.fornecedores || []);
        const found = resData.fornecedores.find((f: any) => f.nome === quickNome.trim());
        setFornecedorId(found ? found.id.toString() : res.data!.id.toString());
      });
      setIsQuickFornecedorOpen(false);
      setQuickNome("");
      setQuickPix("");
    } else {
      alert(res.error || "Erro ao salvar fornecedor rápido.");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Deseja realmente excluir esta transação financeira?")) {
      const res = await deleteTransacao(id);
      if (res.success) {
        loadData();
      } else {
        alert(res.error);
      }
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "PENDENTE" ? "PAGO" : "PENDENTE";
    const res = await alterarStatusTransacao(id, newStatus);
    if (res.success) {
      loadData();
    }
  };

  const formatDateBR = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  // Filtrar transações globais para os cálculos dependendo da empresa
  const transacoesFiltradasEmpresa = transacoes.filter(
    (t) => empresaFilter === "TODOS" || (t as any).empresa === empresaFilter
  );

  // Cálculos Financeiros Globais
  const receitasRecebidas = transacoesFiltradasEmpresa.filter((t) => t.tipo === "RECEITA" && t.status === "PAGO").reduce((acc, t) => acc + t.valor, 0);
  const despesasPagas = transacoesFiltradasEmpresa.filter((t) => t.tipo === "DESPESA" && t.status === "PAGO").reduce((acc, t) => acc + t.valor, 0);
  const caixaAtual = receitasRecebidas - despesasPagas;

  const contasAReceberPendente = transacoesFiltradasEmpresa.filter((t) => t.tipo === "RECEITA" && t.status !== "PAGO").reduce((acc, t) => acc + t.valor, 0);
  const contasAPagarPendente = transacoesFiltradasEmpresa.filter((t) => t.tipo === "DESPESA" && t.status !== "PAGO").reduce((acc, t) => acc + t.valor, 0);

  // Filtragem da lista
  const filteredTransacoes = transacoes.filter((t) => {
    const matchesSearch =
      t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.clienteFornecedor && t.clienteFornecedor.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTipo = tipoFilter === "TODOS" || t.tipo === tipoFilter;
    const matchesStatus = statusFilter === "TODOS" || t.status === statusFilter;
    const matchesObra = obraFilter === "TODOS" || t.obraId?.toString() === obraFilter;
    const matchesEmpresa = empresaFilter === "TODOS" || (t as any).empresa === empresaFilter;

    return matchesSearch && matchesTipo && matchesStatus && matchesObra && matchesEmpresa;
  });

  // Carga e processamento dos gráficos
  const getLast6Months = () => {
    const months = [];
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mIndex = d.getMonth();
      const year = d.getFullYear();
      months.push({
        key: `${year}-${String(mIndex + 1).padStart(2, '0')}`,
        label: `${monthNames[mIndex]}/${String(year).slice(-2)}`,
        receitas: 0,
        despesas: 0,
      });
    }
    return months;
  };

  const monthlyData = getLast6Months();
  transacoesFiltradasEmpresa.forEach((t) => {
    if (t.status === "PAGO") {
      const dateStr = t.dataPagamento || t.dataVencimento;
      if (dateStr) {
        const monthKey = dateStr.slice(0, 7);
        const match = monthlyData.find((m) => m.key === monthKey);
        if (match) {
          if (t.tipo === "RECEITA") {
            match.receitas += t.valor;
          } else {
            match.despesas += t.valor;
          }
        }
      }
    }
  });

  const categoriesMap: Record<string, number> = {
    "Fornecedores": 0,
    "Folha": 0,
    "Viagem": 0,
    "Outros": 0,
  };
  let totalDespesasRealizadas = 0;
  transacoesFiltradasEmpresa.forEach((t) => {
    if (t.tipo === "DESPESA" && t.status === "PAGO") {
      const cat = t.categoria || "Outros";
      if (cat in categoriesMap) {
        categoriesMap[cat] += t.valor;
      } else {
        categoriesMap["Outros"] += t.valor;
      }
      totalDespesasRealizadas += t.valor;
    }
  });

  const slices = [
    { label: "Fornecedores", value: categoriesMap["Fornecedores"], color: "var(--primary)" },
    { label: "Folha Pagamento", value: categoriesMap["Folha"], color: "#8b5cf6" },
    { label: "Custo Viagem", value: categoriesMap["Viagem"], color: "#f59e0b" },
    { label: "Outros", value: categoriesMap["Outros"], color: "#6b7280" },
  ].filter(s => s.value > 0);

  const renderMonthlyChart = () => {
    const maxVal = Math.max(...monthlyData.map((d) => Math.max(d.receitas, d.despesas)), 1000);
    const width = 600;
    const height = 220;
    const paddingLeft = 55;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    const barWidth = 18;
    const gap = 4;
    const groupGap = 40;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = paddingTop + chartHeight * (1 - ratio);
          const val = maxVal * ratio;
          return (
            <g key={idx}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="var(--border-color)" strokeDasharray="3 3" strokeWidth={1} />
              <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fill="var(--text-muted)" fontSize={10} fontWeight={600}>
                {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0)}
              </text>
            </g>
          );
        })}
        {monthlyData.map((d, idx) => {
          const xGroup = paddingLeft + idx * (barWidth * 2 + gap + groupGap) + groupGap / 2;
          const xReceita = xGroup;
          const xDespesa = xGroup + barWidth + gap;
          const hReceita = (d.receitas / maxVal) * chartHeight;
          const hDespesa = (d.despesas / maxVal) * chartHeight;
          const yReceita = paddingTop + chartHeight - hReceita;
          const yDespesa = paddingTop + chartHeight - hDespesa;

          return (
            <g key={idx}>
              <rect x={xReceita} y={yReceita} width={barWidth} height={Math.max(hReceita, 2)} rx={3} fill="url(#greenGrad)">
                <title>{`Receita: ${formatCurrency(d.receitas)}`}</title>
              </rect>
              <rect x={xDespesa} y={yDespesa} width={barWidth} height={Math.max(hDespesa, 2)} rx={3} fill="url(#redGrad)">
                <title>{`Despesa: ${formatCurrency(d.despesas)}`}</title>
              </rect>
              <text x={xGroup + barWidth + gap / 2} y={height - 8} textAnchor="middle" fill="var(--text-muted)" fontSize={11} fontWeight={600}>
                {d.label}
              </text>
            </g>
          );
        })}
        <defs>
          <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  const renderDonutChart = () => {
    const total = totalDespesasRealizadas || 1;
    const radius = 50;
    const circ = 2 * Math.PI * radius;
    const size = 160;
    const center = size / 2;
    let currentOffset = 0;

    return (
      <svg width="100%" height="180px" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--border-color)" strokeWidth={12} opacity={0.3} />
        {slices.map((slice, idx) => {
          const percentage = slice.value / total;
          const strokeLength = percentage * circ;
          const strokeOffset = circ - currentOffset;
          currentOffset += strokeLength;

          return (
            <circle
              key={idx}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={14}
              strokeDasharray={`${strokeLength} ${circ}`}
              strokeDashoffset={strokeOffset}
              transform={`rotate(-90 ${center} ${center})`}
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            >
              <title>{`${slice.label}: ${formatCurrency(slice.value)} (${(percentage * 100).toFixed(1)}%)`}</title>
            </circle>
          );
        })}
        <text x={center} y={center + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--text-heading)">
          {totalDespesasRealizadas > 0 ? "Despesas" : "R$ 0,00"}
        </text>
        <text x={center} y={center + 16} textAnchor="middle" fontSize={9} fontWeight={600} fill="var(--text-muted)">
          {totalDespesasRealizadas > 0 ? formatCurrency(totalDespesasRealizadas) : "Pagas"}
        </text>
      </svg>
    );
  };

  if (isSessionLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ border: "4px solid rgba(0, 0, 0, 0.1)", width: "36px", height: "36px", borderRadius: "50%", borderLeftColor: "var(--primary)", animation: "spin 1s linear infinite" }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (session?.userRole === "CAMPO") {
    return (
      <div style={{ padding: "40px", textAlign: "center", backgroundColor: "var(--bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", maxWidth: "500px", margin: "40px auto" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🚫</div>
        <h3 style={{ fontSize: "20px", fontWeight: 700, color: "var(--error)", marginBottom: "8px" }}>Acesso Negado</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: 1.5 }}>
          Usuários do perfil de **Campo** não têm permissão para acessar o painel e controle financeiro. Entre em contato com a administração se achar que isso é um erro.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex-row-between">
        <div>
          <h3 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-heading)" }}>
            Controle Financeiro
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
            Gerencie o caixa, contas a pagar a fornecedores e recebimentos de clientes de forma unificada.
          </p>
        </div>
        <div style={{ display: "inline-flex", gap: "10px" }}>
          <Link href="/financeiro/boletos" className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Gerenciar Boletos
          </Link>
          <button className="btn btn-secondary" onClick={() => openNewModal("RECEITA")}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px", color: "var(--success)" }}><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
            Nova Receita (Cliente)
          </button>
          <button className="btn btn-primary" onClick={() => openNewModal("DESPESA")}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px" }}><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
            Nova Despesa (Fornecedor)
          </button>
        </div>
      </div>

      {/* Seletor de Empresa */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", padding: "12px", backgroundColor: "var(--bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", alignItems: "center" }}>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-heading)" }}>Visualizar Empresa:</span>
        <div style={{ display: "inline-flex", gap: "8px" }}>
          {[
            { id: "TODOS", name: "Consolidado" },
            { id: "JHOSTON", name: "Jhoston Pools" },
            { id: "ECO_STONE", name: "Eco Stone" }
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
        <div style={{ marginLeft: "auto" }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setIsTransferModalOpen(true)} style={{ gap: "6px", display: "inline-flex", alignItems: "center", borderColor: "#f59e0b", color: "#f59e0b" }}>
            🤝 Transferência Intercompany
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid-cols-4">
        <div className="card">
          <div className="card-title">Saldo em Caixa</div>
          <div className="card-value" style={{ color: caixaAtual >= 0 ? "var(--success)" : "var(--error)" }}>
            {formatCurrency(caixaAtual)}
          </div>
          <div className="card-desc">Total Recebido - Pago</div>
        </div>
        <div className="card">
          <div className="card-title">Contas a Receber</div>
          <div className="card-value" style={{ color: "var(--info)" }}>
            {formatCurrency(contasAReceberPendente)}
          </div>
          <div className="card-desc">Faturamento Pendente</div>
        </div>
        <div className="card">
          <div className="card-title">Contas a Pagar</div>
          <div className="card-value" style={{ color: "var(--warning)" }}>
            {formatCurrency(contasAPagarPendente)}
          </div>
          <div className="card-desc">Compromissos Pendentes</div>
        </div>
        <div className="card">
          <div className="card-title">Fluxo Realizado</div>
          <div className="card-desc" style={{ fontSize: "13px", marginTop: "8px" }}>
            Receitas Pagas: <strong style={{ color: "var(--success)" }}>{formatCurrency(receitasRecebidas)}</strong><br />
            Despesas Pagas: <strong style={{ color: "var(--error)" }}>{formatCurrency(despesasPagas)}</strong>
          </div>
        </div>
      </div>

      {/* Abas de Navegação */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", marginTop: "24px", marginBottom: "24px", gap: "16px" }}>
        <button
          onClick={() => setActiveTab("dashboard")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "dashboard" ? "2px solid var(--primary)" : "2px solid transparent",
            color: activeTab === "dashboard" ? "var(--primary)" : "var(--text-muted)",
            padding: "8px 16px",
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s"
          }}
        >
          📊 Painel Geral
        </button>
        <button
          onClick={() => setActiveTab("transacoes")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "transacoes" ? "2px solid var(--primary)" : "2px solid transparent",
            color: activeTab === "transacoes" ? "var(--primary)" : "var(--text-muted)",
            padding: "8px 16px",
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s"
          }}
        >
          💸 Fluxo de Caixa ({filteredTransacoes.length})
        </button>
      </div>

      {/* Tab: Dashboard */}
      {activeTab === "dashboard" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "20px", marginTop: "16px" }}>
            {/* Gráfico 1: Fluxo de Caixa Mensal */}
            <div className="card" style={{ padding: "20px" }}>
              <h4 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "16px", color: "var(--text-heading)" }}>
                📈 Fluxo de Caixa Mensal (Receitas vs Despesas Pagas)
              </h4>
              <div style={{ height: "220px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {renderMonthlyChart()}
              </div>
              <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: "12px", fontSize: "12px", fontWeight: 600 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#10b981" }}>
                  <span style={{ width: "12px", height: "12px", backgroundColor: "#10b981", borderRadius: "3px" }}></span>
                  Receitas Pagas
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#e11d48" }}>
                  <span style={{ width: "12px", height: "12px", backgroundColor: "#e11d48", borderRadius: "3px" }}></span>
                  Despesas Pagas
                </span>
              </div>
            </div>

            {/* Gráfico 2: Despesas por Categoria */}
            <div className="card" style={{ padding: "20px" }}>
              <h4 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "16px", color: "var(--text-heading)" }}>
                🍕 Distribuição de Despesas Pagas
              </h4>
              {totalDespesasRealizadas > 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: "16px", height: "220px" }}>
                  <div style={{ flex: 1.1 }}>{renderDonutChart()}</div>
                  <div style={{ flex: 1.5, display: "flex", flexDirection: "column", gap: "8px" }}>
                    {[
                      { label: "Fornecedores", value: categoriesMap["Fornecedores"], color: "var(--primary)" },
                      { label: "Folha Pagamento", value: categoriesMap["Folha"], color: "#8b5cf6" },
                      { label: "Custo Viagens", value: categoriesMap["Viagem"], color: "#f59e0b" },
                      { label: "Outras Despesas", value: categoriesMap["Outros"], color: "#6b7280" },
                    ].map((item, index) => {
                      const pct = totalDespesasRealizadas > 0 ? (item.value / totalDespesasRealizadas) * 100 : 0;
                      return (
                        <div key={index} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px" }}>
                          <span style={{ width: "10px", height: "10px", backgroundColor: item.color, borderRadius: "50%", marginTop: "3px", flexShrink: 0 }}></span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, color: "var(--text-heading)" }}>
                              <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{item.label}</span>
                              <span>{pct.toFixed(0)}%</span>
                            </div>
                            <div style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "1px" }}>{formatCurrency(item.value)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ height: "220px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "13px", fontStyle: "italic" }}>
                  <span>Nenhuma despesa paga registrada.</span>
                </div>
              )}
            </div>
          </div>

          {/* Tabela de Rentabilidade das Obras */}
          <div className="card" style={{ marginTop: "24px", padding: "20px" }}>
            <h4 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "16px", color: "var(--text-heading)" }}>
              🏡 Rentabilidade e Custos de Obras Ativas
            </h4>
            <div className="table-container" style={{ margin: 0, border: "none", boxShadow: "none" }}>
              <table className="table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Obra / Cliente</th>
                    <th>Valor do Contrato</th>
                    <th>Custos Incorridos</th>
                    <th style={{ width: "220px" }}>Consumo do Orçamento</th>
                    <th>Margem Realizada</th>
                    <th style={{ textAlign: "right" }}>Margem %</th>
                  </tr>
                </thead>
                <tbody>
                  {obras.filter(o => o.status === "ATIVA" && (empresaFilter === "TODOS" || (o as any).empresa === empresaFilter)).length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px", fontStyle: "italic" }}>
                        Nenhuma obra ativa encontrada para análise.
                      </td>
                    </tr>
                  ) : (
                    obras.filter(o => o.status === "ATIVA" && (empresaFilter === "TODOS" || (o as any).empresa === empresaFilter)).map((o) => {
                      const despesas = transacoesFiltradasEmpresa
                        .filter((t) => t.obraId === o.id && t.tipo === "DESPESA")
                        .reduce((acc, t) => acc + t.valor, 0);
                      const valorFechado = o.valorFechado || 0;
                      const lucro = valorFechado - despesas;
                      const margemPct = valorFechado > 0 ? (lucro / valorFechado) * 100 : 0;
                      const consumoPct = valorFechado > 0 ? (despesas / valorFechado) * 100 : 0;
                      
                      const progressColor = consumoPct <= 60 ? "#10b981" : consumoPct <= 80 ? "#f59e0b" : "#f43f5e";

                      return (
                        <tr key={o.id}>
                          <td style={{ verticalAlign: "middle" }}>
                            <strong style={{ color: "var(--text-heading)", display: "block" }}>{o.nome}</strong>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{o.clienteNome || "Cliente não especificado"}</span>
                          </td>
                          <td style={{ fontWeight: 600, verticalAlign: "middle" }}>{formatCurrency(valorFechado)}</td>
                          <td style={{ fontWeight: 600, color: "var(--error)", verticalAlign: "middle" }}>{formatCurrency(despesas)}</td>
                          <td style={{ verticalAlign: "middle" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 600, color: "var(--text-muted)" }}>
                              <span>Gasto</span>
                              <span style={{ color: progressColor }}>{consumoPct.toFixed(0)}%</span>
                            </div>
                            <div style={{ width: "100%", backgroundColor: "var(--bg-app)", borderRadius: "4px", height: "8px", overflow: "hidden", marginTop: "4px", border: "1px solid var(--border-color)" }}>
                              <div style={{ width: `${Math.min(consumoPct, 100)}%`, backgroundColor: progressColor, height: "100%", borderRadius: "4px", transition: "width 0.5s ease-out" }}></div>
                            </div>
                          </td>
                          <td style={{ fontWeight: 600, color: lucro >= 0 ? "var(--success)" : "var(--error)", verticalAlign: "middle" }}>
                            {formatCurrency(lucro)}
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 700, color: margemPct >= 20 ? "var(--success)" : margemPct >= 0 ? "var(--text-heading)" : "var(--error)", verticalAlign: "middle" }}>
                            {margemPct.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Tab: Transacoes (Fluxo de Caixa) */}
      {activeTab === "transacoes" && (
        <>
          {/* Barra de Filtros */}
          <div className="filters-bar">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Buscar Transação</label>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por descrição ou fornecedor/cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Tipo</label>
              <select className="form-control" value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)}>
                <option value="TODOS">Todos os Tipos</option>
                <option value="RECEITA">Apenas Receitas (Entradas)</option>
                <option value="DESPESA">Apenas Despesas (Saídas)</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Status</label>
              <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="TODOS">Todos os Status</option>
                <option value="PENDENTE">Pendente</option>
                <option value="PAGO">Pago</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1.5 }}>
              <label className="form-label">Obra</label>
              <select className="form-control" value={obraFilter} onChange={(e) => setObraFilter(e.target.value)}>
                <option value="TODOS">Todas as Obras</option>
                {obras.map((o) => (
                  <option key={o.id} value={o.id}>{o.nome}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabela de Transações */}
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Cliente / Fornecedor</th>
                  <th>Descrição</th>
                  <th>Obra Vinculada</th>
                  <th>Vencimento</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th style={{ width: "240px", textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransacoes.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
                      Nenhuma transação financeira encontrada.
                    </td>
                  </tr>
                ) : (
              filteredTransacoes.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span className={`badge ${t.tipo === "RECEITA" ? "badge-success" : "badge-danger"}`} style={{ display: "inline-block", textAlign: "center" }}>
                        {t.tipo === "RECEITA" ? "Receita" : "Despesa"}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "1px 4px",
                          backgroundColor: (t as any).empresa === "ECO_STONE" ? "rgba(34, 197, 94, 0.12)" : "rgba(59, 130, 246, 0.12)",
                          color: (t as any).empresa === "ECO_STONE" ? "#4ade80" : "#60a5fa",
                          borderRadius: "4px",
                          fontWeight: 600,
                          textAlign: "center",
                          display: "inline-block"
                        }}
                      >
                        {(t as any).empresa === "ECO_STONE" ? "Eco Stone" : "Jhoston"}
                      </span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {t.clienteFornecedor || <em style={{ color: "var(--text-muted)" }}>Não informado</em>}
                  </td>
                  <td>{t.descricao}</td>
                  <td>
                    {t.obra ? (
                      <span style={{ fontWeight: 500, color: "var(--primary)" }}>{t.obra.nome}</span>
                    ) : (
                      <em style={{ color: "var(--text-muted)", fontSize: "13px" }}>Caixa Geral</em>
                    )}
                  </td>
                  <td>{formatDateBR(t.dataVencimento)}</td>
                  <td style={{ fontWeight: 700, color: t.tipo === "RECEITA" ? "var(--success)" : "var(--text-heading)" }}>
                    {t.tipo === "RECEITA" ? "+" : "-"} {formatCurrency(t.valor)}
                  </td>
                  <td>
                    <span className={`badge ${t.status === "PAGO" ? "badge-success" : "badge-warning"}`}>
                      {t.status === "PAGO" ? "Pago" : "Pendente"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "8px" }}>
                      {t.categoria === "Empréstimo Intercompany" && (
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#d97706", border: "1px solid rgba(245, 158, 11, 0.25)" }}
                          onClick={() => {
                            setSelectedTransferParaRecibo(t);
                            setIsReciboModalOpen(true);
                          }}
                        >
                          📄 Ciência
                        </button>
                      )}
                      <button
                        className={`btn btn-sm ${t.status === "PAGO" ? "btn-secondary" : "btn-primary"}`}
                        onClick={() => handleToggleStatus(t.id, t.status)}
                      >
                        {t.status === "PAGO" ? "Marcar Pendente" : "Marcar Pago"}
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(t)}>
                        Editar
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )}

      {/* Modal de Criação / Edição */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4 style={{ fontSize: "18px", fontWeight: 600 }}>
                {editingTransacao ? "Editar Transação" : `Lançar Nova ${tipo === "RECEITA" ? "Receita" : "Despesa"}`}
              </h4>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }} onClick={closeModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {errorMsg && (
                  <div style={{ backgroundColor: "var(--error-bg)", color: "var(--error)", padding: "12px", borderRadius: "var(--radius-md)", marginBottom: "16px", fontSize: "14px", fontWeight: 500 }}>
                    {errorMsg}
                  </div>
                )}
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Tipo *</label>
                    <select className="form-control" value={tipo} onChange={(e) => {
                      const val = e.target.value as "RECEITA" | "DESPESA";
                      setTipo(val);
                      setCategoria(val === "RECEITA" ? "Cliente" : "Fornecedores");
                    }} disabled={!!editingTransacao}>
                      <option value="RECEITA">Receita (Entrada / Cliente)</option>
                      <option value="DESPESA">Despesa (Saída / Fornecedor / Outros)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Categoria *</label>
                    <select className="form-control" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                      {tipo === "RECEITA" ? (
                        <>
                          <option value="Cliente">Pagamento de Cliente</option>
                          <option value="Permuta / Terreno">Permuta / Terreno</option>
                          <option value="Outros">Outras Receitas</option>
                        </>
                      ) : (
                        <>
                          <option value="Fornecedores">Fornecedores</option>
                          <option value="Folha">Folha de Pagamento</option>
                          <option value="Viagem">Custo de Viagem / Diárias</option>
                          <option value="Outros">Outras Despesas</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* Condicional para Fornecedores Cadastrados */}
                {tipo === "DESPESA" && categoria === "Fornecedores" ? (
                  <div className="form-group">
                    <label className="form-label">Fornecedor Cadastrado *</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <select 
                        className="form-control" 
                        value={fornecedorId} 
                        onChange={(e) => setFornecedorId(e.target.value)}
                        required
                        style={{ flex: 1 }}
                      >
                        <option value="">-- Selecione um Fornecedor --</option>
                        {fornecedores.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.nome} {f.cnpj ? `(CNPJ: ${f.cnpj})` : ""}
                          </option>
                        ))}
                      </select>
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        style={{ padding: "0 12px", height: "40px", fontSize: "18px", fontWeight: "bold" }}
                        onClick={() => setIsQuickFornecedorOpen(true)}
                        title="Cadastrar fornecedor rápido"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">{tipo === "RECEITA" ? "Cliente" : "Fornecedor / Favorecido"}</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={`Nome do ${tipo === "RECEITA" ? "cliente" : "fornecedor"}...`}
                      value={clienteFornecedor}
                      onChange={(e) => setClienteFornecedor(e.target.value)}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Obra Vinculada (Centro de Custo)</label>
                  <select className="form-control" value={selectedObraId} onChange={(e) => setSelectedObraId(e.target.value)}>
                    <option value="">-- Caixa Geral (Nenhuma obra vinculada) --</option>
                    {obras.map((o) => (
                      <option key={o.id} value={o.id}>{o.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição da Transação *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Compra de azulejos, Recebimento parcela 2"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Valor (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-control"
                      value={valor}
                      onChange={(e) => setValor(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Data de Vencimento *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={dataVencimento}
                      onChange={(e) => setDataVencimento(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Empresa *</label>
                    <select className="form-control" value={empresa} onChange={(e) => setEmpresa(e.target.value)} required>
                      <option value="JHOSTON">Jhoston Pools</option>
                      <option value="ECO_STONE">Eco Stone</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status da Transação</label>
                    <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
                      <option value="PENDENTE">Pendente</option>
                      <option value="PAGO">Pago / Liquidado</option>
                    </select>
                  </div>
                </div>
                {status === "PAGO" && (
                  <div className="form-group">
                    <label className="form-label">Data do Pagamento</label>
                    <input
                      type="date"
                      className="form-control"
                      value={dataPagamento}
                      onChange={(e) => setDataPagamento(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Cadastro Rápido de Fornecedor */}
      {isQuickFornecedorOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: "400px", marginTop: "10%" }}>
            <div className="modal-header">
              <h4 style={{ fontSize: "16px", fontWeight: 600 }}>Cadastrar Fornecedor Rápido</h4>
              <button 
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }} 
                onClick={() => setIsQuickFornecedorOpen(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleQuickFornecedorSubmit}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <label className="form-label">Razão Social / Nome Fantasia *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nome do fornecedor..."
                    value={quickNome}
                    onChange={(e) => setQuickNome(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Chave PIX (Opcional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Chave PIX para pagamento..."
                    value={quickPix}
                    onChange={(e) => setQuickPix(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsQuickFornecedorOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Transferência Intercompany */}
      {isTransferModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "450px" }}>
            <div className="modal-header">
              <h4 style={{ fontSize: "16px", fontWeight: 600 }}>🤝 Nova Transferência Intercompany</h4>
              <button 
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }} 
                onClick={() => setIsTransferModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleTransferSubmit}>
              <div className="modal-body">
                {transferError && (
                  <div style={{ backgroundColor: "var(--error-bg)", color: "var(--error)", padding: "12px", borderRadius: "var(--radius-md)", marginBottom: "16px", fontSize: "13px", fontWeight: 500 }}>
                    {transferError}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Empresa de Origem (Debitará R$)</label>
                  <select 
                    className="form-control" 
                    value={transferOrigem} 
                    onChange={(e) => {
                      const val = e.target.value as "JHOSTON" | "ECO_STONE";
                      setTransferOrigem(val);
                      setTransferDestino(val === "JHOSTON" ? "ECO_STONE" : "JHOSTON");
                    }}
                    required
                  >
                    <option value="JHOSTON">Jhoston Pools</option>
                    <option value="ECO_STONE">Eco Stone</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Empresa de Destino (Receberá R$)</label>
                  <select 
                    className="form-control" 
                    value={transferDestino} 
                    onChange={(e) => {
                      const val = e.target.value as "JHOSTON" | "ECO_STONE";
                      setTransferDestino(val);
                      setTransferOrigem(val === "JHOSTON" ? "ECO_STONE" : "JHOSTON");
                    }}
                    required
                  >
                    <option value="JHOSTON">Jhoston Pools</option>
                    <option value="ECO_STONE">Eco Stone</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Valor do Empréstimo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-control"
                    placeholder="Ex: 5000.00"
                    value={transferValor}
                    onChange={(e) => setTransferValor(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Data do Lançamento</label>
                  <input
                    type="date"
                    className="form-control"
                    value={transferData}
                    onChange={(e) => setTransferData(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição / Motivo</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Empréstimo para fluxo de caixa / folha Eco Stone"
                    value={transferDescricao}
                    onChange={(e) => setTransferDescricao(e.target.value)}
                    required
                  />
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                    Esta ação criará simultaneamente uma DESPESA na origem e uma RECEITA no destino sob a categoria &quot;Empréstimo Intercompany&quot;.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsTransferModalOpen(false)}
                  disabled={transferSubmitting}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={transferSubmitting}>
                  {transferSubmitting ? "Processando..." : "Confirmar Transferência"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal do Recibo/Aviso de Ciência */}
      {isReciboModalOpen && selectedTransferParaRecibo && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "550px", padding: "28px" }}>
            <div className="modal-header">
              <h4 style={{ fontSize: "16px", fontWeight: 700 }}>📄 Aviso de Ciência de Empréstimo Mútuo</h4>
              <button
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }}
                onClick={() => {
                  setIsReciboModalOpen(false);
                  setSelectedTransferParaRecibo(null);
                }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body" id="print-area-recibo" style={{ fontFamily: "sans-serif", color: "#334155", lineHeight: 1.6 }}>
              <div style={{ textAlign: "center", marginBottom: "20px", borderBottom: "2px solid #f59e0b", paddingBottom: "12px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "#1e293b" }}>AVISO DE CIÊNCIA FINANCEIRA</h3>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>TRANSFERÊNCIA DE FUNDOS INTERCOMPANY</span>
              </div>
              <p style={{ fontSize: "13.5px", textAlign: "justify", margin: "0 0 16px 0" }}>
                Por meio deste instrumento, declaramos ciência de que o valor de{" "}
                <strong>{formatCurrency(selectedTransferParaRecibo.valor)}</strong>, transferido em{" "}
                <strong>{formatDateBR(selectedTransferParaRecibo.dataPagamento || selectedTransferParaRecibo.dataVencimento)}</strong>, da conta da empresa{" "}
                <strong>
                  {selectedTransferParaRecibo.tipo === "DESPESA"
                    ? (selectedTransferParaRecibo.empresa === "JHOSTON" ? "JHOSTON POOLS" : "ECO STONE")
                    : (selectedTransferParaRecibo.empresa === "JHOSTON" ? "ECO STONE" : "JHOSTON POOLS")}
                </strong>{" "}
                para a conta da empresa{" "}
                <strong>
                  {selectedTransferParaRecibo.tipo === "RECEITA"
                    ? (selectedTransferParaRecibo.empresa === "JHOSTON" ? "JHOSTON POOLS" : "ECO STONE")
                    : (selectedTransferParaRecibo.empresa === "JHOSTON" ? "ECO STONE" : "JHOSTON POOLS")}
                </strong>, constitui empréstimo mútuo entre as partes (Categoria: Empréstimo Intercompany) e será devidamente registrado em seus respectivos fechamentos contábeis.
              </p>
              <table style={{ width: "100%", fontSize: "12.5px", margin: "16px 0", borderCollapse: "collapse" }}>
                <tbody>
                  <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "6px 0", color: "var(--text-muted)" }}><strong>Motivo / Descrição:</strong></td>
                    <td style={{ padding: "6px 0", textAlign: "right" }}>{selectedTransferParaRecibo.descricao}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "6px 0", color: "var(--text-muted)" }}><strong>Data do Lançamento:</strong></td>
                    <td style={{ padding: "6px 0", textAlign: "right" }}>{formatDateBR(selectedTransferParaRecibo.dataVencimento)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "6px 0", color: "var(--text-muted)" }}><strong>Status:</strong></td>
                    <td style={{ padding: "6px 0", textAlign: "right", color: "var(--success)", fontWeight: 700 }}>
                      {selectedTransferParaRecibo.status === "PAGO" ? "LIQUIDADO" : "PENDENTE"}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div style={{ display: "flex", gap: "20px", marginTop: "40px", textAlign: "center", fontSize: "11px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ borderBottom: "1px solid var(--text-muted)", height: "24px", marginBottom: "4px" }}></div>
                  <span>JHOSTON POOLS</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ borderBottom: "1px solid var(--text-muted)", height: "24px", marginBottom: "4px" }}></div>
                  <span>ECO STONE</span>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", marginTop: "20px" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setIsReciboModalOpen(false);
                  setSelectedTransferParaRecibo(null);
                }}
              >
                Fechar
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  const printContents = document.getElementById("print-area-recibo")?.innerHTML;
                  if (printContents) {
                    const printWindow = window.open("", "_blank");
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Aviso de Ciencia - ${selectedTransferParaRecibo.id}</title>
                            <style>
                              body { font-family: system-ui, sans-serif; padding: 40px; color: #334155; }
                              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                              td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
                            </style>
                          </head>
                          <body>
                            \${printContents}
                            <script>
                              window.onload = function() { window.print(); window.close(); }
                            </script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    }
                  }
                }}
              >
                🖨️ Imprimir Aviso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
