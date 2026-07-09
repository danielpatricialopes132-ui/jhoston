import { prisma } from "@/lib/db";
import Link from "next/link";
import { getSession } from "@/app/login/actions";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const [
    obrasAtivasCount,
    funcionariosCount,
    transacoes,
    viagens,
    vales,
    obrasAtivasLista,
  ] = await Promise.all([
    prisma.obra.count({ where: { status: "ATIVA" } }),
    prisma.funcionario.count({ where: { ativo: true } }),
    prisma.transacaoFinanceira.findMany({
      include: { obra: true },
      orderBy: { dataVencimento: "desc" },
      take: 5,
    }),
    prisma.viagem.findMany({
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
      where: { status: "ATIVA" },
      orderBy: { nome: "asc" },
    }),
  ]);

  // Cálculos Financeiros
  const transacoesPagas = await prisma.transacaoFinanceira.findMany({
    where: { status: "PAGO" },
  });

  const receitasPagas = transacoesPagas
    .filter((t) => t.tipo === "RECEITA")
    .reduce((acc, t) => acc + t.valor, 0);

  const despesasPagas = transacoesPagas
    .filter((t) => t.tipo === "DESPESA")
    .reduce((acc, t) => acc + t.valor, 0);

  const saldoCaixa = receitasPagas - despesasPagas;

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
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
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
            JHOSTON TEC Piscinas — Resumo do fluxo de caixa e status das operações.
          </p>
        </div>
        <div style={{ display: "inline-flex", gap: "10px" }}>
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
                    <div>
                      <strong style={{ fontSize: "15px", color: "var(--text-heading)" }}>{o.nome}</strong>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "12px" }}>Cliente: {o.clienteNome}</span>
                    </div>
                    <span className="badge badge-info" style={{ fontSize: "12px" }}>Progresso Geral: {geral}%</span>
                  </div>

                  {/* Barras de progresso das 5 etapas */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
                    {/* Escavação */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>1. Escavação ({o.progressoEscavacao}%)</span>
                      <div style={{ width: "100%", height: "6px", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: `${o.progressoEscavacao}%`, height: "100%", backgroundColor: o.progressoEscavacao === 100 ? "var(--success)" : "var(--primary)" }} />
                      </div>
                    </div>

                    {/* Estrutura */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>2. Alvenaria ({o.progressoEstrutura}%)</span>
                      <div style={{ width: "100%", height: "6px", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: `${o.progressoEstrutura}%`, height: "100%", backgroundColor: o.progressoEstrutura === 100 ? "var(--success)" : "var(--primary)" }} />
                      </div>
                    </div>

                    {/* Hidráulica */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>3. Hidráulica ({o.progressoHidraulica}%)</span>
                      <div style={{ width: "100%", height: "6px", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: `${o.progressoHidraulica}%`, height: "100%", backgroundColor: o.progressoHidraulica === 100 ? "var(--success)" : "var(--primary)" }} />
                      </div>
                    </div>

                    {/* Revestimento */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>4. Revestimento ({o.progressoRevestimento}%)</span>
                      <div style={{ width: "100%", height: "6px", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: `${o.progressoRevestimento}%`, height: "100%", backgroundColor: o.progressoRevestimento === 100 ? "var(--success)" : "var(--primary)" }} />
                      </div>
                    </div>

                    {/* Acabamento */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>5. Entrega ({o.progressoAcabamento}%)</span>
                      <div style={{ width: "100%", height: "6px", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: `${o.progressoAcabamento}%`, height: "100%", backgroundColor: o.progressoAcabamento === 100 ? "var(--success)" : "var(--primary)" }} />
                      </div>
                    </div>
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
