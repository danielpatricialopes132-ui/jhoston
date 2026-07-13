"use client";

import { useEffect, useState, startTransition } from "react";
import { getClientesList, salvarCliente, deleteCliente } from "./actions";

interface ObraInfo {
  id: number;
  nome: string;
  status: string;
}

interface Cliente {
  id: number;
  nome: string;
  cpfCnpj: string | null;
  telefone: string | null;
  email: string | null;
  obras: ObraInfo[];
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  // Form states
  const [nome, setNome] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const refreshData = () => {
    getClientesList().then((data) => {
      setClientes(data as any);
    });
  };

  useEffect(() => {
    refreshData();
  }, []);

  const openNewModal = () => {
    setEditingCliente(null);
    setNome("");
    setCpfCnpj("");
    setTelefone("");
    setEmail("");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (c: Cliente) => {
    setEditingCliente(c);
    setNome(c.nome);
    setCpfCnpj(c.cpfCnpj || "");
    setTelefone(c.telefone || "");
    setEmail(c.email || "");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCliente(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErrorMsg("O nome do cliente é obrigatório.");
      return;
    }

    const payload = {
      id: editingCliente?.id,
      nome,
      cpfCnpj,
      telefone,
      email,
    };

    startTransition(async () => {
      const res = await salvarCliente(payload);
      if (res.success) {
        refreshData();
        closeModal();
      } else {
        setErrorMsg(res.error || "Erro ao salvar os dados.");
      }
    });
  };

  const handleDelete = async (id: number) => {
    if (
      confirm(
        "Deseja realmente remover este cliente? Se ele estiver vinculado a alguma obra, essa obra continuará existindo mas perderá a associação com este cliente."
      )
    ) {
      const res = await deleteCliente(id);
      if (res.success) {
        refreshData();
      } else {
        alert(res.error || "Erro ao excluir o cliente.");
      }
    }
  };

  const filteredClientes = clientes.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.nome.toLowerCase().includes(term) ||
      (c.cpfCnpj && c.cpfCnpj.toLowerCase().includes(term)) ||
      (c.telefone && c.telefone.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term))
    );
  });

  return (
    <div>
      <div className="flex-row-between">
        <div>
          <h3 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-heading)" }}>
            Cadastro de Clientes / Proprietários
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
            Gerencie os proprietários e clientes vinculados às obras de piscinas.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNewModal}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginRight: "4px" }}
          >
            <line x1="12" x2="12" y1="5" y2="19" />
            <line x1="5" x2="19" y1="12" y2="12" />
          </svg>
          Novo Cliente
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="filters-bar">
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Buscar Cliente</label>
          <input
            type="text"
            className="form-control"
            placeholder="Digite o nome, CPF/CNPJ, telefone ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: "80px" }}>ID</th>
              <th>Nome</th>
              <th>CPF / CNPJ</th>
              <th>Telefone</th>
              <th>E-mail</th>
              <th>Obras Vinculadas</th>
              <th style={{ width: "160px", textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredClientes.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
                  Nenhum cliente cadastrado ou encontrado.
                </td>
              </tr>
            ) : (
              filteredClientes.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600, color: "var(--text-muted)" }}>#{c.id}</td>
                  <td style={{ fontWeight: 600, color: "var(--text-heading)" }}>{c.nome}</td>
                  <td>{c.cpfCnpj || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Não informado</span>}</td>
                  <td>{c.telefone || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Não informado</span>}</td>
                  <td>{c.email || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Não informado</span>}</td>
                  <td>
                    {c.obras.length === 0 ? (
                      <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "13px" }}>Nenhuma obra</span>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {c.obras.map((o) => (
                          <span
                            key={o.id}
                            style={{
                              fontSize: "11px",
                              padding: "2px 6px",
                              backgroundColor: "var(--bg-accent)",
                              color: "var(--primary)",
                              borderRadius: "4px",
                              fontWeight: 500,
                            }}
                          >
                            {o.nome} ({o.status === "ATIVA" ? "Ativa" : o.status === "FINALIZADA" ? "Concluída" : "Suspensa"})
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "8px" }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(c)}>
                        Editar
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>
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

      {/* Modal de Novo/Editar Cliente */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4 style={{ fontSize: "18px", fontWeight: 600 }}>
                {editingCliente ? "Editar Cliente" : "Novo Cliente"}
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
                  <label className="form-label">Nome Completo *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: João Silva"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">CPF / CNPJ</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: 000.000.000-00"
                    value={cpfCnpj}
                    onChange={(e) => setCpfCnpj(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefone</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: (11) 99999-9999"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">E-mail</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Ex: joao@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
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
