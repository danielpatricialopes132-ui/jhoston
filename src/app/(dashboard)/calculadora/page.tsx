"use client";

import { useState } from "react";
import Link from "next/link";

export default function CalculadoraPage() {
  const [activeSubTab, setActiveSubTab] = useState("PISCINA");

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

    // Área do fundo + 2 * (paredes maiores) + 2 * (paredes menores)
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

  // Cálculos de Concreto (Traço Estrutural Geral 1:2:3)
  const calcConcreto = () => {
    const vol = parseFloat(cVol) || 0;
    
    // Proporções médias p/ 1m³ de concreto estrutural Fck 25MPa:
    // ~7 sacos cimento de 50kg
    // ~0.60 m³ areia média
    // ~0.80 m³ brita (pedra 1)
    // ~180 litros de água
    
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

  const pRes = calcPiscinaVolume();
  const rRes = calcRevestimento();
  const cRes = calcConcreto();

  return (
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
        <button
          className="help-tab-btn"
          style={{
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: 600,
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            backgroundColor: activeSubTab === "PISCINA" ? "var(--primary)" : "rgba(0,0,0,0.03)",
            color: activeSubTab === "PISCINA" ? "#fff" : "var(--text-muted)",
          }}
          onClick={() => setActiveSubTab("PISCINA")}
        >
          💧 Volume de Piscina
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
            backgroundColor: activeSubTab === "REVESTIMENTO" ? "var(--primary)" : "rgba(0,0,0,0.03)",
            color: activeSubTab === "REVESTIMENTO" ? "#fff" : "var(--text-muted)",
          }}
          onClick={() => setActiveSubTab("REVESTIMENTO")}
        >
          🧱 Área de Revestimento
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
            backgroundColor: activeSubTab === "CONCRETO" ? "var(--primary)" : "rgba(0,0,0,0.03)",
            color: activeSubTab === "CONCRETO" ? "#fff" : "var(--text-muted)",
          }}
          onClick={() => setActiveSubTab("CONCRETO")}
        >
          🏗️ Dosagem de Concreto
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
            backgroundColor: activeSubTab === "CONVERSOR" ? "var(--primary)" : "rgba(0,0,0,0.03)",
            color: activeSubTab === "CONVERSOR" ? "#fff" : "var(--text-muted)",
          }}
          onClick={() => setActiveSubTab("CONVERSOR")}
        >
          🔄 Conversor de Medidas
        </button>
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

              {/* Cubos e Litros */}
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

              {/* Comprimento */}
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

              {/* Área */}
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

              {/* Galões */}
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
  );
}
