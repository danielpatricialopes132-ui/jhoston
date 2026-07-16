import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/app/login/actions";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import AdmZip from "adm-zip";
import { numeroParaExtenso } from "@/lib/extenso";

// Auxiliar para gerar o buffer de qualquer proposta baseada em template
function generateProposalDoc(oportunidade: any, templateName: string, config: {
  areaPiscina?: number;
  precoUnitario?: number;
  precoAditivo?: number;
  valorInsumos?: number;
  valorEstadia?: number;
  imposto?: number;
  desconto?: number;
  prazoAplicacao?: number;
  hasAditivo?: boolean;
}) {
  const templatePath = path.join(process.cwd(), "src", "templates", templateName);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template não encontrado: ${templateName}`);
  }

  const fileContent = fs.readFileSync(templatePath);
  const zip = new PizZip(fileContent);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  // Extrair valores de configuração com fallbacks coerentes
  const area = config.areaPiscina ?? oportunidade.areaPiscina;
  const pUnit = config.precoUnitario !== undefined ? config.precoUnitario : (oportunidade.precoUnitario ?? 270);
  const pAdit = config.precoAditivo !== undefined ? config.precoAditivo : (oportunidade.precoAditivo ?? 25);
  const valInsumos = config.valorInsumos !== undefined ? config.valorInsumos : (oportunidade.valorInsumos ?? 0);
  const valEstadia = config.valorEstadia !== undefined ? config.valorEstadia : (oportunidade.valorEstadia ?? 0);
  const valImposto = config.imposto !== undefined ? config.imposto : (oportunidade.imposto ?? 0);
  const valDesconto = config.desconto !== undefined ? config.desconto : (oportunidade.desconto ?? 0);
  const prazo = config.prazoAplicacao !== undefined ? config.prazoAplicacao : (oportunidade.prazoAplicacao ?? 15);

  const valorProduto = area * pUnit;
  const valorAditivo = area * pAdit;
  const subTotal = valorProduto + valInsumos + valEstadia;

  let valorTotal = 0;
  if (templateName === "Proposta_Revest_Template.docx") {
    const hasAdit = config.hasAditivo !== undefined ? config.hasAditivo : (oportunidade.produto === "REVESTIMENTO" && pAdit > 0);
    valorTotal = subTotal + (hasAdit ? valorAditivo : 0) + valImposto - valDesconto;
  } else {
    // Pools e Cascata
    valorTotal = valorProduto + valorAditivo;
  }

  const valorEntrada = templateName === "Proposta_Cascata_Template.docx" ? valorTotal * 0.5 : valorTotal * 0.5;
  const valorIntermediaria = templateName === "Proposta_Cascata_Template.docx" ? valorTotal * 0.3 : 0;
  const valorFinal = templateName === "Proposta_Cascata_Template.docx" ? valorTotal * 0.2 : valorTotal * 0.5;

  // Formatadores de Moeda e Data BR
  const formatNumberBR = (num: number) => {
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDateBR = (date: Date) => {
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const d = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} de ${month} de ${year}`;
  };

  // Contas Bancárias padrão por marca
  let bancoNome = "Nú Bank";
  let bancoAgencia = "0001";
  let bancoConta = "26970695-2";
  let bancoTitular = "Jhoston Revest";
  let bancoPix = "44.038.228/0001-46";

  if (templateName === "Proposta_Revest_Template.docx") {
    if (oportunidade.contaBancaria) {
      bancoNome = oportunidade.contaBancaria.banco || "";
      bancoAgencia = oportunidade.contaBancaria.agencia || "";
      bancoConta = oportunidade.contaBancaria.conta || "";
      bancoTitular = oportunidade.contaBancaria.titular || "";
      bancoPix = oportunidade.contaBancaria.chavePix || "";
    }
  } else {
    // Pools padrao
    bancoNome = "C6 S.A. (336)";
    bancoAgencia = "0001";
    bancoConta = "39936999-6";
    bancoTitular = "JHOSTON POOLS";
    bancoPix = "63.013.022/0001-06";
  }

  // Preparações para Cascata Eco Stone
  const valorCascata = pUnit * 0.75;
  const valorPedras = pUnit * 0.25;

  doc.setData({
    id: oportunidade.id,
    propostaId: oportunidade.id,
    propostaNumero: String(oportunidade.id).padStart(4, "0") + "/2026",
    clienteNome: oportunidade.clienteNome,
    clienteEndereco: oportunidade.endereco || "Não Informado",
    areaPiscina: formatNumberBR(area),
    precoUnitario: formatNumberBR(pUnit),
    precoAditivo: formatNumberBR(pAdit),
    descontoAditivo: "-",
    valorProduto: formatNumberBR(valorProduto),
    valorAditivo: formatNumberBR(valorAditivo),
    valorTotal: formatNumberBR(valorTotal),
    valorTotalExtenso: numeroParaExtenso(valorTotal),
    valorEntrada: formatNumberBR(valorEntrada),
    valorIntermediaria: formatNumberBR(valorIntermediaria),
    valorFinal: formatNumberBR(valorFinal),
    dataProposta: formatDateBR(oportunidade.createdAt),

    // Campos Jhoston Revest
    descricaoServico: oportunidade.descricaoServico || "Aplicação de revestimento resinado Verano Pools",
    valorInsumos: formatNumberBR(valInsumos),
    valorEstadia: formatNumberBR(valEstadia),
    imposto: formatNumberBR(valImposto),
    desconto: formatNumberBR(valDesconto),
    subTotal: formatNumberBR(subTotal),
    prazoAplicacao: String(prazo),
    hasAditivo: config.hasAditivo !== undefined ? config.hasAditivo : (oportunidade.produto === "REVESTIMENTO" && pAdit > 0),

    // Campos Eco Stone
    valorCascata: formatNumberBR(valorCascata),
    valorPedras: formatNumberBR(valorPedras),
    valorMateriais: formatNumberBR(valorAditivo),

    // Dados Bancários
    bancoNome,
    bancoAgencia,
    bancoConta,
    bancoTitular,
    bancoPix,
  });

  doc.render();

  return doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Validar autenticação do usuário
    const session = await getSession();
    if (!session || (session.userRole !== "MASTER" && session.userRole !== "ESCRITORIO")) {
      return new NextResponse("Acesso não autorizado.", { status: 401 });
    }

    // 2. Extrair parâmetros do ID
    const { id } = await props.params;
    const opId = parseInt(id, 10);
    if (isNaN(opId)) {
      return new NextResponse("ID de proposta inválido.", { status: 400 });
    }

    // 3. Buscar oportunidade no banco
    const oportunidade = (await prisma.oportunidade.findUnique({
      where: { id: opId },
      include: { contaBancaria: true },
    })) as any;

    if (!oportunidade) {
      return new NextResponse("Oportunidade não encontrada no sistema.", { status: 404 });
    }

    // Verificar se o usuário solicitou o download em lote (ZIP)
    const url = new URL(request.url);
    const isBundle = url.searchParams.get("bundle") === "true";

    // Sanitizar nome do cliente para o nome do arquivo
    const safeClientName = oportunidade.clienteNome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove acentos
      .replace(/[^a-zA-Z0-9\s]/g, "") // remove caracteres especiais
      .replace(/\s+/g, "_"); // substitui espaços por underscores

    if (isBundle && (oportunidade.produto === "PREMIUM" || oportunidade.produto === "SUPER_PREMIUM")) {
      // GERAÇÃO DO PACOTE COMPLETO (ZIP COM 3 PROPOSTAS)
      
      // Documento 1: Jhoston Pools (Premium ou Super Premium)
      const poolsTemplate = oportunidade.produto === "SUPER_PREMIUM" 
        ? "Proposta_Super_Premium_Template.docx" 
        : "Proposta_Premium_Template.docx";
      const poolsBuffer = generateProposalDoc(oportunidade, poolsTemplate, {});

      // Documento 2: Jhoston Revest (Orçamento Modelo)
      const revestBuffer = generateProposalDoc(oportunidade, "Proposta_Revest_Template.docx", {
        precoUnitario: 120.0,
        precoAditivo: 0.0,
        valorInsumos: oportunidade.valorInsumos || 1640.0,
        valorEstadia: oportunidade.valorEstadia || 6200.0,
        hasAditivo: false, // 3 linhas para orçamento padrão como no Vivant/Kahakai
      });

      // Documento 3: Eco Stone (Proposta de Cascata)
      const ecoStoneBuffer = generateProposalDoc(oportunidade, "Proposta_Cascata_Template.docx", {
        precoUnitario: 18000.0,
        precoAditivo: 5000.0,
      });

      // Criar o ZIP
      const zip = new AdmZip();
      zip.addFile(`PROP-${oportunidade.id}_Jhoston_Pools.docx`, poolsBuffer);
      zip.addFile(`PROP-${oportunidade.id}_Jhoston_Revest.docx`, revestBuffer);
      zip.addFile(`PROP-${oportunidade.id}_Eco_Stone.docx`, ecoStoneBuffer);
      
      const zipBuffer = zip.toBuffer();
      const filename = `PROP-${oportunidade.id}_PACOTE_${safeClientName}.zip`;

      return new NextResponse(zipBuffer as any, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // GERAÇÃO INDIVIDUAL COM OVERRIDE DE EMPRESA
    const company = url.searchParams.get("company");
    let templateName = "Proposta_Premium_Template.docx";
    let docConfig = {};
    let filename = "";

    if (company === "revest" || (oportunidade.produto === "REVESTIMENTO" && !company)) {
      templateName = "Proposta_Revest_Template.docx";
      if (oportunidade.produto !== "REVESTIMENTO") {
        docConfig = {
          precoUnitario: 120.0,
          precoAditivo: 0.0,
          valorInsumos: oportunidade.valorInsumos || 1640.0,
          valorEstadia: oportunidade.valorEstadia || 6200.0,
          hasAditivo: false,
        };
      }
      filename = `PROP-${oportunidade.id}_Jhoston_Revest_${safeClientName}.docx`;
    } else if (company === "ecostone" || (oportunidade.produto === "CASCATA" && !company)) {
      templateName = "Proposta_Cascata_Template.docx";
      if (oportunidade.produto !== "CASCATA") {
        docConfig = {
          precoUnitario: 18000.0,
          precoAditivo: 5000.0,
        };
      }
      filename = `PROP-${oportunidade.id}_Eco_Stone_${safeClientName}.docx`;
    } else {
      templateName = oportunidade.produto === "SUPER_PREMIUM"
        ? "Proposta_Super_Premium_Template.docx"
        : "Proposta_Premium_Template.docx";
      filename = `PROP-${oportunidade.id}_Jhoston_Pools_${safeClientName}.docx`;
    }

    const buffer = generateProposalDoc(oportunidade, templateName, docConfig);

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (err: any) {
    console.error("Erro na geração do arquivo da proposta comercial:", err);
    return new NextResponse("Erro interno no servidor ao gerar arquivo da proposta.", { status: 500 });
  }
}
