import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/app/login/actions";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

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

    // 2. Extrair parâmetros da URL
    const { id } = await props.params;
    const opId = parseInt(id, 10);
    if (isNaN(opId)) {
      return new NextResponse("ID de proposta inválido.", { status: 400 });
    }

    // 3. Buscar oportunidade no banco com relação à conta bancária
    const oportunidade = (await prisma.oportunidade.findUnique({
      where: { id: opId },
      include: { contaBancaria: true },
    })) as any;

    if (!oportunidade) {
      return new NextResponse("Oportunidade não encontrada no sistema.", { status: 404 });
    }

    // 4. Definir arquivo de template
    let templateName = "Proposta_Premium_Template.docx";
    if (oportunidade.produto === "SUPER_PREMIUM") {
      templateName = "Proposta_Super_Premium_Template.docx";
    } else if (oportunidade.produto === "CASCATA") {
      templateName = "Proposta_Cascata_Template.docx";
    } else if (oportunidade.produto === "REVESTIMENTO" || oportunidade.empresa === "JHOSTON_REVEST") {
      templateName = "Proposta_Revest_Template.docx";
    }

    const templatePath = path.join(process.cwd(), "src", "templates", templateName);

    if (!fs.existsSync(templatePath)) {
      return new NextResponse(`Template de proposta não encontrado em: ${templatePath}`, { status: 500 });
    }

    // 5. Carregar e preencher template
    const fileContent = fs.readFileSync(templatePath);
    const zip = new PizZip(fileContent);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Cálculos de Proposta com valores customizados (com fallbacks para retrocompatibilidade)
    const precoUnitario = oportunidade.precoUnitario !== null && oportunidade.precoUnitario !== undefined
      ? oportunidade.precoUnitario
      : (oportunidade.produto === "CASCATA" ? 18000.0 : (oportunidade.produto === "SUPER_PREMIUM" ? 350.0 : (oportunidade.produto === "REVESTIMENTO" ? 120.0 : 270.0)));
    
    const precoAditivo = oportunidade.precoAditivo !== null && oportunidade.precoAditivo !== undefined
      ? oportunidade.precoAditivo
      : (oportunidade.produto === "CASCATA" ? 5000.0 : (oportunidade.produto === "REVESTIMENTO" ? 0.0 : 25.0));

    const valorProduto = oportunidade.areaPiscina * precoUnitario;
    const valorAditivo = oportunidade.areaPiscina * precoAditivo;

    // Variáveis para Jhoston Revest
    const valInsumos = oportunidade.valorInsumos ?? 0;
    const valEstadia = oportunidade.valorEstadia ?? 0;
    const valImposto = oportunidade.imposto ?? 0;
    const valDesconto = oportunidade.desconto ?? 0;
    const subTotal = valorProduto + valInsumos + valEstadia;

    const valorTotal = oportunidade.produto === "REVESTIMENTO"
      ? subTotal + valImposto - valDesconto
      : valorProduto + valorAditivo;

    const valorEntrada = oportunidade.produto === "REVESTIMENTO" ? valorTotal * 0.5 : valorTotal * 0.5;
    const valorIntermediaria = oportunidade.produto === "REVESTIMENTO" ? 0 : valorTotal * 0.3;
    const valorFinal = oportunidade.produto === "REVESTIMENTO" ? valorTotal * 0.5 : valorTotal * 0.2;

    // Conta Bancária
    let bancoNome = "Nú Bank";
    let bancoAgencia = "0001";
    let bancoConta = "26970695-2";
    let bancoTitular = "Jhoston Revest";
    let bancoPix = "44.038.228/0001-46";

    if (oportunidade.contaBancaria) {
      bancoNome = oportunidade.contaBancaria.banco || "";
      bancoAgencia = oportunidade.contaBancaria.agencia || "";
      bancoConta = oportunidade.contaBancaria.conta || "";
      bancoTitular = oportunidade.contaBancaria.titular || "";
      bancoPix = oportunidade.contaBancaria.chavePix || "";
    } else if (oportunidade.empresa === "JHOSTON" || oportunidade.produto === "PREMIUM" || oportunidade.produto === "SUPER_PREMIUM") {
      bancoNome = "C6 S.A. (336)";
      bancoAgencia = "0001";
      bancoConta = "39936999-6";
      bancoTitular = "JHOSTON POOLS";
      bancoPix = "63.013.022/0001-06";
    }

    // Formatadores BR
    const formatNumberBR = (num: number) => {
      return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatDateBR = (date: Date) => {
      const months = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
      ];
      // Ajustar timezone para exibir data local correta
      const d = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
      const day = String(d.getDate()).padStart(2, '0');
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day} de ${month} de ${year}`;
    };

    doc.setData({
      id: oportunidade.id,
      propostaId: oportunidade.id,
      propostaNumero: String(oportunidade.id).padStart(4, "0") + "/2026",
      clienteNome: oportunidade.clienteNome,
      clienteEndereco: oportunidade.endereco || "Não Informado",
      areaPiscina: formatNumberBR(oportunidade.areaPiscina),
      precoUnitario: formatNumberBR(precoUnitario),
      precoAditivo: formatNumberBR(precoAditivo),
      valorProduto: formatNumberBR(valorProduto),
      valorAditivo: formatNumberBR(valorAditivo),
      valorTotal: formatNumberBR(valorTotal),
      valorEntrada: formatNumberBR(valorEntrada),
      valorIntermediaria: formatNumberBR(valorIntermediaria),
      valorFinal: formatNumberBR(valorFinal),
      dataProposta: formatDateBR(oportunidade.createdAt),

      // Novos campos Jhoston Revest
      descricaoServico: oportunidade.descricaoServico || "Aplicação de revestimento resinado Verano Pools",
      valorInsumos: formatNumberBR(valInsumos),
      valorEstadia: formatNumberBR(valEstadia),
      imposto: formatNumberBR(valImposto),
      desconto: formatNumberBR(valDesconto),
      subTotal: formatNumberBR(subTotal),
      prazoAplicacao: String(oportunidade.prazoAplicacao ?? 15),

      // Conta Bancária
      bancoNome,
      bancoAgencia,
      bancoConta,
      bancoTitular,
      bancoPix,
    });

    doc.render();

    const buffer = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

    // Sanitizar nome do arquivo de download
    const safeClientName = oportunidade.clienteNome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove acentos
      .replace(/[^a-zA-Z0-9\s]/g, "") // remove caracteres especiais
      .replace(/\s+/g, "_"); // substitui espaços por underscores

    const filename = `PROP-${oportunidade.id}_${safeClientName}.docx`;

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
