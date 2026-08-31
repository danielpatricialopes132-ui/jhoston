"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getViagensData() {
  const [obras, funcionarios, viagens] = await Promise.all([
    prisma.obra.findMany({ where: { status: "ATIVA" } }),
    prisma.funcionario.findMany({ where: { ativo: true } }),
    prisma.viagem.findMany({
      include: {
        obra: true,
        diariasViagem: {
          include: {
            funcionario: true,
          },
        },
      },
      orderBy: { id: "desc" },
    }),
  ]);

  return { obras, funcionarios, viagens };
}

interface DiariaInput {
  funcionarioId: number;
  foiDirigindo: boolean;
  tipoDiaria: "INTEIRA" | "MEIA";
  dias: number;
}

export async function salvarViagem(data: {
  obraId: number;
  dataInicio: string;
  dataFim: string;
  motoristaId: number;
  descricao?: string;
  participantes: DiariaInput[];
}) {
  const dataInicio = new Date(data.dataInicio);
  const dataFim = new Date(data.dataFim);

  // Executar transação
  const viagem = await prisma.$transaction(async (tx) => {
    // 1. Criar a Viagem
    const v = await tx.viagem.create({
      data: {
        obraId: data.obraId,
        dataInicio,
        dataFim,
        motoristaId: data.motoristaId,
        descricao: data.descricao || "",
      },
    });

    // 2. Criar as Diarias calculadas para cada participante
    for (const p of data.participantes) {
      // Buscar funcionário para ler diária base e adicional
      const f = await tx.funcionario.findUniqueOrThrow({
        where: { id: p.funcionarioId },
      });

      // Cálculo: diária base + adicional de motorista (se dirigiu nesta viagem)
      let diariaValor = f.diariaPadrao;
      if (p.foiDirigindo) {
        diariaValor += f.adicionalMotorista;
      }

      // Se for meia diária, aplica 50%
      if (p.tipoDiaria === "MEIA") {
        diariaValor = diariaValor / 2;
      }

      // Multiplica pela quantidade de dias de viagem
      const valorTotal = diariaValor * p.dias;

      await tx.diariaViagem.create({
        data: {
          viagemId: v.id,
          funcionarioId: p.funcionarioId,
          valorCalculado: valorTotal,
          foiDirigindo: p.foiDirigindo,
          tipoDiaria: p.tipoDiaria,
          statusPagamento: "PENDENTE",
        },
      });
    }

    return v;
  });

  revalidatePath("/viagens");
  revalidatePath("/relatorios");
  revalidatePath("/");
  return { success: true, data: viagem };
}

export async function deleteViagem(id: number) {
  try {
    await prisma.viagem.delete({
      where: { id },
    });
    revalidatePath("/viagens");
    revalidatePath("/relatorios");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao excluir a viagem." };
  }
}

export async function alterarStatusPagamentoDiaria(diariaId: number, status: "PENDENTE" | "PAGO") {
  const diaria = await prisma.diariaViagem.update({
    where: { id: diariaId },
    data: { statusPagamento: status },
  });
  revalidatePath("/viagens");
  revalidatePath("/relatorios");
  revalidatePath("/");
  return { success: true, data: diaria };
}

export async function lancarDiariaNoFinanceiro(diariaId: number) {
  const diaria = await prisma.diariaViagem.findUnique({
    where: { id: diariaId },
    include: { funcionario: true, viagem: { include: { obra: true } } },
  });

  if (!diaria) {
    throw new Error("Diária não encontrada");
  }

  if (diaria.transacaoId) {
    throw new Error("Esta diária já foi lançada no financeiro.");
  }

  // Busca a conta de Adiantamentos (ex: 2.3.1)
  const conta = await prisma.planoConta.findFirst({
    where: { descricao: { contains: "Adiantamento" } }
  });

  // Tenta encontrar o centro de custo da obra
  const centroCusto = await prisma.centroCusto.findFirst({
    where: { obraId: diaria.viagem.obraId }
  });

  const descricaoTransacao = `Diária de Viagem - ${diaria.funcionario.nome} (Obra: ${diaria.viagem.obra.nome})`;

  const transacao = await prisma.$transaction(async (tx) => {
    const t = await tx.transacaoFinanceira.create({
      data: {
        tipo: "DESPESA",
        descricao: descricaoTransacao,
        valor: diaria.valorCalculado,
        dataVencimento: diaria.viagem.dataInicio,
        dataPagamento: diaria.viagem.dataInicio, // Assumindo pago no início ou ato
        status: "PAGO",
        planoContaId: conta?.id || null,
        centroCustoId: centroCusto?.id || null,
        obraId: diaria.viagem.obraId,
      }
    });

    await tx.diariaViagem.update({
      where: { id: diaria.id },
      data: { transacaoId: t.id }
    });

    return t;
  });

  revalidatePath("/viagens");
  revalidatePath("/financeiro");
  return { success: true, data: transacao };
}
