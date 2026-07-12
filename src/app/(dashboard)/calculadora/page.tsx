"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CalculadoraPage() {
  const [mainTab, setMainTab] = useState("OBRA"); // "OBRA" ou "FINANCEIRA"
  const [activeSubTab, setActiveSubTab] = useState("PISCINA");
  const [finSubTab, setFinSubTab] = useState("PARCELAMENTO"); // "PARCELAMENTO" ou "MARGEM"

  // 1. Piscina States
  const [piscinaForma, setPiscinaForma] = useState("RETANGULAR");
  const [pComp, setPComp] = useState("");
  const [pLarg, setPLarg] = useState("");
  const [pProf, setPProf] = useState("");
  const [pDiam, setPDiam] = useState("");

  // 2. Revestimento States
  const [rComp, setRComp] = useState("");
  const [rLarg, setRLarg] = useState("");
  const [rProf, setRProf] = useState("");
  const [rMargem, setRMargem] = useState("10"); // 10% padrão

  // 3. Concreto States
  const [cVol, setCVol] = useState("");

  // 4. Conversor States
  const [convM3, setConvM3] = useState("");
  const [convLitro, setConvLitro] = useState("");
  const [convMetros, setConvMetros] = useState("");
  const [convPolegadas, setConvPolegadas] = useState("");
  const [convM2, setConvM2] = useState("");
  const [convPesSq, setConvPesSq] = useState("");
  const [convLGalao, setConvLGalao] = useState("");
  const [convGalao, setConvGalao] = useState("");

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

  // Sync tab with search parameters on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "financeira") {
        setMainTab("FINANCEIRA");
      } else if (tabParam === "obra") {
        setMainTab("OBRA");
      }
    }
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  // Cálculos de Piscina
  const calcPiscinaVolume = () => {
    const comp = parseFloat(pComp) || 0;
    const larg = parseFloat(pLarg) || 0;
    const prof = parseFloat(pProf) || 0;
    const diam = parseFloat(pDiam) || 0;

    let volumeM3 = 0;

    if (piscinaForma === "RETANGULAR") {
      volumeM3 = comp * larg * prof;
    } else if (piscinaForma === "REDONDA") {
      const raio = diam / 2;
      volumeM3 = Math.PI * Math.pow(raio, 2) * prof;
    } else if (piscinaForma === "OVAL") {
      volumeM3 = comp * larg * prof * 0.785;
    }

    return {
      m3: volumeM3,
      litros: volumeM3 * 1000,
    };
  };

  // Cálculos de Revestimento
  const calcRevestimento = () => {
    const comp = parseFloat(rComp) || 0;
    const larg = parseFloat(rLarg) || 0;
    const prof = parseFloat(rProf) || 0;
    const margemPct = parseFloat(rMargem) || 0;

    const areaFundo = comp * larg;
    const areaParedesComp = 2 * (comp * prof);
    const areaParedesLarg = 2 * (larg * prof);
    const areaTotalBase = areaFundo + areaParedesComp + areaParedesLarg;
    const areaComMargem = areaTotalBase * (1 + margemPct / 100);

    return {
      base: areaTotalBase,
      comMargem: areaComMargem,
    };
  };

  // Cálculos de Concreto
  const calcConcreto = () => {
    const vol = parseFloat(cVol) || 0;
    return {
      cimento: vol * 7,
      areia: vol * 0.6,
      brita: vol * 0.8,
      agua: vol * 180,
    };
  };

  // Conversões
  const handleConvM3Change = (valStr: string) => {
    setConvM3(valStr);
    const val = parseFloat(valStr) || 0;
    setConvLitro((val * 1000).toString());
  };

  const handleConvLitroChange = (valStr: string) => {
    setConvLitro(valStr);
    const val = parseFloat(valStr) || 0;
    setConvM3((val / 1000).toString());
  };

  const handleConvMetrosChange = (valStr: string) => {
    setConvMetros(valStr);
    const val = parseFloat(valStr) || 0;
    setConvPolegadas((val * 39.3701).toFixed(2));
  };

  const handleConvPolegadasChange = (valStr: string) => {
    setConvPolegadas(valStr);
    const val = parseFloat(valStr) || 0;
    setConvMetros((val / 39.3701).toFixed(3));
  };

  const handleConvM2Change = (valStr: string) => {
    setConvM2(valStr);
    const val = parseFloat(valStr) || 0;
    setConvPesSq((val * 10.7639).toFixed(2));
  };

  const handleConvPesSqChange = (valStr: string) => {
    setConvPesSq(valStr);
    const val = parseFloat(valStr) || 0;
    setConvM2((val / 10.7639).toFixed(2));
  };

  const handleConvLGalaoChange = (valStr: string) => {
    setConvLGalao(valStr);
    const val = parseFloat(valStr) || 0;
    setConvGalao((val * 0.264172).toFixed(3));
  };

  const handleConvGalaoChange = (valStr: string) => {
    setConvGalao(valStr);
    const val = parseFloat(valStr) || 0;
    setConvLGalao((val / 0.264172).toFixed(2));
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
    
    // Evitar divisão por zero ou markup inviável
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

  // Run all active calculations
  const pRes = calcPiscinaVolume();
  const rRes = calcRevestimento();
  const cRes = calcConcreto();
  const fRes = calcAmortizacao();
  const mRes = calcMargem();

  return (
    <div>
      {/* Abas Principais (Estilo Premium Glassmorphism) */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "28px",
          padding: "6px",
          backgroundColor: "rgba(0, 0, 0, 0.03)",
          borderRadius: "10px",
          maxWidth: "600px"
        }}
      >
        <button
          style={{
            flex: 1,
            padding: "10px 16px",
            fontSize: "14px",
            fontWeight: 700,
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            backgroundColor: mainTab === "OBRA" ? "var(--primary)" : "transparent",
            color: mainTab === "OBRA" ? "#fff" : "var(--text-muted)",
            transition: "var(--transition)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: mainTab === "OBRA" ? "var(--shadow-sm)" : "none"
          }}
          onClick={() => setMainTab("OBRA")}
        >
          📐 Calculadora de Obra
        </button>
        <button
          style={{
            flex: 1,
            padding: "10px 16px",
            fontSize: "14px",
            fontWeight: 700,
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            backgroundColor: mainTab === "FINANCEIRA" ? "var(--secondary)" : "transparent",
            color: mainTab === "FINANCEIRA" ? "#fff" : "var(--text-muted)",
            transition: "var(--transition)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: mainTab === "FINANCEIRA" ? "var(--shadow-sm)" : "none"
          }}
          onClick={() => setMainTab("FINANCEIRA")}
        >
          💰 Calculadora Financeira
        </button>
      </div>

      {/* CALCULADORA DE OBRA */}
      {mainTab === "OBRA" && (
        <div>
          {/* Cabeçalho */}
          <div className="flex-row-between" style={{ marginBottom: "32px" }}>
            <div>
              <h3 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-heading)" }}>
                Calculadora e Conversor de Obras
              </h3>
              <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
                Ferramenta auxiliar para cubagem de piscinas, cálculo de revestimentos e dosagem de insumos.
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
            {[
              { id: "PISCINA", icon: "💧", label: "Volume de Piscina" },
              { id: "REVESTIMENTO", icon: "🧱", label: "Área de Revestimento" },
              { id: "CONCRETO", icon: "🏗️", label: "Dosagem de Concreto" },
              { id: "CONVERSOR", icon: "🔄", label: "Conversor de Medidas" }
            ].map((tab) => (
              <button
                key={tab.id}
                className="help-tab-btn"
                style={{
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: activeSubTab === tab.id ? "var(--primary)" : "rgba(0,0,0,0.03)",
                  color: activeSubTab === tab.id ? "#fff" : "var(--text-muted)",
                }}
                onClick={() => setActiveSubTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="grid-cols-2">
            {/* Painel de Entrada (Esquerda) */}
            <div className="card">
              {activeSubTab === "PISCINA" && (
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Cálculo de Cubagem da Piscina</h4>
                  <div className="form-group" style={{ marginBottom: "16px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Formato da Piscina</label>
                    <select
                      className="form-control"
                      style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                      value={piscinaForma}
                      onChange={(e) => setPiscinaForma(e.target.value)}
                    >
                      <option value="RETANGULAR">Retangular / Quadrada</option>
                      <option value="REDONDA">Redonda / Cilíndrica</option>
                      <option value="OVAL">Oval</option>
                    </select>
                  </div>

                  {piscinaForma !== "REDONDA" ? (
                    <>
                      <div className="form-group" style={{ marginBottom: "16px" }}>
                        <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Comprimento (m)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                          placeholder="0.00"
                          value={pComp}
                          onChange={(e) => setPComp(e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: "16px" }}>
                        <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Largura (m)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                          placeholder="0.00"
                          value={pLarg}
                          onChange={(e) => setPLarg(e.target.value)}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="form-group" style={{ marginBottom: "16px" }}>
                      <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Diâmetro da Piscina (m)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                        placeholder="0.00"
                        value={pDiam}
                        onChange={(e) => setPDiam(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: "16px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Profundidade Média (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                      placeholder="0.00"
                      value={pProf}
                      onChange={(e) => setPProf(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {activeSubTab === "REVESTIMENTO" && (
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Cálculo de Área de Revestimento (Fundo + Paredes)</h4>
                  <div className="form-group" style={{ marginBottom: "16px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Comprimento da Piscina (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                      placeholder="0.00"
                      value={rComp}
                      onChange={(e) => setRComp(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: "16px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Largura da Piscina (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                      placeholder="0.00"
                      value={rLarg}
                      onChange={(e) => setRLarg(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: "16px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Profundidade Média (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                      placeholder="0.00"
                      value={rProf}
                      onChange={(e) => setRProf(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: "16px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Margem de Perda / Recortes (%)</label>
                    <select
                      className="form-control"
                      style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                      value={rMargem}
                      onChange={(e) => setRMargem(e.target.value)}
                    >
                      <option value="5">5% (Recortes simples)</option>
                      <option value="10">10% (Padrão sugerido)</option>
                      <option value="15">15% (Projetos complexos)</option>
                      <option value="0">Sem Margem (0%)</option>
                    </select>
                  </div>
                </div>
              )}

              {activeSubTab === "CONCRETO" && (
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Dosagem de Insumos de Concreto</h4>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
                    Calcula a quantidade de cimento, areia e brita para preenchimento de estrutura em concreto (traço padrão 1:2:3).
                  </p>
                  <div className="form-group" style={{ marginBottom: "16px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Volume Total de Concreto (m³)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                      placeholder="0.00"
                      value={cVol}
                      onChange={(e) => setCVol(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {activeSubTab === "CONVERSOR" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <h4 style={{ fontSize: "16px", fontWeight: 700 }}>Conversão Direta de Unidades</h4>
                  <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Volume (Metros Cúbicos ↔ Litros)</label>
                    <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                      <input
                        type="number"
                        className="form-control"
                        style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                        placeholder="m³"
                        value={convM3}
                        onChange={(e) => handleConvM3Change(e.target.value)}
                      />
                      <span style={{ alignSelf: "center", fontWeight: 700 }}>=</span>
                      <input
                        type="number"
                        className="form-control"
                        style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                        placeholder="Litros"
                        value={convLitro}
                        onChange={(e) => handleConvLitroChange(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Comprimento (Metros ↔ Polegadas)</label>
                    <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                      <input
                        type="number"
                        className="form-control"
                        style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                        placeholder="Metros"
                        value={convMetros}
                        onChange={(e) => handleConvMetrosChange(e.target.value)}
                      />
                      <span style={{ alignSelf: "center", fontWeight: 700 }}>=</span>
                      <input
                        type="number"
                        className="form-control"
                        style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                        placeholder="Polegadas"
                        value={convPolegadas}
                        onChange={(e) => handleConvPolegadasChange(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Área (Metros Quadrados ↔ Pés Quadrados)</label>
                    <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                      <input
                        type="number"
                        className="form-control"
                        style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                        placeholder="m²"
                        value={convM2}
                        onChange={(e) => handleConvM2Change(e.target.value)}
                      />
                      <span style={{ alignSelf: "center", fontWeight: 700 }}>=</span>
                      <input
                        type="number"
                        className="form-control"
                        style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                        placeholder="sq ft"
                        value={convPesSq}
                        onChange={(e) => handleConvPesSqChange(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Líquidos (Litros ↔ Galões Americanos)</label>
                    <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                      <input
                        type="number"
                        className="form-control"
                        style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                        placeholder="Litros"
                        value={convLGalao}
                        onChange={(e) => handleConvLGalaoChange(e.target.value)}
                      />
                      <span style={{ alignSelf: "center", fontWeight: 700 }}>=</span>
                      <input
                        type="number"
                        className="form-control"
                        style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                        placeholder="Galões (US)"
                        value={convGalao}
                        onChange={(e) => handleConvGalaoChange(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Resultados Estimados (Direita) */}
            <div className="card" style={{ backgroundColor: "#fafafb", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <h4 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-heading)", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginBottom: "20px" }}>
                  Resultados da Simulação
                </h4>

                {activeSubTab === "PISCINA" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-color)", paddingBottom: "8px" }}>
                      <span style={{ color: "var(--text-muted)" }}>Formato Escolhido:</span>
                      <strong style={{ color: "var(--text-heading)" }}>{piscinaForma}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-color)", paddingBottom: "8px" }}>
                      <span style={{ color: "var(--text-muted)" }}>Volume em Metros Cúbicos:</span>
                      <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--primary)" }}>{pRes.m3.toFixed(3)} m³</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-color)", paddingBottom: "8px" }}>
                      <span style={{ color: "var(--text-muted)" }}>Volume Estimado em Litros:</span>
                      <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--secondary)" }}>
                        {pRes.litros.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} L
                      </span>
                    </div>
                    
                    <div style={{ backgroundColor: "var(--info-bg)", padding: "12px 16px", borderRadius: "6px", border: "1px solid #bfdbfe", marginTop: "10px" }}>
                      <span style={{ fontSize: "12px", color: "var(--info)", display: "block", fontWeight: 600, marginBottom: "4px" }}>Nota Operacional:</span>
                      <span style={{ fontSize: "12px", color: "var(--text-main)" }}>
                        A cubagem calculada considera a profundidade média. Piscinas com prainhas ou degraus podem apresentar variação no volume final real de abastecimento.
                      </span>
                    </div>
                  </div>
                )}

                {activeSubTab === "REVESTIMENTO" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-color)", paddingBottom: "8px" }}>
                      <span style={{ color: "var(--text-muted)" }}>Área Líquida da Piscina:</span>
                      <strong style={{ color: "var(--text-heading)", fontSize: "16px" }}>{rRes.base.toFixed(2)} m²</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-color)", paddingBottom: "8px" }}>
                      <span style={{ color: "var(--text-muted)" }}>Margem Aplicada:</span>
                      <strong style={{ color: "var(--text-heading)" }}>{rMargem}%</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-color)", paddingBottom: "8px" }}>
                      <span style={{ color: "var(--text-muted)" }}>Total com Margem (Compra):</span>
                      <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--primary)" }}>{rRes.comMargem.toFixed(2)} m²</span>
                    </div>

                    <div style={{ backgroundColor: "#fef8e7", padding: "12px 16px", borderRadius: "6px", border: "1px solid #fde6b3", marginTop: "10px" }}>
                      <span style={{ fontSize: "12px", color: "var(--warning)", display: "block", fontWeight: 600, marginBottom: "4px" }}>Dica de Instalação:</span>
                      <span style={{ fontSize: "12px", color: "var(--text-main)" }}>
                        A margem de recortes de 10% é ideal para pastilhas e azulejos. Para cerâmicas de grandes formatos instaladas em diagonal, prefira a margem de 15% para evitar falta de material.
                      </span>
                    </div>
                  </div>
                )}

                {activeSubTab === "CONCRETO" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-color)", paddingBottom: "8px" }}>
                      <span style={{ color: "var(--text-muted)" }}>Cimento (Sacos de 50kg):</span>
                      <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-heading)" }}>
                        {Math.ceil(cRes.cimento)} sacos
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-color)", paddingBottom: "8px" }}>
                      <span style={{ color: "var(--text-muted)" }}>Areia Média Necessária:</span>
                      <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-heading)" }}>
                        {cRes.areia.toFixed(2)} m³
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-color)", paddingBottom: "8px" }}>
                      <span style={{ color: "var(--text-muted)" }}>Brita (Pedra 1) Necessária:</span>
                      <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-heading)" }}>
                        {cRes.brita.toFixed(2)} m³
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-color)", paddingBottom: "8px" }}>
                      <span style={{ color: "var(--text-muted)" }}>Água Estimada para Mistura:</span>
                      <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--secondary)" }}>
                        {cRes.agua.toFixed(0)} Litros
                      </span>
                    </div>

                    <div style={{ backgroundColor: "var(--success-bg)", padding: "12px 16px", borderRadius: "6px", border: "1px solid #a7f3d0", marginTop: "10px" }}>
                      <span style={{ fontSize: "12px", color: "var(--success)", display: "block", fontWeight: 600, marginBottom: "4px" }}>Nota do Traço (1:2:3):</span>
                      <span style={{ fontSize: "12px", color: "var(--text-main)" }}>
                        As proporções equivalem a aproximadamente 1 balde de cimento para 2 baldes de areia e 3 baldes de brita. Ideal para vigas, cintas e fundações estruturais da piscina.
                      </span>
                    </div>
                  </div>
                )}

                {activeSubTab === "CONVERSOR" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", justifyContent: "center", alignItems: "center", minHeight: "150px" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary)" }}><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)", marginTop: "10px", textAlign: "center" }}>
                      Digite os valores nos campos ao lado para obter a conversão instantânea das medidas no pulso.
                    </p>
                  </div>
                )}
              </div>

              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", marginTop: "20px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", textAlign: "center" }}>
                  JHOSTON TEC Piscinas v1.1 — Fórmulas de Construção Civil
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CALCULADORA FINANCEIRA */}
      {mainTab === "FINANCEIRA" && (
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
      )}
    </div>
  );
}
