"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getObras() {
  return await prisma.obra.findMany({
    include: {
      clientes: true,
      documentos: true,
      procurador: true,
    },
    orderBy: { id: "desc" },
  });
}

export async function createObra(data: {
  nome: string;
  clientIds?: number[];
  procuradorId?: number;
  valorFechado: number;
  endereco?: string;
  status?: string;
  observacoesPermuta?: string;
}) {
  const clientIds = data.clientIds || [];
  
  const clients = await prisma.cliente.findMany({
    where: { id: { in: clientIds } },
  });
  
  const clienteNome = clients.length > 0 
    ? clients.map(c => c.nome).join(", ") 
    : "Sem cliente";

  const obra = await prisma.obra.create({
    data: {
      nome: data.nome,
      clienteNome: clienteNome,
      endereco: data.endereco || "",
      status: data.status || "ATIVA",
      valorFechado: data.valorFechado,
      observacoesPermuta: data.observacoesPermuta || null,
      procuradorId: data.procuradorId || null,
      clientes: {
        connect: clientIds.map(id => ({ id })),
      },
    },
    include: {
      clientes: true,
      procurador: true,
    },
  });
  revalidatePath("/obras");
  revalidatePath("/");
  return { success: true, data: obra };
}

export async function updateObra(
  id: number,
  data: {
    nome: string;
    clientIds?: number[];
    procuradorId?: number;
    valorFechado: number;
    endereco?: string;
    status?: string;
    observacoesPermuta?: string;
  }
) {
  const clientIds = data.clientIds || [];

  const clients = await prisma.cliente.findMany({
    where: { id: { in: clientIds } },
  });
  
  const clienteNome = clients.length > 0 
    ? clients.map(c => c.nome).join(", ") 
    : "Sem cliente";

  const obra = await prisma.obra.update({
    where: { id },
    data: {
      nome: data.nome,
      clienteNome: clienteNome,
      endereco: data.endereco || "",
      status: data.status || "ATIVA",
      valorFechado: data.valorFechado,
      observacoesPermuta: data.observacoesPermuta || null,
      procuradorId: data.procuradorId || null,
      clientes: {
        set: clientIds.map(id => ({ id })),
      },
    },
    include: {
      clientes: true,
      procurador: true,
    },
  });
  revalidatePath("/obras");
  revalidatePath("/");
  return { success: true, data: obra };
}

export async function deleteObra(id: number) {
  try {
    await prisma.obra.delete({
      where: { id },
    });
    revalidatePath("/obras");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Não foi possível excluir a obra pois existem registros (ponto, viagens ou financeiro) vinculados a ela." };
  }
}

export async function addDocumentoObra(data: {
  obraId: number;
  nome: string;
  fileName: string;
  base64Data: string;
}) {
  if (!data.nome.trim()) {
    return { success: false, error: "O nome do documento é obrigatório." };
  }

  try {
    const doc = await prisma.documentoObra.create({
      data: {
        obraId: data.obraId,
        nome: data.nome.trim(),
        fileName: data.fileName,
        base64Data: data.base64Data,
      },
    });

    revalidatePath("/obras");
    return { success: true, data: doc };
  } catch (error) {
    console.error("Erro ao salvar documento da obra:", error);
    return { success: false, error: "Erro ao salvar o documento no banco de dados." };
  }
}

export async function deleteDocumentoObra(id: number) {
  try {
    await prisma.documentoObra.delete({
      where: { id },
    });

    revalidatePath("/obras");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir documento da obra:", error);
    return { success: false, error: "Erro ao excluir o documento." };
  }
}

export async function getAutorizacoesCompra(obraId: number) {
  return await prisma.autorizacaoCompra.findMany({
    where: { obraId },
    include: {
      fornecedor: {
        select: {
          id: true,
          nome: true,
          cnpj: true,
          contato: true,
        },
      },
    },
    orderBy: { id: "desc" },
  });
}

export async function createAutorizacaoCompra(data: {
  obraId: number;
  fornecedorId: number;
  itens: string;
  valorLimite: number;
  observacoes?: string;
}) {
  if (!data.itens.trim()) {
    return { success: false, error: "A descrição dos itens autorizados é obrigatória." };
  }
  if (data.valorLimite < 0) {
    return { success: false, error: "O valor limite não pode ser negativo." };
  }

  try {
    const auth = await prisma.autorizacaoCompra.create({
      data: {
        obraId: data.obraId,
        fornecedorId: data.fornecedorId,
        itens: data.itens.trim(),
        valorLimite: data.valorLimite,
        observacoes: data.observacoes?.trim() || null,
      },
    });

    revalidatePath("/obras");
    return { success: true, data: auth };
  } catch (error) {
    console.error("Erro ao criar autorização de compra:", error);
    return { success: false, error: "Erro ao criar a autorização de compra no banco de dados." };
  }
}

export async function deleteAutorizacaoCompra(id: number) {
  try {
    await prisma.autorizacaoCompra.delete({
      where: { id },
    });

    revalidatePath("/obras");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir autorização de compra:", error);
    return { success: false, error: "Erro ao excluir a autorização de compra." };
  }
}

export async function getAutorizacaoCompra(id: number) {
  return await prisma.autorizacaoCompra.findUnique({
    where: { id },
    include: {
      obra: {
        select: {
          nome: true,
          endereco: true,
          empresa: true,
        },
      },
      fornecedor: {
        select: {
          nome: true,
          cnpj: true,
          telefone: true,
          email: true,
          contato: true,
        },
      },
    },
  });
}

export async function analisarContratoComIA(base64Data: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: "A chave de API do Gemini (GEMINI_API_KEY) não foi encontrada nas variáveis de ambiente (.env). Por favor, adicione-a para habilitar esta funcionalidade.",
    };
  }

  const prompt = "Você é um assistente especialista em analisar contratos de prestação de serviços e construção civil da Jhoston Tec. Analise o documento em PDF anexo e extraia as seguintes informações no formato JSON estrito, sem formatação markdown ou blocos de código (não use ```json ... ```, apenas retorne o texto puro em JSON): { \"obraNome\": \"Nome resumido da obra/projeto\", \"endereco\": \"Endereço da obra ou local da construção\", \"valorFechado\": valor final do contrato como número decimal, \"clientes\": [ { \"nome\": \"Nome completo ou Razão Social\", \"tipo\": \"PF\" ou \"PJ\", \"cpfCnpj\": \"CPF ou CNPJ formatado se disponível\", \"rg\": \"RG se disponível (para PF)\", \"ie\": \"Inscrição Estadual se disponível (para PJ)\", \"contato\": \"Nome do representante/procurador legal (para PJ)\", \"telefone\": \"Telefone de contato se disponível\", \"email\": \"E-mail se disponível\", \"endereco\": \"Endereço completo do cliente se disponível\" } ], \"formaPagamento\": \"Resumo da forma de pagamento, parcelas, prazos, etc\" }";

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: "application/pdf",
                    data: base64Data,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro da API do Gemini:", errorText);
      return { success: false, error: "Falha na chamada da API do Gemini. Verifique a chave de API ou tente novamente." };
    }

    const resJson = await response.json();
    const textContent = resJson.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      return { success: false, error: "O Gemini não retornou nenhuma resposta válida." };
    }

    try {
      const extractedData = JSON.parse(textContent.trim());
      return { success: true, data: extractedData };
    } catch (parseError) {
      console.error("Erro ao parsear JSON do Gemini:", textContent, parseError);
      return { success: false, error: "A resposta da inteligência artificial não veio no formato JSON esperado. Tente novamente." };
    }
  } catch (error) {
    console.error("Erro na análise do contrato:", error);
    return { success: false, error: "Erro interno ao processar a requisição com a IA." };
  }
}

export async function importarObraComContrato(data: {
  nome: string;
  endereco: string;
  valorFechado: number;
  clientes: Array<{
    tipo: string;
    nome: string;
    cpfCnpj?: string;
    rg?: string;
    ie?: string;
    contato?: string;
    telefone?: string;
    email?: string;
    endereco?: string;
  }>;
}) {
  try {
    const clientIds: number[] = [];

    for (const c of data.clientes) {
      if (!c.nome.trim()) continue;

      // Busca se cliente já existe por nome (case-insensitive) ou CPF/CNPJ
      let existingClient = await prisma.cliente.findFirst({
        where: {
          OR: [
            { nome: { equals: c.nome.trim(), mode: "insensitive" } },
            c.cpfCnpj ? { cpfCnpj: c.cpfCnpj.trim() } : undefined
          ].filter(Boolean) as any
        }
      });

      if (!existingClient) {
        existingClient = await prisma.cliente.create({
          data: {
            tipo: c.tipo || "PF",
            nome: c.nome.trim(),
            cpfCnpj: c.cpfCnpj?.trim() || null,
            rg: c.rg?.trim() || null,
            ie: c.ie?.trim() || null,
            contato: c.contato?.trim() || null,
            telefone: c.telefone?.trim() || null,
            email: c.email?.trim() || null,
            endereco: c.endereco?.trim() || null,
          }
        });
      }

      clientIds.push(existingClient.id);
    }

    const res = await createObra({
      nome: data.nome,
      clientIds,
      valorFechado: data.valorFechado,
      endereco: data.endereco,
      status: "ATIVA",
    });

    return res;
  } catch (error) {
    console.error("Erro ao importar obra com contrato:", error);
    return { success: false, error: "Erro ao cadastrar obra e novos clientes." };
  }
}

