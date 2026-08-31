"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function salvarRascunhoRelatorioFotografico(data: {
  obraId: number;
  relatoEmpresa: string;
  paresFotos: {
    descricao: string;
    fotoAntesBase64: string;
    fotoDepoisBase64: string;
    ordem: number;
  }[];
}) {
  // Check if there is an existing draft
  const draftExistente = await prisma.relatorioFotografico.findFirst({
    where: {
      obraId: data.obraId,
      status: "RASCUNHO",
    },
  });

  if (draftExistente) {
    // Update existing draft
    await prisma.relatorioFotografico.update({
      where: { id: draftExistente.id },
      data: {
        relatoEmpresa: data.relatoEmpresa,
        paresFotos: {
          deleteMany: {}, // Limpa os antigos
          create: data.paresFotos.map((par) => ({
            descricao: par.descricao,
            fotoAntesBase64: par.fotoAntesBase64,
            fotoDepoisBase64: par.fotoDepoisBase64,
            ordem: par.ordem,
          })),
        },
      },
    });
    return { success: true, relatorioId: draftExistente.id };
  } else {
    // Create new draft
    const novoDraft = await prisma.relatorioFotografico.create({
      data: {
        obraId: data.obraId,
        relatoEmpresa: data.relatoEmpresa,
        status: "RASCUNHO",
        paresFotos: {
          create: data.paresFotos.map((par) => ({
            descricao: par.descricao,
            fotoAntesBase64: par.fotoAntesBase64,
            fotoDepoisBase64: par.fotoDepoisBase64,
            ordem: par.ordem,
          })),
        },
      },
    });
    return { success: true, relatorioId: novoDraft.id };
  }
}

export async function finalizarRelatorioFotografico(relatorioId: number) {
  const relatorio = await prisma.relatorioFotografico.update({
    where: { id: relatorioId },
    data: { status: "FINALIZADO" },
  });

  revalidatePath(`/obras/${relatorio.obraId}/avanco-fotografico`);
  return { success: true, relatorio };
}

export async function getRascunhoAtual(obraId: number) {
  return await prisma.relatorioFotografico.findFirst({
    where: {
      obraId,
      status: "RASCUNHO",
    },
    include: {
      paresFotos: {
        orderBy: { ordem: "asc" },
      },
    },
  });
}

export async function getRelatoriosFinalizados(obraId: number) {
  return await prisma.relatorioFotografico.findMany({
    where: {
      obraId,
      status: "FINALIZADO",
    },
    include: {
      paresFotos: {
        orderBy: { ordem: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Opcional: Buscar fotos do diário de obra para poder importar
export async function buscarFotosDoDiario(obraId: number) {
  return await prisma.diarioObraFoto.findMany({
    where: {
      diarioObra: {
        obraId,
      },
    },
    select: {
      id: true,
      base64Data: true,
      createdAt: true,
      diarioObra: {
        select: {
          data: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
