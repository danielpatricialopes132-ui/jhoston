"use client";

import { useState } from "react";
import Link from "next/link";

export default function FinanceiraTab() {
  const [finSubTab, setFinSubTab] = useState("PARCELAMENTO"); // "PARCELAMENTO" ou "MARGEM"

  // 5. Financial Amortization States
  const [finTotalObra, setFinTotalObra] = useState("45000");
  const [finEntrada, setFinEntrada] = useState("15000");
  const [finTaxaJuros, setFinTaxaJuros] = useState("1.2");
  const [finNumParcelas, setFinNumParcelas] = useState("12");
  const [finSistemaAmort, setFinSistemaAmort] = useState("PRICE");

  // 6. Financial Margin States
  const [mCustoMateriais, setMCustoMateriais] = useState("18000");
  const [mCustoMaoObra, setMCustoMaoObra] = useState("12000");
  const [mCustosIndiretos, setMCustosIndiretos] = useState("10"); // 10% custos indiretos (combustível, etc)
  const [mImpostos, setMImpostos] = useState("6"); // 6% simples nacional médio
  const [mMargemDesejada, setMMargemDesejada] = useState("20"); // 20% lucro líquido

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  // Amortization Math (PRICE vs SAC vs SEM_JUROS)
  const calcAmortizacao = () => {
    const total = parseFloat(finTotalObra) || 0;
    const entrada = parseFloat(finEntrada) || 0;
    const taxa = parseFloat(finTaxaJuros) || 0;
    const n = parseInt(finNumParcelas, 10) || 1;

    const pv = Math.max(0, total - entrada);
    const i = taxa / 100;

    let parcelas: Array<{
      mes: number;
      prestacao: number;
      juros: number;
      amortizacao: number;
      saldoDevedor: number;
    }> = [];

    let totalJuros = 0;
    let totalPago = entrada;

    if (pv > 0) {
      if (finSistemaAmort === "PRICE") {
        const pmt = i === 0 ? pv / n : (pv * i) / (1 - Math.pow(1 + i, -n));
        let saldo = pv;
        for (let t = 1; t <= n; t++) {
          const juros = saldo * i;
          const amort = pmt - juros;
          saldo = Math.max(0, saldo - amort);
          parcelas.push({
            mes: t,
            prestacao: pmt,
            juros: juros,
            amortizacao: amort,
            saldoDevedor: saldo,
          });
          totalJuros += juros;
        }
        totalPago += pv + totalJuros;
      } else if (finSistemaAmort === "SAC") {
        const amort = pv / n;
        let saldo = pv;
        for (let t = 1; t <= n; t++) {
          const juros = saldo * i;
          const pmt = amort + juros;
          saldo = Math.max(0, saldo - amort);
          parcelas.push({
            mes: t,
            prestacao: pmt,
            juros: juros,
            amortizacao: amort,
            saldoDevedor: saldo,
          });
          totalJuros += juros;
        }
        totalPago += pv + totalJuros;
      } else {
        // SEM JUROS
        const pmt = pv / n;
        let saldo = pv;
        for (let t = 1; t <= n; t++) {
          saldo = Math.max(0, saldo - pmt);
          parcelas.push({
            mes: t,
            prestacao: pmt,
            juros: 0,
            amortizacao: pmt,
            saldoDevedor: saldo,
          });
        }
        totalPago += pv;
      }
    }

    return {
      pv,
      totalJuros,
      totalPago,
      parcelas,
    };
  };

  // Margin/Pricing Math
  const calcMargem = () => {
    const materiais = parseFloat(mCustoMateriais) || 0;
    const maoObra = parseFloat(mCustoMaoObra) || 0;
    const indiretosPct = parseFloat(mCustosIndiretos) || 0;
    const impostosPct = parseFloat(mImpostos) || 0;
    const margemPct = parseFloat(mMargemDesejada) || 0;

    const custoDireto = materiais + maoObra;
    const pctTotal = (indiretosPct + impostosPct + margemPct) / 100;
    
    const divisor = Math.max(0.01, 1 - pctTotal);
    const markup = 1 / divisor;
    
    const precoVenda = custoDireto * markup;
    const impostosValor = precoVenda * (impostosPct / 100);
    const indiretosValor = precoVenda * (indiretosPct / 100);
    const lucroValor = precoVenda * (margemPct / 100);

    const divisorBreakEven = Math.max(0.01, 1 - (indiretosPct + impostosPct) / 100);
    const precoBreakEven = custoDireto / divisorBreakEven;

    return {
      custoDireto,
      markup,
      precoVenda,
      impostosValor,
      indiretosValor,
      lucroValor,
      precoBreakEven,
    };
  };

  const fRes = calcAmortizacao();
  const mRes = calcMargem();

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex-row-between" style={{ marginBottom: "32px" }}>
        <div>
          <h3 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-heading)" }}>
            Calculadora Financeira Comercial
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
            Ferramenta comercial para simulação de financiamento, cálculo de parcelas e precificação com margem.
          </p>
        </div>
        <Link href="/" className="btn btn-secondary">
          Voltar para Home
        </Link>
      </div>

      {/* Abas Secundárias */}
      <div
        className="help-tabs-container"
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid var(--border-color)",
          paddingBottom: "12px",
          marginBottom: "24px",
        }}
      >
        <button
          className="help-tab-btn"
          style={{
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: 600,
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            backgroundColor: finSubTab === "PARCELAMENTO" ? "var(--secondary)" : "rgba(0,0,0,0.03)",
            color: finSubTab === "PARCELAMENTO" ? "#fff" : "var(--text-muted)",
          }}
          onClick={() => setFinSubTab("PARCELAMENTO")}
        >
          💳 Simulador de Parcelas (Financiamento)
        </button>
        <button
          className="help-tab-btn"
          style={{
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: 600,
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            backgroundColor: finSubTab === "MARGEM" ? "var(--secondary)" : "rgba(0,0,0,0.03)",
            color: finSubTab === "MARGEM" ? "#fff" : "var(--text-muted)",
          }}
          onClick={() => setFinSubTab("MARGEM")}
        >
          📈 Cálculo de Margem & Markup
        </button>
      </div>

      <div className="grid-cols-2">
        {/* Painel de Entrada (Esquerda) */}
        <div className="card">
          {finSubTab === "PARCELAMENTO" && (
            <div>
              <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", color: "var(--text-heading)" }}>
                Parâmetros do Parcelamento
              </h4>
              
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Valor Total da Obra / Proposta (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                  value={finTotalObra}
                  onChange={(e) => setFinTotalObra(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Valor de Entrada (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                  value={finEntrada}
                  onChange={(e) => setFinEntrada(e.target.value)}
                />
              </div>

              <div className="grid-cols-2" style={{ gap: "12px", marginBottom: "16px", gridTemplateColumns: "1fr 1fr" }}>
                <div className="form-group">
                  <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Taxa de Juros (% a.m.)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                    value={finTaxaJuros}
                    onChange={(e) => setFinTaxaJuros(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Número de Parcelas</label>
                  <select
                    className="form-control"
                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                    value={finNumParcelas}
                    onChange={(e) => setFinNumParcelas(e.target.value)}
                  >
                    {[3, 6, 9, 12, 18, 24, 36, 48].map((meses) => (
                      <option key={meses} value={meses}>{meses} parcelas</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Sistema de Amortização</label>
                <select
                  className="form-control"
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                  value={finSistemaAmort}
                  onChange={(e) => setFinSistemaAmort(e.target.value)}
                >
                  <option value="PRICE">Tabela PRICE (Parcelas Fixas)</option>
                  <option value="SAC">Tabela SAC (Parcelas Decrescentes)</option>
                  <option value="SEM_JUROS">Sem Juros (Divisão Simples)</option>
                </select>
              </div>
            </div>
          )}

          {finSubTab === "MARGEM" && (
            <div>
              <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", color: "var(--text-heading)" }}>
                Custos & Margem do Projeto
              </h4>

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Custo Direto de Materiais (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                  value={mCustoMateriais}
                  onChange={(e) => setMCustoMateriais(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Custo Direto de Mão de Obra (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                  value={mCustoMaoObra}
                  onChange={(e) => setMCustoMaoObra(e.target.value)}
                />
              </div>

              <div className="grid-cols-3" style={{ gap: "12px", marginBottom: "16px", gridTemplateColumns: "1fr 1fr 1fr" }}>
                <div className="form-group">
                  <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Indiretos (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control"
                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                    value={mCustosIndiretos}
                    onChange={(e) => setMCustosIndiretos(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Impostos (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control"
                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                    value={mImpostos}
                    onChange={(e) => setMImpostos(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Margem (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control"
                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                    value={mMargemDesejada}
                    onChange={(e) => setMMargemDesejada(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resultados Estimados (Direita) */}
        <div className="card" style={{ backgroundColor: "#fafafb", display: "flex", flexDirection: "column" }}>
          <h4 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-heading)", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginBottom: "20px" }}>
            Relatório de Simulação Financeira
          </h4>

          {finSubTab === "PARCELAMENTO" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
              <div className="grid-cols-2" style={{ gap: "12px", gridTemplateColumns: "1fr 1fr", marginBottom: "8px" }}>
                <div style={{ backgroundColor: "#f1f5f9", padding: "10px", borderRadius: "6px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Valor Financiado:</span>
                  <strong style={{ fontSize: "15px", color: "var(--text-heading)" }}>{formatCurrency(fRes.pv)}</strong>
                </div>
                <div style={{ backgroundColor: "rgba(13, 148, 136, 0.08)", padding: "10px", borderRadius: "6px" }}>
                  <span style={{ fontSize: "11px", color: "var(--secondary)", display: "block" }}>Total de Juros:</span>
                  <strong style={{ fontSize: "15px", color: "var(--secondary)" }}>{formatCurrency(fRes.totalJuros)}</strong>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-color)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--text-muted)" }}>Total Pago (Entrada + Parcelas):</span>
                <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--secondary)" }}>{formatCurrency(fRes.totalPago)}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-color)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--text-muted)" }}>
                  {finSistemaAmort === "PRICE" ? "Valor de Cada Parcela (Fixa):" : "Parcela Inicial / Estimada:"}
                </span>
                <strong style={{ fontSize: "18px", color: "var(--text-heading)" }}>
                  {fRes.parcelas.length > 0 ? formatCurrency(fRes.parcelas[0].prestacao) : "R$ 0,00"}
                </strong>
              </div>

              {fRes.parcelas.length > 0 && (
                <div style={{ flex: 1, maxHeight: "220px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "6px", marginTop: "10px" }}>
                  <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid var(--border-color)" }}>
                        <th style={{ padding: "8px" }}>Mês</th>
                        <th style={{ padding: "8px" }}>Prestação</th>
                        <th style={{ padding: "8px" }}>Juros</th>
                        <th style={{ padding: "8px" }}>Amortizac.</th>
                        <th style={{ padding: "8px" }}>Saldo Devedor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fRes.parcelas.map((p) => (
                        <tr key={p.mes} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "6px 8px", fontWeight: 600 }}>{p.mes}º</td>
                          <td style={{ padding: "6px 8px" }}>{formatCurrency(p.prestacao)}</td>
                          <td style={{ padding: "6px 8px", color: "var(--error)" }}>{formatCurrency(p.juros)}</td>
                          <td style={{ padding: "6px 8px", color: "var(--success)" }}>{formatCurrency(p.amortizacao)}</td>
                          <td style={{ padding: "6px 8px" }}>{formatCurrency(p.saldoDevedor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {finSubTab === "MARGEM" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="grid-cols-2" style={{ gap: "12px", gridTemplateColumns: "1fr 1fr", marginBottom: "8px" }}>
                <div style={{ backgroundColor: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Custos Diretos Totais:</span>
                  <strong style={{ fontSize: "16px", color: "var(--text-heading)" }}>{formatCurrency(mRes.custoDireto)}</strong>
                </div>
                <div style={{ backgroundColor: "rgba(13, 148, 136, 0.08)", padding: "10px", borderRadius: "6px" }}>
                  <span style={{ fontSize: "11px", color: "var(--secondary)", display: "block" }}>Fator de Markup Comercial:</span>
                  <strong style={{ fontSize: "16px", color: "var(--secondary)" }}>{mRes.markup.toFixed(3)}x</strong>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-color)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--text-muted)" }}>Preço de Venda Sugerido:</span>
                <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--primary)" }}>{formatCurrency(mRes.precoVenda)}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-color)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--text-muted)" }}>Lucro Líquido Estimado:</span>
                <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--success)" }}>{formatCurrency(mRes.lucroValor)}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-color)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--text-muted)" }}>Break-even (Preço Mínimo sem Lucro):</span>
                <strong style={{ color: "var(--text-heading)" }}>{formatCurrency(mRes.precoBreakEven)}</strong>
              </div>

              <div style={{ backgroundColor: "#eff6ff", padding: "12px 16px", borderRadius: "6px", border: "1px solid #bfdbfe", marginTop: "10px" }}>
                <span style={{ fontSize: "12px", color: "var(--info)", display: "block", fontWeight: 600, marginBottom: "4px" }}>Resumo da Composição do Preço:</span>
                <div style={{ fontSize: "11px", color: "var(--text-main)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  <div>Impostos ({mImpostos}%): <strong>{formatCurrency(mRes.impostosValor)}</strong></div>
                  <div>C. Indiretos ({mCustosIndiretos}%): <strong>{formatCurrency(mRes.indiretosValor)}</strong></div>
                  <div>C. Diretos: <strong>{formatCurrency(mRes.custoDireto)}</strong></div>
                  <div>Lucro Desejado ({mMargemDesejada}%): <strong>{formatCurrency(mRes.lucroValor)}</strong></div>
                </div>
              </div>
            </div>
          )}

          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", marginTop: "auto" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", textAlign: "center" }}>
              JHOSTON TEC Piscinas v1.1 — Módulos Comerciais Avançados
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
