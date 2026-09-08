"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getFinanceiroData() {
  const [obras, transacoes, fornecedores, planoContas, centrosCusto] = await Promise.all([
    prisma.obra.findMany({ 
      orderBy: { nome: "asc" },
      include: { adendos: true }
    }),
    prisma.transacaoFinanceira.findMany({
      include: {
        obra: true,
        fornecedor: true,
        planoConta: true,
        centroCusto: true,
      },
      orderBy: { dataVencimento: "desc" },
    }),
    prisma.fornecedor.findMany({ orderBy: { nome: "asc" } }),
    prisma.planoConta.findMany({ orderBy: { codigo: "asc" } }),
    prisma.centroCusto.findMany({ orderBy: { nome: "asc" } }),
  ]);

  return { obras, transacoes, fornecedores, planoContas, centrosCusto };
}

export async function salvarTransacao(data: {
  id?: number;
  tipo: "RECEITA" | "DESPESA";
  categoria?: string; // Legado
  planoContaId?: number | null;
  centroCustoId?: number | null;
  obraId?: number | null;
  adendoId?: number | null;
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
    categoria: data.categoria || null,
    planoContaId: data.planoContaId || null,
    centroCustoId: data.centroCustoId || null,
    obraId: data.obraId || null,
    adendoId: data.adendoId || null,
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

export async function salvarEmprestimoIntercompany(data: {
  empresaOrigem: string;
  empresaDestino: string;
  valor: number;
  data: string;
  descricao: string;
}) {
  try {
    const payloadOrigem = {
      tipo: "DESPESA" as const,
      descricao: data.descricao,
      valor: data.valor,
      dataVencimento: new Date(data.data),
      dataPagamento: new Date(data.data),
      status: "PAGO",
      empresa: data.empresaOrigem,
      categoria: "Empréstimo Intercompany"
    };
    const payloadDestino = {
      tipo: "RECEITA" as const,
      descricao: data.descricao,
      valor: data.valor,
      dataVencimento: new Date(data.data),
      dataPagamento: new Date(data.data),
      status: "PAGO",
      empresa: data.empresaDestino,
      categoria: "Empréstimo Intercompany"
    };

    await prisma.$transaction([
      prisma.transacaoFinanceira.create({ data: payloadOrigem }),
      prisma.transacaoFinanceira.create({ data: payloadDestino })
    ]);

    revalidatePath("/financeiro");
    revalidatePath("/relatorios");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao registrar empréstimo intercompany." };
  }
}
