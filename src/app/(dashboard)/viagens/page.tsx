"use client";

import { useEffect, useState, startTransition } from "react";
import { getViagensData, salvarViagem, deleteViagem, alterarStatusPagamentoDiaria } from "./actions";

interface Obra {
  id: number;
  nome: string;
  clienteNome: string;
}

interface Funcionario {
  id: number;
  nome: string;
  cargo: string;
  diariaPadrao: number;
  adicionalMotorista: number;
}

interface DiariaViagem {
  id: number;
  funcionarioId: number;
  funcionario: {
    nome: string;
    pix: string | null;
  };
  valorCalculado: number;
  foiDirigindo: boolean;
  tipoDiaria: string;
  statusPagamento: string;
}

interface Viagem {
  id: number;
  obra: Obra;
  dataInicio: string;
  dataFim: string;
  motoristaId: number;
  descricao: string | null;
  diariasViagem: DiariaViagem[];
}

export default function ViagensPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [viagens, setViagens] = useState<Viagem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form states
  const [selectedObraId, setSelectedObraId] = useState("");
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split("T")[0]);
  const [dataFim, setDataFim] = useState(new Date().toISOString().split("T")[0]);
  const [selectedMotoristaId, setSelectedMotoristaId] = useState("");
  const [selectedAcompanhantes, setSelectedAcompanhantes] = useState<number[]>([]);
  const [descricao, setDescricao] = useState("");
  
  // Custom travel configuration per participant (INTEIRA / MEIA)
  const [diariaTipos, setDiariaTipos] = useState<Record<number, "INTEIRA" | "MEIA">>({});

  const loadData = () => {
    getViagensData().then((res) => {
      setObras(res.obras);
      setFuncionarios(res.funcionarios);
      // Mapear strings de data
      const mapped = res.viagens.map((v) => ({
        ...v,
        dataInicio: new Date(v.dataInicio).toISOString().split("T")[0],
        dataFim: new Date(v.dataFim).toISOString().split("T")[0],
      }));
      setViagens(mapped as any);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calcular dias de viagem
  const getDiasViagem = () => {
    if (!dataInicio || !dataFim) return 1;
    const start = new Date(dataInicio);
    const end = new Date(dataFim);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 1; // Data fim antes de início
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const dias = getDiasViagem();

  const handleAcompanhanteToggle = (id: number) => {
    setSelectedAcompanhantes((prev) => {
      const exists = prev.includes(id);
      if (exists) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleDiariaTipoChange = (funcId: number, tipo: "INTEIRA" | "MEIA") => {
    setDiariaTipos((prev) => ({
      ...prev,
      [funcId]: tipo,
    }));
  };

  const openModal = () => {
    setSelectedObraId("");
    setDataInicio(new Date().toISOString().split("T")[0]);
    setDataFim(new Date().toISOString().split("T")[0]);
    setSelectedMotoristaId("");
    setSelectedAcompanhantes([]);
    setDescricao("");
    setDiariaTipos({});
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedObraId) {
      setErrorMsg("Selecione a obra de destino.");
      return;
    }
    if (!selectedMotoristaId) {
      setErrorMsg("Selecione o motorista responsável.");
      return;
    }

    const motoristaId = parseInt(selectedMotoristaId);
    
    // Todos os participantes (motorista + acompanhantes)
    const todosIds = Array.from(new Set([motoristaId, ...selectedAcompanhantes]));

    const participantes = todosIds.map((id) => ({
      funcionarioId: id,
      foiDirigindo: id === motoristaId,
      tipoDiaria: diariaTipos[id] || "INTEIRA",
      dias,
    }));

    startTransition(async () => {
      const res = await salvarViagem({
        obraId: parseInt(selectedObraId),
        dataInicio,
        dataFim,
        motoristaId,
        descricao,
        participantes,
      });

      if (res.success) {
        loadData();
        setIsModalOpen(false);
      } else {
        setErrorMsg("Erro ao salvar o registro de viagem.");
      }
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Deseja realmente excluir esta viagem? As diárias calculadas dela também serão excluídas.")) {
      const res = await deleteViagem(id);
      if (res.success) {
        loadData();
      } else {
        alert(res.error);
      }
    }
  };

  const handleStatusChange = async (diariaId: number, currentStatus: string) => {
    const newStatus = currentStatus === "PENDENTE" ? "PAGO" : "PENDENTE";
    const res = await alterarStatusPagamentoDiaria(diariaId, newStatus);
    if (res.success) {
      loadData();
    }
  };

  const formatDateBR = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  // Listar funcionários para acompanhante que não sejam o motorista selecionado
  const acompanhantesDisponiveis = funcionarios.filter(
    (f) => f.id !== parseInt(selectedMotoristaId)
  );

  // Calcular prévia do valor da diária para um funcionário
  const getPreviaDiaria = (f: Funcionario, foiDirigindo: boolean) => {
    const tipo = diariaTipos[f.id] || "INTEIRA";
    let valor = f.diariaPadrao;
    if (foiDirigindo) {
      valor += f.adicionalMotorista;
    }
    if (tipo === "MEIA") {
      valor = valor / 2;
    }
    return valor * dias;
  };

  return (
    <div>
      <div className="flex-row-between">
        <div>
          <h3 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-heading)" }}>
            Controle de Viagens e Diárias
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
            Lance viagens externas de equipes, calculando diárias normais e adicionais de motorista.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openModal}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px" }}><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
          Registrar Viagem
        </button>
      </div>

      {/* Lista de Viagens */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {viagens.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)", borderStyle: "dashed", borderWidth: "2px" }}>
            <p style={{ fontSize: "15px" }}>Nenhuma viagem registrada até o momento.</p>
          </div>
        ) : (
          viagens.map((viagem) => {
            const motoristaNome = funcionarios.find((f) => f.id === viagem.motoristaId)?.nome || "Não identificado";
            return (
              <div className="card" key={viagem.id} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Cabeçalho da Viagem */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                  <div>
                    <h4 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-heading)" }}>
                      Destino: {viagem.obra.nome} (Cliente: {viagem.obra.clienteNome})
                    </h4>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                      Período: <strong>{formatDateBR(viagem.dataInicio)}</strong> a <strong>{formatDateBR(viagem.dataFim)}</strong> | Motorista: <strong>{motoristaNome}</strong>
                    </p>
                    {viagem.descricao && (
                      <p style={{ fontSize: "13px", color: "var(--text-main)", marginTop: "6px", backgroundColor: "#f8fafc", padding: "8px", borderRadius: "var(--radius-sm)", borderLeft: "3px solid var(--primary)" }}>
                        {viagem.descricao}
                      </p>
                    )}
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(viagem.id)}>
                    Excluir Viagem
                  </button>
                </div>

                {/* Diárias Geradas */}
                <div>
                  <h5 style={{ fontSize: "13px", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px", marginBottom: "8px", fontWeight: 600 }}>
                    Diárias dos Participantes
                  </h5>
                  <div className="table-container" style={{ margin: 0, boxShadow: "none" }}>
                    <table className="table" style={{ fontSize: "13px" }}>
                      <thead>
                        <tr>
                          <th>Funcionário</th>
                          <th>Papel</th>
                          <th>Tipo de Diária</th>
                          <th>Valor Calculado</th>
                          <th>Status Pagamento</th>
                          <th style={{ textAlign: "right" }}>Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viagem.diariasViagem.map((diaria) => (
                          <tr key={diaria.id}>
                            <td style={{ fontWeight: 600 }}>{diaria.funcionario.nome}</td>
                            <td>
                              <span className={`badge ${diaria.foiDirigindo ? "badge-success" : "badge-info"}`}>
                                {diaria.foiDirigindo ? "Motorista" : "Passageiro"}
                              </span>
                            </td>
                            <td>{diaria.tipoDiaria === "INTEIRA" ? "Diária Inteira" : "Meia Diária"}</td>
                            <td style={{ fontWeight: 600 }}>{formatCurrency(diaria.valorCalculado)}</td>
                            <td>
                              <span className={`badge ${diaria.statusPagamento === "PAGO" ? "badge-success" : "badge-warning"}`}>
                                {diaria.statusPagamento === "PAGO" ? "Pago" : "Pendente"}
                              </span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button
                                className={`btn btn-sm ${diaria.statusPagamento === "PAGO" ? "btn-secondary" : "btn-primary"}`}
                                onClick={() => handleStatusChange(diaria.id, diaria.statusPagamento)}
                              >
                                {diaria.statusPagamento === "PAGO" ? "Marcar Pendente" : "Marcar Pago"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Registro de Viagem */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "650px" }}>
            <div className="modal-header">
              <h4 style={{ fontSize: "18px", fontWeight: 600 }}>Registrar Nova Viagem</h4>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }} onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                {errorMsg && (
                  <div style={{ backgroundColor: "var(--error-bg)", color: "var(--error)", padding: "12px", borderRadius: "var(--radius-md)", marginBottom: "16px", fontSize: "14px", fontWeight: 500 }}>
                    {errorMsg}
                  </div>
                )}
                
                <div className="form-group">
                  <label className="form-label">Obra de Destino *</label>
                  <select className="form-control" value={selectedObraId} onChange={(e) => setSelectedObraId(e.target.value)} required>
                    <option value="">-- Selecione a Obra --</option>
                    {obras.map((o) => (
                      <option key={o.id} value={o.id}>{o.nome} (Cliente: {o.clienteNome})</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Data de Início *</label>
                    <input type="date" className="form-control" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Data de Fim *</label>
                    <input type="date" className="form-control" value={dataFim} onChange={(e) => setDataFim(e.target.value)} required />
                  </div>
                </div>

                <div style={{ backgroundColor: "var(--info-bg)", padding: "10px", borderRadius: "var(--radius-md)", marginBottom: "16px", fontSize: "13px", color: "var(--info)", fontWeight: 500 }}>
                  Duração calculada: <strong>{dias} dia(s)</strong> de viagem.
                </div>

                <div className="form-group">
                  <label className="form-label">Motorista (Dirige na viagem e ganha adicional) *</label>
                  <select className="form-control" value={selectedMotoristaId} onChange={(e) => {
                    setSelectedMotoristaId(e.target.value);
                    setSelectedAcompanhantes((prev) => prev.filter((id) => id !== parseInt(e.target.value)));
                  }} required>
                    <option value="">-- Selecione o Motorista --</option>
                    {funcionarios.map((f) => (
                      <option key={f.id} value={f.id}>{f.nome} ({f.cargo})</option>
                    ))}
                  </select>
                </div>

                {selectedMotoristaId && (
                  <div className="form-group">
                    <label className="form-label">Equipe Acompanhante (Passageiros)</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", border: "1px solid var(--border-color)", padding: "12px", borderRadius: "var(--radius-md)", maxHeight: "150px", overflowY: "auto", backgroundColor: "#fff" }}>
                      {acompanhantesDisponiveis.map((f) => (
                        <label key={f.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={selectedAcompanhantes.includes(f.id)}
                            onChange={() => handleAcompanhanteToggle(f.id)}
                            style={{ width: "16px", height: "16px" }}
                          />
                          <span>{f.nome}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prévia de Diárias */}
                {selectedMotoristaId && (
                  <div style={{ marginTop: "20px" }}>
                    <h5 style={{ fontSize: "13px", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px", marginBottom: "8px", fontWeight: 600 }}>
                      Configuração e Prévia de Diárias
                    </h5>
                    <div className="table-container" style={{ margin: 0, boxShadow: "none" }}>
                      <table className="table" style={{ fontSize: "13px" }}>
                        <thead>
                          <tr>
                            <th>Nome</th>
                            <th>Papel</th>
                            <th style={{ width: "150px" }}>Tipo Diária</th>
                            <th>Total Previsto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Motorista */}
                          {(() => {
                            const mot = funcionarios.find((f) => f.id === parseInt(selectedMotoristaId));
                            if (!mot) return null;
                            return (
                              <tr key={mot.id}>
                                <td style={{ fontWeight: 600 }}>{mot.nome}</td>
                                <td><span className="badge badge-success">Motorista</span></td>
                                <td>
                                  <select className="form-control" style={{ padding: "4px 8px", fontSize: "12px" }} value={diariaTipos[mot.id] || "INTEIRA"} onChange={(e) => handleDiariaTipoChange(mot.id, e.target.value as any)}>
                                    <option value="INTEIRA">Inteira</option>
                                    <option value="MEIA">Meia</option>
                                  </select>
                                </td>
                                <td style={{ fontWeight: 600 }}>{formatCurrency(getPreviaDiaria(mot, true))}</td>
                              </tr>
                            );
                          })()}
                          {/* Acompanhantes */}
                          {selectedAcompanhantes.map((id) => {
                            const f = funcionarios.find((item) => item.id === id);
                            if (!f) return null;
                            return (
                              <tr key={f.id}>
                                <td style={{ fontWeight: 600 }}>{f.nome}</td>
                                <td><span className="badge badge-info">Passageiro</span></td>
                                <td>
                                  <select className="form-control" style={{ padding: "4px 8px", fontSize: "12px" }} value={diariaTipos[f.id] || "INTEIRA"} onChange={(e) => handleDiariaTipoChange(f.id, e.target.value as any)}>
                                    <option value="INTEIRA">Inteira</option>
                                    <option value="MEIA">Meia</option>
                                  </select>
                                </td>
                                <td style={{ fontWeight: 600 }}>{formatCurrency(getPreviaDiaria(f, false))}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="form-group" style={{ marginTop: "16px" }}>
                  <label className="form-label">Observações da Viagem</label>
                  <textarea className="form-control" rows={3} placeholder="Descreva os serviços ou ocorrências da viagem..." value={descricao} onChange={(e) => setDescricao(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={!selectedObraId || !selectedMotoristaId}>
                  Salvar Viagem e Diárias
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
