"use client";

import { useEffect, useState, startTransition, use } from "react";
import { getOportunidade } from "../../actions";
import Link from "next/link";

interface Oportunidade {
  id: number;
  clienteNome: string;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  descricaoPiscina: string | null;
  produto: "PREMIUM" | "SUPER_PREMIUM";
  areaPiscina: number;
  valorProposta: number;
  status: string;
  observacoes: string | null;
  precoUnitario: number | null;
  precoAditivo: number | null;
  createdAt: Date;
}

export default function PropostaPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const opId = parseInt(id, 10);

  const [oportunidade, setOportunidade] = useState<Oportunidade | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOportunidade(opId)
      .then((data) => {
        setOportunidade(data as any);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [opId]);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
        <p>Carregando dados da proposta...</p>
      </div>
    );
  }

  if (!oportunidade) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h4 style={{ color: "var(--error)" }}>Proposta não encontrada</h4>
        <Link href="/crm" className="btn btn-secondary" style={{ marginTop: "16px" }}>
          Voltar ao CRM
        </Link>
      </div>
    );
  }

  // Preço unitário e aditivos
  const unitPrice = oportunidade.precoUnitario !== null && oportunidade.precoUnitario !== undefined
    ? oportunidade.precoUnitario
    : (oportunidade.produto === "SUPER_PREMIUM" ? 350.0 : 270.0);
  
  const aditivoPrice = oportunidade.precoAditivo !== null && oportunidade.precoAditivo !== undefined
    ? oportunidade.precoAditivo
    : 25.0;

  const valorProduto = oportunidade.areaPiscina * unitPrice;
  const valorAditivo = oportunidade.areaPiscina * aditivoPrice;
  const valorTotal = valorProduto + valorAditivo;

  const formatNumberBR = (num: number) => {
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-app)" }}>
      {/* Estilos específicos para Impressão e Preview */}
      <style jsx global>{`
        @media print {
          /* Esconder toda a UI do painel do sistema */
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
          
          /* Ajustar container do Next.js dashboard */
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
          
          /* Estilo da folha na impressão */
          .proposal-paper {
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
          <Link href="/crm" className="btn btn-secondary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            ← Voltar ao CRM
          </Link>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)" }}>
            Pré-visualização da Proposta #{oportunidade.id}
          </span>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <a
            href={`/api/propostas/${oportunidade.id}`}
            className="btn btn-secondary btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            📥 Baixar em Word (.docx)
          </a>
          <button
            onClick={handlePrint}
            className="btn btn-primary btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            🖨️ Imprimir / Salvar em PDF
          </button>
        </div>
      </div>

      {/* Papel da Proposta (Estilização A4) */}
      <div
        className="proposal-paper"
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
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #0f172a", paddingBottom: "20px", marginBottom: "30px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.5px" }}>
              PROPOSTA COMERCIAL
            </h1>
            <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "13px", fontWeight: 500 }}>
              Ref: Construção de Revestimento de Piscina
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0284c7", margin: 0 }}>
              VERANO POOLS COMERCIO LTDA
            </h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
              CNPJ: 63.013.022/0001-06
            </p>
          </div>
        </div>

        {/* Dados do Cliente e Proposta */}
        <div
          style={{
            backgroundColor: "#f8fafc",
            borderRadius: "6px",
            padding: "16px",
            marginBottom: "30px",
            border: "1px solid #e2e8f0",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <div>
            <span style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "#94a3b8" }}>Cliente</span>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginTop: "2px" }}>{oportunidade.clienteNome}</div>
            <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>{oportunidade.endereco || "Endereço não informado"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "#94a3b8" }}>Proposta Nº</span>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginTop: "2px" }}>#{oportunidade.id}</div>
            <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>Data: {formatDateBR(oportunidade.createdAt)}</div>
          </div>
        </div>

        {/* Informações do Produto */}
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px", marginBottom: "12px" }}>
            Especificação Técnica da Solução
          </h3>
          {oportunidade.produto === "SUPER_PREMIUM" ? (
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0284c7", margin: "0 0 6px 0" }}>
                Linha Super Premium (Revestimento Poliaspártico)
              </h4>
              <p style={{ margin: 0, textAlign: "justify" }}>
                A Linha Super Premium é a solução definitiva para máxima performance em revestimentos de piscinas. 
                Formulada em resina <strong>poliaspártica</strong>, oferece estabilidade UV absoluta e é a opção exclusiva 
                para projetos na cor Branca, com garantia de que não amarela sob nenhuma circunstância.
              </p>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0284c7", margin: "16px 0 6px 0" }}>
                Aditivo de Alta Performance (Resina UVX HighPro Defense+)
              </h4>
              <p style={{ margin: 0, textAlign: "justify" }}>
                UVX HighPro Defense+ é uma resina de alta performance desenvolvida para oferecer proteção avançada contra 
                radiação UV, cloretos e agentes agressivos presentes em ambientes de piscina e áreas externas. Sua formulação 
                combina tecnologia UVX de última geração com polímeros HighPro, garantindo resistência extrema, acabamento estável 
                e durabilidade superior mesmo em condições de sol intenso e alta salinidade.
              </p>
            </div>
          ) : (
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0284c7", margin: "0 0 6px 0" }}>
                Linha Premium (Revestimento em Resina PU)
              </h4>
              <p style={{ margin: 0, textAlign: "justify" }}>
                A Linha Premium utiliza revestimento em resina PU (Poliuretano) de alta performance, proporcionando excelente 
                flexibilidade, aderência e durabilidade. É a solução ideal para quem busca ótimo acabamento estético, 
                estanqueidade impecável e proteção duradoura com excelente custo-benefício.
              </p>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0284c7", margin: "16px 0 6px 0" }}>
                Aditivo de Alta Performance (Resina UVX HighPro Defense+)
              </h4>
              <p style={{ margin: 0, textAlign: "justify" }}>
                UVX HighPro Defense+ é uma resina de alta performance desenvolvida para oferecer proteção avançada contra 
                radiação UV, cloretos e agentes agressivos presentes em ambientes de piscina e áreas externas, garantindo resistência 
                extrema, acabamento estável e durabilidade superior mesmo em condições de sol intenso e alta salinidade.
              </p>
            </div>
          )}
        </div>

        {/* Tabela do Orçamento */}
        <div style={{ marginBottom: "35px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px", marginBottom: "16px" }}>
            Orçamento Comercial Detalhado
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f1f5f9", borderBottom: "2px solid #cbd5e1" }}>
                <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 700, color: "#1e293b" }}>Item / Descrição</th>
                <th style={{ textAlign: "center", padding: "10px 12px", fontWeight: 700, color: "#1e293b", width: "80px" }}>Área (m²)</th>
                <th style={{ textAlign: "right", padding: "10px 12px", fontWeight: 700, color: "#1e293b", width: "110px" }}>Valor Un.</th>
                <th style={{ textAlign: "right", padding: "10px 12px", fontWeight: 700, color: "#1e293b", width: "120px" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={{ padding: "12px", fontWeight: 600, color: "#0f172a" }}>
                  {oportunidade.produto === "SUPER_PREMIUM" ? "Linha Super Premium" : "Linha Premium"}
                </td>
                <td style={{ padding: "12px", textAlign: "center" }}>{oportunidade.areaPiscina.toFixed(2)}</td>
                <td style={{ padding: "12px", textAlign: "right" }}>{formatCurrency(unitPrice)}</td>
                <td style={{ padding: "12px", textAlign: "right", fontWeight: 500 }}>{formatCurrency(valorProduto)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={{ padding: "12px", color: "#475569" }}>Aditivo de Alta Performance (UVX HighPro Defense+)</td>
                <td style={{ padding: "12px", textAlign: "center" }}>{oportunidade.areaPiscina.toFixed(2)}</td>
                <td style={{ padding: "12px", textAlign: "right" }}>{formatCurrency(aditivoPrice)}</td>
                <td style={{ padding: "12px", textAlign: "right", fontWeight: 500 }}>{formatCurrency(valorAditivo)}</td>
              </tr>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                <td colSpan={2} style={{ padding: "12px" }}></td>
                <td style={{ padding: "12px", textAlign: "right", fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>Total Geral:</td>
                <td style={{ padding: "12px", textAlign: "right", fontWeight: 800, color: "#0284c7", fontSize: "15px" }}>
                  {formatCurrency(valorTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Condições de Pagamento e Termos */}
        <div style={{ marginBottom: "35px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px", marginBottom: "12px" }}>
            Condições Comerciais e Logística
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", fontSize: "12px", color: "#475569" }}>
            <div>
              <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", margin: "0 0 6px 0" }}>Formas de Pagamento</h4>
              <ul style={{ paddingLeft: "16px", margin: 0 }}>
                <li style={{ marginBottom: "4px" }}>
                  <strong>À vista:</strong> 5% de desconto via PIX ou transferência bancária.
                </li>
                <li style={{ marginBottom: "4px" }}>
                  <strong>Cartão de Crédito:</strong> Em até 3x sem juros (entrada + 2 parcelas), sem aplicação de desconto.
                </li>
              </ul>
              <div style={{ marginTop: "10px", padding: "8px", backgroundColor: "#f1f5f9", borderRadius: "4px", fontSize: "11px" }}>
                <strong>Dados Bancários Verano Pools:</strong><br />
                CNPJ/PIX: 63.013.022/0001-06<br />
                Nu Pagamentos (260) | AG: 0001 | CC: 999383083-2
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", margin: "0 0 6px 0" }}>Logística e Prazo</h4>
              <ul style={{ paddingLeft: "16px", margin: 0 }}>
                <li style={{ marginBottom: "4px" }}>
                  <strong>Logística (Frete FOB):</strong> O transporte dos materiais é por conta e responsabilidade do cliente (carga/descarga/envio).
                </li>
                <li style={{ marginBottom: "4px" }}>
                  <strong>Prazo de Entrega:</strong> De 28 a 30 dias após formalização.
                </li>
                <li style={{ marginBottom: "4px" }}>
                  <strong>Medição:</strong> O quantitativo é conferido em loco antes da aplicação. Recomenda-se margem de perda de 10% no pedido final.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Plano de Manutenção Ativo */}
        <div style={{ marginBottom: "40px", padding: "16px", border: "1px solid #bae6fd", backgroundColor: "#f0f9ff", borderRadius: "6px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0369a1", margin: "0 0 8px 0" }}>
            Plano de Manutenção Ativo (Garantia de 3 Anos)
          </h3>
          <p style={{ margin: "0 0 10px 0", fontSize: "12px", textAlign: "justify", color: "#0369a1" }}>
            Assumimos o compromisso real com a durabilidade da sua piscina. Substituímos a garantia burocrática convencional pelo 
            <strong> Plano de Manutenção Ativo</strong> de cuidados preditivos durante os 3 primeiros anos:
          </p>
          <ul style={{ paddingLeft: "16px", margin: 0, fontSize: "12px", color: "#334155" }}>
            <li style={{ marginBottom: "4px" }}>
              <strong>Monitoramento Semanal Remoto:</strong> Sem custos de mensalidade, nossa equipe audita e orienta os parâmetros químicos de pH e cloro.
            </li>
            <li style={{ marginBottom: "4px" }}>
              <strong>Intervenção Preventiva (Ano 1 e 2):</strong> Lavagem técnica anual preventiva e reaplicação da resina de proteção com <strong>mão de obra 100% isenta</strong> (cliente arca com custos logísticos e materiais).
            </li>
            <li style={{ marginBottom: "4px" }}>
              <strong>Manutenção Pesada (Ano 3):</strong> Lavagem química intensiva com equipamentos de alta pressão e camada final de proteção com <strong>mão de obra isenta</strong>.
            </li>
          </ul>
        </div>

        {/* Aceite do Cliente / Assinaturas */}
        <div style={{ marginTop: "60px" }}>
          <div style={{ textAlign: "center", marginBottom: "30px", fontSize: "13px", color: "#64748b" }}>
            Monte Santo de Minas - MG, {formatDateBR(oportunidade.createdAt)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "40px", marginTop: "40px" }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ borderBottom: "1px solid #94a3b8", height: "30px", marginBottom: "6px" }}></div>
              <strong style={{ fontSize: "13px", color: "#0f172a" }}>VERANO POOLS COMERCIO LTDA</strong>
              <div style={{ fontSize: "12px", color: "#64748b" }}>Contratado</div>
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ borderBottom: "1px solid #94a3b8", height: "30px", marginBottom: "6px" }}></div>
              <strong style={{ fontSize: "13px", color: "#0f172a" }}>{oportunidade.clienteNome}</strong>
              <div style={{ fontSize: "12px", color: "#64748b" }}>Contratante / Aceite</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
