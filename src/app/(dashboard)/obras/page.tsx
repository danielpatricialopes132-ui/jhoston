"use client";

import { useEffect, useState, startTransition } from "react";
import { getObras, createObra, updateObra, deleteObra } from "./actions";

interface Obra {
  id: number;
  nome: string;
  clienteNome: string;
  endereco: string | null;
  status: string;
}

export default function ObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODAS");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingObra, setEditingObra] = useState<Obra | null>(null);

  // Form states
  const [nome, setNome] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [status, setStatus] = useState("ATIVA");
  const [errorMsg, setErrorMsg] = useState("");

  const refreshObras = () => {
    getObras().then((data) => setObras(data));
  };

  useEffect(() => {
    refreshObras();
  }, []);

  const openNewModal = () => {
    setEditingObra(null);
    setNome("");
    setClienteNome("");
    setEndereco("");
    setStatus("ATIVA");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (obra: Obra) => {
    setEditingObra(obra);
    setNome(obra.nome);
    setClienteNome(obra.clienteNome);
    setEndereco(obra.endereco || "");
    setStatus(obra.status);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingObra(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !clienteNome.trim()) {
      setErrorMsg("Nome da obra e Cliente são obrigatórios.");
      return;
    }

    const payload = { nome, clienteNome, endereco, status };

    startTransition(async () => {
      let res;
      if (editingObra) {
        res = await updateObra(editingObra.id, payload);
      } else {
        res = await createObra(payload);
      }

      if (res.success) {
        refreshObras();
        closeModal();
      } else {
        setErrorMsg("Erro ao salvar os dados.");
      }
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta obra?")) {
      const res = await deleteObra(id);
      if (res.success) {
        refreshObras();
      } else {
        alert(res.error);
      }
    }
  };

  const filteredObras = obras.filter((o) => {
    const matchesSearch =
      o.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.endereco && o.endereco.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "TODAS" || o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="flex-row-between">
        <div>
          <h3 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-heading)" }}>
            Cadastro de Obras
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
            Gerencie os projetos de piscinas ativas e concluídas.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNewModal}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px" }}><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
          Nova Obra
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="filters-bar">
        <div className="form-group" style={{ flex: 2 }}>
          <label className="form-label">Buscar Obra</label>
          <input
            type="text"
            className="form-control"
            placeholder="Digite o nome da obra, cliente ou endereço..."
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
            <option value="TODAS">Todos os Status</option>
            <option value="ATIVA">Ativa</option>
            <option value="FINALIZADA">Finalizada</option>
            <option value="SUSPENSA">Suspensa</option>
          </select>
        </div>
      </div>

      {/* Lista de Obras */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: "80px" }}>ID</th>
              <th>Nome da Obra</th>
              <th>Cliente</th>
              <th>Endereço</th>
              <th>Status</th>
              <th style={{ width: "160px", textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredObras.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
                  Nenhuma obra cadastrada ou encontrada.
                </td>
              </tr>
            ) : (
              filteredObras.map((obra) => (
                <tr key={obra.id}>
                  <td style={{ fontWeight: 600, color: "var(--text-muted)" }}>#{obra.id}</td>
                  <td style={{ fontWeight: 600, color: "var(--text-heading)" }}>{obra.nome}</td>
                  <td>{obra.clienteNome}</td>
                  <td>{obra.endereco || <em style={{ color: "var(--text-muted)" }}>Não informado</em>}</td>
                  <td>
                    <span
                      className={`badge ${
                        obra.status === "ATIVA"
                          ? "badge-success"
                          : obra.status === "FINALIZADA"
                          ? "badge-info"
                          : "badge-warning"
                      }`}
                    >
                      {obra.status === "ATIVA"
                        ? "Ativa"
                        : obra.status === "FINALIZADA"
                        ? "Finalizada"
                        : "Suspensa"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "8px" }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditModal(obra)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(obra.id)}
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

      {/* Modal de Nova/Editar Obra */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4 style={{ fontSize: "18px", fontWeight: 600 }}>
                {editingObra ? "Editar Obra" : "Nova Obra"}
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
                  <label className="form-label">Nome da Obra *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Piscina Condomínio Alphaville"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nome do Cliente *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Jhoston Tech Ltda"
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Endereço da Obra</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Av. das Palmeiras, 120"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status da Obra</label>
                  <select
                    className="form-control"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="ATIVA">Ativa</option>
                    <option value="FINALIZADA">Finalizada</option>
                    <option value="SUSPENSA">Suspensa</option>
                  </select>
                </div>
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
