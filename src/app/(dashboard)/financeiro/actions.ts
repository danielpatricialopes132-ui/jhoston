"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getFinanceiroData() {
  const [obras, transacoes, fornecedores] = await Promise.all([
    prisma.obra.findMany({ orderBy: { nome: "asc" } }),
    prisma.transacaoFinanceira.findMany({
      include: {
        obra: true,
        fornecedor: true,
      },
      orderBy: { dataVencimento: "desc" },
    }),
    prisma.fornecedor.findMany({ orderBy: { nome: "asc" } }),
  ]);

  return { obras, transacoes, fornecedores };
}

export async function salvarTransacao(data: {
  id?: number;
  tipo: "RECEITA" | "DESPESA";
  categoria: string;
  obraId?: number | null;
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string | null;
  status: string;
  clienteFornecedor?: string;
  fornecedorId?: number | null;
  empresa?: string;
}) {
  let clienteFornecedor = data.clienteFornecedor || "";

  // Se for uma despesa vinculada a um fornecedor cadastrado, preenchemos o clienteFornecedor automaticamente com o nome do fornecedor
  if (data.tipo === "DESPESA" && data.fornecedorId) {
    const fornecedor = await prisma.fornecedor.findUnique({
      where: { id: data.fornecedorId },
    });
    if (fornecedor) {
      clienteFornecedor = fornecedor.nome;
    }
  }

  const payload = {
    tipo: data.tipo,
    categoria: data.categoria,
    obraId: data.obraId || null,
    descricao: data.descricao,
    valor: data.valor,
    dataVencimento: new Date(data.dataVencimento),
    dataPagamento: data.dataPagamento ? new Date(data.dataPagamento) : null,
    status: data.status,
    clienteFornecedor: clienteFornecedor,
    fornecedorId: data.fornecedorId || null,
    empresa: data.empresa || "JHOSTON",
  };

  let transacao;
  if (data.id) {
    transacao = await prisma.transacaoFinanceira.update({
      where: { id: data.id },
      data: payload,
    });
  } else {
    transacao = await prisma.transacaoFinanceira.create({
      data: payload,
    });
  }

  revalidatePath("/financeiro");
  revalidatePath("/relatorios");
  revalidatePath("/fornecedores");
  revalidatePath("/");
  return { success: true, data: transacao };
}

export async function deleteTransacao(id: number) {
  try {
    await prisma.transacaoFinanceira.delete({
      where: { id },
    });
    revalidatePath("/financeiro");
    revalidatePath("/relatorios");
    revalidatePath("/fornecedores");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao excluir transação." };
  }
}

export async function alterarStatusTransacao(
  id: number,
  status: "PENDENTE" | "PAGO",
  dataPagamentoStr?: string | null
) {
  const transacao = await prisma.transacaoFinanceira.update({
    where: { id },
    data: {
      status,
      dataPagamento: status === "PAGO" ? (dataPagamentoStr ? new Date(dataPagamentoStr) : new Date()) : null,
    },
  });
  revalidatePath("/financeiro");
  revalidatePath("/relatorios");
  revalidatePath("/fornecedores");
  revalidatePath("/");
  return { success: true, data: transacao };
}

export async function salvarTransferenciaIntercompany(data: {
  origem: "JHOSTON" | "ECO_STONE";
  destino: "JHOSTON" | "ECO_STONE";
  valor: number;
  dataVencimento: string;
  descricao: string;
}) {
  if (data.origem === data.destino) {
    return { success: false, error: "As empresas de origem e destino devem ser diferentes." };
  }
  if (data.valor <= 0) {
    return { success: false, error: "O valor da transferência deve ser maior que zero." };
  }

  const dataTransacao = new Date(data.dataVencimento);

  try {
    await prisma.$transaction([
      // 1. Despesa na empresa de origem (saída de caixa)
      prisma.transacaoFinanceira.create({
        data: {
          tipo: "DESPESA",
          categoria: "Empréstimo Intercompany",
          descricao: `[Transferência para ${data.destino === "JHOSTON" ? "Jhoston Pools" : "Eco Stone"}] ${data.descricao}`,
          valor: data.valor,
          dataVencimento: dataTransacao,
          dataPagamento: dataTransacao,
          status: "PAGO",
          empresa: data.origem,
          clienteFornecedor: data.destino === "JHOSTON" ? "JHOSTON POOLS" : "ECO STONE",
        },
      }),
      // 2. Receita na empresa de destino (entrada de caixa)
      prisma.transacaoFinanceira.create({
        data: {
          tipo: "RECEITA",
          categoria: "Empréstimo Intercompany",
          descricao: `[Transferência de ${data.origem === "JHOSTON" ? "Jhoston Pools" : "Eco Stone"}] ${data.descricao}`,
          valor: data.valor,
          dataVencimento: dataTransacao,
          dataPagamento: dataTransacao,
          status: "PAGO",
          empresa: data.destino,
          clienteFornecedor: data.origem === "JHOSTON" ? "JHOSTON POOLS" : "ECO STONE",
        },
      }),
    ]);

    revalidatePath("/financeiro");
    revalidatePath("/relatorios");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Erro na transferência intercompany:", error);
    return { success: false, error: "Erro ao registrar transferência no banco de dados." };
  }
}
