"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/actions";

export async function getPontoData(dataStr: string, obraId: number) {
  // Obter todas as obras e funcionários ativos
  const [obras, funcionarios] = await Promise.all([
    prisma.obra.findMany({ where: { status: "ATIVA" } }),
    prisma.funcionario.findMany({ where: { ativo: true } }),
  ]);

  if (!obraId) {
    return { obras, funcionarios, pontosExistentes: [] };
  }

  // Normaliza a data para busca
  const targetDate = new Date(dataStr);
  const startOfDay = new Date(targetDate.setUTCHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setUTCHours(23, 59, 59, 999));

  // Buscar pontos já registrados para a data e obra
  const pontosExistentes = await prisma.registroPonto.findMany({
    where: {
      obraId,
      data: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      criadoPor: true,
    },
  });

  return { obras, funcionarios, pontosExistentes };
}

interface PontoEntry {
  funcionarioId: number;
  tipoDia: string;
  horasTrabalhadas: number;
  percentualPago?: number;
  observacoes: string;
}

export async function salvarPonto(
  dataStr: string,
  obraId: number,
  entries: PontoEntry[]
): Promise<{ success: boolean; statusAprovacao?: string; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Usuário não autenticado." };
  }

  const targetDate = new Date(dataStr);
  const startOfDay = new Date(targetDate.setUTCHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setUTCHours(23, 59, 59, 999));

  // Regra de status de aprovação baseada na role do usuário que insere
  const statusAprovacao = session.userRole === "ESCRITORIO" ? "APROVADO" : "PENDENTE";

  await prisma.$transaction(async (tx) => {
    // 1. Deleta registros existentes para aquela data e obra
    // Para evitar apagar registros já aprovados se o Campo estiver lançando, podemos filtrar.
    // Mas se for uma nova inserção completa da data/obra, limpamos o anterior.
    await tx.registroPonto.deleteMany({
      where: {
        obraId,
        data: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // 2. Cria os novos registros
    if (entries.length > 0) {
      await tx.registroPonto.createMany({
        data: entries.map((entry) => ({
          funcionarioId: entry.funcionarioId,
          obraId,
          data: startOfDay,
          tipoDia: entry.tipoDia,
          horasTrabalhadas: entry.horasTrabalhadas,
          percentualPago: entry.percentualPago !== undefined ? entry.percentualPago : 100,
          observacoes: entry.observacoes,
          statusAprovacao,
          criadoPorId: session.userId,
        })),
      });
    }
  });

  revalidatePath("/ponto");
  revalidatePath("/relatorios");
  revalidatePath("/");
  return { success: true, statusAprovacao };
}

// Buscar todos os pontos pendentes para aprovação do escritório
export async function getPontosPendentes() {
  const session = await getSession();
  if (!session || session.userRole !== "ESCRITORIO") {
    return [];
  }

  return await prisma.registroPonto.findMany({
    where: {
      statusAprovacao: "PENDENTE",
    },
    include: {
      funcionario: true,
      obra: true,
      criadoPor: true,
    },
    orderBy: {
      data: "desc",
    },
  });
}

// Aprovar ou rejeitar um ponto específico
export async function aprovarRejeitarPonto(pontoId: number, status: "APROVADO" | "REJEITADO") {
  const session = await getSession();
  if (!session || (session.userRole !== "ESCRITORIO" && session.userRole !== "MASTER")) {
    return { success: false, error: "Apenas usuários autorizados podem validar pontos." };
  }

  const ponto = await prisma.registroPonto.update({
    where: { id: pontoId },
    data: { statusAprovacao: status },
  });

  revalidatePath("/ponto");
  revalidatePath("/relatorios");
  revalidatePath("/");
  return { success: true, data: ponto };
}

// Aprovar todos os pontos em lote
export async function aprovarPontosEmLote(pontoIds: number[]) {
  const session = await getSession();
  if (!session || (session.userRole !== "ESCRITORIO" && session.userRole !== "MASTER")) {
    return { success: false, error: "Permissão negada." };
  }

  await prisma.registroPonto.updateMany({
    where: {
      id: { in: pontoIds },
    },
    data: {
      statusAprovacao: "APROVADO",
    },
  });

  revalidatePath("/ponto");
  revalidatePath("/relatorios");
  revalidatePath("/");
  return { success: true };
}

interface DiaLote {
  dataStr: string;
  entries: PontoEntry[];
}

export async function salvarPontosLoteDias(obraId: number, dias: DiaLote[]) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Usuário não autenticado." };
  }

  const statusAprovacao = (session.userRole === "ESCRITORIO" || session.userRole === "MASTER") ? "APROVADO" : "PENDENTE";

  await prisma.$transaction(async (tx) => {
    for (const dia of dias) {
      const targetDate = new Date(dia.dataStr);
      const startOfDay = new Date(targetDate.setUTCHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setUTCHours(23, 59, 59, 999));

      // Apaga os anteriores
      await tx.registroPonto.deleteMany({
        where: {
          obraId,
          data: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      // Insere os novos
      if (dia.entries.length > 0) {
        await tx.registroPonto.createMany({
          data: dia.entries.map((entry) => ({
            funcionarioId: entry.funcionarioId,
            obraId,
            data: startOfDay,
            tipoDia: entry.tipoDia,
            horasTrabalhadas: entry.horasTrabalhadas,
            percentualPago: entry.percentualPago !== undefined ? entry.percentualPago : 100,
            observacoes: entry.observacoes,
            statusAprovacao,
            criadoPorId: session.userId,
          })),
        });
      }
    }
  });

  revalidatePath("/ponto");
  revalidatePath("/relatorios");
  revalidatePath("/");
  return { success: true, statusAprovacao };
}

export async function criarFuncionarioRapido(data: {
  nome: string;
  cargo: string;
  diariaPadrao: number;
  adicionalMotorista: number;
  pix: string;
}) {
  const session = await getSession();
  if (!session || (session.userRole !== "ESCRITORIO" && session.userRole !== "MASTER")) {
    return { success: false, error: "Permissão negada." };
  }

  try {
    const novo = await prisma.funcionario.create({
      data: {
        nome: data.nome,
        cargo: data.cargo,
        diariaPadrao: data.diariaPadrao,
        adicionalMotorista: data.adicionalMotorista,
        pix: data.pix,
        ativo: true,
      },
    });
    return { success: true, funcionario: novo };
  } catch (e: any) {
    return { success: false, error: e.message || "Erro ao cadastrar funcionário." };
  }
}

