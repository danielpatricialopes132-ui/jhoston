"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

const db = prisma as any;

export async function getChatChannels(userId: number) {
  try {
    const [obras, usuarios] = await Promise.all([
      db.obra.findMany({
        where: { status: "ATIVA" },
        orderBy: { nome: "asc" },
      }),
      db.usuario.findMany({
        where: {
          id: { not: userId },
        },
        orderBy: { nome: "asc" },
      }),
    ]);

    return { success: true, obras, usuarios };
  } catch (error: any) {
    console.error("Erro ao carregar canais do chat:", error);
    return { success: false, error: "Erro ao carregar canais do chat." };
  }
}

export async function getChatMessages(userId: number, targetId: number, isGroup: boolean) {
  try {
    let mensagens = [];

    if (isGroup) {
      // Mensagens da obra
      mensagens = await db.mensagemChat.findMany({
        where: {
          obraId: targetId,
        },
        include: {
          remetente: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });
    } else {
      // Mensagens diretas (DMs)
      mensagens = await db.mensagemChat.findMany({
        where: {
          OR: [
            { remetenteId: userId, destinatarioId: targetId },
            { remetenteId: targetId, destinatarioId: userId },
          ],
        },
        include: {
          remetente: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });
    }

    // Mapear para limpar as datas
    const mapped = mensagens.map((m: any) => ({
      id: m.id,
      conteudo: m.conteudo,
      remetenteId: m.remetenteId,
      remetenteNome: m.remetente.nome,
      remetenteRole: m.remetente.role,
      createdAt: m.createdAt.toISOString(),
    }));

    return { success: true, data: mapped };
  } catch (error: any) {
    console.error("Erro ao carregar histórico do chat:", error);
    return { success: false, error: "Erro ao carregar histórico do chat." };
  }
}

export async function enviarMensagem(
  conteudo: string,
  remetenteId: number,
  targetId: number,
  isGroup: boolean
) {
  try {
    if (!conteudo.trim()) {
      return { success: false, error: "A mensagem não pode ser vazia." };
    }

    const payload: any = {
      conteudo: conteudo.trim(),
      remetenteId,
    };

    if (isGroup) {
      payload.obraId = targetId;
    } else {
      payload.destinatarioId = targetId;
    }

    const msg = await db.mensagemChat.create({
      data: payload,
    });

    revalidatePath("/chat");
    return { success: true, data: msg };
  } catch (error: any) {
    console.error("Erro ao enviar mensagem:", error);
    return { success: false, error: "Erro ao enviar mensagem." };
  }
}
