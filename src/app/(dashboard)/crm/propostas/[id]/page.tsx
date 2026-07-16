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
  produto: "PREMIUM" | "SUPER_PREMIUM" | "CASCATA" | "REVESTIMENTO";
  areaPiscina: number;
  valorProposta: number;
  status: string;
  observacoes: string | null;
  precoUnitario: number | null;
  precoAditivo: number | null;
  createdAt: Date;
  descricaoServico?: string | null;
  valorInsumos?: number | null;
  valorEstadia?: number | null;
  imposto?: number | null;
  desconto?: number | null;
  prazoAplicacao?: number | null;
  contaBancariaId?: number | null;
  contaBancaria?: any | null;
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
    : (oportunidade.produto === "CASCATA" ? 18000.0 : (oportunidade.produto === "SUPER_PREMIUM" ? 350.0 : (oportunidade.produto === "REVESTIMENTO" ? 120.0 : 270.0)));
  
  const aditivoPrice = oportunidade.precoAditivo !== null && oportunidade.precoAditivo !== undefined
    ? oportunidade.precoAditivo
    : (oportunidade.produto === "CASCATA" ? 5000.0 : (oportunidade.produto === "REVESTIMENTO" ? 0.0 : 25.0));

  const valorProduto = oportunidade.areaPiscina * unitPrice;
  const valorAditivo = oportunidade.areaPiscina * aditivoPrice;

  // Variáveis para Jhoston Revest
  const valInsumos = oportunidade.valorInsumos ?? 0;
  const valEstadia = oportunidade.valorEstadia ?? 0;
  const valImposto = oportunidade.imposto ?? 0;
  const valDesconto = oportunidade.desconto ?? 0;
  const subTotal = valorProduto + valInsumos + valEstadia;

  const valorTotal = oportunidade.produto === "REVESTIMENTO"
    ? subTotal + valImposto - valDesconto
    : valorProduto + valorAditivo;

  const valorEntrada = oportunidade.produto === "REVESTIMENTO" ? valorTotal * 0.5 : unitPrice * 0.5;
  const valorIntermediaria = oportunidade.produto === "REVESTIMENTO" ? 0 : unitPrice * 0.3;
  const valorFinal = oportunidade.produto === "REVESTIMENTO" ? valorTotal * 0.5 : unitPrice * 0.2;

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
              {oportunidade.produto === "CASCATA" 
                ? "Ref: Execução de Cascata Decorativa" 
                : oportunidade.produto === "REVESTIMENTO" 
                  ? `Ref: ${oportunidade.descricaoServico || "Aplicação de revestimento resinado"}` 
                  : "Ref: Construção de Revestimento de Piscina"}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0284c7", margin: 0 }}>
              {oportunidade.produto === "CASCATA" 
                ? "ECO STONE BRASIL" 
                : oportunidade.produto === "REVESTIMENTO" 
                  ? "JHOSTON REVEST" 
                  : "JHOSTON POOLS"}
            </h3>
            {oportunidade.produto !== "CASCATA" && oportunidade.produto !== "REVESTIMENTO" && (
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                CNPJ: 63.013.022/0001-06
              </p>
            )}
            {oportunidade.produto === "REVESTIMENTO" && (
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                Visite nosso instagram: @jhoston.revest
              </p>
            )}
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
          {oportunidade.produto === "CASCATA" ? (
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0284c7", margin: "0 0 6px 0" }}>
                Execução de Cascata Decorativa e Funcional
              </h4>
              <p style={{ margin: "0 0 12px 0", textAlign: "justify" }}>
                A <strong>ECO STONE BRASIL</strong> apresenta esta proposta técnico-comercial para a implantação de uma cascata decorativa e funcional integrada à piscina já existente em sua residência. Nosso foco é entregar uma estética impecável — que valorize a área de lazer e crie uma atmosfera de relaxamento com o som da água — sem comprometer a impermeabilização ou a integridade estrutural da piscina atual.
              </p>
              <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#0284c7", margin: "12px 0 6px 0" }}>
                Etapas de Execução do Escopo Técnico:
              </h4>
              <ul style={{ paddingLeft: "16px", margin: 0, fontSize: "12px", color: "#475569" }}>
                <li style={{ marginBottom: "4px" }}><strong>Fase 1: Vistoria Técnica e Proteção da Área:</strong> Proteção do espelho d'água, bordas e revestimentos existentes no entorno do local de instalação. Mapeamento estrutural da borda/alvenaria para ancoragem segura da nova estrutura.</li>
                <li style={{ marginBottom: "4px" }}><strong>Fase 2: Adequação Hidráulica e Eletromecânica:</strong> Instalação de motobomba exclusiva com captação e acionamento independentes da filtragem da piscina, ou conexão à casa de máquinas existente.</li>
                <li style={{ marginBottom: "4px" }}><strong>Fase 3: Estruturação e Impermeabilização:</strong> Armação da estrutura base utilizando ferragem ancorada na alvenaria externa, seguida de impermeabilização de alta performance.</li>
                <li style={{ marginBottom: "4px" }}><strong>Fase 4: Modelagem e Acabamento (Padrão ECO STONE):</strong> Escultura e modelagem da rocha artificial utilizando concreto armado composto por areia, cimento e ferro, com acabamento de textura e pintura artística.</li>
                <li style={{ marginBottom: "4px" }}><strong>Fase 5: Testes, Limpeza e Entrega Técnica:</strong> Limpeza pós-obra da área de lazer, teste de vazão e regulagem final da lâmina d'água.</li>
              </ul>
            </div>
          ) : oportunidade.produto === "REVESTIMENTO" ? (
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0284c7", margin: "0 0 6px 0" }}>
                Aplicação de Revestimento Resinado Artístico
              </h4>
              <p style={{ margin: 0, textAlign: "justify" }}>
                Esta proposta contempla a prestação de serviços especializados de revestimento resinado de alta aderência,
                utilizando as especificações técnicas da linha de produtos selecionada, garantindo impermeabilidade completa,
                facilidade de manutenção física e um acabamento artístico de alta sofisticação visual para sua área de lazer.
              </p>
            </div>
          ) : oportunidade.produto === "SUPER_PREMIUM" ? (
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
          {oportunidade.produto === "CASCATA" ? (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f1f5f9", borderBottom: "2px solid #cbd5e1" }}>
                  <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 700, color: "#1e293b" }}>Item / Descrição</th>
                  <th style={{ textAlign: "center", padding: "10px 12px", fontWeight: 700, color: "#1e293b", width: "80px" }}>Qtd</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", fontWeight: 700, color: "#1e293b", width: "120px" }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "12px", fontWeight: 600, color: "#0f172a" }}>
                    Mão de obra: Estruturação, armação, modelagem artística, impermeabilização e pintura
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>{oportunidade.areaPiscina.toFixed(0)}</td>
                  <td style={{ padding: "12px", textAlign: "right", fontWeight: 500 }}>{formatCurrency(valorProduto)}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "12px", color: "#475569" }}>
                    Previsão de material: Areia, cimento, ferro, tinta, aditivos e impermeabilizantes (Adquirido pelo cliente)
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>{oportunidade.areaPiscina.toFixed(0)}</td>
                  <td style={{ padding: "12px", textAlign: "right", fontWeight: 500 }}>{formatCurrency(valorAditivo)}</td>
                </tr>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  <td colSpan={1} style={{ padding: "12px" }}>
                    <span style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic" }}>
                      * Nota: O valor a ser contratado diretamente com a ECO STONE BRASIL é de {formatCurrency(valorProduto)}, referente à mão de obra e logística.
                    </span>
                  </td>
                  <td style={{ padding: "12px", textAlign: "right", fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>Total:</td>
                  <td style={{ padding: "12px", textAlign: "right", fontWeight: 800, color: "#0284c7", fontSize: "15px" }}>
                    {formatCurrency(valorTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : oportunidade.produto === "REVESTIMENTO" ? (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f1f5f9", borderBottom: "2px solid #cbd5e1" }}>
                  <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 700, color: "#1e293b" }}>Item / Descrição</th>
                  <th style={{ textAlign: "center", padding: "10px 12px", fontWeight: 700, color: "#1e293b", width: "80px" }}>Qtd</th>
                  <th style={{ textAlign: "center", padding: "10px 12px", fontWeight: 700, color: "#1e293b", width: "60px" }}>Und</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", fontWeight: 700, color: "#1e293b", width: "110px" }}>V. Un.</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", fontWeight: 700, color: "#1e293b", width: "120px" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "12px", fontWeight: 600, color: "#0f172a" }}>
                    {oportunidade.descricaoServico || "Aplicação de revestimento resinado Verano Pools"}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>{oportunidade.areaPiscina.toFixed(2)}</td>
                  <td style={{ padding: "12px", textAlign: "center" }}>m2</td>
                  <td style={{ padding: "12px", textAlign: "right" }}>{formatCurrency(unitPrice)}</td>
                  <td style={{ padding: "12px", textAlign: "right", fontWeight: 500 }}>{formatCurrency(valorProduto)}</td>
                </tr>
                {valInsumos > 0 && (
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "12px", color: "#475569" }}>Insumos</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>1,00</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>Vb</td>
                    <td style={{ padding: "12px", textAlign: "right" }}>{formatCurrency(valInsumos)}</td>
                    <td style={{ padding: "12px", textAlign: "right", fontWeight: 500 }}>{formatCurrency(valInsumos)}</td>
                  </tr>
                )}
                {valEstadia > 0 && (
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "12px", color: "#475569" }}>Estadia e deslocamento</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>1,00</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>Vb</td>
                    <td style={{ padding: "12px", textAlign: "right" }}>{formatCurrency(valEstadia)}</td>
                    <td style={{ padding: "12px", textAlign: "right", fontWeight: 500 }}>{formatCurrency(valEstadia)}</td>
                  </tr>
                )}
                <tr style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
                  <td colSpan={3} style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "#64748b" }}>Sub-Total:</td>
                  <td colSpan={2} style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#1e293b" }}>{formatCurrency(subTotal)}</td>
                </tr>
                {valImposto > 0 && (
                  <tr style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
                    <td colSpan={3} style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "#64748b" }}>(+) Imposto - NF:</td>
                    <td colSpan={2} style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "var(--warning)" }}>{formatCurrency(valImposto)}</td>
                  </tr>
                )}
                {valDesconto > 0 && (
                  <tr style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
                    <td colSpan={3} style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "#64748b" }}>(-) Desconto:</td>
                    <td colSpan={2} style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "var(--error)" }}>-{formatCurrency(valDesconto)}</td>
                  </tr>
                )}
                <tr style={{ backgroundColor: "#f1f5f9" }}>
                  <td colSpan={3} style={{ padding: "12px" }}></td>
                  <td style={{ padding: "12px", textAlign: "right", fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>Total Geral:</td>
                  <td style={{ padding: "12px", textAlign: "right", fontWeight: 800, color: "#0284c7", fontSize: "15px" }}>
                    {formatCurrency(valorTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
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
          )}
        </div>

        {/* Condições de Pagamento e Termos */}
        <div style={{ marginBottom: "35px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px", marginBottom: "12px" }}>
            Condições Comerciais e Logística
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", fontSize: "12px", color: "#475569" }}>
            <div>
              <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", margin: "0 0 6px 0" }}>Formas de Pagamento</h4>
              {oportunidade.produto === "CASCATA" ? (
                <ul style={{ paddingLeft: "16px", margin: 0 }}>
                  <li style={{ marginBottom: "4px" }}>
                    <strong>1ª Parcela (50% - {formatCurrency(valorEntrada)}):</strong> Pago no ato de aprovação e aceite desta proposta (Entrada).
                  </li>
                  <li style={{ marginBottom: "4px" }}>
                    <strong>2ª Parcela (30% - {formatCurrency(valorIntermediaria)}):</strong> Pago após a conclusão da etapa de impermeabilização das pedras/rochas esculpidas.
                  </li>
                  <li style={{ marginBottom: "4px" }}>
                    <strong>3ª Parcela (20% - {formatCurrency(valorFinal)}):</strong> Pago na finalização dos testes técnicos e assinatura do Termo de Entrega da obra.
                  </li>
                </ul>
              ) : oportunidade.produto === "REVESTIMENTO" ? (
                <>
                  <ul style={{ paddingLeft: "16px", margin: 0 }}>
                    <li style={{ marginBottom: "4px" }}>
                      <strong>Condição:</strong> 50% de sinal e 50% no término da aplicação.
                    </li>
                  </ul>
                  <div style={{ marginTop: "10px", padding: "8px", backgroundColor: "#f1f5f9", borderRadius: "4px", fontSize: "11px" }}>
                    <strong>Dados Bancários Jhoston Revest:</strong><br />
                    {oportunidade.contaBancaria ? (
                      <>
                        Nome: {oportunidade.contaBancaria.titular}<br />
                        Banco: {oportunidade.contaBancaria.banco} | PIX: {oportunidade.contaBancaria.chavePix || "-"}<br />
                        AG: {oportunidade.contaBancaria.agencia} | CC: {oportunidade.contaBancaria.conta}
                      </>
                    ) : (
                      <>
                        Nome: Jhoston Revest | CNPJ: 44.038.228/0001-46<br />
                        Banco: Nú Bank | AG: 0001 | CC: 26970695-2 | PIX: 44.038.228/0001-46
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <ul style={{ paddingLeft: "16px", margin: 0 }}>
                    <li style={{ marginBottom: "4px" }}>
                      <strong>À vista:</strong> 5% de desconto via PIX ou transferência bancária.
                    </li>
                    <li style={{ marginBottom: "4px" }}>
                      <strong>Cartão de Crédito:</strong> Em até 3x sem juros (entrada + 2 parcelas), sem aplicação de desconto.
                    </li>
                  </ul>
                  <div style={{ marginTop: "10px", padding: "8px", backgroundColor: "#f1f5f9", borderRadius: "4px", fontSize: "11px" }}>
                    <strong>Dados Bancários Jhoston Pools:</strong><br />
                    Nome: JHOSTON POOLS | CNPJ/PIX: 63.013.022/0001-06<br />
                    Banco C6 S.A. (336) | AG: 0001 | CC: 39936999-6
                  </div>
                </>
              )}
            </div>
            <div>
              <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", margin: "0 0 6px 0" }}>Logística e Prazo</h4>
              {oportunidade.produto === "CASCATA" ? (
                <ul style={{ paddingLeft: "16px", margin: 0 }}>
                  <li style={{ marginBottom: "4px" }}>
                    <strong>Prazo de Execução:</strong> 10 dias úteis a partir da chegada dos materiais e liberação da área.
                  </li>
                  <li style={{ marginBottom: "4px" }}>
                    <strong>Garantia Estrutural:</strong> 5 anos contra defeitos na estrutura e na impermeabilização executada pela equipe ECO STONE.
                  </li>
                  <li style={{ marginBottom: "4px" }}>
                    <strong>Materiais:</strong> Aquisição e descarregamento de materiais básicos são de responsabilidade do contratante conforme quantitativo prévio.
                  </li>
                </ul>
              ) : oportunidade.produto === "REVESTIMENTO" ? (
                <ul style={{ paddingLeft: "16px", margin: 0 }}>
                  <li style={{ marginBottom: "4px" }}>
                    <strong>Prazo de Aplicação:</strong> {oportunidade.prazoAplicacao ?? 15} dias a partir da regularização e preparação do substrato.
                  </li>
                  <li style={{ marginBottom: "4px" }}>
                    <strong>Medição:</strong> O quantitativo é conferido no local antes da aplicação pela equipe técnica.
                  </li>
                  <li style={{ marginBottom: "4px" }}>
                    <strong>Preparo de Substrato:</strong> O substrato deve estar limpo, seco e regularizado conforme especificações técnicas do fabricante.
                  </li>
                </ul>
              ) : (
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
              )}
            </div>
          </div>
        </div>

        {/* Termos e Condições Gerais - Jhoston Revest */}
        {oportunidade.produto === "REVESTIMENTO" && (
          <div style={{ marginBottom: "40px", padding: "16px", border: "1px solid #fed7aa", backgroundColor: "#fff7ed", borderRadius: "6px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#c2410c", margin: "0 0 8px 0" }}>
              Termos e Condições Gerais (Jhoston Revest)
            </h3>
            <ul style={{ paddingLeft: "16px", margin: 0, fontSize: "11px", color: "#431407", lineHeight: "1.5" }}>
              <li style={{ marginBottom: "4px" }}>
                Os valores informados no orçamento por m² são referentes a metragem, substratos e as áreas informadas cujo são de responsabilidade do cliente.
              </li>
              <li style={{ marginBottom: "4px" }}>
                Confirmar metragem, condições de substrato, acesso ao local livre, validade dos materiais adquiridos, pontos de água e luz e as requisições do fabricante se estão de acordo.
              </li>
              <li style={{ marginBottom: "4px" }}>
                Caso as informações (m², substrato, áreas) sejam alteradas, será necessário atualizar o orçamento podendo haver alteração de valor do m².
              </li>
              <li style={{ marginBottom: "4px" }}>
                O revestimento deve ser aplicado sobre substratos regularizados, firmes, coesos, limpos, secos, livres de gordura, graxa, mofo, sem emendas ou trincas.
              </li>
              <li style={{ marginBottom: "4px" }}>
                Acabamentos não aceitam retoques, portanto, as áreas devem estar totalmente liberadas para início e término da aplicação de uma só vez.
              </li>
              <li style={{ marginBottom: "4px" }}>
                Produto aplicado de forma artesanal, ocorrendo variações no acabamento.
              </li>
              <li style={{ marginBottom: "4px" }}>
                Cancelamento total da proposta poderá ser feito em até 48 horas a partir da data de assinatura, após este prazo haverá multa de 30% do valor contratado.
              </li>
            </ul>
          </div>
        )}

        {/* Plano de Manutenção Ativo */}
        {oportunidade.produto !== "CASCATA" && oportunidade.produto !== "REVESTIMENTO" && (
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
        )}

        {/* Aceite do Cliente / Assinaturas */}
        <div style={{ marginTop: "60px" }}>
          <div style={{ textAlign: "center", marginBottom: "30px", fontSize: "13px", color: "#64748b" }}>
            {oportunidade.produto === "CASCATA" ? "Goiânia - GO" : "Monte Santo de Minas - MG"}, {formatDateBR(oportunidade.createdAt)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "40px", marginTop: "40px" }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ borderBottom: "1px solid #94a3b8", height: "30px", marginBottom: "6px" }}></div>
              <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                {oportunidade.produto === "CASCATA" 
                  ? "ECO STONE BRASIL" 
                  : oportunidade.produto === "REVESTIMENTO" 
                    ? "JHOSTON REVEST" 
                    : "JHOSTON POOLS"}
              </strong>
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
