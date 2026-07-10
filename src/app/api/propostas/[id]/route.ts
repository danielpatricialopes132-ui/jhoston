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

    // 3. Buscar oportunidade no banco
    const oportunidade = await prisma.oportunidade.findUnique({
      where: { id: opId },
    });

    if (!oportunidade) {
      return new NextResponse("Oportunidade não encontrada no sistema.", { status: 404 });
    }

    // 4. Definir arquivo de template
    const templateName = oportunidade.produto === "SUPER_PREMIUM"
      ? "Proposta_Super_Premium_Template.docx"
      : "Proposta_Premium_Template.docx";

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

    // Cálculos de Proposta
    const precoUnitario = oportunidade.produto === "SUPER_PREMIUM" ? 350.0 : 270.0;
    const valorProduto = oportunidade.areaPiscina * precoUnitario;
    const valorAditivo = oportunidade.areaPiscina * 25.0;
    const valorTotal = valorProduto + valorAditivo;

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
      return `${day} de ${month} de ${year}.`;
    };

    doc.setData({
      clienteNome: oportunidade.clienteNome,
      clienteEndereco: oportunidade.endereco || "Não Informado",
      areaPiscina: formatNumberBR(oportunidade.areaPiscina),
      precoUnitario: formatNumberBR(precoUnitario),
      valorProduto: formatNumberBR(valorProduto),
      valorAditivo: formatNumberBR(valorAditivo),
      valorTotal: formatNumberBR(valorTotal),
      dataProposta: formatDateBR(oportunidade.createdAt),
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

    const docxName = oportunidade.produto === "SUPER_PREMIUM" ? "Super_Premium" : "Premium";
    const filename = `Proposta_${docxName}_${safeClientName}.docx`;

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
