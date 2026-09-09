"use server"

import { prisma } from "@/lib/db"
import { getSession } from "@/app/login/actions"
import { revalidatePath } from "next/cache"

// ==========================================
// CONTATOS (Agenda)
// ==========================================

export async function getContatos() {
  const session = await getSession()
  if (!session) throw new Error("Não autorizado")

  const where = session.userRole === "MASTER" ? {} : { empresa: session.userEmpresa }

  return await prisma.contato.findMany({
    where,
    orderBy: { nome: 'asc' }
  })
}

export async function salvarContato(data: { id?: number, nome: string, telefone: string, categoria: string }) {
  const session = await getSession()
  if (!session) throw new Error("Não autorizado")

  const empresa = session.userEmpresa || "JHOSTON"

  if (data.id) {
    const contato = await prisma.contato.update({
      where: { id: data.id },
      data: {
        nome: data.nome,
        telefone: data.telefone,
        categoria: data.categoria
      }
    })
    revalidatePath("/agenda")
    return contato
  } else {
    const contato = await prisma.contato.create({
      data: {
        nome: data.nome,
        telefone: data.telefone,
        categoria: data.categoria,
        empresa
      }
    })
    revalidatePath("/agenda")
    return contato
  }
}

export async function deletarContato(id: number) {
  const session = await getSession()
  if (!session) throw new Error("Não autorizado")

  await prisma.contato.delete({
    where: { id }
  })
  revalidatePath("/agenda")
}

// ==========================================
// COMPROMISSOS
// ==========================================

export async function getCompromissos() {
  const session = await getSession()
  if (!session) throw new Error("Não autorizado")

  const where = session.userRole === "MASTER" ? {} : { empresa: session.userEmpresa }

  return await prisma.compromisso.findMany({
    where,
    include: { contato: true },
    orderBy: { dataHora: 'asc' }
  })
}

export async function salvarCompromisso(data: { id?: number, titulo: string, descricao?: string, dataHora: Date, contatoId?: number, status?: string }) {
  const session = await getSession()
  if (!session) throw new Error("Não autorizado")

  const empresa = session.userEmpresa || "JHOSTON"

  if (data.id) {
    const comp = await prisma.compromisso.update({
      where: { id: data.id },
      data: {
        titulo: data.titulo,
        descricao: data.descricao,
        dataHora: data.dataHora,
        contatoId: data.contatoId,
        status: data.status
      }
    })
    revalidatePath("/agenda")
    return comp
  } else {
    const comp = await prisma.compromisso.create({
      data: {
        titulo: data.titulo,
        descricao: data.descricao,
        dataHora: data.dataHora,
        contatoId: data.contatoId,
        status: data.status || "PENDENTE",
        empresa
      }
    })
    revalidatePath("/agenda")
    return comp
  }
}

export async function deletarCompromisso(id: number) {
  const session = await getSession()
  if (!session) throw new Error("Não autorizado")

  await prisma.compromisso.delete({
    where: { id }
  })
  revalidatePath("/agenda")
}

import { sendWhatsAppText } from '@/lib/whatsapp';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export async function notificarCompromisso(id: number) {
  const session = await getSession();
  if (!session) throw new Error('Não autorizado');

  const comp = await prisma.compromisso.findUnique({
    where: { id },
    include: { contato: true }
  });

  if (!comp || !comp.contato) throw new Error('Compromisso ou contato não encontrado');

  const dateStr = format(new Date(comp.dataHora), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
  
  const text = `*Lembrete de Compromisso:*\n\n📌 *${comp.titulo}*\n📅 Data: ${dateStr}\n\n${comp.descricao ? `Detalhes: ${comp.descricao}\n\n` : ''}Equipe ${comp.empresa}`;

  await sendWhatsAppText({
    number: comp.contato.telefone,
    text: text
  });
}

