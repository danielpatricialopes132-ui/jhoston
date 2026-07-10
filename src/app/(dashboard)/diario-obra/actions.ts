"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/actions";

export async function getDiarioData(obraId?: number) {
  const obras = await prisma.obra.findMany({
    where: { status: "ATIVA" },
    orderBy: { nome: "asc" },
  });

  if (!obraId) {
    return { obras, relatos: [], obraAtual: null };
  }

  const [relatos, obraAtual] = await Promise.all([
    prisma.diarioObra.findMany({
      where: { obraId },
      include: {
        usuario: true,
        obra: true,
        fotos: true,
      },
      orderBy: { data: "desc" },
    }),
    prisma.obra.findUnique({
      where: { id: obraId },
    }),
  ]);

  return { obras, relatos, obraAtual };
}

export async function salvarRelatoDiario(data: {
  obraId: number;
  data: string;
  conteudo: string;
  progressoEscavacao?: number;
  progressoEstrutura?: number;
  progressoHidraulica?: number;
  progressoRevestimento?: number;
  progressoAcabamento?: number;
  fotosBase64?: string[];
}) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Usuário não autenticado." };
  }

  const relato = await prisma.$transaction(async (tx) => {
    // 1. Atualizar o progresso da obra se os valores forem enviados
    await tx.obra.update({
      where: { id: data.obraId },
      data: {
        progressoEscavacao: data.progressoEscavacao !== undefined ? data.progressoEscavacao : undefined,
        progressoEstrutura: data.progressoEstrutura !== undefined ? data.progressoEstrutura : undefined,
        progressoHidraulica: data.progressoHidraulica !== undefined ? data.progressoHidraulica : undefined,
        progressoRevestimento: data.progressoRevestimento !== undefined ? data.progressoRevestimento : undefined,
        progressoAcabamento: data.progressoAcabamento !== undefined ? data.progressoAcabamento : undefined,
      },
    });

    // 2. Criar a nota do diário de obra
    const relatoObj = await tx.diarioObra.create({
      data: {
        obraId: data.obraId,
        data: new Date(data.data),
        conteudo: data.conteudo,
        usuarioId: session.userId,
      },
    });

    // 3. Criar os registros de fotos se fornecido
    if (data.fotosBase64 && data.fotosBase64.length > 0) {
      await tx.diarioObraFoto.createMany({
        data: data.fotosBase64.map((base64) => ({
          diarioObraId: relatoObj.id,
          base64Data: base64,
        })),
      });
    }

    return relatoObj;
  });

  revalidatePath("/diario-obra");
  revalidatePath("/relatorios");
  revalidatePath("/");
  return { success: true, data: relato };
}

export async function deleteRelatoDiario(id: number) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Não autorizado." };
  }

  try {
    // Ao deletar o diário de obra, as fotos vinculadas serão excluídas automaticamente (onDelete: Cascade no Prisma)
    await prisma.diarioObra.delete({
      where: { id },
    });
    revalidatePath("/diario-obra");
    revalidatePath("/relatorios");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao excluir o relato." };
  }
}
