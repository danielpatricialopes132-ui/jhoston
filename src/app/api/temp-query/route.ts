import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const obras = await prisma.obra.findMany();
  const vales = await prisma.vale.findMany();
  const transacoes = await prisma.transacaoFinanceira.findMany({
    where: { categoria: "Vale/Adiantamento" }
  });
  
  return NextResponse.json({ success: true, obras, vales, transacoes });
}
