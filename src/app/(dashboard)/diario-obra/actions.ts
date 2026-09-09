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
    return { success: false, error: "UsuÃ¡rio nÃ£o autenticado." };
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

    // 2. Criar a nota do diÃ¡rio de obra
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
    return { success: false, error: "NÃ£o autorizado." };
  }

  try {
    // Ao deletar o diÃ¡rio de obra, as fotos vinculadas serÃ£o excluÃ­das automaticamente (onDelete: Cascade no Prisma)
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

import { sendWhatsAppText, sendWhatsAppFile } from '@/lib/whatsapp';

export async function shareDiarioOnWhatsApp(relatoId: number) {
  const relato = await prisma.diarioObra.findUnique({
    where: { id: relatoId },
    include: {
      obra: true,
      usuario: true,
      fotos: true
    }
  });

  if (!relato) throw new Error('Relato não encontrado.');
  if (!relato.obra.whatsappGroupId) throw new Error('Obra não possui grupo de WhatsApp vinculado.');

  const dataFormatada = new Date(relato.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  const mensagem = ??? *DIÁRIO DE OBRA: *\n?? *Data:* \n?? *Autor:* \n\n?? *Relato:*\n;

  // Enviar texto
  await sendWhatsAppText(relato.obra.whatsappGroupId, mensagem);

  // Enviar fotos
  if (relato.fotos && relato.fotos.length > 0) {
    for (let i = 0; i < relato.fotos.length; i++) {
      const foto = relato.fotos[i];
      // A base64Data já possui o prefixo data:image/...;base64,
      const base64Content = foto.base64Data.split(',')[1] || foto.base64Data;
      const mime = foto.base64Data.match(/data:(.*?);/)?.[1] || 'image/jpeg';
      
      await sendWhatsAppFile(
        relato.obra.whatsappGroupId,
        base64Content,
        mime,
        oto_.jpg,
        Foto  do relato
      );
    }
  }

  return { success: true };
}

