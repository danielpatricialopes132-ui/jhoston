"use server"

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function getRelatoriosObra(obraId: number) {
  return await prisma.relatorioProgresso.findMany({
    where: { obraId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRelatorio(relatorioId: number) {
  return await prisma.relatorioProgresso.findUnique({
    where: { id: relatorioId },
    include: {
      obra: true,
      secoes: {
        orderBy: { ordem: "asc" },
        include: {
          fotos: true,
        },
      },
    },
  });
}

export async function criarRelatorio(obraId: number, mesReferencia: string) {
  const relatorio = await prisma.relatorioProgresso.create({
    data: {
      obraId,
      mesReferencia,
      relatoEngenheiro: "",
    },
  });
  
  revalidatePath(`/obras/${obraId}/relatorios`);
  return relatorio;
}

export async function atualizarRelatoEngenheiro(relatorioId: number, relatoEngenheiro: string, mesReferencia: string) {
  const relatorio = await prisma.relatorioProgresso.update({
    where: { id: relatorioId },
    data: { relatoEngenheiro, mesReferencia },
  });
  
  revalidatePath(`/obras/${relatorio.obraId}/relatorios/${relatorioId}`);
  return relatorio;
}

export async function criarSecao(relatorioId: number, titulo: string, tipo: "FOTOS" | "ANTES_DEPOIS", ordem: number) {
  const secao = await prisma.secaoRelatorio.create({
    data: {
      relatorioId,
      titulo,
      tipo,
      ordem,
    },
  });
  
  const relatorio = await prisma.relatorioProgresso.findUnique({ where: { id: relatorioId }});
  if (relatorio) {
    revalidatePath(`/obras/${relatorio.obraId}/relatorios/${relatorioId}`);
  }
  return secao;
}

export async function deletarSecao(secaoId: number) {
  const secao = await prisma.secaoRelatorio.delete({
    where: { id: secaoId },
    include: { relatorio: true },
  });
  
  revalidatePath(`/obras/${secao.relatorio.obraId}/relatorios/${secao.relatorioId}`);
  return secao;
}

export async function adicionarFoto(secaoId: number, base64Data: string, dataFoto?: string, tipoEvolucao?: "ANTES" | "DEPOIS") {
  const foto = await prisma.fotoRelatorio.create({
    data: {
      secaoId,
      base64Data,
      dataFoto: dataFoto || undefined,
      tipoEvolucao: tipoEvolucao || undefined,
    },
    include: { secao: { include: { relatorio: true } } },
  });
  
  revalidatePath(`/obras/${foto.secao.relatorio.obraId}/relatorios/${foto.secao.relatorioId}`);
  return foto;
}

export async function deletarFoto(fotoId: number) {
  const foto = await prisma.fotoRelatorio.delete({
    where: { id: fotoId },
    include: { secao: { include: { relatorio: true } } },
  });
  
  revalidatePath(`/obras/${foto.secao.relatorio.obraId}/relatorios/${foto.secao.relatorioId}`);
  return foto;
}

export async function buscarFotosDiario(obraId: number) {
  const diarios = await prisma.diarioObra.findMany({
    where: { obraId },
    include: { fotos: true },
    orderBy: { data: "desc" },
    take: 30,
  });
  
  return diarios.flatMap((d) => d.fotos.map((f) => ({ ...f, dataDiario: d.data })));
}
