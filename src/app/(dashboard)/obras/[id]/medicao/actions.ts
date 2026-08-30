"use server"

import { revalidatePath } from "next/cache";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient() as any;

const TELEGRAM_BOT_TOKEN = "8838832049:AAHjicBzNx3VEDwgdo-1zfQwQnITgnibjPQ";
const TELEGRAM_CHAT_ID = "6315130099";

export async function notificarTelegram(mensagem: string) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: mensagem,
        parse_mode: "Markdown",
      }),
    });
  } catch (error) {
    console.error("Erro ao enviar mensagem para o Telegram:", error);
  }
}

export async function getMedicaoObra(obraId: number) {
  return await prisma.obra.findUnique({
    where: { id: obraId },
    include: {
      etapasMedicao: {
        orderBy: { ordem: "asc" },
        include: {
          itens: {
            orderBy: { ordem: "asc" },
            include: { comentarios: true },
          },
        },
      },
    },
  });
}

export async function criarEtapaMedicao(obraId: number, nome: string) {
  const etapa = await prisma.etapaMedicao.create({
    data: { obraId, nome },
  });
  revalidatePath(`/obras/${obraId}/medicao`);
  return etapa;
}

export async function deletarEtapaMedicao(etapaId: number) {
  const etapa = await prisma.etapaMedicao.delete({
    where: { id: etapaId },
  });
  revalidatePath(`/obras/${etapa.obraId}/medicao`);
  return etapa;
}

export async function criarItemMedicao(etapaId: number, descricao: string, unidade?: string, precoUnitario?: number) {
  const item = await prisma.itemMedicao.create({
    data: {
      etapaId,
      descricao,
      unidade,
      precoUnitario: precoUnitario || 0,
    },
    include: { etapa: true },
  });
  revalidatePath(`/obras/${item.etapa.obraId}/medicao`);
  return item;
}

export async function deletarItemMedicao(itemId: number) {
  const item = await prisma.itemMedicao.delete({
    where: { id: itemId },
    include: { etapa: true },
  });
  revalidatePath(`/obras/${item.etapa.obraId}/medicao`);
  return item;
}

export async function atualizarProgressoItem(itemId: number, percentual: number, quantidadeRealizada: number) {
  const item = await prisma.itemMedicao.update({
    where: { id: itemId },
    data: { percentual, quantidadeRealizada },
    include: { etapa: { include: { obra: true } } },
  });
  revalidatePath(`/obras/${item.etapa.obraId}/medicao`);
  return item;
}

export async function atualizarPrecoItem(itemId: number, precoUnitario: number) {
  const item = await prisma.itemMedicao.update({
    where: { id: itemId },
    data: { precoUnitario },
    include: { etapa: true },
  });
  revalidatePath(`/obras/${item.etapa.obraId}/medicao`);
  return item;
}

export async function adicionarComentario(itemId: number, texto: string, autor: string = "Cliente") {
  const comentario = await prisma.comentarioMedicao.create({
    data: { itemId, texto, autor },
    include: { item: { include: { etapa: { include: { obra: true } } } } },
  });

  const obra = comentario.item.etapa.obra;
  const item = comentario.item;

  const msg = `💬 *Novo Comentário*\n\n🏗 *Obra:* ${obra.nome}\n📋 *Item:* ${item.descricao}\n👤 *Autor:* ${autor}\n\n"${texto}"`;
  await notificarTelegram(msg);

  revalidatePath(`/obras/${obra.id}/medicao`);
  revalidatePath(`/acompanhamento/${obra.tokenMedicaoFisica}`);
  revalidatePath(`/acompanhamento/${obra.tokenMedicaoFinanceira}`);
  
  return comentario;
}

export async function getObraByToken(token: string) {
  return await prisma.obra.findFirst({
    where: {
      OR: [
        { tokenMedicaoFisica: token },
        { tokenMedicaoFinanceira: token },
      ],
    },
    include: {
      etapasMedicao: {
        orderBy: { ordem: "asc" },
        include: {
          itens: {
            orderBy: { ordem: "asc" },
            include: { comentarios: true },
          },
        },
      },
    },
  });
}

export async function renovarTokenMedicao(obraId: number, tipo: 'fisico' | 'financeiro') {
  const { randomUUID } = require('crypto');
  
  const tokenField = tipo === 'fisico' ? 'tokenMedicaoFisica' : 'tokenMedicaoFinanceira';
  
  const obra = await prisma.obra.update({
    where: { id: obraId },
    data: { [tokenField]: randomUUID() },
  });
  
  revalidatePath(`/obras/${obraId}/medicao`);
  return obra;
}
