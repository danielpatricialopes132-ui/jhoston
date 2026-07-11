"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

const db = prisma as any;

export async function getBoletos() {
  try {
    const boletos = await db.boleto.findMany({
      orderBy: { vencimento: "asc" },
    });
    return { success: true, data: boletos };
  } catch (error: any) {
    console.error("Erro ao buscar boletos:", error);
    return { success: false, error: "Erro ao buscar boletos." };
  }
}

export async function salvarBoleto(data: {
  id?: number;
  vencimento: string; // no formato YYYY-MM-DD
  sacado: string;
  cedente: string;
  valor: number;
  codigoBarras: string;
}) {
  try {
    const payload = {
      vencimento: new Date(data.vencimento),
      sacado: data.sacado.trim(),
      cedente: data.cedente.trim(),
      valor: data.valor,
      codigoBarras: data.codigoBarras.trim(),
    };

    let boleto;
    if (data.id) {
      boleto = await db.boleto.update({
        where: { id: data.id },
        data: payload,
      });
    } else {
      boleto = await db.boleto.create({
        data: payload,
      });
    }

    revalidatePath("/financeiro/boletos");
    revalidatePath("/financeiro");
    revalidatePath("/");
    return { success: true, data: boleto };
  } catch (error: any) {
    console.error("Erro ao salvar boleto:", error);
    return { success: false, error: "Erro ao salvar boleto." };
  }
}

export async function deleteBoleto(id: number) {
  try {
    await db.boleto.delete({
      where: { id },
    });
    revalidatePath("/financeiro/boletos");
    revalidatePath("/financeiro");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao excluir boleto:", error);
    return { success: false, error: "Erro ao excluir boleto." };
  }
}
