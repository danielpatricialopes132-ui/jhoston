"use client";

import { useEffect, useState } from "react";
import { getRelatoriosMetadata, getFolhaPontoObra, getPagamentoFuncionarios, getLucratividadeObras, getAndamentoObraReport as getAndamentoObra, getRelatorioGerencialContabil, getLivroCaixa, gerarLinkCompartilhado, lancarPagamentoSalario } from "./actions";
import { getCompanyBranding } from "@/lib/branding";
import { sendWhatsAppFile, sendWhatsAppText, wakeEvolutionServer } from "@/lib/whatsapp";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

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
  funcao?: string | null;
  salarioFixo?: number;
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
  valorPagoNoPeriodo?: number;
  pagamentosRealizadosDetails?: any[];
  valorLiquidoTotal?: number;
  valorLiquidoPendente: number;
  temMovimentacao?: boolean;
}

import { Send } from "lucide-react";

const ReportFooter = ({ branding, style }: { branding: ReturnType<typeof getCompanyBranding>, style?: React.CSSProperties }) => (
  <div className="report-footer no-print-bg" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px", paddingTop: "12px", borderTop: "1px solid #e2e8f0", backgroundColor: "transparent", ...style }}>
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <img src="/logo.jpg" alt="DPG SOLUTIONS" style={{ height: "24px", objectFit: "contain" }} />
      <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
        Sistema de Gestão Integrada • Gerado em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())}
      </span>
    </div>
  </div>
);

export default function RelatoriosPage() {
  const [activeTab, setActiveTab] = useState<"ponto" | "pagamento" | "lucratividade" | "andamento" | "gerencial" | "livro_caixa">("ponto");
  const [obras, setObras] = useState<Obra[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [agendas, setAgendas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [empresaFilter, setEmpresaFilter] = useState("TODOS");

  const [whatsappNumberReport, setWhatsappNumberReport] = useState("");
  const [isSendingWhatsAppReport, setIsSendingWhatsAppReport] = useState(false);

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
  const [ocultarZerados, setOcultarZerados] = useState(true);
  const [somenteComSaldo, setSomenteComSaldo] = useState(true);

  // States: Lançamento Contábil de Salário a partir do relatório
  const [planoContas, setPlanoContas] = useState<any[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<any[]>([]);
  const [isLancarModalOpen, setIsLancarModalOpen] = useState(false);
  const [selectedLancarFunc, setSelectedLancarFunc] = useState<PagamentoItem | null>(null);
  const [lancarValor, setLancarValor] = useState<number>(0);
  const [lancarData, setLancarData] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [lancarPlanoContaId, setLancarPlanoContaId] = useState<string>("");
  const [lancarCentroCustoId, setLancarCentroCustoId] = useState<string>("");
  const [lancarDescricao, setLancarDescricao] = useState<string>("");
  const [isSubmittingLancamento, setIsSubmittingLancamento] = useState(false);

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

  // Carregar metadados iniciais (obras, colaboradores, plano de contas, centro de custo)
  useEffect(() => {
    let isMounted = true;
    getRelatoriosMetadata().then((res: any) => {
      if (isMounted) {
        setObras(res.obras as any);
        setFuncionarios(res.funcionarios);
        setAgendas(res.agendas || []);
        if (res.planoContas) setPlanoContas(res.planoContas);
        if (res.centrosCusto) setCentrosCusto(res.centrosCusto);
      }
    });

    // Pré-aquece a Evolution API silenciosamente em segundo plano para quando o usuário clicar no botão WhatsApp já estar pronto!
    wakeEvolutionServer().catch(() => {});

    return () => {
      isMounted = false;
    };
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
    getPagamentoFuncionarios(dataInicio, dataFim, empresaFilter).then((res) => {
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
      
      if (whatsappNumberReport) {
        setIsSendingWhatsAppReport(true);
        await sendWhatsAppText({
          number: whatsappNumberReport,
          text: `Confira o relatório online através deste link seguro: \n\n${url}`
        });
        alert("Link copiado para a área de transferência e enviado via WhatsApp!");
        setIsSendingWhatsAppReport(false);
      } else {
        alert("Link copiado para a área de transferência! (Para enviar via WhatsApp, preencha o número no topo)");
      }
    } catch (error) {
      setIsSendingWhatsAppReport(false);
      console.error(error);
      alert("Erro ao gerar link ou enviar pelo WhatsApp.");
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

  const handleSendReportWhatsApp = async (elementId: string, reportName: string) => {
    if (!whatsappNumberReport) {
      alert("Por favor, informe o número do WhatsApp.");
      return;
    }
    setIsSendingWhatsAppReport(true);
    try {
      const element = document.getElementById(elementId);
      if (element) {
        // Hide elements with 'no-print' class before capturing
        const noPrintElements = element.querySelectorAll('.no-print');
        noPrintElements.forEach(el => (el as HTMLElement).style.display = 'none');

        const canvas = await html2canvas(element, { scale: 2 });
        
        // Restore elements
        noPrintElements.forEach(el => (el as HTMLElement).style.display = '');

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: "a4",
        });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        // Se a altura passar de 1 página A4 landscape (210mm), pode ser necessário multi-página. 
        // Para simplicidade, imprimimos uma única imagem no PDF longo ou cortamos.
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        const pdfBase64 = pdf.output("datauristring");

        await sendWhatsAppFile({
          number: whatsappNumberReport,
          base64: pdfBase64,
          fileName: `${reportName.replace(/ /g, '_')}.pdf`,
          caption: `Segue o relatório: ${reportName}.`
        });
        alert("Relatório enviado com sucesso pelo WhatsApp!");
      } else {
        alert("Erro ao localizar o relatório na página.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao enviar relatório pelo WhatsApp. Verifique o console.");
    } finally {
      setIsSendingWhatsAppReport(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }} className="no-print">
        <div>
          <h3 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-heading)" }}>
            Central de Relatórios & Fechamentos
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
            Consolide a frequência dos diaristas, gere folhas de pagamentos com bônus e vales, emita holerites individuais e acompanhe custos físicos/financeiros de projetos.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", backgroundColor: "var(--bg-card)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
          <span style={{ fontSize: "14px", fontWeight: 600 }}>WhatsApp para Envio:</span>
          <div style={{ display: "flex", gap: "4px" }}>
            <input
              type="text"
              placeholder="Ex: 11999999999"
              className="form-control"
              style={{ width: "160px" }}
              value={whatsappNumberReport}
              onChange={(e) => setWhatsappNumberReport(e.target.value)}
              list="agenda-contacts"
            />
            <datalist id="agenda-contacts">
              {agendas.map((contato, index) => (
                <option key={index} value={contato.telefone}>
                  {contato.nome} ({contato.tipo})
                </option>
              ))}
            </datalist>
            <button
              onClick={async () => {
                if (!whatsappNumberReport) {
                  alert("Informe um número de WhatsApp.");
                  return;
                }
                setIsSendingWhatsAppReport(true);
                try {
                  const element = document.getElementById("report-content");
                  if (element) {
                    const canvas = await html2canvas(element, { scale: 2 });
                    const imgData = canvas.toDataURL("image/jpeg", 0.8);
                    
                    const pdf = new jsPDF("p", "mm", "a4");
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
                    
                    const pdfBlob = pdf.output("blob");
                    const base64data = await new Promise<string>((resolve) => {
                      const reader = new FileReader();
                      reader.readAsDataURL(pdfBlob);
                      reader.onloadend = () => resolve(reader.result as string);
                    });
                    
                    await sendWhatsAppFile({
                      number: whatsappNumberReport, 
                      base64: base64data, 
                      fileName: "Relatorio.pdf", 
                      caption: "Segue o relatório solicitado."
                    });
                    alert("Relatório enviado com sucesso!");
                  } else {
                    alert("Não foi possível encontrar o conteúdo do relatório para gerar o PDF.");
                  }
                } catch (error) {
                  console.error("Erro ao enviar relatório:", error);
                  alert("Erro ao enviar o relatório. Verifique o console.");
                } finally {
                  setIsSendingWhatsAppReport(false);
                }
              }}
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 12px" }}
              disabled={isSendingWhatsAppReport}
              title="Enviar via WhatsApp"
            >
              {isSendingWhatsAppReport ? "..." : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Seletor de Empresa */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", padding: "12px", backgroundColor: "var(--bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", alignItems: "center" }} className="no-print">
        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-heading)" }}>Filtrar Empresa:</span>
        <div style={{ display: "inline-flex", gap: "8px" }}>
          {[
            { id: "ECO_STONE", name: "🌿 Eco Stone" },
            { id: "JHOSTON", name: "🏢 Jhoston Pools" },
            { id: "JHOSTON_REVEST", name: "✨ Jhoston Revest" }
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setEmpresaFilter(c.id);
                setSelectedObraId("");
                setAndamentoObraId("");
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
          className={`btn ${activeTab === "pagamento" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("pagamento")}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, whiteSpace: "nowrap" }}
        >
          Folha de Salários
        </button>
        <button
          className={`btn ${activeTab === "ponto" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("ponto")}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, whiteSpace: "nowrap" }}
        >
          Ponto por Obra
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
          Relatório Gerencial
        </button>
        <button
          className={`btn ${activeTab === "livro_caixa" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => { setActiveTab("livro_caixa"); gerarLivroCaixa(); }}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, whiteSpace: "nowrap" }}
        >
          Livro Caixa
        </button>
      </div>

      <div id="report-content" style={{ backgroundColor: "#fff", minHeight: "600px", padding: "10px", borderRadius: "8px" }}>
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
            <div id="relatorio-ponto" className="card" style={{ padding: 0, overflow: "hidden", backgroundColor: "#fff" }}>
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
                    <div style={{ display: "flex", gap: "8px" }} className="no-print">
                      <button className="btn btn-secondary btn-sm" disabled={isSendingWhatsAppReport} onClick={() => handleSendReportWhatsApp("relatorio-ponto", `Folha_Ponto_${currentObra?.nome}`)}>
                        {isSendingWhatsAppReport ? "Enviando..." : "Gerar PDF (WhatsApp)"}
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                        Imprimir
                      </button>
                    </div>
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
              <ReportFooter branding={getCompanyBranding(obras.find((o) => o.id === parseInt(selectedObraId))?.empresa || empresaFilter)} style={{ margin: "0 24px", paddingBottom: "16px" }} />
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
            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "4px", flexWrap: "wrap" }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "var(--text-heading)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={somenteComSaldo}
                  onChange={(e) => setSomenteComSaldo(e.target.checked)}
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
                Apenas com Saldo a Pagar (&gt; R$ 0)
              </label>

              <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 500, color: "var(--text-muted)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={ocultarZerados}
                  onChange={(e) => setOcultarZerados(e.target.checked)}
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
                Ocultar sem movimentação
              </label>
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
            <div id="relatorio-pagamentos" className="card" style={{ padding: 24, backgroundColor: "#fff" }}>
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
                        <h4 style={{ fontSize: "17px", fontWeight: 800, marginTop: "2px", color: "var(--text-heading)" }}>Folha de Pagamentos & Salários a Pagar</h4>
                        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
                          Demonstrativo de diárias, viagens, vales, pagamentos já feitos no caixa e saldo de salário de {formatDateBR(dataInicio)} a {formatDateBR(dataFim)}.
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }} className="no-print">
                      <button className="btn btn-secondary btn-sm" disabled={isSendingWhatsAppReport} onClick={() => handleSendReportWhatsApp("relatorio-pagamentos", `Resumo_Pagamentos`)}>
                        {isSendingWhatsAppReport ? "Enviando..." : "Gerar PDF (WhatsApp)"}
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                        Imprimir
                      </button>
                    </div>
                  </div>
                );
              })()}

              <div className="table-container" style={{ margin: 0, boxShadow: "none", border: "none" }}>
                <table className="table" style={{ fontSize: "12px" }}>
                  <thead>
                    <tr>
                      <th>Colaborador</th>
                      <th>Cargo</th>
                      <th>Ganhos Ponto</th>
                      <th>Ganhos Viagem</th>
                      <th>Bônus (+)</th>
                      <th>Vales (-)</th>
                      <th>Total a Receber</th>
                      <th style={{ color: "#10b981" }}>Já Pago (Caixa)</th>
                      <th style={{ fontWeight: 800, fontSize: "13px" }}>Saldo de Salário</th>
                      <th>PIX</th>
                      <th style={{ textAlign: "right" }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagamentosReport
                      .filter((p) => {
                        if (somenteComSaldo) {
                          return p.valorLiquidoPendente > 0;
                        }
                        if (ocultarZerados) {
                          return p.temMovimentacao;
                        }
                        return true;
                      })
                      .map((p) => {
                        const jaPago = p.valorPagoNoPeriodo || 0;
                        const totalLiquido = p.valorLiquidoTotal !== undefined ? p.valorLiquidoTotal : (p.valorTotalPonto + p.valorTotalViagem + p.valorTotalBonus - p.valorValesPendentes);
                        const saldo = p.valorLiquidoPendente;
                        return (
                          <tr key={p.funcionario.id}>
                            <td>
                              <strong style={{ color: "var(--text-heading)", fontSize: "13px" }}>{p.funcionario.nome}</strong>
                              {p.funcionario.funcao === "ESCRITORIO" && (
                                <span className="badge" style={{ display: "block", width: "fit-content", marginTop: "2px", fontSize: "10px", backgroundColor: "#e0e7ff", color: "#3730a3" }}>
                                  ESCRITÓRIO
                                </span>
                              )}
                              {p.funcionario.funcao === "DIRETORIA" && (
                                <span className="badge" style={{ display: "block", width: "fit-content", marginTop: "2px", fontSize: "10px", backgroundColor: "#fef3c7", color: "#92400e" }}>
                                  DIRETORIA
                                </span>
                              )}
                            </td>
                            <td>{p.funcionario.cargo || "-"}</td>
                            <td style={{ color: "var(--text-main)" }}>
                              <strong>{formatCurrency(p.valorTotalPonto)}</strong>
                              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                {p.funcionario.funcao === "ESCRITORIO" || p.funcionario.funcao === "DIRETORIA"
                                   ? "Fixo Mensal"
                                   : `(${p.pontosContagem} dia(s) trab.)`}
                              </div>
                            </td>
                            <td>
                              <span style={{ color: "var(--text-heading)", fontWeight: 500 }}>
                                {formatCurrency(p.valorTotalViagem)}
                              </span>
                              {p.diariasViagemCount > 0 && (
                                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                  {p.diariasViagemCount} diária(s)
                                </div>
                              )}
                            </td>
                            <td style={{ color: "var(--success)", fontWeight: 600 }}>
                              {p.valorTotalBonus > 0 ? `+ ${formatCurrency(p.valorTotalBonus)}` : "R$ 0,00"}
                              {p.bonusCount > 0 && <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>({p.bonusCount} bônus)</div>}
                            </td>
                            <td style={{ color: "var(--error)", fontWeight: 500 }}>
                              {p.valorValesPendentes > 0 ? `- ${formatCurrency(p.valorValesPendentes)}` : "R$ 0,00"}
                              {p.valesCount > 0 && (
                                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                  ({p.valesCount} vale(s))
                                </div>
                              )}
                            </td>
                            <td style={{ fontWeight: 600, color: "var(--text-heading)" }}>
                              {formatCurrency(totalLiquido)}
                            </td>
                            <td style={{ color: jaPago > 0 ? "#10b981" : "var(--text-muted)", fontWeight: 600 }}>
                              {formatCurrency(jaPago)}
                              {p.pagamentosRealizadosDetails && p.pagamentosRealizadosDetails.length > 0 && (
                                <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                                  {p.pagamentosRealizadosDetails.length} pgto(s) no Caixa
                                </div>
                              )}
                            </td>
                            <td style={{ fontWeight: 800, fontSize: "14px", color: saldo > 0 ? "var(--primary)" : saldo === 0 ? "var(--text-muted)" : "var(--error)" }}>
                              {formatCurrency(saldo)}
                              {saldo === 0 && totalLiquido > 0 && (
                                <div style={{ fontSize: "10px", color: "#10b981", fontWeight: 700 }}>QUITADO</div>
                              )}
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
                              <div style={{ display: "inline-flex", gap: "6px" }}>
                                {saldo > 0 && (
                                  <button
                                    className="btn btn-sm btn-primary"
                                    style={{ fontSize: "11px", padding: "4px 8px" }}
                                    title="Lançar pagamento deste saldo no Caixa Financeiro"
                                    onClick={() => {
                                      setSelectedLancarFunc(p);
                                      setLancarValor(saldo);
                                      setLancarData(new Date().toISOString().split("T")[0]);
                                      setLancarDescricao(`Pagamento Salário - ${p.funcionario.nome} (${formatDateBR(dataInicio)} a ${formatDateBR(dataFim)})`);
                                      setIsLancarModalOpen(true);
                                    }}
                                  >
                                    Pagar no Caixa
                                  </button>
                                )}
                                <button
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: "11px", padding: "4px 8px" }}
                                  onClick={() => {
                                    setSelectedHoleriteFunc(p);
                                    setIsHoleriteModalOpen(true);
                                  }}
                                >
                                  Gerar RPA
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
              <ReportFooter branding={getCompanyBranding(empresaFilter)} />
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
            <div id="relatorio-lucratividade" className="card" style={{ padding: 24, backgroundColor: "#fff" }}>
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
                    <div style={{ display: "flex", gap: "8px" }} className="no-print">
                      <button className="btn btn-secondary btn-sm" onClick={gerarRelatorioLucratividade}>
                        Atualizar Dados
                      </button>
                      <button className="btn btn-secondary btn-sm" disabled={isSendingWhatsAppReport} onClick={() => handleSendReportWhatsApp("relatorio-lucratividade", `Lucratividade_${empresaFilter}`)}>
                        {isSendingWhatsAppReport ? "Enviando..." : "Gerar PDF (WhatsApp)"}
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                        Imprimir
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
              <ReportFooter branding={getCompanyBranding(empresaFilter)} />
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
            <div id="relatorio-andamento" className="card printable-report-card" style={{ padding: 24, backgroundColor: "#fff" }}>
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
                    <div style={{ display: "flex", gap: "8px" }} className="no-print">
                      <button className="btn btn-secondary btn-sm" disabled={isSendingWhatsAppReport} onClick={() => handleSendReportWhatsApp("relatorio-andamento", `Andamento_${andamentoReport.obra.nome}`)}>
                        {isSendingWhatsAppReport ? "Enviando..." : "Gerar PDF (WhatsApp)"}
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                        Imprimir
                      </button>
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Barra de progresso das 5 etapas da piscina */}
                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    padding: "16px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-color)",
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
              <ReportFooter branding={getCompanyBranding(andamentoReport.obra.empresa)} />
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
              <div className="card" style={{ padding: "16px 24px", backgroundColor: "#fff" }}>
                <ReportFooter branding={getCompanyBranding(empresaFilter)} style={{ marginTop: 0, borderTop: "none" }} />
              </div>
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
            <div id="relatorio-livro-caixa" className="card" style={{ padding: "24px", backgroundColor: "#fff" }}>
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
              <ReportFooter branding={getCompanyBranding(empresaFilter)} />
            </div>
          )}
        </div>
      )}
      </div>

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

                    {selectedHoleriteFunc.pagamentosRealizadosDetails && selectedHoleriteFunc.pagamentosRealizadosDetails.map((p: any) => (
                      <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9", fontStyle: "italic" }}>
                        <td style={{ padding: "6px" }}>Pago no Caixa: {p.descricao || "Adiantamento/Pagto"} ({formatDateBR(p.data)})</td>
                        <td style={{ textAlign: "center", padding: "6px" }}>1</td>
                        <td style={{ textAlign: "right", padding: "6px" }}>-</td>
                        <td style={{ textAlign: "right", padding: "6px", fontWeight: "600", color: "#64748b" }}>{formatCurrency(p.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", borderTop: "2px solid #ccc", paddingTop: "12px", fontSize: "13px" }}>
                  <div>
                    <strong>Total Proventos:</strong> {formatCurrency(selectedHoleriteFunc.valorTotalPonto + selectedHoleriteFunc.valorTotalViagem + selectedHoleriteFunc.valorTotalBonus)}
                  </div>
                  <div>
                    <strong>Vales / Descontos:</strong> {formatCurrency(selectedHoleriteFunc.valorValesPendentes)}
                  </div>
                  {(selectedHoleriteFunc.valorPagoNoPeriodo || 0) > 0 && (
                    <>
                      <div>
                        <strong>Total Bruto/Líquido Gerado:</strong> {formatCurrency(selectedHoleriteFunc.valorLiquidoTotal || 0)}
                      </div>
                      <div style={{ color: "#0284c7" }}>
                        <strong>Já Pago no Período (Caixa):</strong> -{formatCurrency(selectedHoleriteFunc.valorPagoNoPeriodo || 0)}
                      </div>
                    </>
                  )}
                  <div style={{ gridColumn: "span 2", borderTop: "1px dashed #ccc", paddingTop: "8px", marginTop: "4px", fontSize: "15px" }}>
                    <strong style={{ color: (selectedHoleriteFunc.valorLiquidoPendente ?? 0) > 0 ? "var(--primary)" : "#16a34a" }}>
                      {(selectedHoleriteFunc.valorLiquidoPendente ?? 0) > 0 ? "SALDO DE SALÁRIO A PAGAR: " : "STATUS: QUITADO (SALDO R$ 0,00)"} 
                      {(selectedHoleriteFunc.valorLiquidoPendente ?? 0) > 0 && formatCurrency(selectedHoleriteFunc.valorLiquidoPendente ?? 0)}
                    </strong>
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

      {/* --- MODAL LANÇAR PAGAMENTO DE SALÁRIO NO CAIXA --- */}
      {isLancarModalOpen && selectedLancarFunc && (
        <div className="modal-backdrop" onClick={() => setIsLancarModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: "550px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: "16px", fontWeight: 700 }}>
                💳 Lançar Pagamento de Salário no Caixa
              </h3>
              <button className="modal-close-btn" onClick={() => setIsLancarModalOpen(false)}>×</button>
            </div>

            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-heading)" }}>
                  {selectedLancarFunc.funcionario.nome}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Cargo: {selectedLancarFunc.funcionario.cargo || "Não informado"} | Função: {selectedLancarFunc.funcionario.funcao || "Colaborador"}
                </div>
                {selectedLancarFunc.funcionario.pix && (
                  <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#0284c7" }}>Chave PIX:</span>
                    <code style={{ fontSize: "12px", backgroundColor: "#e0f2fe", padding: "2px 6px", borderRadius: "4px" }}>
                      {selectedLancarFunc.funcionario.pix}
                    </code>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: "10px", padding: "2px 6px" }}
                      onClick={() => {
                        navigator.clipboard.writeText(selectedLancarFunc.funcionario.pix || "");
                        alert("PIX copiado!");
                      }}
                    >
                      Copiar
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Valor a Pagar (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={lancarValor}
                    onChange={(e) => setLancarValor(parseFloat(e.target.value) || 0)}
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Saldo apurado: {formatCurrency(selectedLancarFunc.valorLiquidoPendente)}
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Data do Pagamento</label>
                  <input
                    type="date"
                    className="form-control"
                    value={lancarData}
                    onChange={(e) => setLancarData(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Plano de Contas Contábil</label>
                <select
                  className="form-control"
                  value={lancarPlanoContaId}
                  onChange={(e) => setLancarPlanoContaId(e.target.value)}
                >
                  <option value="">Padrão (Conta 2.3.0 - Salários / Mão de Obra)</option>
                  {planoContas.map((pc) => (
                    <option key={pc.id} value={pc.id}>
                      {pc.codigo} - {pc.descricao || pc.nome}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Gera o débito no plano contábil empresarial selecionado.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Centro de Custos (Opcional)</label>
                <select
                  className="form-control"
                  value={lancarCentroCustoId}
                  onChange={(e) => setLancarCentroCustoId(e.target.value)}
                >
                  <option value="">Nenhum / Geral</option>
                  {centrosCusto.map((cc) => (
                    <option key={cc.id} value={cc.id}>
                      {cc.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Descrição / Histórico Contábil</label>
                <input
                  type="text"
                  className="form-control"
                  value={lancarDescricao}
                  onChange={(e) => setLancarDescricao(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsLancarModalOpen(false)}
                disabled={isSubmittingLancamento}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={isSubmittingLancamento || lancarValor <= 0}
                onClick={async () => {
                  if (lancarValor <= 0) {
                    alert("Informe um valor válido.");
                    return;
                  }
                  try {
                    setIsSubmittingLancamento(true);
                    await lancarPagamentoSalario({
                      funcionarioId: selectedLancarFunc.funcionario.id,
                      valor: lancarValor,
                      dataPagamento: lancarData,
                      empresa: empresaFilter !== "TODOS" ? empresaFilter : (selectedLancarFunc.funcionario as any).empresa || "ECO_STONE",
                      planoContaId: lancarPlanoContaId ? parseInt(lancarPlanoContaId) : null,
                      centroCustoId: lancarCentroCustoId ? parseInt(lancarCentroCustoId) : null,
                      descricao: lancarDescricao,
                    });
                    alert("Lançamento de pagamento registrado com sucesso no Caixa Financeiro!");
                    setIsLancarModalOpen(false);
                    // Atualizar folha
                    gerarRelatorioPagamentos();
                  } catch (err: any) {
                    console.error(err);
                    alert(`Erro ao lançar pagamento: ${err.message || "Tente novamente"}`);
                  } finally {
                    setIsSubmittingLancamento(false);
                  }
                }}
              >
                {isSubmittingLancamento ? "Lançando..." : "Confirmar Pagamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
