"use client";

import { useEffect, useState, startTransition } from "react";
import { getFinanceiroData, salvarTransacao, deleteTransacao, alterarStatusTransacao, salvarEmprestimoIntercompany } from "./actions";
import { salvarFornecedor } from "../fornecedores/actions";
import { getValesData } from "../vales/actions";
import { sendWhatsAppFile } from "@/lib/whatsapp";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
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
  adendos?: { id: number; descricao: string; valor: number; status: string }[];
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
  categoria?: string;
  planoContaId?: number | null;
  centroCustoId?: number | null;
  planoConta?: { id: number; codigo: string; descricao: string } | null;
  centroCusto?: { id: number; nome: string; codigo: string | null } | null;
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
  adendoId: number | null;
}

const getCompanyBranding = (empresa: string) => {
  if (empresa === "ECO_STONE") {
    return {
      logo: "https://i.ibb.co/Ld1JvL2/eco-stone-logo.png",
      name: "ECO STONE",
      subtitle: "Revestimentos em Pedra Naturais",
      cnpj: "52.880.840/0001-44",
      corporateName: "Eco Stone Revestimentos LTDA",
      primaryColor: "#0f766e"
    };
  }
  return {
    logo: "https://i.ibb.co/q5k262h/jhoston-pools-logo.png",
    name: "Jhoston Pools",
    subtitle: "Soluções em Piscinas e Revestimentos",
    cnpj: "42.062.261/0001-63",
    corporateName: "Jhoston Revestimentos LTDA",
    primaryColor: "#0284c7"
  };
};

export default function FinanceiroPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "transacoes" | "balancete">("dashboard");

  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [valesPendentes, setValesPendentes] = useState<any[]>([]);
  const [planoContas, setPlanoContas] = useState<any[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("TODOS");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [obraFilter, setObraFilter] = useState("TODOS");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransacao, setEditingTransacao] = useState<Transacao | null>(null);

  // Estados específicos para o Mini Balancete
  const [balanceteRegime, setBalanceteRegime] = useState<"CAIXA" | "COMPETENCIA">("CAIXA");
  const [balanceteMes, setBalanceteMes] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Form states
  const [tipo, setTipo] = useState<"RECEITA" | "DESPESA">("DESPESA");
  const [planoContaId, setPlanoContaId] = useState("");
  const [centroCustoId, setCentroCustoId] = useState("");
  const [selectedObraId, setSelectedObraId] = useState("");
  const [adendoId, setAdendoId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [dataVencimento, setDataVencimento] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState("PENDENTE");
  const [dataPagamento, setDataPagamento] = useState("");
  const [clienteFornecedor, setClienteFornecedor] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [funcionarioId, setFuncionarioId] = useState("");
  const [valesDescontadosIds, setValesDescontadosIds] = useState<number[]>([]);
  const [descontoAutomatico, setDescontoAutomatico] = useState<boolean>(true);
  const [totalVales, setTotalVales] = useState(0);
  const [empresa, setEmpresa] = useState("JHOSTON");
  const [errorMsg, setErrorMsg] = useState("");
  const [empresaFilter, setEmpresaFilter] = useState("TODOS");
  const [activeContext, setActiveContext] = useState("TODOS");



  // Quick Fornecedor Modal states
  const [isQuickFornecedorOpen, setIsQuickFornecedorOpen] = useState(false);
  const [quickNome, setQuickNome] = useState("");
  const [quickPix, setQuickPix] = useState("");

  // Intercompany Loan Modal states
  const [isIntercompanyModalOpen, setIsIntercompanyModalOpen] = useState(false);
  const [intercompanyOrigem, setIntercompanyOrigem] = useState("JHOSTON");
  const [intercompanyDestino, setIntercompanyDestino] = useState("ECO_STONE");
  const [intercompanyValor, setIntercompanyValor] = useState("");
  const [intercompanyData, setIntercompanyData] = useState(new Date().toISOString().split("T")[0]);
  const [intercompanyDescricao, setIntercompanyDescricao] = useState("");
  const [intercompanyErrorMsg, setIntercompanyErrorMsg] = useState("");

  const [isRPAModalOpen, setIsRPAModalOpen] = useState(false);
  const [rpaTransaction, setRpaTransaction] = useState<any>(null);
  const [whatsappNumberRPA, setWhatsappNumberRPA] = useState("");
  const [isSendingWhatsAppRPA, setIsSendingWhatsAppRPA] = useState(false);
  const [isGuiaLancamentosOpen, setIsGuiaLancamentosOpen] = useState(false);

  const loadData = () => {
    getFinanceiroData().then((res) => {
      setObras(res.obras);
      setFornecedores(res.fornecedores || []);
      setPlanoContas(res.planoContas || []);
      setCentrosCusto(res.centrosCusto || []);
      const mapped = res.transacoes.map((t: any) => ({
        ...t,
        dataVencimento: new Date(t.dataVencimento).toISOString().split("T")[0],
        dataPagamento: t.dataPagamento ? new Date(t.dataPagamento).toISOString().split("T")[0] : null,
      }));
      setTransacoes(mapped as any);
      getValesData().then((vRes) => {
        setFuncionarios(vRes.funcionarios);
        setValesPendentes(vRes.vales.filter((v: any) => v.statusDesconto === "PENDENTE"));
      });
    });
  };

  useEffect(() => {
    getSession().then((res) => {
      setSession(res as any);
      setIsSessionLoading(false);
      if (res?.userEmpresa) {
        const emp = res.userEmpresa === "AMBAS" ? "JHOSTON" : res.userEmpresa;
        setEmpresaFilter(emp);
        setEmpresa(emp);
        setActiveContext(res.userEmpresa);
      } else {
        setActiveContext("TODOS");
      }
    });

    const handleContextChange = (e: CustomEvent<string>) => {
      if (e.detail) {
        const emp = e.detail === "AMBAS" ? "JHOSTON" : e.detail;
        setEmpresaFilter(emp);
        setEmpresa(emp);
        setActiveContext(e.detail);
      } else {
        setActiveContext("TODOS");
      }
    };
    window.addEventListener("empresaContextChanged" as any, handleContextChange);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "balancete" || tabParam === "transacoes" || tabParam === "dashboard") {
        setActiveTab(tabParam as any);
      }
    }

    loadData();

    return () => {
      window.removeEventListener("empresaContextChanged" as any, handleContextChange);
    };
  }, []);

  const openNewModal = (initialTipo: "RECEITA" | "DESPESA" = "DESPESA") => {
    setEditingTransacao(null);
    setTipo(initialTipo);
    setPlanoContaId("");
    setCentroCustoId("");
    setSelectedObraId("");
    setAdendoId("");
    setDescricao("");
    setValor("");
    setDataVencimento(new Date().toISOString().split("T")[0]);
    setStatus("PENDENTE");
    setDataPagamento("");
    setClienteFornecedor("");
    setFornecedorId("");
    setFuncionarioId("");
    setValesDescontadosIds([]);
    setTotalVales(0);
    setEmpresa(empresaFilter !== "TODOS" ? empresaFilter : "JHOSTON");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (t: Transacao) => {
    setEditingTransacao(t);
    setTipo(t.tipo);
    setPlanoContaId(t.planoContaId ? t.planoContaId.toString() : "");
    setCentroCustoId(t.centroCustoId ? t.centroCustoId.toString() : "");
    setSelectedObraId(t.obraId ? t.obraId.toString() : "");
    setAdendoId(t.adendoId ? t.adendoId.toString() : "");
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
    // Como agora temos planoConta, essa regra baseada em 'categoria == Fornecedores' é um pouco legada,
    // mas vamos manter caso usem o tipo para cobrar fornecedor.
    if (tipo === "DESPESA" && !fornecedorId && (planoContaId === "3" /* Ex: id de fornecedor, ajustável */ || clienteFornecedor)) {
      // Regra afrouxada temporariamente
    }

    const payload = {
      id: editingTransacao?.id,
      tipo,
      categoria: undefined, // legado desativado na UI
      planoContaId: planoContaId ? parseInt(planoContaId) : null,
      centroCustoId: centroCustoId ? parseInt(centroCustoId) : null,
      obraId: selectedObraId ? parseInt(selectedObraId) : null,
      adendoId: adendoId ? parseInt(adendoId) : null,
      descricao,
      valor: parseFloat(valor),
      dataVencimento,
      dataPagamento: status === "PAGO" ? (dataPagamento || new Date().toISOString().split("T")[0]) : null,
      status,
      clienteFornecedor,
      fornecedorId: fornecedorId ? parseInt(fornecedorId) : null,
      funcionarioId: funcionarioId ? parseInt(funcionarioId) : null,
      valesDescontadosIds,
      descontoAutomatico,
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



  const handleIntercompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intercompanyDescricao.trim()) {
      setIntercompanyErrorMsg("A descrição é obrigatória.");
      return;
    }
    if (!intercompanyValor || parseFloat(intercompanyValor) <= 0) {
      setIntercompanyErrorMsg("Insira um valor válido.");
      return;
    }
    if (intercompanyOrigem === intercompanyDestino) {
      setIntercompanyErrorMsg("As empresas de origem e destino não podem ser a mesma.");
      return;
    }

    startTransition(async () => {
      const res = await salvarEmprestimoIntercompany({
        empresaOrigem: intercompanyOrigem,
        empresaDestino: intercompanyDestino,
        valor: parseFloat(intercompanyValor),
        data: intercompanyData,
        descricao: intercompanyDescricao,
      });

      if (res.success) {
        loadData();
        setIsIntercompanyModalOpen(false);
        setIntercompanyValor("");
        setIntercompanyDescricao("");
        setIntercompanyErrorMsg("");
      } else {
        setIntercompanyErrorMsg(res.error || "Erro ao salvar empréstimo.");
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
    (t) => {
      const matchesContext = (activeContext === "TODOS" || activeContext === "AMBAS") ? true : activeContext === "ECO_STONE" ? (t as any).empresa === "ECO_STONE" : (t as any).empresa === "JHOSTON";
      const matchesEmp = empresaFilter === "TODOS" ? true : (t as any).empresa === empresaFilter;
      return matchesContext && matchesEmp;
    }
  );

  // Cálculos Financeiros Globais
  const saldoContaAnterior = transacoesFiltradasEmpresa
    .filter((t) => t.tipo === "RECEITA" && t.status === "PAGO" && t.planoConta?.codigo === "0.2")
    .reduce((acc, t) => acc + t.valor, 0);

  const receitasRecebidas = transacoesFiltradasEmpresa
    .filter((t) => t.tipo === "RECEITA" && t.status === "PAGO" && t.planoConta?.codigo !== "0.1" && t.planoConta?.codigo !== "0.2")
    .reduce((acc, t) => acc + t.valor, 0);

  const despesasPagas = transacoesFiltradasEmpresa
    .filter((t) => t.tipo === "DESPESA" && t.status === "PAGO" && t.planoConta?.codigo !== "0.1" && t.planoConta?.codigo !== "0.2")
    .reduce((acc, t) => acc + t.valor, 0);

  const caixaAtual = receitasRecebidas + saldoContaAnterior - despesasPagas;

  const contasAReceberPendente = transacoesFiltradasEmpresa.filter((t) => t.tipo === "RECEITA" && t.status !== "PAGO" && t.planoConta?.codigo !== "0.1" && t.planoConta?.codigo !== "0.2").reduce((acc, t) => acc + t.valor, 0);
  const contasAPagarPendente = transacoesFiltradasEmpresa.filter((t) => t.tipo === "DESPESA" && t.status !== "PAGO" && t.planoConta?.codigo !== "0.1" && t.planoConta?.codigo !== "0.2").reduce((acc, t) => acc + t.valor, 0);

  // Filtragem da lista
  const filteredTransacoes = transacoes.filter((t) => {
    const matchesSearch =
      t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.clienteFornecedor && t.clienteFornecedor.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTipo = tipoFilter === "TODOS" || t.tipo === tipoFilter;
    const matchesStatus = statusFilter === "TODOS" || t.status === statusFilter;
    const matchesObra = obraFilter === "TODOS" || t.obraId?.toString() === obraFilter;
    const matchesContext = (activeContext === "TODOS" || activeContext === "AMBAS") ? true : activeContext === "ECO_STONE" ? (t as any).empresa === "ECO_STONE" : (t as any).empresa === "JHOSTON";
    const matchesEmpresa = empresaFilter === "TODOS" || (t as any).empresa === empresaFilter;

    return matchesSearch && matchesTipo && matchesStatus && matchesObra && matchesContext && matchesEmpresa;
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
      // Ignorar Lançamentos Iniciais no Gráfico Mensal para não distorcer as barras
      if (t.descricao.includes("Saldo Recebido Anterior") || t.descricao.includes("Saldo em Conta Anterior")) {
        return;
      }
      
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
      let cat = "Outros";
      if (t.planoConta?.codigo) {
        if (t.planoConta.codigo.startsWith("2.3") || t.planoConta.codigo.startsWith("3.1")) {
          cat = "Folha";
        } else if (t.planoConta.codigo.startsWith("2.5") || t.planoConta.codigo.startsWith("2.6")) {
          cat = "Viagem";
        } else if (t.planoConta.codigo.startsWith("2.1") || t.planoConta.codigo.startsWith("2.2") || t.planoConta.codigo.startsWith("2.4") || t.planoConta.codigo.startsWith("3.") || t.planoConta.codigo.startsWith("4.")) {
          // Simplificação: vamos chamar de Fornecedores o resto das operacionais
          cat = "Fornecedores";
        }
      } else {
        cat = t.categoria || "Outros";
      }

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
          <button className="btn btn-secondary" onClick={() => setIsIntercompanyModalOpen(true)} style={{ backgroundColor: "#f3f4f6", color: "#1f2937", border: "1px solid #d1d5db" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px", color: "#6b7280" }}><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
            Empréstimo Intercompany
          </button>
        </div>
      </div>

      {/* Seletor de Empresa (Isolamento Estrito) */}
      {activeContext !== "ECO_STONE" && (
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", padding: "12px", backgroundColor: "var(--bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", alignItems: "center" }}>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-heading)" }}>Visualizar Empresa:</span>
          <div style={{ display: "inline-flex", gap: "8px" }}>
            {[
              { id: "JHOSTON", name: "🏢 Jhoston Pools" },
              { id: "ECO_STONE", name: "🌿 Eco Stone" }
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setEmpresaFilter(c.id);
                  setEmpresa(c.id);
                }}
                className={`btn btn-sm ${empresaFilter === c.id ? "btn-primary" : "btn-secondary"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

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
        <button
          onClick={() => setActiveTab("balancete")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "balancete" ? "2px solid var(--primary)" : "2px solid transparent",
            color: activeTab === "balancete" ? "var(--primary)" : "var(--text-muted)",
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
          📑 Mini Balancete Gerencial
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
                    <th>Valor Recebido (Realizado)</th>
                    <th>Custos Incorridos</th>
                    <th style={{ width: "220px" }}>Consumo do Orçamento</th>
                    <th>Margem Realizada</th>
                    <th style={{ textAlign: "right" }}>Margem %</th>
                  </tr>
                </thead>
                <tbody>
                  {obras.filter(o => o.status === "ATIVA" && (empresaFilter === "TODOS" || (o as any).empresa === empresaFilter)).length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px", fontStyle: "italic" }}>
                        Nenhuma obra ativa encontrada para análise.
                      </td>
                    </tr>
                  ) : (
                    obras.filter(o => o.status === "ATIVA" && (empresaFilter === "TODOS" || (o as any).empresa === empresaFilter)).map((o) => {
                      const despesas = transacoesFiltradasEmpresa
                        .filter((t) => t.obraId === o.id && t.tipo === "DESPESA")
                        .reduce((acc, t) => acc + t.valor, 0);
                      const receitasRealizadas = transacoesFiltradasEmpresa
                        .filter((t) => t.obraId === o.id && t.tipo === "RECEITA" && t.status === "PAGO" && t.planoConta?.codigo !== "0.2")
                        .reduce((acc, t) => acc + t.valor, 0);

                      const adendosValor = o.adendos?.filter(a => a.status !== "CANCELADO").reduce((acc, ad) => acc + ad.valor, 0) || 0;
                      const valorFechado = (o.valorFechado || 0) + adendosValor;
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
                          <td style={{ fontWeight: 600, color: "var(--success)", verticalAlign: "middle" }}>{formatCurrency(receitasRealizadas)}</td>
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
                  <th>Plano de Contas</th>
                  <th>Centro de Custo</th>
                  <th>Descrição</th>
                  <th>Vencimento</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th style={{ width: "240px", textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransacoes.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
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
                  <td style={{ fontWeight: 600, maxWidth: "150px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={t.clienteFornecedor || ""}>
                    {t.clienteFornecedor || <em style={{ color: "var(--text-muted)", fontWeight: "normal" }}>Não informado</em>}
                  </td>
                  <td>
                    {t.planoConta ? (
                      <span 
                        title={`${t.planoConta.codigo} - ${t.planoConta.descricao}`}
                        style={{ 
                          fontSize: "12px", 
                          border: "1px solid var(--border-color)", 
                          padding: "2px 6px", 
                          borderRadius: "4px",
                          display: "inline-block",
                          maxWidth: "160px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          verticalAlign: "middle"
                        }}
                      >
                        {t.planoConta.codigo} - {t.planoConta.descricao}
                      </span>
                    ) : (
                      <em style={{ color: "var(--text-muted)", fontSize: "12px" }}>{t.categoria || "S/ Conta"}</em>
                    )}
                  </td>
                  <td>
                    {t.centroCusto ? (
                      <span 
                        title={t.centroCusto.nome}
                        style={{ 
                          fontSize: "12px", 
                          border: "1px solid var(--border-color)", 
                          padding: "2px 6px", 
                          borderRadius: "4px",
                          display: "inline-block",
                          maxWidth: "140px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          verticalAlign: "middle"
                        }}
                      >{t.centroCusto.nome}</span>
                    ) : t.obra ? (
                      <span 
                        title={t.obra.nome}
                        style={{ 
                          fontWeight: 500, 
                          color: "var(--primary)",
                          display: "inline-block",
                          maxWidth: "140px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          verticalAlign: "middle"
                        }}
                      >{t.obra.nome}</span>
                    ) : (
                      <em style={{ color: "var(--text-muted)", fontSize: "12px" }}>Caixa Geral</em>
                    )}
                  </td>
                  <td style={{ maxWidth: "160px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={t.descricao}>
                    {t.descricao}
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
                  <td style={{ textAlign: "right", minWidth: "220px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "flex-end" }}>

                      {t.tipo === "DESPESA" && t.status === "PAGO" && (
                        <button className="btn btn-secondary btn-sm" onClick={() => {
                          setRpaTransaction(t);
                          setIsRPAModalOpen(true);
                        }}>
                          Gerar RPA
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

      {/* Tab: Mini Balancete Gerencial */}
      {activeTab === "balancete" && (() => {
        // Filtra transações do balancete de acordo com a empresa e período
        const transacoesBalancete = transacoes.filter((t) => {
          // Filtro de empresa estrito
          if ((t as any).empresa !== empresaFilter) return false;

          // Filtro por regime (Caixa ou Competência)
          if (balanceteRegime === "CAIXA") {
            if (t.status !== "PAGO") return false;
            const dataP = t.dataPagamento || t.dataVencimento;
            return dataP ? dataP.startsWith(balanceteMes) : false;
          } else {
            // Competência (data de vencimento)
            return t.dataVencimento.startsWith(balanceteMes);
          }
        });

        // Agrupamento por Plano de Contas
        // 1. Receitas
        const receitasPorConta: Record<string, { codigo: string; descricao: string; total: number; itens: any[] }> = {};
        // 2. Custos Operacionais (Custos Diretos vinculados a obras ou fornecedores)
        const custosPorConta: Record<string, { codigo: string; descricao: string; total: number; itens: any[] }> = {};
        // 3. Despesas Fixas / Administrativas
        const despesasPorConta: Record<string, { codigo: string; descricao: string; total: number; itens: any[] }> = {};

        let totalReceitasBalancete = 0;
        let totalCustosBalancete = 0;
        let totalDespesasBalancete = 0;

        transacoesBalancete.forEach((t) => {
          const cod = t.planoConta?.codigo || (t.tipo === "RECEITA" ? "1.9" : "2.9");
          const desc = t.planoConta?.descricao || (t.tipo === "RECEITA" ? "Outras Receitas Operacionais" : "Despesas Gerais sem Classificação");
          const key = `${cod} - ${desc}`;

          if (t.tipo === "RECEITA") {
            totalReceitasBalancete += t.valor;
            if (!receitasPorConta[key]) {
              receitasPorConta[key] = { codigo: cod, descricao: desc, total: 0, itens: [] };
            }
            receitasPorConta[key].total += t.valor;
            receitasPorConta[key].itens.push(t);
          } else {
            // É DESPESA: Se tem obra vinculada ou plano de contas começa com 2 ou custo direto, consideramos custo da obra
            const isCustoObra = !!t.obraId || cod.startsWith("2") || (t.categoria && t.categoria.includes("Obra"));
            if (isCustoObra) {
              totalCustosBalancete += t.valor;
              if (!custosPorConta[key]) {
                custosPorConta[key] = { codigo: cod, descricao: desc, total: 0, itens: [] };
              }
              custosPorConta[key].total += t.valor;
              custosPorConta[key].itens.push(t);
            } else {
              totalDespesasBalancete += t.valor;
              if (!despesasPorConta[key]) {
                despesasPorConta[key] = { codigo: cod, descricao: desc, total: 0, itens: [] };
              }
              despesasPorConta[key].total += t.valor;
              despesasPorConta[key].itens.push(t);
            }
          }
        });

        const margemBruta = totalReceitasBalancete - totalCustosBalancete;
        const resultadoLiquido = margemBruta - totalDespesasBalancete;
        const [anoB, mesB] = balanceteMes.split("-");
        const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const mesExtenso = `${mesesNomes[parseInt(mesB, 10) - 1]} de ${anoB}`;
        const empresaNomeDisplay = empresaFilter === "ECO_STONE" ? "ECO STONE CASATAS & PEDRAS NATURAIS" : "GRUPO JHOSTON / JHOSTON POOLS";

        return (
          <div style={{ marginTop: "16px" }}>
            {/* Controles do Balancete */}
            <div className="card" style={{ padding: "16px 20px", marginBottom: "20px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                    Mês de Apuração
                  </label>
                  <input
                    type="month"
                    className="form-control"
                    style={{ height: "36px", width: "160px", fontSize: "13px" }}
                    value={balanceteMes}
                    onChange={(e) => setBalanceteMes(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                    Regime Financeiro
                  </label>
                  <div style={{ display: "inline-flex", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => setBalanceteRegime("CAIXA")}
                      className={`btn btn-sm ${balanceteRegime === "CAIXA" ? "btn-primary" : "btn-secondary"}`}
                      title="Considera transações efetivamente quitadas"
                    >
                      Regime de Caixa
                    </button>
                    <button
                      type="button"
                      onClick={() => setBalanceteRegime("COMPETENCIA")}
                      className={`btn btn-sm ${balanceteRegime === "COMPETENCIA" ? "btn-primary" : "btn-secondary"}`}
                      title="Considera transações pelo vencimento"
                    >
                      Competência
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-secondary btn-sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                  Imprimir Balancete
                </button>
              </div>
            </div>

            {/* Demonstrativo Contábil / Mini Balancete Formatado */}
            <div className="card" style={{ padding: "32px", backgroundColor: "#ffffff", color: "#0f172a", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
              {/* Cabeçalho do Balancete */}
              <div style={{ borderBottom: "2px solid #0f172a", paddingBottom: "16px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.5px" }}>
                    {empresaNomeDisplay}
                  </h2>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#475569", marginTop: "2px" }}>
                    BALANCETE FINANCEIRO GERENCIAL
                  </p>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    Período: <strong>{mesExtenso}</strong> | Critério: <strong>{balanceteRegime === "CAIXA" ? "Regime de Caixa (Realizado)" : "Regime de Competência (Projetado)"}</strong>
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>Gerado em: {new Date().toLocaleDateString("pt-BR")}</div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: empresaFilter === "ECO_STONE" ? "#16a34a" : "#0f766e", marginTop: "4px" }}>
                    {empresaFilter === "ECO_STONE" ? "🌿 ECO STONE" : "🏢 JHOSTON TEC"}
                  </div>
                </div>
              </div>

              {/* Cards Rápidos de Síntese */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "28px" }}>
                <div style={{ padding: "12px 16px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>(+) Receita Bruta</span>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "#15803d", marginTop: "4px" }}>{formatCurrency(totalReceitasBalancete)}</div>
                </div>
                <div style={{ padding: "12px 16px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#991b1b", textTransform: "uppercase" }}>(-) Custos Diretos</span>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "#b91c1c", marginTop: "4px" }}>{formatCurrency(totalCustosBalancete)}</div>
                </div>
                <div style={{ padding: "12px 16px", backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#92400e", textTransform: "uppercase" }}>(=) Margem Bruta</span>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: margemBruta >= 0 ? "#b45309" : "#b91c1c", marginTop: "4px" }}>{formatCurrency(margemBruta)}</div>
                </div>
                <div style={{ padding: "12px 16px", backgroundColor: resultadoLiquido >= 0 ? "#ecfdf5" : "#fef2f2", border: `1.5px solid ${resultadoLiquido >= 0 ? "#10b981" : "#ef4444"}`, borderRadius: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: resultadoLiquido >= 0 ? "#065f46" : "#991b1b", textTransform: "uppercase" }}>(=) Resultado Líquido</span>
                  <div style={{ fontSize: "19px", fontWeight: 900, color: resultadoLiquido >= 0 ? "#059669" : "#dc2626", marginTop: "4px" }}>{formatCurrency(resultadoLiquido)}</div>
                </div>
              </div>

              {/* Tabela Estruturada do Balancete */}
              <div style={{ width: "100%", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #cbd5e1" }}>
                      <th style={{ textAlign: "left", padding: "10px 12px", color: "#334155", fontWeight: 700 }}>Classificação Contábil / Conta</th>
                      <th style={{ textAlign: "center", padding: "10px 12px", color: "#334155", fontWeight: 700, width: "100px" }}>Lançamentos</th>
                      <th style={{ textAlign: "right", padding: "10px 12px", color: "#334155", fontWeight: 700, width: "160px" }}>Total (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* SEÇÃO 1: RECEITAS OPERACIONAIS */}
                    <tr style={{ backgroundColor: "#f1f5f9", borderBottom: "1px solid #e2e8f0" }}>
                      <td colSpan={2} style={{ padding: "10px 12px", fontWeight: 800, color: "#15803d" }}>
                        (+) 1. RECEITAS OPERACIONAIS
                      </td>
                      <td style={{ textAlign: "right", padding: "10px 12px", fontWeight: 800, color: "#15803d" }}>
                        {formatCurrency(totalReceitasBalancete)}
                      </td>
                    </tr>
                    {Object.keys(receitasPorConta).length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ padding: "8px 24px", color: "#94a3b8", fontStyle: "italic", fontSize: "12px" }}>
                          Nenhuma receita registrada neste período.
                        </td>
                      </tr>
                    ) : (
                      Object.entries(receitasPorConta).map(([key, data]) => (
                        <tr key={key} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "8px 12px 8px 28px", color: "#334155" }}>
                            <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#64748b", marginRight: "8px" }}>{data.codigo}</span>
                            {data.descricao}
                          </td>
                          <td style={{ textAlign: "center", padding: "8px 12px", color: "#64748b", fontSize: "12px" }}>
                            {data.itens.length}
                          </td>
                          <td style={{ textAlign: "right", padding: "8px 12px", fontWeight: 600, color: "#0f172a" }}>
                            {formatCurrency(data.total)}
                          </td>
                        </tr>
                      ))
                    )}

                    {/* SEÇÃO 2: CUSTOS OPERACIONAIS */}
                    <tr style={{ backgroundColor: "#f1f5f9", borderBottom: "1px solid #e2e8f0", marginTop: "10px" }}>
                      <td colSpan={2} style={{ padding: "10px 12px", fontWeight: 800, color: "#b91c1c" }}>
                        (-) 2. CUSTOS DIRETOS DE OBRAS E SERVIÇOS
                      </td>
                      <td style={{ textAlign: "right", padding: "10px 12px", fontWeight: 800, color: "#b91c1c" }}>
                        {formatCurrency(totalCustosBalancete)}
                      </td>
                    </tr>
                    {Object.keys(custosPorConta).length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ padding: "8px 24px", color: "#94a3b8", fontStyle: "italic", fontSize: "12px" }}>
                          Nenhum custo direto registrado neste período.
                        </td>
                      </tr>
                    ) : (
                      Object.entries(custosPorConta).map(([key, data]) => (
                        <tr key={key} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "8px 12px 8px 28px", color: "#334155" }}>
                            <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#64748b", marginRight: "8px" }}>{data.codigo}</span>
                            {data.descricao}
                          </td>
                          <td style={{ textAlign: "center", padding: "8px 12px", color: "#64748b", fontSize: "12px" }}>
                            {data.itens.length}
                          </td>
                          <td style={{ textAlign: "right", padding: "8px 12px", fontWeight: 600, color: "#0f172a" }}>
                            {formatCurrency(data.total)}
                          </td>
                        </tr>
                      ))
                    )}

                    {/* SUBTOTAL: MARGEM BRUTA */}
                    <tr style={{ backgroundColor: "#fef3c7", borderTop: "2px solid #f59e0b", borderBottom: "2px solid #f59e0b" }}>
                      <td colSpan={2} style={{ padding: "10px 12px", fontWeight: 800, color: "#92400e" }}>
                        (=) RESULTADO BRUTO OPERACIONAL (MARGEM BRUTA)
                      </td>
                      <td style={{ textAlign: "right", padding: "10px 12px", fontWeight: 800, color: margemBruta >= 0 ? "#b45309" : "#b91c1c" }}>
                        {formatCurrency(margemBruta)}
                      </td>
                    </tr>

                    {/* SEÇÃO 3: DESPESAS ADMINISTRATIVAS & FIXAS */}
                    <tr style={{ backgroundColor: "#f1f5f9", borderBottom: "1px solid #e2e8f0" }}>
                      <td colSpan={2} style={{ padding: "10px 12px", fontWeight: 800, color: "#475569" }}>
                        (-) 3. DESPESAS OPERACIONAIS, FIXAS E ADMINISTRATIVAS
                      </td>
                      <td style={{ textAlign: "right", padding: "10px 12px", fontWeight: 800, color: "#475569" }}>
                        {formatCurrency(totalDespesasBalancete)}
                      </td>
                    </tr>
                    {Object.keys(despesasPorConta).length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ padding: "8px 24px", color: "#94a3b8", fontStyle: "italic", fontSize: "12px" }}>
                          Nenhuma despesa administrativa no período.
                        </td>
                      </tr>
                    ) : (
                      Object.entries(despesasPorConta).map(([key, data]) => (
                        <tr key={key} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "8px 12px 8px 28px", color: "#334155" }}>
                            <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#64748b", marginRight: "8px" }}>{data.codigo}</span>
                            {data.descricao}
                          </td>
                          <td style={{ textAlign: "center", padding: "8px 12px", color: "#64748b", fontSize: "12px" }}>
                            {data.itens.length}
                          </td>
                          <td style={{ textAlign: "right", padding: "8px 12px", fontWeight: 600, color: "#0f172a" }}>
                            {formatCurrency(data.total)}
                          </td>
                        </tr>
                      ))
                    )}

                    {/* TOTAL FINAL: RESULTADO LÍQUIDO */}
                    <tr style={{ backgroundColor: resultadoLiquido >= 0 ? "#dcfce7" : "#fee2e2", borderTop: "3px solid #0f172a", borderBottom: "3px solid #0f172a" }}>
                      <td colSpan={2} style={{ padding: "12px", fontWeight: 900, fontSize: "15px", color: resultadoLiquido >= 0 ? "#14532d" : "#7f1d1d" }}>
                        (=) RESULTADO LÍQUIDO DO EXERCÍCIO (LUCRO / PREJUÍZO LÍQUIDO)
                      </td>
                      <td style={{ textAlign: "right", padding: "12px", fontWeight: 900, fontSize: "16px", color: resultadoLiquido >= 0 ? "#15803d" : "#b91c1c" }}>
                        {formatCurrency(resultadoLiquido)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Rodapé formal */}
              <div style={{ marginTop: "40px", paddingTop: "20px", borderTop: "1px dashed #cbd5e1", display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b" }}>
                <div>Documento gerado automaticamente pelo Sistema Integrado de Gestão.</div>
                <div>Assinatura do Gestor Financeiro: __________________________________</div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de Criação / Edição */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <h4 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>
                  {editingTransacao ? "Editar Transação" : `Lançar Nova ${tipo === "RECEITA" ? "Receita" : "Despesa"}`}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsGuiaLancamentosOpen(true)}
                  style={{
                    backgroundColor: "rgba(59, 130, 246, 0.12)",
                    color: "#3b82f6",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                    borderRadius: "20px",
                    padding: "4px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px"
                  }}
                  title="Clique para ver o guia de onde lançar cada valor"
                >
                  💡 Guia de Lançamentos
                </button>
              </div>
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
                      // Clear plano/centro on type change to force re-selection appropriate to type
                      setPlanoContaId("");
                    }} disabled={!!editingTransacao}>
                      <option value="RECEITA">Receita (Entrada / Cliente)</option>
                      <option value="DESPESA">Despesa (Saída / Fornecedor / Outros)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Plano de Contas *</label>
                    <select 
                      className="form-control" 
                      value={planoContaId} 
                      onChange={(e) => {
                        const newId = e.target.value;
                        setPlanoContaId(newId);
                        const contaSel = planoContas.find(c => c.id.toString() === newId);
                        if (contaSel && (contaSel.codigo === "2.7.0" || contaSel.descricao.toLowerCase().includes("despesas gerais"))) {
                          if (!descricao || descricao.startsWith("Envio de adiantamento para despesas gerais de viagem")) {
                            const f = funcionarios.find(func => func.id.toString() === funcionarioId);
                            setDescricao(`Envio de adiantamento para despesas gerais de viagem${f ? ` - Colaborador ${f.nome}` : ""}`);
                          }
                        }
                      }} 
                      required
                    >
                      <option value="">-- Selecione uma Conta --</option>
                      {planoContas.filter(c => c.tipo === tipo).map(c => (
                        <option key={c.id} value={c.id}>{c.codigo} - {c.descricao}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Condicional para Fornecedores Cadastrados / Colaboradores */}
                {tipo === "DESPESA" ? (
                  planoContas.find(c => c.id.toString() === planoContaId)?.descricao.toLowerCase().includes("folha de pagamento") ||
                  planoContas.find(c => c.id.toString() === planoContaId)?.descricao.toLowerCase().includes("salário") ||
                  planoContas.find(c => c.id.toString() === planoContaId)?.descricao.toLowerCase().includes("adiantamento") ||
                  planoContas.find(c => c.id.toString() === planoContaId)?.codigo === "2.7.0" ||
                  planoContas.find(c => c.id.toString() === planoContaId)?.descricao.toLowerCase().includes("despesas gerais") ? (
                    <div className="form-group">
                      <label className="form-label">Colaborador (Favorecido) *</label>
                      <select 
                        className="form-control" 
                        value={funcionarioId} 
                        onChange={(e) => {
                          const newFuncId = e.target.value;
                          setFuncionarioId(newFuncId);
                          setValesDescontadosIds([]);
                          setTotalVales(0);
                          const contaSel = planoContas.find(c => c.id.toString() === planoContaId);
                          if (contaSel && (contaSel.codigo === "2.7.0" || contaSel.descricao.toLowerCase().includes("despesas gerais"))) {
                            const f = funcionarios.find(func => func.id.toString() === newFuncId);
                            setDescricao(`Envio de adiantamento para despesas gerais de viagem${f ? ` - Colaborador ${f.nome}` : ""}`);
                          }
                        }}
                        required
                      >
                        <option value="">-- Selecione um Colaborador --</option>
                        {funcionarios.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.nome} - {f.cargo || "Sem cargo"}
                          </option>
                        ))}
                      </select>
                      
                      {funcionarioId && !(planoContas.find(c => c.id.toString() === planoContaId)?.codigo === "2.7.0" || planoContas.find(c => c.id.toString() === planoContaId)?.descricao.toLowerCase().includes("despesas gerais")) && valesPendentes.filter(v => v.funcionarioId.toString() === funcionarioId).length > 0 && (
                        <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffe69c' }}>
                          <h5 style={{ margin: '0 0 8px 0', color: '#856404' }}>Vales Pendentes</h5>
                          {valesPendentes.filter(v => v.funcionarioId.toString() === funcionarioId).map(v => (
                            <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <input 
                                type="checkbox" 
                                id={`vale-${v.id}`}
                                checked={valesDescontadosIds.includes(v.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setValesDescontadosIds([...valesDescontadosIds, v.id]);
                                    setTotalVales(prev => prev + v.valor);
                                  } else {
                                    setValesDescontadosIds(valesDescontadosIds.filter(id => id !== v.id));
                                    setTotalVales(prev => prev - v.valor);
                                  }
                                }}
                              />
                              <label htmlFor={`vale-${v.id}`} style={{ color: '#856404', fontSize: '14px', cursor: 'pointer' }}>
                                R$ {v.valor.toFixed(2)} - {new Date(v.data).toLocaleDateString()} {v.descricao ? `(${v.descricao})` : ''}
                              </label>
                            </div>
                          ))}
                          
                          {valesDescontadosIds.length > 0 && (
                            <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #ffe69c' }}>
                              <h6 style={{ margin: '0 0 8px 0', color: '#664d03', fontSize: '13px' }}>O valor R$ {valor || "0,00"} informado acima é:</h6>
                              
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                                  <input 
                                    type="radio" 
                                    name="descontoModo" 
                                    checked={descontoAutomatico} 
                                    onChange={() => setDescontoAutomatico(true)} 
                                  />
                                  <div>
                                    <strong>Valor Bruto (Recomendado):</strong> O sistema vai descontar os Vales (R$ {valesPendentes.filter(v => valesDescontadosIds.includes(v.id)).reduce((acc, v) => acc + v.valor, 0).toFixed(2)}) automaticamente antes de salvar.
                                  </div>
                                </label>
                                
                                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                                  <input 
                                    type="radio" 
                                    name="descontoModo" 
                                    checked={!descontoAutomatico} 
                                    onChange={() => setDescontoAutomatico(false)} 
                                  />
                                  <div>
                                    <strong>Valor Já Líquido:</strong> Eu já fiz a subtração. O sistema deve salvar exatamente o valor que eu digitei (R$ {valor || "0,00"}).
                                  </div>
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
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
                  )
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

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Obra Vinculada</label>
                    <select className="form-control" value={selectedObraId} onChange={(e) => {
                      setSelectedObraId(e.target.value);
                      setAdendoId(""); // Limpa o adendo ao trocar de obra
                    }}>
                      <option value="">-- Sem obra vinculada --</option>
                      {obras.map((o) => (
                        <option key={o.id} value={o.id}>{o.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Centro de Custo</label>
                    <select className="form-control" value={centroCustoId} onChange={(e) => setCentroCustoId(e.target.value)}>
                      <option value="">-- Selecione o Centro de Custo --</option>
                      {centrosCusto.map((cc) => (
                        <option key={cc.id} value={cc.id}>{cc.codigo ? `${cc.codigo} - ` : ""}{cc.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedObraId && obras.find(o => o.id.toString() === selectedObraId)?.adendos?.length ? (
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" style={{ color: "var(--primary)" }}>Vincular a Adendo / Serviço Extra (Opcional)</label>
                      <select className="form-control" value={adendoId} onChange={(e) => setAdendoId(e.target.value)}>
                        <option value="">-- Contrato Principal --</option>
                        {obras.find(o => o.id.toString() === selectedObraId)?.adendos?.map((a) => (
                          <option key={a.id} value={a.id}>{a.descricao} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(a.valor)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : null}

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

      {/* Modal de Empréstimo Intercompany */}
      {isIntercompanyModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: "500px", marginTop: "10%" }}>
            <div className="modal-header">
              <h4 style={{ fontSize: "16px", fontWeight: 600 }}>Empréstimo Intercompany</h4>
              <button 
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }} 
                onClick={() => setIsIntercompanyModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleIntercompanySubmit}>
              <div className="modal-body">
                {intercompanyErrorMsg && (
                  <div style={{ backgroundColor: "var(--error-bg)", color: "var(--error)", padding: "12px", borderRadius: "var(--radius-md)", marginBottom: "16px", fontSize: "14px", fontWeight: 500 }}>
                    {intercompanyErrorMsg}
                  </div>
                )}
                
                <div style={{ padding: "12px", backgroundColor: "rgba(59, 130, 246, 0.05)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: "var(--radius-md)", marginBottom: "16px", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                  <strong>Atenção:</strong> Esta ação criará automaticamente duas transações com a categoria "Empréstimo Intercompany":<br/>
                  - Uma <strong>Despesa</strong> (Saída) na empresa de Origem.<br/>
                  - Uma <strong>Receita</strong> (Entrada) na empresa de Destino.
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Origem (Saída) *</label>
                    <select className="form-control" value={intercompanyOrigem} onChange={(e) => setIntercompanyOrigem(e.target.value)} required>
                      <option value="JHOSTON">Jhoston Pools</option>
                      <option value="ECO_STONE">Eco Stone</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Destino (Entrada) *</label>
                    <select className="form-control" value={intercompanyDestino} onChange={(e) => setIntercompanyDestino(e.target.value)} required>
                      <option value="JHOSTON">Jhoston Pools</option>
                      <option value="ECO_STONE">Eco Stone</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Empréstimo para cobrir folha"
                    value={intercompanyDescricao}
                    onChange={(e) => setIntercompanyDescricao(e.target.value)}
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
                      value={intercompanyValor}
                      onChange={(e) => setIntercompanyValor(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Data *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={intercompanyData}
                      onChange={(e) => setIntercompanyData(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsIntercompanyModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar Transferência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DO RPA IMPRIMÍVEL (LANÇAMENTO ÚNICO) --- */}
      {isRPAModalOpen && rpaTransaction && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content" style={{ width: "95%", maxWidth: "700px" }}>
            <div className="modal-header">
              <h4 style={{ fontSize: "18px", fontWeight: 700 }}>Recibo de Pagamento de Autônomo (RPA)</h4>
              <button
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }}
                onClick={() => setIsRPAModalOpen(false)}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body printable-holerite" id="rpa-content-to-print">
              {(() => {
                const branding = getCompanyBranding(rpaTransaction.empresa || empresaFilter);
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
                    Recebi(emos) de <strong>{branding.corporateName}</strong>, inscrita no CNPJ sob o nº <strong>{branding.cnpj}</strong>, a importância de 
                    <strong style={{ fontSize: "16px" }}> {formatCurrency(rpaTransaction.valor)}</strong>, 
                    referente a <strong>{rpaTransaction.descricao}</strong>, prestando serviços sem vínculo empregatício. O pagamento foi efetuado na data de <strong>{formatDateBR(rpaTransaction.dataPagamento || rpaTransaction.dataVencimento)}</strong>.
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px", marginBottom: "20px" }}>
                  <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "4px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Nome do Beneficiário:</span>
                    <strong style={{ display: "block", fontSize: "14px" }}>{rpaTransaction.clienteFornecedor || "___________________________"}</strong>
                  </div>
                  <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "4px" }}>
                    <span style={{ color: "var(--text-muted)" }}>CPF / RG:</span>
                    <strong style={{ display: "block", fontSize: "14px" }}>___________________________</strong>
                  </div>
                  <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "4px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Chave PIX:</span>
                    <strong style={{ display: "block", fontSize: "14px" }}>___________________________</strong>
                  </div>
                  <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "4px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Assinatura:</span>
                    <strong style={{ display: "block", fontSize: "14px" }}>___________________________</strong>
                  </div>
                </div>

                <div style={{ borderTop: "2px solid #ccc", paddingTop: "12px", fontSize: "13px", textAlign: "center" }}>
                  <strong style={{ color: "var(--primary)", fontSize: "15px" }}>VALOR PAGO: {formatCurrency(rpaTransaction.valor)}</strong>
                </div>

              </div>
            );
          })()}
            </div>

            <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="WhatsApp (Ex: 11999999999)"
                  className="form-control"
                  style={{ width: "200px" }}
                  value={whatsappNumberRPA}
                  onChange={(e) => setWhatsappNumberRPA(e.target.value)}
                />
                <button
                  className="btn btn-secondary"
                  style={{ backgroundColor: "#25D366", color: "white", border: "none" }}
                  disabled={isSendingWhatsAppRPA || !whatsappNumberRPA}
                  onClick={async () => {
                    if (!whatsappNumberRPA) return;
                    setIsSendingWhatsAppRPA(true);
                    try {
                      const element = document.getElementById("rpa-content-to-print");
                      if (element) {
                        const canvas = await html2canvas(element, { scale: 2 });
                        const imgData = canvas.toDataURL("image/png");
                        const pdf = new jsPDF({
                          orientation: "portrait",
                          unit: "mm",
                          format: "a4",
                        });
                        const pdfWidth = pdf.internal.pageSize.getWidth();
                        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
                        const pdfBase64 = pdf.output("datauristring");

                        await sendWhatsAppFile({
                          number: whatsappNumberRPA,
                          base64: pdfBase64,
                          fileName: `RPA_${rpaTransaction.clienteFornecedor || "Pagamento"}.pdf`,
                          caption: `Segue o Recibo de Pagamento de Autônomo (RPA) referente a ${rpaTransaction.descricao}.`
                        });
                        alert("RPA enviado com sucesso pelo WhatsApp!");
                      }
                    } catch (error) {
                      console.error(error);
                      alert("Erro ao enviar RPA pelo WhatsApp. Verifique o console.");
                    } finally {
                      setIsSendingWhatsAppRPA(false);
                    }
                  }}
                >
                  {isSendingWhatsAppRPA ? "Enviando..." : "Enviar pelo WhatsApp"}
                </button>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn btn-secondary" onClick={() => setIsRPAModalOpen(false)}>
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
        </div>
      )}

      {/* Modal Guia Rápido de Lançamentos */}
      {isGuiaLancamentosOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: "800px", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "22px" }}>💡</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: "17px", fontWeight: 700 }}>Guia Rápido: Onde Lançar no Financeiro?</h4>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
                    Consulte como classificar corretamente cada operação da empresa.
                  </p>
                </div>
              </div>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "22px", color: "var(--text-muted)" }} onClick={() => setIsGuiaLancamentosOpen(false)}>
                &times;
              </button>
            </div>

            <div className="modal-body" style={{ overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Card 1: Envio para Colaborador (Viagem/Geral) */}
              <div style={{ backgroundColor: "rgba(59, 130, 246, 0.06)", border: "1px solid rgba(59, 130, 246, 0.25)", borderRadius: "8px", padding: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <strong style={{ fontSize: "15px", color: "#3b82f6" }}>
                    🚗 1. Dinheiro Enviado para Colaborador (Despesas de Viagem / Gerais)
                  </strong>
                  <span style={{ backgroundColor: "#3b82f6", color: "#fff", fontSize: "11px", padding: "2px 8px", borderRadius: "12px", fontWeight: 600 }}>
                    CONTA 2.7.0
                  </span>
                </div>
                <p style={{ fontSize: "13px", margin: "0 0 8px 0", color: "var(--text-secondary)" }}>
                  Quando você faz um PIX de adiantamento para um funcionário em campo cobrir gastos de estrada, refeições, combustíveis, pedágios ou suprimentos de obra.
                </p>
                <div style={{ backgroundColor: "var(--bg-card)", padding: "10px", borderRadius: "6px", fontSize: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div>• <strong>Tipo:</strong> Despesa</div>
                  <div>• <strong>Plano de Contas:</strong> <code>2.7.0 - Despesas Gerais (não especificadas - Obra/Viagem)</code></div>
                  <div>• <strong>Favorecido:</strong> O campo muda para <strong>Colaborador</strong> automaticamente! O sistema já insere o texto na descrição: <em>"Envio de adiantamento para despesas gerais de viagem - Colaborador Fulano"</em>.</div>
                  <div>• <strong>Obra Vinculada:</strong> Selecione a Obra correspondente para o custo ser computado no lucro real do contrato.</div>
                </div>
              </div>

              {/* Card 2: Contabilidade e Assessoria Jurídica */}
              <div style={{ backgroundColor: "rgba(16, 185, 129, 0.06)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "8px", padding: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <strong style={{ fontSize: "15px", color: "#10b981" }}>
                    📊 2. Mensalidade da Contabilidade / Jurídico
                  </strong>
                  <span style={{ backgroundColor: "#10b981", color: "#fff", fontSize: "11px", padding: "2px 8px", borderRadius: "12px", fontWeight: 600 }}>
                    CONTA 4.3.1 ou 4.3.0
                  </span>
                </div>
                <p style={{ fontSize: "13px", margin: "0 0 8px 0", color: "var(--text-secondary)" }}>
                  Pagamento mensal do escritório contábil ou honorários advocatícios da empresa.
                </p>
                <div style={{ backgroundColor: "var(--bg-card)", padding: "10px", borderRadius: "6px", fontSize: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div>• <strong>Tipo:</strong> Despesa</div>
                  <div>• <strong>Plano de Contas:</strong> <code>4.3.1 - Mensalidade Contábil</code> (ou <code>4.3.0 - Honorários Contábeis e Advocatícios</code>)</div>
                  <div>• <strong>Obra Vinculada:</strong> Deixar <em>Sem obra vinculada</em> (é uma despesa institucional/sede).</div>
                  <div>• <strong>Centro de Custo:</strong> Escritório / Administrativo.</div>
                </div>
              </div>

              {/* Card 3: Combustível, Pedágio e Hospedagem com NF direta */}
              <div style={{ backgroundColor: "rgba(245, 158, 11, 0.06)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: "8px", padding: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <strong style={{ fontSize: "15px", color: "#f59e0b" }}>
                    ⛽ 3. Combustível, Pedágios, Hotéis e Refeições (Pagos Direto pela Empresa)
                  </strong>
                  <span style={{ backgroundColor: "#f59e0b", color: "#fff", fontSize: "11px", padding: "2px 8px", borderRadius: "12px", fontWeight: 600 }}>
                    CONTAS 2.5.0 / 2.6.0
                  </span>
                </div>
                <p style={{ fontSize: "13px", margin: "0 0 8px 0", color: "var(--text-secondary)" }}>
                  Quando o pagamento for feito direto no posto, hotel ou restaurante (cartão corporativo, fatura ou nota direta).
                </p>
                <div style={{ backgroundColor: "var(--bg-card)", padding: "10px", borderRadius: "6px", fontSize: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div>• <strong>Combustível / Frete / Pedágio:</strong> <code>2.5.0 - Combustível, Fretes e Logística (Obras)</code></div>
                  <div>• <strong>Hospedagem / Alimentação:</strong> <code>2.6.0 - Alimentação e Hospedagem (Obras/Viagem)</code></div>
                  <div>• <strong>Obra Vinculada:</strong> Sempre selecionar a Obra da viagem.</div>
                </div>
              </div>

              {/* Card 4: Folha de Pagamento & Diárias */}
              <div style={{ backgroundColor: "rgba(139, 92, 246, 0.06)", border: "1px solid rgba(139, 92, 246, 0.25)", borderRadius: "8px", padding: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <strong style={{ fontSize: "15px", color: "#8b5cf6" }}>
                    👷 4. Pagamento de Salários, Diárias de Ponto e Vales
                  </strong>
                  <span style={{ backgroundColor: "#8b5cf6", color: "#fff", fontSize: "11px", padding: "2px 8px", borderRadius: "12px", fontWeight: 600 }}>
                    CONTAS 2.3.0 / 3.1.0
                  </span>
                </div>
                <div style={{ backgroundColor: "var(--bg-card)", padding: "10px", borderRadius: "6px", fontSize: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div>• <strong>Equipe de Campo / Diaristas:</strong> <code>2.3.0 - Folha de Pagamento (Equipe Campo)</code> — o sistema lista os vales pendentes do colaborador para você abater automaticamente na hora!</div>
                  <div>• <strong>Equipe de Escritório / Sócios:</strong> <code>3.1.0 - Pró-labore e Folha de Pagamento (Escritório)</code></div>
                  <div>• <strong>Diárias de Viagem & Vales:</strong> São gerados e lançados automaticamente pelas telas de <em>Diárias de Viagem</em> e <em>Controle de Vales</em> através do botão <strong>"Lançar no Caixa"</strong>.</div>
                </div>
              </div>

              {/* Card 5: Materiais e Insumos */}
              <div style={{ backgroundColor: "rgba(236, 72, 153, 0.06)", border: "1px solid rgba(236, 72, 153, 0.25)", borderRadius: "8px", padding: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <strong style={{ fontSize: "15px", color: "#ec4899" }}>
                    🧱 5. Compra de Materiais, Resinas, Pastilhas e Insumos
                  </strong>
                  <span style={{ backgroundColor: "#ec4899", color: "#fff", fontSize: "11px", padding: "2px 8px", borderRadius: "12px", fontWeight: 600 }}>
                    CONTA 2.1.0
                  </span>
                </div>
                <div style={{ backgroundColor: "var(--bg-card)", padding: "10px", borderRadius: "6px", fontSize: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div>• <strong>Plano de Contas:</strong> <code>2.1.0 - Materiais de Construção / Revestimento</code></div>
                  <div>• <strong>Fornecedor:</strong> Selecione o fornecedor cadastrado (ou use o botão <code>+</code> para cadastrar na hora).</div>
                  <div>• <strong>Obra / Adendo:</strong> Se o material for para uma obra ou adendo extra contratado pelo cliente, vincule diretamente.</div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border-color)", padding: "12px 16px" }}>
              <button className="btn btn-primary" onClick={() => setIsGuiaLancamentosOpen(false)}>
                Entendido, fechar guia
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

