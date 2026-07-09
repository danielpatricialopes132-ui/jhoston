"use client";

import { useEffect, useState, startTransition } from "react";
import { getFuncionarios, createFuncionario, updateFuncionario, deleteFuncionario } from "./actions";

interface Funcionario {
  id: number;
  nome: string;
  cargo: string;
  diariaPadrao: number;
  adicionalMotorista: number;
  pix: string | null;
  ativo: boolean;
}

export default function FuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);

  // Form states
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [diariaPadrao, setDiariaPadrao] = useState("0");
  const [adicionalMotorista, setAdicionalMotorista] = useState("0");
  const [pix, setPix] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const refreshFuncionarios = () => {
    getFuncionarios().then((data) => setFuncionarios(data));
  };

  useEffect(() => {
    refreshFuncionarios();
  }, []);

  const openNewModal = () => {
    setEditingFuncionario(null);
    setNome("");
    setCargo("");
    setDiariaPadrao("150"); // Valor padrão sugerido
    setAdicionalMotorista("50"); // Adicional padrão sugerido
    setPix("");
    setAtivo(true);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (f: Funcionario) => {
    setEditingFuncionario(f);
    setNome(f.nome);
    setCargo(f.cargo);
    setDiariaPadrao(f.diariaPadrao.toString());
    setAdicionalMotorista(f.adicionalMotorista.toString());
    setPix(f.pix || "");
    setAtivo(f.ativo);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingFuncionario(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !cargo.trim()) {
      setErrorMsg("Nome e Cargo são obrigatórios.");
      return;
    }

    const payload = {
      nome,
      cargo,
      diariaPadrao: parseFloat(diariaPadrao) || 0,
      adicionalMotorista: parseFloat(adicionalMotorista) || 0,
      pix,
      ativo
    };

    startTransition(async () => {
      let res;
      if (editingFuncionario) {
        res = await updateFuncionario(editingFuncionario.id, payload);
      } else {
        res = await createFuncionario(payload);
      }

      if (res.success) {
        refreshFuncionarios();
        closeModal();
      } else {
        setErrorMsg("Erro ao salvar os dados.");
      }
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este funcionário?")) {
      const res = await deleteFuncionario(id);
      if (res.success) {
        refreshFuncionarios();
      } else {
        alert(res.error);
      }
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  const filteredFuncionarios = funcionarios.filter((f) => {
    const matchesSearch =
      f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.pix && f.pix.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "TODOS" ||
      (statusFilter === "ATIVO" && f.ativo) ||
      (statusFilter === "INATIVO" && !f.ativo);

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="flex-row-between">
        <div>
          <h3 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-heading)" }}>
            Cadastro de Funcionários
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
            Gerencie os dados da equipe, cargos, diárias padrão e chaves PIX.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNewModal}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px" }}><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
          Novo Funcionário
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="filters-bar">
        <div className="form-group" style={{ flex: 2 }}>
          <label className="form-label">Buscar Funcionário</label>
          <input
            type="text"
            className="form-control"
            placeholder="Digite o nome, cargo ou chave PIX..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Filtrar por Status</label>
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="TODOS">Todos os Status</option>
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
          </select>
        </div>
      </div>

      {/* Lista de Funcionários */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: "80px" }}>ID</th>
              <th>Nome</th>
              <th>Cargo</th>
              <th>Diária Padrão</th>
              <th>Adicional Motorista</th>
              <th>Chave PIX</th>
              <th>Status</th>
              <th style={{ width: "160px", textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredFuncionarios.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
                  Nenhum funcionário cadastrado ou encontrado.
                </td>
              </tr>
            ) : (
              filteredFuncionarios.map((f) => (
                <tr key={f.id}>
                  <td style={{ fontWeight: 600, color: "var(--text-muted)" }}>#{f.id}</td>
                  <td style={{ fontWeight: 600, color: "var(--text-heading)" }}>{f.nome}</td>
                  <td>{f.cargo}</td>
                  <td style={{ fontWeight: 500 }}>{formatCurrency(f.diariaPadrao)}</td>
                  <td style={{ fontWeight: 500, color: "var(--secondary)" }}>
                    {f.adicionalMotorista > 0 ? `+ ${formatCurrency(f.adicionalMotorista)}` : "Sem adicional"}
                  </td>
                  <td>
                    {f.pix ? (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontFamily: "monospace", fontSize: "13px" }}>{f.pix}</span>
                        <button
                          className="copy-pix-btn"
                          onClick={() => {
                            navigator.clipboard.writeText(f.pix || "");
                            alert("Chave PIX copiada para a área de transferência!");
                          }}
                        >
                          Copiar
                        </button>
                      </div>
                    ) : (
                      <em style={{ color: "var(--text-muted)" }}>Não informado</em>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${f.ativo ? "badge-success" : "badge-danger"}`}>
                      {f.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "8px" }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditModal(f)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(f.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Novo/Editar Funcionário */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4 style={{ fontSize: "18px", fontWeight: 600 }}>
                {editingFuncionario ? "Editar Funcionário" : "Novo Funcionário"}
              </h4>
              <button
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }}
                onClick={closeModal}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {errorMsg && (
                  <div
                    style={{
                      backgroundColor: "var(--error-bg)",
                      color: "var(--error)",
                      padding: "12px",
                      borderRadius: "var(--radius-md)",
                      marginBottom: "16px",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    {errorMsg}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Nome Completo *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: João da Silva"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cargo *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Instalador, Motorista, Técnico"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Valor Diária Padrão (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      value={diariaPadrao}
                      onChange={(e) => setDiariaPadrao(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Adicional Motorista (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      value={adicionalMotorista}
                      onChange={(e) => setAdicionalMotorista(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Chave PIX (Para Pagamento)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="E-mail, CPF, Celular ou Chave Aleatória"
                    value={pix}
                    onChange={(e) => setPix(e.target.value)}
                  />
                </div>
                {editingFuncionario && (
                  <div className="form-group" style={{ flexDirection: "row", gap: "10px", alignItems: "center", marginTop: "10px" }}>
                    <input
                      type="checkbox"
                      id="ativo-chk"
                      checked={ativo}
                      onChange={(e) => setAtivo(e.target.checked)}
                      style={{ width: "16px", height: "16px" }}
                    />
                    <label htmlFor="ativo-chk" className="form-label" style={{ cursor: "pointer", marginBottom: 0 }}>
                      Funcionário Ativo
                    </label>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
