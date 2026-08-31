import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request, props: { params: Promise<{ relatorioId: string }> }) {
  const params = await props.params;
  const relatorioId = parseInt(params.relatorioId);
  
  if (isNaN(relatorioId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const relatorio = await prisma.relatorioProgresso.findUnique({
    where: { id: relatorioId },
    include: {
      obra: true,
      secoes: {
        orderBy: { ordem: "asc" },
        include: {
          fotos: true,
        },
      },
    },
  });

  if (!relatorio) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(relatorio);
}
