"use client";

import { useEffect, useState, startTransition } from "react";
import { getObras, createObra, updateObra, deleteObra } from "./actions";
import { getClientesList } from "../clientes/actions";

interface Cliente {
  id: number;
  nome: string;
}

interface Obra {
  id: number;
  nome: string;
  clienteNome: string;
  endereco: string | null;
  status: string;
  valorFechado: number;
  clientes: Cliente[];
}

export default function ObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [allClientes, setAllClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODAS");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingObra, setEditingObra] = useState<Obra | null>(null);

  // Form states
  const [nome, setNome] = useState("");
  const [selectedClienteIds, setSelectedClienteIds] = useState<number[]>([]);
  const [valorFechado, setValorFechado] = useState("");
  const [endereco, setEndereco] = useState("");
  const [status, setStatus] = useState("ATIVA");
  const [errorMsg, setErrorMsg] = useState("");
  const [clientSearchTerm, setClientSearchTerm] = useState("");

  const refreshObras = () => {
    getObras().then((data) => setObras(data as any));
  };

  useEffect(() => {
    refreshObras();
    getClientesList().then((data) => setAllClientes(data as any));
  }, []);

  const openNewModal = () => {
    getClientesList().then((data) => setAllClientes(data as any));
    setEditingObra(null);
    setNome("");
    setSelectedClienteIds([]);
    setValorFechado("");
    setEndereco("");
    setStatus("ATIVA");
    setErrorMsg("");
    setClientSearchTerm("");
    setIsModalOpen(true);
  };

  const openEditModal = (obra: Obra) => {
    getClientesList().then((data) => setAllClientes(data as any));
    setEditingObra(obra);
    setNome(obra.nome);
    setSelectedClienteIds(obra.clientes ? obra.clientes.map((c) => c.id) : []);
    setValorFechado(obra.valorFechado?.toString() || "");
    setEndereco(obra.endereco || "");
    setStatus(obra.status);
    setErrorMsg("");
    setClientSearchTerm("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingObra(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErrorMsg("Nome da obra é obrigatório.");
      return;
    }
    if (selectedClienteIds.length === 0) {
      setErrorMsg("Selecione pelo menos um cliente para a obra.");
      return;
    }

    const payload = {
      nome,
      clientIds: selectedClienteIds,
      valorFechado: parseFloat(valorFechado) || 0,
      endereco,
      status,
    };

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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

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
              <th>Clientes (Proprietários)</th>
              <th>Valor Fechado</th>
              <th>Endereço</th>
              <th>Status</th>
              <th style={{ width: "160px", textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredObras.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
                  Nenhuma obra cadastrada ou encontrada.
                </td>
              </tr>
            ) : (
              filteredObras.map((obra) => (
                <tr key={obra.id}>
                  <td style={{ fontWeight: 600, color: "var(--text-muted)" }}>#{obra.id}</td>
                  <td style={{ fontWeight: 600, color: "var(--text-heading)" }}>{obra.nome}</td>
                  <td>
                    {obra.clientes && obra.clientes.length > 0 ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {obra.clientes.map((c) => (
                          <span
                            key={c.id}
                            style={{
                              fontSize: "12px",
                              padding: "2px 6px",
                              backgroundColor: "var(--bg-accent)",
                              color: "var(--primary)",
                              borderRadius: "4px",
                              fontWeight: 500,
                            }}
                          >
                            {c.nome}
                          </span>
                        ))}
                      </div>
                    ) : (
                      obra.clienteNome || <em style={{ color: "var(--text-muted)" }}>Sem cliente</em>
                    )}
                  </td>
                  <td style={{ fontWeight: 600, color: "var(--text-heading)" }}>
                    {formatCurrency(obra.valorFechado || 0)}
                  </td>
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
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "var(--text-heading)" }}
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
                  <label className="form-label">Clientes (Proprietários) *</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="🔍 Filtrar clientes..."
                    value={clientSearchTerm}
                    onChange={(e) => setClientSearchTerm(e.target.value)}
                    style={{ marginBottom: "8px" }}
                  />
                  <div
                    style={{
                      maxHeight: "130px",
                      overflowY: "auto",
                      border: "1px solid var(--border-color)",
                      padding: "8px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--bg-card)",
                    }}
                  >
                    {allClientes.filter((c) =>
                      c.nome.toLowerCase().includes(clientSearchTerm.toLowerCase())
                    ).length === 0 ? (
                      <div style={{ color: "var(--text-muted)", fontSize: "13px", padding: "4px 0" }}>
                        Nenhum cliente encontrado.
                      </div>
                    ) : (
                      allClientes
                        .filter((c) =>
                          c.nome.toLowerCase().includes(clientSearchTerm.toLowerCase())
                        )
                        .map((c) => (
                          <label
                            key={c.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              margin: "6px 0",
                              fontSize: "14px",
                              cursor: "pointer",
                              color: "var(--text-heading)",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedClienteIds.includes(c.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedClienteIds([...selectedClienteIds, c.id]);
                                } else {
                                  setSelectedClienteIds(selectedClienteIds.filter((id) => id !== c.id));
                                }
                              }}
                            />
                            {c.nome}
                          </label>
                        ))
                    )}
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                    Marque um ou mais proprietários. Caso não encontre o cliente na lista, cadastre-o primeiro no menu "Clientes".
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Valor Fechado (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    placeholder="Ex: 150000.00"
                    value={valorFechado}
                    onChange={(e) => setValorFechado(e.target.value)}
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
