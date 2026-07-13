"use client";

import { useEffect, useState, use } from "react";
import { getAutorizacaoCompra } from "../../actions";
import Link from "next/link";

interface AutorizacaoDetalhada {
  id: number;
  itens: string;
  valorLimite: number;
  observacoes: string | null;
  data: Date;
  createdAt: Date;
  obra: {
    nome: string;
    endereco: string | null;
  };
  fornecedor: {
    nome: string;
    cnpj: string | null;
    telefone: string | null;
    email: string | null;
    contato: string | null;
  };
}

export default function AutorizacaoPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const authId = parseInt(id, 10);

  const [auth, setAuth] = useState<AutorizacaoDetalhada | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAutorizacaoCompra(authId)
      .then((data) => {
        setAuth(data as any);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [authId]);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
        <p>Carregando autorização de compra...</p>
      </div>
    );
  }

  if (!auth) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h4 style={{ color: "var(--error)" }}>Autorização não encontrada</h4>
        <Link href="/obras" className="btn btn-secondary" style={{ marginTop: "16px" }}>
          Voltar a Obras
        </Link>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const formatDateBR = (dateVal: Date | string) => {
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const date = new Date(dateVal);
    const d = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} de ${month} de ${year}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-app)" }}>
      {/* Estilos específicos para Impressão */}
      <style jsx global>{`
        @media print {
          .sidebar,
          .main-header,
          .no-print,
          header,
          aside,
          button,
          .btn,
          footer {
            display: none !important;
          }
          
          .app-container {
            display: block !important;
          }
          .main-content {
            margin-left: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: white !important;
          }
          .main-body {
            padding: 0 !important;
          }
          
          .print-paper {
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            color: black !important;
            background: white !important;
          }
          
          body {
            background-color: white !important;
            color: black !important;
          }
        }
      `}</style>

      {/* Toolbar do Topo (no-print) */}
      <div
        className="no-print"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          backgroundColor: "var(--bg-card)",
          borderBottom: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/obras" className="btn btn-secondary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            ← Voltar a Obras
          </Link>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)" }}>
            Pré-visualização da Autorização #{auth.id}
          </span>
        </div>
        <div>
          <button
            onClick={handlePrint}
            className="btn btn-primary btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            🖨️ Imprimir / Salvar em PDF
          </button>
        </div>
      </div>

      {/* Papel da Autorização (Estilização A4) */}
      <div
        className="print-paper"
        style={{
          backgroundColor: "#ffffff",
          maxWidth: "800px",
          margin: "0 auto 40px auto",
          padding: "50px 60px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
          borderRadius: "8px",
          border: "1px solid var(--border-color)",
          color: "#334155",
          fontFamily: "var(--font-sans), sans-serif",
          lineHeight: "1.6",
          fontSize: "14px",
        }}
      >
        {/* Cabeçalho do Documento */}
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #0d9488", paddingBottom: "20px", marginBottom: "30px" }}>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.5px" }}>
              AUTORIZAÇÃO DE COMPRA
            </h1>
            <p style={{ margin: "4px 0 0 0", color: "#0d9488", fontSize: "13px", fontWeight: 700 }}>
              JHOSTON TEC PISCINAS
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#475569", margin: 0 }}>
              VERANO POOLS COMERCIO LTDA
            </h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#64748b" }}>
              CNPJ: 63.013.022/0001-06
            </p>
          </div>
        </div>

        {/* Declaração Principal */}
        <p style={{ fontSize: "14px", color: "#1e293b", textAlign: "justify", marginBottom: "24px" }}>
          A empresa <strong>JHOSTON TEC (VERANO POOLS COMERCIO LTDA)</strong>, por meio desta, autoriza o fornecimento dos materiais e insumos listados abaixo para atendimento à obra indicada, responsabilizando-se pelo faturamento correspondente até o limite financeiro estipulado.
        </p>

        {/* Informações da Obra de Destino */}
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: "4px", marginBottom: "10px" }}>
            1. Destinação (Obra)
          </h3>
          <table style={{ width: "100%", fontSize: "13px" }}>
            <tbody>
              <tr>
                <td style={{ width: "120px", color: "#64748b", padding: "4px 0" }}><strong>Obra / Projeto:</strong></td>
                <td style={{ color: "#1e293b", padding: "4px 0" }}>{auth.obra.nome}</td>
              </tr>
              <tr>
                <td style={{ color: "#64748b", padding: "4px 0" }}><strong>Endereço Obra:</strong></td>
                <td style={{ color: "#1e293b", padding: "4px 0" }}>{auth.obra.endereco || "Não cadastrado"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Informações do Fornecedor */}
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: "4px", marginBottom: "10px" }}>
            2. Fornecedor Autorizado
          </h3>
          <table style={{ width: "100%", fontSize: "13px" }}>
            <tbody>
              <tr>
                <td style={{ width: "120px", color: "#64748b", padding: "4px 0" }}><strong>Razão Social:</strong></td>
                <td style={{ color: "#1e293b", padding: "4px 0" }}>{auth.fornecedor.nome}</td>
              </tr>
              {auth.fornecedor.cnpj && (
                <tr>
                  <td style={{ color: "#64748b", padding: "4px 0" }}><strong>CNPJ:</strong></td>
                  <td style={{ color: "#1e293b", padding: "4px 0" }}>{auth.fornecedor.cnpj}</td>
                </tr>
              )}
              {auth.fornecedor.contato && (
                <tr>
                  <td style={{ color: "#64748b", padding: "4px 0" }}><strong>Representante:</strong></td>
                  <td style={{ color: "#1e293b", padding: "4px 0" }}>{auth.fornecedor.contato}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Itens Autorizados */}
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: "4px", marginBottom: "10px" }}>
            3. Descrição dos Itens / Materiais Autorizados
          </h3>
          <div
            style={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              padding: "16px",
              fontSize: "13px",
              whiteSpace: "pre-wrap",
              color: "#334155",
              minHeight: "80px",
            }}
          >
            {auth.itens}
          </div>
        </div>

        {/* Limite Financeiro e Faturamento */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.5fr",
            gap: "20px",
            marginBottom: "30px",
            backgroundColor: "#f0fdfa",
            border: "1px solid #99f6e4",
            padding: "16px",
            borderRadius: "6px",
          }}
        >
          <div>
            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#0d9488" }}>
              Valor Limite de Compra
            </span>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#0d9488", marginTop: "4px" }}>
              {formatCurrency(auth.valorLimite)}
            </div>
          </div>
          <div style={{ fontSize: "12px", color: "#0f766e" }}>
            <strong>Condição de Faturamento:</strong><br />
            Esta autorização garante o pagamento pela <strong>JHOSTON TEC (Verano Pools Comercio Ltda)</strong> de notas fiscais emitidas no CNPJ 63.013.022/0001-06, exclusivamente até o limite indicado. Vendas acima deste valor devem receber autorização prévia por escrito.
          </div>
        </div>

        {/* Observações Adicionais */}
        {auth.observacoes && (
          <div style={{ marginBottom: "35px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: "4px", marginBottom: "10px" }}>
              Observações de Faturamento e Entrega
            </h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#475569", textAlign: "justify" }}>
              {auth.observacoes}
            </p>
          </div>
        )}

        {/* Assinaturas */}
        <div style={{ marginTop: "60px" }}>
          <div style={{ textAlign: "center", marginBottom: "30px", fontSize: "13px", color: "#64748b" }}>
            Monte Santo de Minas - MG, {formatDateBR(auth.createdAt)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "40px", marginTop: "40px" }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ borderBottom: "1px solid #94a3b8", height: "30px", marginBottom: "6px" }}></div>
              <strong style={{ fontSize: "13px", color: "#0f172a" }}>JHOSTON TEC PISCINAS</strong>
              <div style={{ fontSize: "12px", color: "#64748b" }}>Emissor Autorizado</div>
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ borderBottom: "1px solid #94a3b8", height: "30px", marginBottom: "6px" }}></div>
              <strong style={{ fontSize: "13px", color: "#0f172a" }}>{auth.fornecedor.nome}</strong>
              <div style={{ fontSize: "12px", color: "#64748b" }}>Aceite / Fornecedor</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
