import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/app/login/actions";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // 1. Verificar autenticação
    let authorized = false;

    // A. Verificar por Token na Query
    const token = request.nextUrl.searchParams.get("token");
    const expectedToken = process.env.WATCH_API_TOKEN || "JhostonTecWatchKey2026";
    
    if (token === expectedToken) {
      authorized = true;
    }

    // B. Se não bateu o token, tentar por sessão do navegador (cookies)
    if (!authorized) {
      const session = await getSession();
      if (session && (session.userRole === "MASTER" || session.userRole === "ESCRITORIO")) {
        authorized = true;
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    // 2. Coletar dados
    const [
      obrasAtivasCount,
      funcionariosCount,
      pontosPendentes,
      resetsPendentes,
      usuariosNovos,
      transacoesPagas,
      despesasPendentes,
    ] = await Promise.all([
      prisma.obra.count({ where: { status: "ATIVA" } }),
      prisma.funcionario.count({ where: { ativo: true } }),
      prisma.registroPonto.count({ where: { statusAprovacao: "PENDENTE" } }),
      prisma.usuario.count({ where: { statusReset: "SOLICITADO" } }),
      prisma.usuario.count({ where: { role: "CAMPO", usuario: { not: "@campo" } } }),
      prisma.transacaoFinanceira.findMany({ where: { status: "PAGO" } }),
      prisma.transacaoFinanceira.findMany({ where: { tipo: "DESPESA", status: "PENDENTE" } }),
    ]);

    // 3. Calcular Saldo de Caixa
    const receitasPagas = transacoesPagas
      .filter((t) => t.tipo === "RECEITA")
      .reduce((acc, t) => acc + t.valor, 0);

    const despesasPagas = transacoesPagas
      .filter((t) => t.tipo === "DESPESA")
      .reduce((acc, t) => acc + t.valor, 0);

    const saldoCaixa = receitasPagas - despesasPagas;

    // 4. Calcular vencimento de contas a pagar
    const now = new Date();
    const brOffset = -3;
    const brTime = new Date(now.getTime() + brOffset * 60 * 60 * 1000);
    const hojeStr = brTime.toISOString().split("T")[0];
    const hojeDate = new Date(hojeStr);

    let contasHojeCount = 0;
    let contasHojeValor = 0;
    let contas1DiaCount = 0;
    let contas1DiaValor = 0;
    let contas3DiasCount = 0;
    let contas3DiasValor = 0;
    let contas5DiasCount = 0;
    let contas5DiasValor = 0;

    despesasPendentes.forEach((t) => {
      const vencStr = t.dataVencimento.toISOString().split("T")[0];
      const vencDate = new Date(vencStr);
      const diffTime = vencDate.getTime() - hojeDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        contasHojeCount++;
        contasHojeValor += t.valor;
      } else if (diffDays === 1) {
        contas1DiaCount++;
        contas1DiaValor += t.valor;
      } else if (diffDays === 3) {
        contas3DiasCount++;
        contas3DiasValor += t.valor;
      } else if (diffDays === 5) {
        contas5DiasCount++;
        contas5DiasValor += t.valor;
      }
    });

    return NextResponse.json({
      saldoCaixa,
      obrasAtivas: obrasAtivasCount,
      funcionariosAtivos: funcionariosCount,
      tarefasPendentes: {
        pontos: pontosPendentes,
        resets: resetsPendentes,
        usuarios: usuariosNovos,
        total: pontosPendentes + resetsPendentes + usuariosNovos,
      },
      contasAPagar: {
        hoje: { count: contasHojeCount, valor: contasHojeValor },
        amanha: { count: contas1DiaCount, valor: contas1DiaValor },
        em3Dias: { count: contas3DiasCount, valor: contas3DiasValor },
        em5Dias: { count: contas5DiasCount, valor: contas5DiasValor },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Erro na API do relógio:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
