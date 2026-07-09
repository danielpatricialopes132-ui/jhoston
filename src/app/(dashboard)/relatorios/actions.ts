"use server";

import { prisma } from "@/lib/db";

export async function getRelatoriosMetadata() {
  const [obras, funcionarios] = await Promise.all([
    prisma.obra.findMany({ orderBy: { nome: "asc" } }),
    prisma.funcionario.findMany({ orderBy: { nome: "asc" } }),
  ]);
  return { obras, funcionarios };
}

// 1. Relatório de Folha de Ponto por Obra
export async function getFolhaPontoObra(obraId: number, ano: number, mes: number) {
  const startOfMonth = new Date(Date.UTC(ano, mes - 1, 1, 0, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999));

  // Buscar todos os registros de ponto desta obra no mês
  const pontos = await prisma.registroPonto.findMany({
    where: {
      obraId,
      data: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    include: {
      funcionario: true,
    },
    orderBy: {
      data: "asc",
    },
  });

  // Obter lista única de funcionários que trabalharam nessa obra no mês
  const funcionariosIds = Array.from(new Set(pontos.map((p) => p.funcionarioId)));
  const funcionarios = await prisma.funcionario.findMany({
    where: { id: { in: funcionariosIds } },
  });

  return { pontos, funcionarios };
}

// 2. Relatório de Pagamento de Funcionários
export async function getPagamentoFuncionarios(dataInicioStr: string, dataFimStr: string) {
  const start = new Date(dataInicioStr);
  const end = new Date(dataFimStr);
  const startOfDay = new Date(start.setUTCHours(0, 0, 0, 0));
  const endOfDay = new Date(end.setUTCHours(23, 59, 59, 999));

  const funcionarios = await prisma.funcionario.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });

  const payrollReport = [];

  for (const f of funcionarios) {
    // A) Diárias normais por Ponto (dias de trabalho registrados no ponto)
    const pontosTrabalhados = await prisma.registroPonto.findMany({
      where: {
        funcionarioId: f.id,
        tipoDia: { in: ["TRABALHO", "CHUVA"] },
        statusAprovacao: "APROVADO",
        data: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        obra: true,
      },
    });

    const valorTotalPonto = pontosTrabalhados.reduce((sum, p) => {
      const factor = p.tipoDia === "CHUVA" ? (p.percentualPago / 100) : 1;
      return sum + (f.diariaPadrao * factor);
    }, 0);

    // B) Diárias de Viagem lançadas
    const diariasViagem = await prisma.diariaViagem.findMany({
      where: {
        funcionarioId: f.id,
        viagem: {
          dataInicio: {
            gte: startOfDay,
          },
          dataFim: {
            lte: endOfDay,
          },
        },
      },
      include: {
        viagem: {
          include: {
            obra: true,
          },
        },
      },
    });

    const valorTotalViagem = diariasViagem.reduce((acc, d) => acc + d.valorCalculado, 0);
    const valorViagemPendente = diariasViagem.filter((d) => d.statusPagamento === "PENDENTE").reduce((acc, d) => acc + d.valorCalculado, 0);
    const valorViagemPago = diariasViagem.filter((d) => d.statusPagamento === "PAGO").reduce((acc, d) => acc + d.valorCalculado, 0);

    // C) Vales (Adiantamentos) e Bônus no período
    const adjustments = await prisma.vale.findMany({
      where: {
        funcionarioId: f.id,
        data: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const valesList = adjustments.filter(a => (a.tipo || "VALE") === "VALE");
    const bonusList = adjustments.filter(a => a.tipo === "BONUS");

    const valorTotalVales = valesList.reduce((acc, v) => acc + v.valor, 0);
    const valorValesPendentes = valesList.filter((v) => v.statusDesconto === "PENDENTE").reduce((acc, v) => acc + v.valor, 0);
    const valorValesDescontados = valesList.filter((v) => v.statusDesconto === "DESCONTADO").reduce((acc, v) => acc + v.valor, 0);

    const valorTotalBonus = bonusList.reduce((acc, b) => acc + b.valor, 0);
    const valorBonusPendentes = bonusList.filter((b) => b.statusDesconto === "PENDENTE").reduce((acc, b) => acc + b.valor, 0);
    const valorBonusPagos = bonusList.filter((b) => b.statusDesconto === "DESCONTADO").reduce((acc, b) => acc + b.valor, 0);

    const bonusDetails = bonusList.map(b => ({
      id: b.id,
      data: new Date(b.data).toISOString().split("T")[0],
      valor: b.valor,
      descricao: b.descricao || "Sem anotação",
    }));

    const valesDetails = valesList.map(v => ({
      id: v.id,
      data: new Date(v.data).toISOString().split("T")[0],
      valor: v.valor,
      descricao: v.descricao || "Sem anotação",
    }));

    // D) Cálculo Líquido Pendente
    // O líquido pendente de pagamento = (Valor Ponto + Diárias de Viagem Pendentes + Bônus Pendentes) - Vales Pendentes
    const valorLiquidoPendente = (valorTotalPonto + valorViagemPendente + valorBonusPendentes) - valorValesPendentes;

    payrollReport.push({
      funcionario: f,
      pontosContagem: pontosTrabalhados.length,
      pontosTrabalhadosDetails: pontosTrabalhados.map(p => ({ data: p.data, obraNome: p.obra.nome })),
      valorTotalPonto,
      diariasViagemCount: diariasViagem.length,
      valorTotalViagem,
      valorViagemPendente,
      valorViagemPago,
      valesCount: valesList.length,
      valorTotalVales,
      valorValesPendentes,
      valorValesDescontados,
      valesDetails,
      bonusCount: bonusList.length,
      valorTotalBonus,
      valorBonusPendentes,
      valorBonusPagos,
      bonusDetails,
      valorLiquidoPendente,
    });
  }

  return payrollReport;
}

// 3. Relatório Financeiro de Lucratividade por Obra
export async function getLucratividadeObras() {
  const obras = await prisma.obra.findMany({
    orderBy: { status: "asc" },
  });

  const report = [];

  for (const o of obras) {
    // A) Receitas da Obra
    const transacoesReceitas = await prisma.transacaoFinanceira.findMany({
      where: {
        obraId: o.id,
        tipo: "RECEITA",
      },
    });
    const receitasPagas = transacoesReceitas.filter((t) => t.status === "PAGO").reduce((acc, t) => acc + t.valor, 0);
    const receitasPendentes = transacoesReceitas.filter((t) => t.status === "PENDENTE").reduce((acc, t) => acc + t.valor, 0);
    const faturamentoTotal = receitasPagas + receitasPendentes;

    // B) Despesas diretas de Fornecedores / Outros
    const transacoesDespesas = await prisma.transacaoFinanceira.findMany({
      where: {
        obraId: o.id,
        tipo: "DESPESA",
      },
    });
    const despesasPagas = transacoesDespesas.filter((t) => t.status === "PAGO").reduce((acc, t) => acc + t.valor, 0);
    const despesasPendentes = transacoesDespesas.filter((t) => t.status === "PENDENTE").reduce((acc, t) => acc + t.valor, 0);
    const custoDireto = despesasPagas + despesasPendentes;

    // C) Custos de Ponto (Dias trabalhados na obra multiplicados pela diária do funcionário)
    const pontosObra = await prisma.registroPonto.findMany({
      where: {
        obraId: o.id,
        tipoDia: { in: ["TRABALHO", "CHUVA"] },
        statusAprovacao: "APROVADO",
      },
      include: {
        funcionario: true,
      },
    });
    const custoMaoDeObraPonto = pontosObra.reduce((acc, p) => {
      const factor = p.tipoDia === "CHUVA" ? (p.percentualPago / 100) : 1;
      return acc + (p.funcionario.diariaPadrao * factor);
    }, 0);

    // D) Custos de Viagem (Diárias geradas em viagens a essa obra)
    const viagensObra = await prisma.viagem.findMany({
      where: {
        obraId: o.id,
      },
      include: {
        diariasViagem: true,
      },
    });
    const custoMaoDeObraViagem = viagensObra.reduce((acc, v) => {
      const somaDiarias = v.diariasViagem.reduce((sum, d) => sum + d.valorCalculado, 0);
      return acc + somaDiarias;
    }, 0);

    const custoMaoDeObraTotal = custoMaoDeObraPonto + custoMaoDeObraViagem;
    const custoTotal = custoDireto + custoMaoDeObraTotal;
    const lucroLiquido = faturamentoTotal - custoTotal;
    const margem = faturamentoTotal > 0 ? (lucroLiquido / faturamentoTotal) * 100 : 0;

    report.push({
      obra: o,
      receitasPagas,
      receitasPendentes,
      faturamentoTotal,
      despesasPagas,
      despesasPendentes,
      custoDireto,
      custoMaoDeObraPonto,
      custoMaoDeObraViagem,
      custoMaoDeObraTotal,
      custoTotal,
      lucroLiquido,
      margem,
    });
  }

  return report;
}

export async function getAndamentoObraReport(
  obraId: number,
  dataInicioStr: string,
  dataFimStr: string
) {
  const start = new Date(dataInicioStr);
  const end = new Date(dataFimStr);
  const startOfDay = new Date(start.setUTCHours(0, 0, 0, 0));
  const endOfDay = new Date(end.setUTCHours(23, 59, 59, 999));

  const [obra, relatos] = await Promise.all([
    prisma.obra.findUniqueOrThrow({ where: { id: obraId } }),
    prisma.diarioObra.findMany({
      where: {
        obraId,
        data: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        usuario: true,
      },
      orderBy: {
        data: "asc",
      },
    }),
  ]);

  return { obra, relatos };
}
