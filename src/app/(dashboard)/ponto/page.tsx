"use client";

import { useEffect, useState, startTransition } from "react";
import { getPontoData, salvarPonto, getPontosPendentes, aprovarRejeitarPonto, aprovarPontosEmLote, salvarPontosLoteDias, criarFuncionarioRapido } from "./actions";
import { getSession } from "@/app/login/actions";

interface Obra {
  id: number;
  nome: string;
}

interface Session {
  userId: number;
  userName: string;
  userRole: "MASTER" | "ESCRITORIO" | "CAMPO";
}

interface PontoRow {
  funcionarioId: number;
  nome: string;
  cargo: string;
  tipoDia: string;
  horasTrabalhadas: string;
  percentualPago: string;
  observacoes: string;
  statusAprovacao?: string;
}

interface PontoPendente {
  id: number;
  funcionario: { nome: string; cargo: string };
  obra: { nome: string };
  data: string;
  tipoDia: string;
  horasTrabalhadas: number;
  percentualPago: number;
  observacoes: string | null;
  criadoPor: { nome: string } | null;
}

interface ImportedDay {
  dataStr: string;
  rows: PontoRow[];
}

export default function PontoPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [dataStr, setDataStr] = useState(new Date().toISOString().split("T")[0]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [funcionariosGlobais, setFuncionariosGlobais] = useState<any[]>([]);
  const [selectedObraId, setSelectedObraId] = useState("");
  const [pontoRows, setPontoRows] = useState<PontoRow[]>([]);
  const [pontosPendentes, setPontosPendentes] = useState<PontoPendente[]>([]);
  const [pontoTab, setPontoTab] = useState<"lancar" | "aprovar">("lancar");
  
  const [isSaved, setIsSaved] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // WhatsApp Import Modal States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [whatsappText, setWhatsappText] = useState("");
  const [importedObraId, setImportedObraId] = useState("");
  const [importedDias, setImportedDias] = useState<ImportedDay[]>([]);
  
  // Custom name mappings to handle spelling mistakes (whatsappName -> employeeId)
  const [nameMappings, setNameMappings] = useState<Record<string, number>>({});
  // List of unique names from text that aren't matched yet
  const [unidentifiedNames, setUnidentifiedNames] = useState<string[]>([]);
  // Inline forms state for creating new employees from unrecognized names
  const [newEmployeeForms, setNewEmployeeForms] = useState<Record<string, { cargo: string; diaria: string; adicional: string; pix: string }>>({});

  // Carregar dados iniciais e sessão
  useEffect(() => {
    getSession().then((sess) => {
      if (sess) {
        setSession(sess as any);
      }
    });

    getPontoData(new Date().toISOString().split("T")[0], 0).then((res) => {
      setObras(res.obras);
      setFuncionariosGlobais(res.funcionarios);
    });
  }, []);

  const loadPontoForm = () => {
    if (!selectedObraId) {
      setPontoRows([]);
      return;
    }

    setIsLoading(true);
    getPontoData(dataStr, parseInt(selectedObraId)).then((res) => {
      const rows = res.funcionarios.map((f) => {
        const existente = res.pontosExistentes.find((p) => p.funcionarioId === f.id);
        return {
          funcionarioId: f.id,
          nome: f.nome,
          cargo: f.cargo,
          tipoDia: existente ? existente.tipoDia : "NA",
          horasTrabalhadas: existente ? existente.horasTrabalhadas.toString() : "0",
          percentualPago: existente ? existente.percentualPago.toString() : "100",
          observacoes: existente ? existente.observacoes || "" : "",
          statusAprovacao: existente ? existente.statusAprovacao : undefined,
        };
      });

      setPontoRows(rows);
      setIsLoading(false);
    });
  };

  const loadPendentes = () => {
    if (session?.userRole === "ESCRITORIO" || session?.userRole === "MASTER") {
      getPontosPendentes().then((res) => {
        const mapped = res.map((p) => ({
          ...p,
          data: new Date(p.data).toISOString().split("T")[0],
        }));
        setPontosPendentes(mapped as any);
      });
    }
  };

  useEffect(() => {
    loadPontoForm();
    setIsSaved(false);
  }, [dataStr, selectedObraId]);

  useEffect(() => {
    loadPendentes();
  }, [session, pontoTab]);

  const handleRowChange = (index: number, field: keyof PontoRow, value: string) => {
    const updated = [...pontoRows];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === "tipoDia" && value !== "TRABALHO" && value !== "VIAGEM" && value !== "CHUVA") {
      updated[index].horasTrabalhadas = "0";
    } else if (field === "tipoDia" && (value === "TRABALHO" || value === "VIAGEM" || value === "CHUVA") && updated[index].horasTrabalhadas === "0") {
      updated[index].horasTrabalhadas = "8";
    }
    
    setPontoRows(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedObraId) {
      alert("Por favor, selecione uma obra.");
      return;
    }

    const entries = pontoRows.map((r) => ({
      funcionarioId: r.funcionarioId,
      tipoDia: r.tipoDia,
      horasTrabalhadas: parseFloat(r.horasTrabalhadas) || 0,
      percentualPago: parseFloat(r.percentualPago) || 100,
      observacoes: r.observacoes,
    }));

    startTransition(async () => {
      const res = await salvarPonto(dataStr, parseInt(selectedObraId), entries);
      if (res.success) {
        setSaveStatus(res.statusAprovacao || "APROVADO");
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 4000);
        loadPontoForm();
      } else {
        alert(res.error || "Erro ao salvar o ponto.");
      }
    });
  };

  // Funções de Aprovação
  const handleAprovarPonto = async (id: number) => {
    const res = await aprovarRejeitarPonto(id, "APROVADO");
    if (res.success) {
      loadPendentes();
    } else {
      alert(res.error);
    }
  };

  const handleRejeitarPonto = async (id: number) => {
    if (confirm("Tem certeza que deseja rejeitar este registro de ponto?")) {
      const res = await aprovarRejeitarPonto(id, "REJEITADO");
      if (res.success) {
        loadPendentes();
      } else {
        alert(res.error);
      }
    }
  };

  const handleAprovarTodos = async () => {
    if (confirm(`Deseja aprovar todos os ${pontosPendentes.length} pontos pendentes em lote?`)) {
      const ids = pontosPendentes.map((p) => p.id);
      const res = await aprovarPontosEmLote(ids);
      if (res.success) {
        loadPendentes();
      }
    }
  };

  // --- LOGICA DE PARSER DO WHATSAPP ---

  const getUniqueNamesFromText = (text: string) => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];

    let obraLineIndex = -1;
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i].toLowerCase();
      const cleanLine = line.replace("obra", "").replace("projeto", "").trim();
      const matched = obras.find(
        (o) =>
          o.nome.toLowerCase().includes(cleanLine) ||
          cleanLine.includes(o.nome.toLowerCase())
      );
      if (matched) {
        obraLineIndex = i;
        break;
      }
    }
    const contentLines = obraLineIndex >= 0 ? lines.slice(obraLineIndex + 1) : lines;

    const dateRegex = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/;
    const names = new Set<string>();

    for (const line of contentLines) {
      if (!line.match(dateRegex)) {
        names.add(line);
      }
    }
    return Array.from(names);
  };

  const getUnidentifiedNames = (text: string, currentMappings: Record<string, number>) => {
    const uniqueNames = getUniqueNamesFromText(text);
    return uniqueNames.filter((name) => {
      if (currentMappings[name] !== undefined) return false;

      const matched = funcionariosGlobais.find((f) => {
        const fNomeLow = f.nome.toLowerCase();
        const nameLow = name.toLowerCase();
        return (
          fNomeLow.includes(nameLow) ||
          nameLow.includes(fNomeLow) ||
          fNomeLow.split(" ").some((part: string) => part === nameLow) ||
          nameLow.split(" ").some((part: string) => part === fNomeLow)
        );
      });
      return !matched;
    });
  };

  const handleParseWhatsappText = () => {
    if (!whatsappText.trim()) {
      alert("Cole o texto da mensagem para processar.");
      return;
    }

    const unrecognized = getUnidentifiedNames(whatsappText, nameMappings);
    if (unrecognized.length > 0) {
      setUnidentifiedNames(unrecognized);
      const initialForms: Record<string, any> = {};
      unrecognized.forEach(name => {
        initialForms[name] = { cargo: "Ajudante", diaria: "150", adicional: "50", pix: "" };
      });
      setNewEmployeeForms(initialForms);
      return;
    }

    generateImportedPreview(nameMappings);
  };

  const generateImportedPreview = (mappings: Record<string, number>) => {
    const lines = whatsappText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    let matchedObraId = importedObraId;
    let obraLineIndex = -1;

    if (!matchedObraId) {
      for (let i = 0; i < Math.min(3, lines.length); i++) {
        const line = lines[i].toLowerCase();
        const cleanLine = line.replace("obra", "").replace("projeto", "").trim();
        const matched = obras.find(
          (o) =>
            o.nome.toLowerCase().includes(cleanLine) ||
            cleanLine.includes(o.nome.toLowerCase())
        );
        if (matched) {
          matchedObraId = matched.id.toString();
          obraLineIndex = i;
          break;
        }
      }
    }

    const contentLines = obraLineIndex >= 0 ? lines.slice(obraLineIndex + 1) : lines;

    const dateRegex = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/;
    const parsedDays: { dataStr: string; funcionariosMarcados: string[] }[] = [];
    let currentDay: { dataStr: string; funcionariosMarcados: string[] } | null = null;

    for (const line of contentLines) {
      const dateMatch = line.match(dateRegex);
      if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]);
        const year = dateMatch[3] ? parseInt(dateMatch[3]) : new Date().getFullYear();

        const dateObj = new Date(Date.UTC(year, month - 1, day));
        const formattedDate = dateObj.toISOString().split("T")[0];

        currentDay = {
          dataStr: formattedDate,
          funcionariosMarcados: [],
        };
        parsedDays.push(currentDay);
      } else if (currentDay) {
        currentDay.funcionariosMarcados.push(line);
      }
    }

    const resultDays = parsedDays.map((day) => {
      const rows = funcionariosGlobais.map((f) => {
        const fNomeLow = f.nome.toLowerCase();

        const foiMencionado = day.funcionariosMarcados.some((mencao) => {
          if (mappings[mencao] !== undefined) {
            return mappings[mencao] === f.id;
          }

          const mencaoLow = mencao.toLowerCase();
          return (
            fNomeLow.includes(mencaoLow) ||
            mencaoLow.includes(fNomeLow) ||
            fNomeLow.split(" ").some((part: string) => part === mencaoLow) ||
            mencaoLow.split(" ").some((part: string) => part === fNomeLow)
          );
        });

        return {
          funcionarioId: f.id,
          nome: f.nome,
          cargo: f.cargo,
          tipoDia: foiMencionado ? "TRABALHO" : "NA",
          horasTrabalhadas: foiMencionado ? "8" : "0",
          percentualPago: "100",
          observacoes: foiMencionado ? "" : "N/A - Não citado na mensagem",
        };
      });

      return {
        dataStr: day.dataStr,
        rows,
      };
    });

    setImportedObraId(matchedObraId);
    setImportedDias(resultDays);
    setUnidentifiedNames([]);
  };

  const handleCreateNewAndMap = (whatsappName: string) => {
    const form = newEmployeeForms[whatsappName];
    if (!form || !form.cargo || !form.diaria) {
      alert("Por favor preencha cargo e diária.");
      return;
    }

    startTransition(async () => {
      const res = await criarFuncionarioRapido({
        nome: whatsappName,
        cargo: form.cargo,
        diariaPadrao: parseFloat(form.diaria) || 150,
        adicionalMotorista: parseFloat(form.adicional) || 0,
        pix: form.pix,
      });

      if (res.success && res.funcionario) {
        const newEmp = res.funcionario;
        setFuncionariosGlobais(prev => [...prev, newEmp]);
        const updatedMappings = { ...nameMappings, [whatsappName]: newEmp.id };
        setNameMappings(updatedMappings);
        
        const remaining = unidentifiedNames.filter(n => n !== whatsappName);
        setUnidentifiedNames(remaining);

        alert(`Funcionário ${newEmp.nome} cadastrado com sucesso!`);
        
        if (remaining.length === 0) {
          generateImportedPreview(updatedMappings);
        }
      } else {
        alert(res.error || "Erro ao cadastrar.");
      }
    });
  };

  const handleMapToExisting = (whatsappName: string, employeeIdStr: string) => {
    if (!employeeIdStr) return;
    
    const empId = parseInt(employeeIdStr);
    const updatedMappings = { ...nameMappings, [whatsappName]: empId };
    setNameMappings(updatedMappings);

    const remaining = unidentifiedNames.filter(n => n !== whatsappName);
    setUnidentifiedNames(remaining);

    if (remaining.length === 0) {
      generateImportedPreview(updatedMappings);
    }
  };

  const handleImportedRowChange = (dayIndex: number, rowIndex: number, field: keyof PontoRow, value: string) => {
    const updated = [...importedDias];
    const updatedRows = [...updated[dayIndex].rows];
    updatedRows[rowIndex] = { ...updatedRows[rowIndex], [field]: value };

    if (field === "tipoDia" && value !== "TRABALHO" && value !== "VIAGEM" && value !== "CHUVA") {
      updatedRows[rowIndex].horasTrabalhadas = "0";
    } else if (field === "tipoDia" && (value === "TRABALHO" || value === "VIAGEM" || value === "CHUVA") && updatedRows[rowIndex].horasTrabalhadas === "0") {
      updatedRows[rowIndex].horasTrabalhadas = "8";
    }

    updated[dayIndex] = { ...updated[dayIndex], rows: updatedRows };
    setImportedDias(updated);
  };

  const handleSaveImportedDays = () => {
    if (!importedObraId) {
      alert("Por favor, selecione uma obra para associar a escala.");
      return;
    }

    const payload = importedDias.map((dia) => ({
      dataStr: dia.dataStr,
      entries: dia.rows.map((r) => ({
        funcionarioId: r.funcionarioId,
        tipoDia: r.tipoDia,
        horasTrabalhadas: parseFloat(r.horasTrabalhadas) || 0,
        percentualPago: parseFloat(r.percentualPago) || 100,
        observacoes: r.observacoes,
      })),
    }));

    startTransition(async () => {
      const res = await salvarPontosLoteDias(parseInt(importedObraId), payload);
      if (res.success) {
        alert("Lote de pontos lançado com sucesso!");
        setIsImportModalOpen(false);
        setWhatsappText("");
        setImportedDias([]);
        setSelectedObraId(importedObraId);
        loadPontoForm();
      } else {
        alert(res.error || "Erro ao salvar lote de pontos.");
      }
    });
  };

  const ehAdmin = session?.userRole === "ESCRITORIO" || session?.userRole === "MASTER";

  return (
    <div>
      <div className="flex-row-between">
        <div>
          <h3 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-heading)" }}>
            Controle de Ponto Administrativo
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
            Lançamento de presença de diaristas e validação de pontos em lote.
          </p>
        </div>

        {ehAdmin && (
          <button
            className="btn btn-secondary"
            onClick={() => {
              setIsImportModalOpen(true);
              setWhatsappText("");
              setImportedDias([]);
              setImportedObraId("");
              setUnidentifiedNames([]);
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Importar Escala WhatsApp
          </button>
        )}
      </div>

      {ehAdmin && (
        <div style={{ display: "flex", gap: "10px", margin: "16px 0 24px 0", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
          <button
            onClick={() => setPontoTab("lancar")}
            className={`btn ${pontoTab === "lancar" ? "btn-primary" : "btn-secondary"} btn-sm`}
          >
            Lançar Ponto
          </button>
          <button
            onClick={() => setPontoTab("aprovar")}
            className={`btn ${pontoTab === "aprovar" ? "btn-primary" : "btn-secondary"} btn-sm`}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            Aprovações Pendentes
            {pontosPendentes.length > 0 && (
              <span style={{ backgroundColor: "var(--error)", color: "white", padding: "2px 6px", borderRadius: "9999px", fontSize: "10px", fontWeight: 700 }}>
                {pontosPendentes.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* --- ABA DE LANÇAMENTO --- */}
      {pontoTab === "lancar" && (
        <div>
          {/* Seletores */}
          <div className="filters-bar">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Data do Ponto</label>
              <input
                type="date"
                className="form-control"
                value={dataStr}
                onChange={(e) => setDataStr(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Obra / Centro de Custo</label>
              <select
                className="form-control"
                value={selectedObraId}
                onChange={(e) => setSelectedObraId(e.target.value)}
              >
                <option value="">-- Selecione uma Obra --</option>
                {obras.map((obra) => (
                  <option key={obra.id} value={obra.id}>
                    {obra.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isSaved && (
            <div
              style={{
                backgroundColor: saveStatus === "PENDENTE" ? "var(--warning-bg)" : "var(--success-bg)",
                color: saveStatus === "PENDENTE" ? "var(--warning)" : "var(--success)",
                padding: "16px",
                borderRadius: "var(--radius-md)",
                marginBottom: "24px",
                fontWeight: 600,
                fontSize: "14px",
                border: `1px solid ${saveStatus === "PENDENTE" ? "var(--warning)" : "var(--success)"}`,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              {saveStatus === "PENDENTE"
                ? "Folha de ponto enviada com sucesso! Aguardando aprovação do escritório."
                : "Folha de ponto salva e aprovada automaticamente!"}
            </div>
          )}

          {selectedObraId ? (
            <form onSubmit={handleSubmit}>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Funcionário</th>
                      <th>Cargo</th>
                      <th style={{ width: "220px" }}>Status do Dia</th>
                      <th style={{ width: "130px" }}>Horas</th>
                      <th>Observações / Ocorrências</th>
                      {ehAdmin && <th style={{ width: "130px" }}>Status Aprov.</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={ehAdmin ? 6 : 5} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                          Carregando dados...
                        </td>
                      </tr>
                    ) : pontoRows.length === 0 ? (
                      <tr>
                        <td colSpan={ehAdmin ? 6 : 5} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                          Nenhum funcionário ativo cadastrado no sistema.
                        </td>
                      </tr>
                    ) : (
                      pontoRows.map((row, index) => (
                        <tr key={row.funcionarioId}>
                          <td style={{ fontWeight: 600, color: "var(--text-heading)" }}>{row.nome}</td>
                          <td>
                            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{row.cargo}</span>
                          </td>
                          <td>
                            <select
                              className="form-control"
                              value={row.tipoDia}
                              onChange={(e) => handleRowChange(index, "tipoDia", e.target.value)}
                            >
                              <option value="TRABALHO">Dia Trabalhado</option>
                              <option value="VIAGEM">V - Viagem</option>
                              <option value="CHUVA">Dia Chuvoso</option>
                              <option value="NA">N/A - Não Aplicável</option>
                            </select>

                            {row.tipoDia === "CHUVA" && (
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                                <span style={{ fontSize: "11px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Pagar (%):</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="10"
                                  className="form-control"
                                  style={{ width: "65px", height: "24px", padding: "2px 4px", fontSize: "12px" }}
                                  value={row.percentualPago}
                                  onChange={(e) => handleRowChange(index, "percentualPago", e.target.value)}
                                  required
                                />
                              </div>
                            )}
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="24"
                              className="form-control"
                              value={row.horasTrabalhadas}
                              onChange={(e) => handleRowChange(index, "horasTrabalhadas", e.target.value)}
                              disabled={row.tipoDia !== "TRABALHO" && row.tipoDia !== "VIAGEM" && row.tipoDia !== "CHUVA"}
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Ex: atraso, hora extra, etc."
                              value={row.observacoes}
                              onChange={(e) => handleRowChange(index, "observacoes", e.target.value)}
                            />
                          </td>
                          {ehAdmin && (
                            <td>
                              {row.statusAprovacao ? (
                                <span className={`badge ${row.statusAprovacao === "APROVADO" ? "badge-success" : row.statusAprovacao === "PENDENTE" ? "badge-warning" : "badge-danger"}`}>
                                  {row.statusAprovacao}
                                </span>
                              ) : (
                                <em style={{ color: "var(--text-muted)", fontSize: "12px" }}>Não lançado</em>
                              )}
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" className="btn btn-primary" disabled={isLoading || pontoRows.length === 0}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px" }}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  {session?.userRole === "CAMPO" ? "Enviar Ponto para Validação" : "Salvar e Aprovar Ponto"}
                </button>
              </div>
            </form>
          ) : (
            <div className="card" style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)", borderStyle: "dashed", borderWidth: "2px" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)", marginBottom: "16px" }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <p style={{ fontSize: "16px", fontWeight: 500 }}>Selecione uma obra acima para lançar a folha de ponto.</p>
            </div>
          )}
        </div>
      )}

      {/* --- ABA DE APROVAÇÃO --- */}
      {ehAdmin && pontoTab === "aprovar" && (
        <div>
          {pontosPendentes.length > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
              <button className="btn btn-primary btn-sm" onClick={handleAprovarTodos}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px" }}><polyline points="20 6 9 17 4 12"/></svg>
                Aprovar Todos em Lote ({pontosPendentes.length})
              </button>
            </div>
          )}

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Obra</th>
                  <th>Funcionário</th>
                  <th>Status do Dia</th>
                  <th>Horas</th>
                  <th>Relato do Campo</th>
                  <th style={{ width: "200px", textAlign: "right" }}>Validação</th>
                </tr>
              </thead>
              <tbody>
                {pontosPendentes.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
                      Nenhum registro de ponto pendente de aprovação no momento.
                    </td>
                  </tr>
                ) : (
                  pontosPendentes.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{formatDateBR(p.data)}</td>
                      <td>
                        <strong style={{ color: "var(--primary)" }}>{p.obra.nome}</strong>
                      </td>
                      <td style={{ fontWeight: 600 }}>{p.funcionario.nome}</td>
                      <td>
                        <span className={`badge ${
                          p.tipoDia === "TRABALHO" 
                            ? "badge-info" 
                            : p.tipoDia === "VIAGEM" 
                            ? "badge-success" 
                            : p.tipoDia === "CHUVA" 
                            ? "badge-warning" 
                            : "badge-danger"
                        }`}>
                          {p.tipoDia === "CHUVA" ? `Chuva (${p.percentualPago}%)` : p.tipoDia === "VIAGEM" ? "Viagem (V)" : p.tipoDia === "NA" ? "Não Aplicável (N/A)" : p.tipoDia}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{p.horasTrabalhadas}h</td>
                      <td>
                        {p.observacoes || <em style={{ color: "var(--text-muted)" }}>Nenhuma</em>}
                        <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>Enviado por: {p.criadoPor?.nome || "Campo"}</div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "8px" }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleAprovarPonto(p.id)}
                          >
                            Aprovar
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRejeitarPonto(p.id)}
                          >
                            Rejeitar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL DE IMPORTAÇÃO DO WHATSAPP --- */}
      {isImportModalOpen && (
        <div className="modal" style={{ display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="modal-content" style={{ width: "95%", maxWidth: "850px", maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <div className="modal-header">
              <h4 style={{ fontSize: "18px", fontWeight: 700 }}>Importar Frequência do WhatsApp</h4>
              <button
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", fontWeight: "bold" }}
                onClick={() => setIsImportModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* ETAPA 1 */}
              {importedDias.length === 0 && unidentifiedNames.length === 0 && (
                <div>
                  <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "12px" }}>
                    Cole a mensagem enviada pelo encarregado no WhatsApp.
                  </p>
                  <div className="form-group">
                    <textarea
                      className="form-control"
                      rows={10}
                      placeholder={`Exemplo:\nObra Quase Tudo\n06/07\nJosé Roberto\nIann Gabriel\n\n07/07\nJosé Roberto\nWender`}
                      value={whatsappText}
                      onChange={(e) => setWhatsappText(e.target.value)}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                    <button className="btn btn-primary" onClick={handleParseWhatsappText}>
                      Analisar Texto da Mensagem
                    </button>
                  </div>
                </div>
              )}

              {/* ETAPA 2 */}
              {unidentifiedNames.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ backgroundColor: "var(--warning-bg)", color: "var(--warning)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--warning)", fontSize: "14px", fontWeight: 600 }}>
                    ⚠️ Nomes não identificados na mensagem. Vincule a grafia correta ou crie o funcionário:
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {unidentifiedNames.map((name) => (
                      <div key={name} style={{ backgroundColor: "white", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-heading)" }}>
                          WhatsApp: <span style={{ color: "var(--primary)" }}>"{name}"</span>
                        </div>

                        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
                          <div style={{ flex: 1, minWidth: "250px" }}>
                            <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>Associar a existente (Corrigir Grafia):</label>
                            <select
                              className="form-control"
                              onChange={(e) => handleMapToExisting(name, e.target.value)}
                              defaultValue=""
                            >
                              <option value="">-- Selecione o Funcionário Correto --</option>
                              {funcionariosGlobais.map((f) => (
                                <option key={f.id} value={f.id}>
                                  {f.nome} ({f.cargo})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div style={{ borderTop: "1px dashed var(--border-color)", paddingTop: "12px", marginTop: "4px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Ou cadastrar como Novo Funcionário:</span>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginTop: "8px" }}>
                            <input
                              type="text"
                              className="form-control"
                              style={{ height: "30px", fontSize: "12px" }}
                              placeholder="Cargo"
                              value={newEmployeeForms[name]?.cargo || ""}
                              onChange={(e) => setNewEmployeeForms({
                                ...newEmployeeForms,
                                [name]: { ...newEmployeeForms[name], cargo: e.target.value }
                              })}
                            />
                            <input
                              type="number"
                              className="form-control"
                              style={{ height: "30px", fontSize: "12px" }}
                              placeholder="Diária R$"
                              value={newEmployeeForms[name]?.diaria || ""}
                              onChange={(e) => setNewEmployeeForms({
                                ...newEmployeeForms,
                                [name]: { ...newEmployeeForms[name], diaria: e.target.value }
                              })}
                            />
                            <input
                              type="number"
                              className="form-control"
                              style={{ height: "30px", fontSize: "12px" }}
                              placeholder="Adicional R$"
                              value={newEmployeeForms[name]?.adicional || ""}
                              onChange={(e) => setNewEmployeeForms({
                                ...newEmployeeForms,
                                [name]: { ...newEmployeeForms[name], adicional: e.target.value }
                              })}
                            />
                            <input
                              type="text"
                              className="form-control"
                              style={{ height: "30px", fontSize: "12px" }}
                              placeholder="PIX"
                              value={newEmployeeForms[name]?.pix || ""}
                              onChange={(e) => setNewEmployeeForms({
                                ...newEmployeeForms,
                                [name]: { ...newEmployeeForms[name], pix: e.target.value }
                              })}
                            />
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ height: "30px", fontSize: "12px" }}
                              onClick={() => handleCreateNewAndMap(name)}
                            >
                              Salvar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ETAPA 3 */}
              {importedDias.length > 0 && (
                <div>
                  <div style={{ backgroundColor: "#f0fdf4", color: "#166534", padding: "12px", borderRadius: "var(--radius-md)", marginBottom: "16px", fontSize: "14px", fontWeight: 500 }}>
                    🔍 Encontramos <strong>{importedDias.length} datas</strong>. Revise os dados antes de salvar:
                  </div>

                  <div className="form-group" style={{ marginBottom: "20px" }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>Obra Associada</label>
                    <select
                      className="form-control"
                      value={importedObraId}
                      onChange={(e) => setImportedObraId(e.target.value)}
                    >
                      <option value="">-- Selecione a Obra --</option>
                      {obras.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {importedDias.map((dia, dIdx) => (
                      <div key={dia.dataStr} style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", overflow: "hidden", backgroundColor: "#f8fafc" }}>
                        <div style={{ padding: "10px 16px", backgroundColor: "var(--primary-bg)", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", fontWeight: 700, color: "var(--primary)" }}>
                          <span>Data: {formatDateBR(dia.dataStr)}</span>
                          <span style={{ fontSize: "13px", fontWeight: 500 }}>
                            {dia.rows.filter(r => r.tipoDia === "TRABALHO").length} presente(s)
                          </span>
                        </div>

                        <div className="table-container" style={{ margin: 0, border: "none", boxShadow: "none" }}>
                          <table className="table" style={{ fontSize: "13px" }}>
                            <thead>
                              <tr>
                                <th>Funcionário</th>
                                <th style={{ width: "200px" }}>Status</th>
                                <th style={{ width: "80px" }}>Horas</th>
                                <th>Observações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dia.rows.map((row, rIdx) => (
                                <tr key={row.funcionarioId}>
                                  <td style={{ fontWeight: 600 }}>{row.nome}</td>
                                  <td>
                                    <select
                                      className="form-control"
                                      style={{ height: "30px", fontSize: "12px", padding: "2px 6px" }}
                                      value={row.tipoDia}
                                      onChange={(e) => handleImportedRowChange(dIdx, rIdx, "tipoDia", e.target.value)}
                                    >
                                      <option value="TRABALHO">Presente</option>
                                      <option value="VIAGEM">Viagem (V)</option>
                                      <option value="CHUVA">Chuva</option>
                                      <option value="NA">Não Aplicável (N/A)</option>
                                    </select>

                                    {row.tipoDia === "CHUVA" && (
                                      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                                        <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Pagar %:</span>
                                        <input
                                          type="number"
                                          className="form-control"
                                          style={{ width: "55px", height: "20px", fontSize: "11px", padding: "1px 3px" }}
                                          value={row.percentualPago}
                                          onChange={(e) => handleImportedRowChange(dIdx, rIdx, "percentualPago", e.target.value)}
                                          required
                                        />
                                      </div>
                                    )}
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      className="form-control"
                                      style={{ height: "30px", fontSize: "12px", padding: "2px 6px" }}
                                      value={row.horasTrabalhadas}
                                      disabled={row.tipoDia !== "TRABALHO" && row.tipoDia !== "VIAGEM" && row.tipoDia !== "CHUVA"}
                                      onChange={(e) => handleImportedRowChange(dIdx, rIdx, "horasTrabalhadas", e.target.value)}
                                      required
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control"
                                      style={{ height: "30px", fontSize: "12px", padding: "2px 6px" }}
                                      value={row.observacoes}
                                      onChange={(e) => handleImportedRowChange(dIdx, rIdx, "observacoes", e.target.value)}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ borderTop: "1px solid var(--border-color)", padding: "16px 24px" }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  if (importedDias.length > 0 || unidentifiedNames.length > 0) {
                    setImportedDias([]);
                    setUnidentifiedNames([]);
                  } else {
                    setIsImportModalOpen(false);
                  }
                }}
              >
                {importedDias.length > 0 || unidentifiedNames.length > 0 ? "Voltar / Limpar" : "Cancelar"}
              </button>
              {importedDias.length > 0 && (
                <button
                  className="btn btn-primary"
                  onClick={handleSaveImportedDays}
                  disabled={!importedObraId}
                >
                  Confirmar e Lançar {importedDias.length} dias
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const formatDateBR = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
};
