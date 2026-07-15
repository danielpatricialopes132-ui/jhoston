import { prisma } from "@/lib/db";
import Link from "next/link";
import { getSession } from "@/app/login/actions";

export const dynamic = "force-dynamic";

async function getDashboardData(empresaFilter: string) {
  const [
    obrasAtivasCount,
    funcionariosCount,
    transacoes,
    viagens,
    vales,
    obrasAtivasLista,
  ] = await Promise.all([
    prisma.obra.count({ 
      where: { 
        status: "ATIVA",
        ...(empresaFilter !== "TODOS" ? { empresa: empresaFilter } : {})
      } 
    }),
    prisma.funcionario.count({ where: { ativo: true } }),
    prisma.transacaoFinanceira.findMany({
      where: {
        ...(empresaFilter !== "TODOS" ? { empresa: empresaFilter } : {})
      },
      include: { obra: true },
      orderBy: { dataVencimento: "desc" },
      take: 5,
    }),
    prisma.viagem.findMany({
      where: {
        obra: {
          ...(empresaFilter !== "TODOS" ? { empresa: empresaFilter } : {})
        }
      },
      include: { obra: true },
      orderBy: { id: "desc" },
      take: 5,
    }),
    prisma.vale.findMany({
      where: { statusDesconto: "PENDENTE" },
      include: { funcionario: true },
      orderBy: { id: "desc" },
      take: 5,
    }),
    prisma.obra.findMany({
      where: { 
        status: "ATIVA",
        ...(empresaFilter !== "TODOS" ? { empresa: empresaFilter } : {})
      },
      orderBy: { nome: "asc" },
    }),
  ]);

  // Cálculos Financeiros
  const [transacoesPagas, despesasPendentes] = await Promise.all([
    prisma.transacaoFinanceira.findMany({
      where: { 
        status: "PAGO",
        ...(empresaFilter !== "TODOS" ? { empresa: empresaFilter } : {})
      },
    }),
    prisma.transacaoFinanceira.findMany({
      where: { 
        tipo: "DESPESA", 
        status: "PENDENTE",
        ...(empresaFilter !== "TODOS" ? { empresa: empresaFilter } : {})
      },
    }),
  ]);

  const receitasPagas = transacoesPagas
    .filter((t) => t.tipo === "RECEITA")
    .reduce((acc, t) => acc + t.valor, 0);

  const despesasPagas = transacoesPagas
    .filter((t) => t.tipo === "DESPESA")
    .reduce((acc, t) => acc + t.valor, 0);

  const saldoCaixa = receitasPagas - despesasPagas;

  // Classificação de Contas a Pagar por data crítica (GMT-3)
  const now = new Date();
  const brOffset = -3;
  const brTime = new Date(now.getTime() + brOffset * 60 * 60 * 1000);
  const hojeStr = brTime.toISOString().split("T")[0];
  const hojeDate = new Date(hojeStr);

  let contasHojeCount = 0;
  let contasHojeValor = 0;
  let contas1DiaCount = 0;
  let contas1DiaValor = 0;
  let contas3DiasCount = 0;
  let contas3DiasValor = 0;
  let contas5DiasCount = 0;
  let contas5DiasValor = 0;

  despesasPendentes.forEach((t) => {
    const vencStr = t.dataVencimento.toISOString().split("T")[0];
    const vencDate = new Date(vencStr);
    const diffTime = vencDate.getTime() - hojeDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      contasHojeCount++;
      contasHojeValor += t.valor;
    } else if (diffDays === 1) {
      contas1DiaCount++;
      contas1DiaValor += t.valor;
    } else if (diffDays === 3) {
      contas3DiasCount++;
      contas3DiasValor += t.valor;
    } else if (diffDays === 5) {
      contas5DiasCount++;
      contas5DiasValor += t.valor;
    }
  });

  // Empréstimo Intercompany
  const intercompanyTransacoes = await prisma.transacaoFinanceira.findMany({
    where: {
      categoria: "Empréstimo Intercompany",
      status: "PAGO",
    },
  });

  const jhostonOutflows = intercompanyTransacoes
    .filter((t) => t.empresa === "JHOSTON" && t.tipo === "DESPESA")
    .reduce((acc, t) => acc + t.valor, 0);

  const jhostonInflows = intercompanyTransacoes
    .filter((t) => t.empresa === "JHOSTON" && t.tipo === "RECEITA")
    .reduce((acc, t) => acc + t.valor, 0);

  const saldoEmprestimo = jhostonOutflows - jhostonInflows;

  return {
    obrasAtivasCount,
    funcionariosCount,
    transacoes,
    viagens,
    vales,
    receitasPagas,
    despesasPagas,
    saldoCaixa,
    obrasAtivasLista,
    saldoEmprestimo,
    vencimentoAlerts: {
      hoje: { count: contasHojeCount, valor: contasHojeValor },
      amanha: { count: contas1DiaCount, valor: contas1DiaValor },
      em3Dias: { count: contas3DiasCount, valor: contas3DiasValor },
      em5Dias: { count: contas5DiasCount, valor: contas5DiasValor },
    },
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ empresa?: string }> | { empresa?: string } | undefined;
}) {
  const resolvedParams = searchParams ? (searchParams instanceof Promise ? await searchParams : searchParams) : {};
  const empresaFilter = resolvedParams.empresa || "TODOS";
  const data = await getDashboardData(empresaFilter);
  const session = await getSession();
  const isMaster = session?.userRole === "MASTER";

  let masterTasks = {
    usuariosNovosCount: 0,
    resetsPendentesCount: 0,
    pontosPendentesCount: 0,
  };

  if (isMaster) {
    const [usuariosNovos, resetsPendentes, pontosPendentes] = await Promise.all([
      prisma.usuario.count({
        where: {
          role: "CAMPO",
          usuario: { not: "@campo" },
        },
      }),
      prisma.usuario.count({
        where: {
          statusReset: "SOLICITADO",
        },
      }),
      prisma.registroPonto.count({
        where: {
          statusAprovacao: "PENDENTE",
        },
      }),
    ]);

    masterTasks = {
      usuariosNovosCount: usuariosNovos,
      resetsPendentesCount: resetsPendentes,
      pontosPendentesCount: pontosPendentes,
    };
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  const formatDateBR = (dateInput: Date | string) => {
    const d = new Date(dateInput);
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div>
      <div className="flex-row-between" style={{ marginBottom: "32px" }}>
        <div>
          <h3 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-heading)" }}>
            Painel Financeiro Geral
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
            JHOSTON TEC — Resumo do fluxo de caixa e status das operações.
          </p>
        </div>
        <div style={{ display: "inline-flex", gap: "10px" }}>
          <Link href="/chat" className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            💬 Chat Interno
          </Link>
          <Link href="/calculadora" className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            📐 Calculadora
          </Link>
          <Link href="/ponto" className="btn btn-secondary">
            Lançar Ponto
          </Link>
          <Link href="/viagens" className="btn btn-secondary">
            Registrar Viagem
          </Link>
          <Link href="/financeiro" className="btn btn-primary">
            Lançar Finanças
          </Link>
        </div>
      </div>

      {/* Seletor de Empresa */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "24px", padding: "12px", backgroundColor: "var(--bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", alignItems: "center" }}>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-heading)" }}>Visualizar Empresa:</span>
        <div style={{ display: "inline-flex", gap: "8px" }}>
          {[
            { id: "TODOS", name: "Consolidado" },
            { id: "JHOSTON", name: "Jhoston Pools" },
            { id: "ECO_STONE", name: "Eco Stone" }
          ].map((c) => (
            <Link
              key={c.id}
              href={c.id === "TODOS" ? "/" : `/?empresa=${c.id}`}
              className={`btn btn-sm ${empresaFilter === c.id ? "btn-primary" : "btn-secondary"}`}
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Widget de Saldo de Empréstimos Intercompany */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderLeft: `5px solid ${data.saldoEmprestimo !== 0 ? "#f59e0b" : "var(--success)"}`,
          borderRadius: "var(--radius-md)",
          padding: "16px 20px",
          marginBottom: "24px",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ fontSize: "24px" }}>🤝</div>
        <div>
          <h4 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "var(--text-heading)" }}>
            Saldo de Empréstimos Intercompany
          </h4>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "4px 0 0 0", lineHeight: 1.4 }}>
            {data.saldoEmprestimo > 0 ? (
              <>
                A <strong>ECO STONE</strong> deve ao caixa da <strong>JHOSTON POOLS</strong> o valor líquido de{" "}
                <strong style={{ color: "#d97706" }}>{formatCurrency(data.saldoEmprestimo)}</strong>.
              </>
            ) : data.saldoEmprestimo < 0 ? (
              <>
                A <strong>JHOSTON POOLS</strong> deve ao caixa da <strong>ECO STONE</strong> o valor líquido de{" "}
                <strong style={{ color: "#d97706" }}>{formatCurrency(Math.abs(data.saldoEmprestimo))}</strong>.
              </>
            ) : (
              <>
                As contas de empréstimos mútuos entre <strong>JHOSTON POOLS</strong> e <strong>ECO STONE</strong> estão{" "}
                <strong style={{ color: "var(--success)" }}>100% equilibradas</strong>.
              </>
            )}
          </p>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <Link href="/financeiro" className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}>
            Realizar Transferência
          </Link>
        </div>
      </div>

      {/* Widget de Tarefas do MASTER */}
      {isMaster && (masterTasks.usuariosNovosCount > 0 || masterTasks.resetsPendentesCount > 0 || masterTasks.pontosPendentesCount > 0) && (
        <div
          style={{
            backgroundColor: "#fff7ed",
            border: "1px solid #ffedd5",
            borderRadius: "var(--radius-md)",
            padding: "20px",
            marginBottom: "32px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#c2410c", marginBottom: "12px" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <h4 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>
              Tarefas Pendentes do MASTER
            </h4>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {masterTasks.resetsPendentesCount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: "10px 16px", borderRadius: "6px", border: "1px solid #fed7aa" }}>
                <span style={{ fontSize: "14px", color: "var(--text-main)" }}>
                  🔑 Há <strong>{masterTasks.resetsPendentesCount} solicitação(ões) de reset de senha</strong> aguardando sua autorização.
                </span>
                <Link href="/usuarios" className="btn btn-sm btn-primary" style={{ padding: "4px 12px", fontSize: "12px", height: "auto" }}>
                  Autorizar Resets
                </Link>
              </div>
            )}

            {masterTasks.usuariosNovosCount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: "10px 16px", borderRadius: "6px", border: "1px solid #fed7aa" }}>
                <span style={{ fontSize: "14px", color: "var(--text-main)" }}>
                  👥 Há <strong>{masterTasks.usuariosNovosCount} novo(s) usuário(s)</strong> cadastrado(s) aguardando liberação de acesso administrativo.
                </span>
                <Link href="/usuarios" className="btn btn-sm btn-primary" style={{ padding: "4px 12px", fontSize: "12px", height: "auto" }}>
                  Gerenciar Acessos
                </Link>
              </div>
            )}

            {masterTasks.pontosPendentesCount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: "10px 16px", borderRadius: "6px", border: "1px solid #fed7aa" }}>
                <span style={{ fontSize: "14px", color: "var(--text-main)" }}>
                  📝 Há <strong>{masterTasks.pontosPendentesCount} registro(s) de ponto</strong> pendente(s) de validação e aprovação.
                </span>
                <Link href="/ponto" className="btn btn-sm btn-primary" style={{ padding: "4px 12px", fontSize: "12px", height: "auto" }}>
                  Aprovar Pontos
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cards de Métricas */}
      <div className="grid-cols-4" style={{ marginBottom: "24px" }}>
        <div className="card">
          <div className="card-title">Saldo em Caixa</div>
          <div className="card-value" style={{ color: data.saldoCaixa >= 0 ? "var(--success)" : "var(--error)" }}>
            {formatCurrency(data.saldoCaixa)}
          </div>
          <div className="card-desc">Total Recebido - Pago</div>
        </div>
        <div className="card">
          <div className="card-title">Obras Ativas</div>
          <div className="card-value" style={{ color: "var(--primary)" }}>
            {data.obrasAtivasCount}
          </div>
          <div className="card-desc">Projetos em andamento</div>
        </div>
        <div className="card">
          <div className="card-title">Funcionários Ativos</div>
          <div className="card-value" style={{ color: "var(--secondary)" }}>
            {data.funcionariosCount}
          </div>
          <div className="card-desc">Equipe externa cadastrada</div>
        </div>
        <div className="card">
          <div className="card-title">Fluxo Realizado</div>
          <div className="card-desc" style={{ fontSize: "13px", marginTop: "8px" }}>
            Receitas Pagas: <strong style={{ color: "var(--success)" }}>{formatCurrency(data.receitasPagas)}</strong><br />
            Despesas Pagas: <strong style={{ color: "var(--error)" }}>{formatCurrency(data.despesasPagas)}</strong>
          </div>
        </div>
      </div>

      {/* NOVO PAINEL: CONTAS A PAGAR CRÍTICAS */}
      <div className="card" style={{ marginBottom: "24px", padding: "20px 24px" }}>
        <h4 style={{ fontSize: "15px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "16px" }}>
          Controle de Vencimentos — Contas a Pagar Pendentes
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          
          {/* Hoje */}
          <div style={{
            padding: "16px",
            border: "1px solid #fca5a5",
            borderRadius: "var(--radius-md)",
            backgroundColor: "#fef2f2",
            borderLeft: "5px solid var(--error)",
            display: "flex",
            flexDirection: "column",
            gap: "4px"
          }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#991b1b" }}>Vencem Hoje</span>
            <strong style={{ fontSize: "20px", color: "var(--error)" }}>
              {formatCurrency(data.vencimentoAlerts.hoje.valor)}
            </strong>
            <span style={{ fontSize: "12px", color: "#7f1d1d" }}>
              {data.vencimentoAlerts.hoje.count} despesa(s) pendente(s)
            </span>
          </div>

          {/* Amanhã (1 dia) */}
          <div style={{
            padding: "16px",
            border: "1px solid #fed7aa",
            borderRadius: "var(--radius-md)",
            backgroundColor: "#fff7ed",
            borderLeft: "5px solid #ea580c",
            display: "flex",
            flexDirection: "column",
            gap: "4px"
          }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#c2410c" }}>Vencem Amanhã (1 Dia)</span>
            <strong style={{ fontSize: "20px", color: "#c2410c" }}>
              {formatCurrency(data.vencimentoAlerts.amanha.valor)}
            </strong>
            <span style={{ fontSize: "12px", color: "#7c2d12" }}>
              {data.vencimentoAlerts.amanha.count} despesa(s) pendente(s)
            </span>
          </div>

          {/* 3 dias */}
          <div style={{
            padding: "16px",
            border: "1px solid #fef08a",
            borderRadius: "var(--radius-md)",
            backgroundColor: "#fefce8",
            borderLeft: "5px solid var(--warning)",
            display: "flex",
            flexDirection: "column",
            gap: "4px"
          }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#a16207" }}>Vencem em 3 Dias</span>
            <strong style={{ fontSize: "20px", color: "#a16207" }}>
              {formatCurrency(data.vencimentoAlerts.em3Dias.valor)}
            </strong>
            <span style={{ fontSize: "12px", color: "#713f12" }}>
              {data.vencimentoAlerts.em3Dias.count} despesa(s) pendente(s)
            </span>
          </div>

          {/* 5 dias */}
          <div style={{
            padding: "16px",
            border: "1px solid #bfdbfe",
            borderRadius: "var(--radius-md)",
            backgroundColor: "#eff6ff",
            borderLeft: "5px solid var(--info)",
            display: "flex",
            flexDirection: "column",
            gap: "4px"
          }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#1d4ed8" }}>Vencem em 5 Dias</span>
            <strong style={{ fontSize: "20px", color: "#1d4ed8" }}>
              {formatCurrency(data.vencimentoAlerts.em5Dias.valor)}
            </strong>
            <span style={{ fontSize: "12px", color: "#1e3a8a" }}>
              {data.vencimentoAlerts.em5Dias.count} despesa(s) pendente(s)
            </span>
          </div>

        </div>
      </div>

      {/* NOVO PAINEL: ACOMPANHAMENTO DE FASES DA INSTALAÇÃO (PISCINA) */}
      <div className="card" style={{ marginBottom: "24px", padding: "20px 24px" }}>
        <h4 style={{ fontSize: "15px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "16px" }}>
          Status de Conclusão das Obras Ativas (Piscinas)
        </h4>

        {data.obrasAtivasLista.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Nenhuma obra ativa cadastrada no momento.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {data.obrasAtivasLista.map((o) => {
               const isEco = o.empresa === "ECO_STONE";
               const phases = isEco ? [
                 { label: "1. Vistoria", val: o.progressoEscavacao },
                 { label: "2. Adeq. Hidráu.", val: o.progressoHidraulica },
                 { label: "3. Estruturação", val: o.progressoEstrutura },
                 { label: "4. Modelagem", val: o.progressoRevestimento },
                 { label: "5. Testes", val: o.progressoAcabamento },
               ] : [
                 { label: "1. Escavação", val: o.progressoEscavacao },
                 { label: "2. Alvenaria", val: o.progressoEstrutura },
                 { label: "3. Hidráulica", val: o.progressoHidraulica },
                 { label: "4. Revestimento", val: o.progressoRevestimento },
                 { label: "5. Entrega", val: o.progressoAcabamento },
               ];

              const geral = Math.round(
                (o.progressoEscavacao +
                  o.progressoEstrutura +
                  o.progressoHidraulica +
                  o.progressoRevestimento +
                  o.progressoAcabamento) /
                  5
              );

              return (
                <div
                  key={o.id}
                  style={{
                    padding: "16px",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "#f8fafc",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                       <span
                         style={{
                           fontSize: "10px",
                           padding: "1px 5px",
                           backgroundColor: isEco ? "rgba(34, 197, 94, 0.15)" : "rgba(59, 130, 246, 0.15)",
                           color: isEco ? "#4ade80" : "#60a5fa",
                           borderRadius: "4px",
                           fontWeight: 600
                         }}
                       >
                         {isEco ? "Eco Stone" : "Jhoston"}
                       </span>
                      <strong style={{ fontSize: "15px", color: "var(--text-heading)" }}>{o.nome}</strong>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "12px" }}>Cliente: {o.clienteNome}</span>
                    </div>
                    <span className="badge badge-info" style={{ fontSize: "12px" }}>Progresso Geral: {geral}%</span>
                  </div>

                  {/* Barras de progresso das 5 etapas */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
                    {phases.map((phase, idx) => (
                      <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {phase.label} ({phase.val}%)
                        </span>
                        <div style={{ width: "100%", height: "6px", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ width: `${phase.val}%`, height: "100%", backgroundColor: phase.val === 100 ? "var(--success)" : "var(--primary)" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid Secundário: Tabelas Rápidas */}
      <div className="grid-cols-2">
        {/* Lançamentos Financeiros Recentes */}
        <div className="card" style={{ padding: "20px 24px" }}>
          <div className="flex-row-between" style={{ marginBottom: "16px" }}>
            <h4 style={{ fontSize: "15px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
              Últimas Transações Financeiras
            </h4>
            <Link href="/financeiro" style={{ fontSize: "13px", fontWeight: 600 }}>
              Ver Tudo
            </Link>
          </div>
          <div className="table-container" style={{ margin: 0, boxShadow: "none", border: "none" }}>
            <table className="table" style={{ fontSize: "13px" }}>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Data</th>
                  <th>Valor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.transacoes.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)", padding: "16px" }}>
                      Nenhuma transação financeira.
                    </td>
                  </tr>
                ) : (
                  data.transacoes.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{t.descricao}</td>
                      <td>{formatDateBR(t.dataVencimento)}</td>
                      <td style={{ fontWeight: 700, color: t.tipo === "RECEITA" ? "var(--success)" : "var(--text-heading)" }}>
                        {t.tipo === "RECEITA" ? "+" : "-"} {formatCurrency(t.valor)}
                      </td>
                      <td>
                        <span className={`badge ${t.status === "PAGO" ? "badge-success" : "badge-warning"}`} style={{ fontSize: "9px" }}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Viagens Recentes */}
        <div className="card" style={{ padding: "20px 24px" }}>
          <div className="flex-row-between" style={{ marginBottom: "16px" }}>
            <h4 style={{ fontSize: "15px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
              Viagens Recentes da Equipe
            </h4>
            <Link href="/viagens" style={{ fontSize: "13px", fontWeight: 600 }}>
              Ver Tudo
            </Link>
          </div>
          <div className="table-container" style={{ margin: 0, boxShadow: "none", border: "none" }}>
            <table className="table" style={{ fontSize: "13px" }}>
              <thead>
                <tr>
                  <th>Obra / Destino</th>
                  <th>Início</th>
                  <th>Fim</th>
                </tr>
              </thead>
              <tbody>
                {data.viagens.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", color: "var(--text-muted)", padding: "16px" }}>
                      Nenhuma viagem registrada.
                    </td>
                  </tr>
                ) : (
                  data.viagens.map((v) => (
                    <tr key={v.id}>
                      <td style={{ fontWeight: 600, color: "var(--primary)" }}>{v.obra.nome}</td>
                      <td>{formatDateBR(v.dataInicio)}</td>
                      <td>{formatDateBR(v.dataFim)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Caixa de Vales Pendentes */}
      <div className="card" style={{ marginTop: "24px", padding: "20px 24px" }}>
        <div className="flex-row-between" style={{ marginBottom: "16px" }}>
          <h4 style={{ fontSize: "15px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
            Vales Pendentes de Desconto (Adiantamentos)
          </h4>
          <Link href="/vales" style={{ fontSize: "13px", fontWeight: 600 }}>
            Gerenciar Vales
          </Link>
        </div>
        <div className="table-container" style={{ margin: 0, boxShadow: "none", border: "none" }}>
          <table className="table" style={{ fontSize: "13px" }}>
            <thead>
              <tr>
                <th>Funcionário</th>
                <th>Data Concessão</th>
                <th>Valor do Vale</th>
                <th>Finalidade</th>
              </tr>
            </thead>
            <tbody>
              {data.vales.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)", padding: "16px" }}>
                    Nenhum vale pendente.
                  </td>
                </tr>
              ) : (
                data.vales.map((v) => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 600 }}>{v.funcionario.nome}</td>
                    <td>{formatDateBR(v.data)}</td>
                    <td style={{ fontWeight: 700, color: "var(--error)" }}>{formatCurrency(v.valor)}</td>
                    <td>{v.descricao || <em style={{ color: "var(--text-muted)" }}>Não informado</em>}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
