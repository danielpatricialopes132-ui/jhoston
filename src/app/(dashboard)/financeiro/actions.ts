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
  funcionarioId?: number | null;
  valesDescontadosIds?: number[];
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

  // Se for uma despesa vinculada a um funcionário, preenchemos o clienteFornecedor com o nome do funcionário
  if (data.tipo === "DESPESA" && data.funcionarioId) {
    const funcionario = await prisma.funcionario.findUnique({
      where: { id: data.funcionarioId },
    });
    if (funcionario) {
      clienteFornecedor = funcionario.nome;
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
    funcionarioId: data.funcionarioId || null,
    empresa: data.empresa || "JHOSTON",
  };

  let transacao;
  
  // Utiliza $transaction para garantir atomicidade se houver vales sendo descontados
  transacao = await prisma.$transaction(async (tx) => {
    // 1. Calcula o desconto dos vales antes de salvar a transação (se o usuário escolheu Valor Bruto)
    if (data.valesDescontadosIds && data.valesDescontadosIds.length > 0 && data.descontoAutomatico !== false) {
      const vales = await tx.vale.findMany({
        where: { id: { in: data.valesDescontadosIds } }
      });
      const totalDesconto = vales.reduce((acc: number, v: any) => acc + v.valor, 0);
      payload.valor = Math.max(0, payload.valor - totalDesconto);
    }

    let t;
    if (data.id) {
      t = await tx.transacaoFinanceira.update({
        where: { id: data.id },
        data: payload,
      });
    } else {
      t = await tx.transacaoFinanceira.create({
        data: payload,
      });
    }

    // 2. Atualiza os vales como descontados
    if (data.valesDescontadosIds && data.valesDescontadosIds.length > 0) {
      await tx.vale.updateMany({
        where: { id: { in: data.valesDescontadosIds } },
        data: { statusDesconto: "DESCONTADO" },
      });
    }
    
    return t;
  });

  revalidatePath("/financeiro");
  revalidatePath("/relatorios");
  revalidatePath("/fornecedores");
  revalidatePath("/vales");
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
