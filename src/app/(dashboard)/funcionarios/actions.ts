"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

import { unstable_noStore as noStore } from "next/cache";

export async function getFuncionarios() {
  noStore();
  return await prisma.funcionario.findMany({
    orderBy: { nome: "asc" },
  });
}

export async function createFuncionario(data: {
  nome: string;
  cargo?: string | null;
  funcao?: string;
  salarioFixo?: number;
  diariaPadrao: number;
  adicionalMotorista: number;
  pix?: string;
  telefone?: string;
  ativo?: boolean;
  empresa: string;
}) {
  const funcionario = await prisma.funcionario.create({
    data: {
      nome: data.nome,
      cargo: data.cargo || null,
      funcao: data.funcao || "CAMPO",
      salarioFixo: data.salarioFixo || 0,
      diariaPadrao: data.diariaPadrao,
      adicionalMotorista: data.adicionalMotorista,
      pix: data.pix || "",
      telefone: data.telefone || null,
      ativo: data.ativo !== undefined ? data.ativo : true,
      empresa: data.empresa,
    },
  });

  if (data.telefone && data.telefone.trim() !== "") {
    await prisma.contato.create({
      data: {
        nome: data.nome,
        telefone: data.telefone,
        categoria: "EQUIPE",
        empresa: data.empresa,
        funcionarioId: funcionario.id,
      }
    });
  }

  revalidatePath("/funcionarios");
  revalidatePath("/agenda");
  revalidatePath("/ponto");
  revalidatePath("/viagens");
  revalidatePath("/vales");
  revalidatePath("/relatorios");
  return { success: true, data: funcionario };
}

export async function updateFuncionario(
  id: number,
  data: {
    nome: string;
    cargo?: string | null;
    funcao?: string;
    salarioFixo?: number;
    diariaPadrao: number;
    adicionalMotorista: number;
    pix?: string;
    telefone?: string;
    ativo?: boolean;
    empresa: string;
  }
) {
  const funcionario = await prisma.funcionario.update({
    where: { id },
    data: {
      nome: data.nome,
      cargo: data.cargo || null,
      funcao: data.funcao || "CAMPO",
      salarioFixo: data.salarioFixo || 0,
      diariaPadrao: data.diariaPadrao,
      adicionalMotorista: data.adicionalMotorista,
      pix: data.pix || "",
      telefone: data.telefone || null,
      ativo: data.ativo !== undefined ? data.ativo : true,
      empresa: data.empresa,
    },
    include: {
      contato: true,
    }
  });

  if (data.telefone && data.telefone.trim() !== "") {
    if (funcionario.contato) {
      await prisma.contato.update({
        where: { id: funcionario.contato.id },
        data: {
          nome: data.nome,
          telefone: data.telefone,
          empresa: data.empresa,
        }
      });
    } else {
      await prisma.contato.create({
        data: {
          nome: data.nome,
          telefone: data.telefone,
          categoria: "EQUIPE",
          empresa: data.empresa,
          funcionarioId: funcionario.id,
        }
      });
    }
  } else if (funcionario.contato) {
    // Remove contato se telefone for removido
    await prisma.contato.delete({
      where: { id: funcionario.contato.id }
    });
  }

  revalidatePath("/funcionarios");
  revalidatePath("/agenda");
  revalidatePath("/ponto");
  revalidatePath("/viagens");
  revalidatePath("/vales");
  revalidatePath("/relatorios");
  return { success: true, data: funcionario };
}

export async function deleteFuncionario(id: number) {
  try {
    const funcionario = await prisma.funcionario.findUnique({
      where: { id },
      include: { contato: true }
    });
    
    if (funcionario?.contato) {
      await prisma.contato.delete({
        where: { id: funcionario.contato.id }
      });
    }

    await prisma.funcionario.delete({
      where: { id },
    });
    revalidatePath("/funcionarios");
    revalidatePath("/agenda");
    revalidatePath("/ponto");
    revalidatePath("/viagens");
    revalidatePath("/vales");
    revalidatePath("/relatorios");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Não foi possível excluir o funcionário pois existem registros (ponto, viagens ou vales) vinculados a ele." };
  }
}
