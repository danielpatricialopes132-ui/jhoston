"use client";

import { useEffect, useState, startTransition } from "react";
import {
  getClientesList,
  salvarCliente,
  deleteCliente,
  addDocumentoCliente,
  deleteDocumentoCliente,
} from "./actions";

interface ObraInfo {
  id: number;
  nome: string;
  status: string;
}

interface Documento {
  id: number;
  nome: string;
  fileName: string;
  base64Data: string;
  createdAt: Date;
}

interface Cliente {
  id: number;
  tipo: "PF" | "PJ";
  nome: string;
  cpfCnpj: string | null;
  rg: string | null;
  ie: string | null;
  contato: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  obras: ObraInfo[];
  documentos: Documento[];
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  // Document management states
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [activeCliente, setActiveCliente] = useState<Cliente | null>(null);
  const [docNome, setDocNome] = useState("");
  const [docFile, setDocFile] = useState<{ fileName: string; base64Data: string } | null>(null);
  const [docError, setDocError] = useState("");
  const [docSubmitting, setDocSubmitting] = useState(false);

  // Form states
  const [tipo, setTipo] = useState<"PF" | "PJ">("PF");
  const [nome, setNome] = useState(""); // Nome Completo (PF) ou Razão Social (PJ)
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [rg, setRg] = useState("");
  const [ie, setIe] = useState("");
  const [contato, setContato] = useState(""); // Procurador ou Representante
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
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
    setTipo("PF");
    setNome("");
    setCpfCnpj("");
    setRg("");
    setIe("");
    setContato("");
    setTelefone("");
    setEmail("");
    setEndereco("");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (c: Cliente) => {
    setEditingCliente(c);
    setTipo(c.tipo || "PF");
    setNome(c.nome);
    setCpfCnpj(c.cpfCnpj || "");
    setRg(c.rg || "");
    setIe(c.ie || "");
    setContato(c.contato || "");
    setTelefone(c.telefone || "");
    setEmail(c.email || "");
    setEndereco(c.endereco || "");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCliente(null);
  };

  const openDocModal = (c: Cliente) => {
    setActiveCliente(c);
    setDocNome("");
    setDocFile(null);
    setDocError("");
    setIsDocModalOpen(true);
  };

  const closeDocModal = () => {
    setIsDocModalOpen(false);
    setActiveCliente(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocError("");

    if (file.size > 5 * 1024 * 1024) {
      setDocError("Arquivo muito grande. O limite máximo é 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setDocFile({
        fileName: file.name,
        base64Data: base64,
      });
      if (!docNome.trim()) {
        const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
        setDocNome(nameWithoutExt);
      }
    };
    reader.onerror = () => {
      setDocError("Erro ao ler o arquivo.");
    };
    reader.readAsDataURL(file);
  };

  const handleDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCliente || !docFile || !docNome.trim()) {
      setDocError("Nome do documento e arquivo são obrigatórios.");
      return;
    }

    setDocSubmitting(true);
    setDocError("");

    startTransition(async () => {
      const res = await addDocumentoCliente({
        clienteId: activeCliente.id,
        nome: docNome,
        fileName: docFile.fileName,
        base64Data: docFile.base64Data,
      });

      setDocSubmitting(false);
      if (res.success) {
        getClientesList().then((data) => {
          setClientes(data as any);
          const up = data.find((cl) => cl.id === activeCliente.id);
          if (up) {
            setActiveCliente(up as any);
          }
        });
        setDocNome("");
        setDocFile(null);
      } else {
        setDocError(res.error || "Erro ao salvar o documento.");
      }
    });
  };

  const handleDocDelete = async (docId: number) => {
    if (!activeCliente) return;
    if (confirm("Tem certeza que deseja excluir este documento?")) {
      const res = await deleteDocumentoCliente(docId);
      if (res.success) {
        getClientesList().then((data) => {
          setClientes(data as any);
          const up = data.find((cl) => cl.id === activeCliente.id);
          if (up) {
            setActiveCliente(up as any);
          }
        });
      } else {
        alert(res.error || "Erro ao excluir o documento.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErrorMsg("O nome ou razão social é obrigatório.");
      return;
    }

    const payload = {
      id: editingCliente?.id,
      tipo,
      nome,
      cpfCnpj,
      rg: tipo === "PF" ? rg : undefined,
      ie: tipo === "PJ" ? ie : undefined,
      contato: tipo === "PJ" ? contato : undefined,
      telefone,
      email,
      endereco,
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
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.contato && c.contato.toLowerCase().includes(term))
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
            Gerencie os proprietários e clientes de obras (Pessoa Física e Pessoa Jurídica).
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
            placeholder="Digite o nome, representação, documento, telefone ou e-mail..."
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
              <th>Tipo</th>
              <th>Nome / Razão Social</th>
              <th>Documentos Cadastrais</th>
              <th>Contato / Telefone / E-mail</th>
              <th>Obras Vinculadas</th>
              <th style={{ width: "240px", textAlign: "right" }}>Ações</th>
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
                  <td>
                    <span
                      className={`badge ${c.tipo === "PJ" ? "badge-info" : "badge-success"}`}
                      style={{ fontSize: "11px", fontWeight: 700 }}
                    >
                      {c.tipo === "PJ" ? "PJ" : "PF"}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: "var(--text-heading)" }}>
                    {c.nome}{" "}
                    {c.documentos && c.documentos.length > 0 && (
                      <span
                        style={{
                          fontSize: "11px",
                          marginLeft: "6px",
                          padding: "1px 5px",
                          backgroundColor: "rgba(16, 185, 129, 0.1)",
                          color: "#10b981",
                          borderRadius: "4px",
                          fontWeight: 600,
                        }}
                        title={`${c.documentos.length} arquivo(s) anexados`}
                      >
                        📂 {c.documentos.length} doc{c.documentos.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: "13px" }}>
                      {c.tipo === "PJ" ? (
                        <>
                          <strong>CNPJ:</strong> {c.cpfCnpj || "Não informado"}
                          {c.ie && (
                            <>
                              <br />
                              <strong>IE:</strong> {c.ie}
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <strong>CPF:</strong> {c.cpfCnpj || "Não informado"}
                          {c.rg && (
                            <>
                              <br />
                              <strong>RG:</strong> {c.rg}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: "13px" }}>
                      {c.tipo === "PJ" && c.contato && (
                        <div style={{ marginBottom: "2px" }}>
                          <strong>Representante:</strong> {c.contato}
                        </div>
                      )}
                      {c.telefone && <div>📞 {c.telefone}</div>}
                      {c.email && <div style={{ color: "var(--text-muted)" }}>✉️ {c.email}</div>}
                    </div>
                  </td>
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
                      <button className="btn btn-secondary btn-sm" onClick={() => openDocModal(c)}>
                        📂 Documentos
                      </button>
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
          <div className="modal-content" style={{ maxWidth: "600px", width: "95%" }}>
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

                {/* Seleção de Tipo de Cliente */}
                <div className="form-group">
                  <label className="form-label">Tipo de Cliente *</label>
                  <div style={{ display: "flex", gap: "24px", marginTop: "6px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "var(--text-heading)" }}>
                      <input
                        type="radio"
                        name="tipoCliente"
                        value="PF"
                        checked={tipo === "PF"}
                        onChange={() => setTipo("PF")}
                      />
                      Pessoa Física (PF)
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "var(--text-heading)" }}>
                      <input
                        type="radio"
                        name="tipoCliente"
                        value="PJ"
                        checked={tipo === "PJ"}
                        onChange={() => setTipo("PJ")}
                      />
                      Pessoa Jurídica (PJ)
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {tipo === "PJ" ? "Razão Social *" : "Nome Completo *"}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={tipo === "PJ" ? "Ex: Jhoston Tintas Ltda" : "Ex: João Silva"}
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>

                {tipo === "PJ" ? (
                  // Campos específicos de Pessoa Jurídica
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div className="form-group">
                      <label className="form-label">CNPJ</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ex: 00.000.000/0001-00"
                        value={cpfCnpj}
                        onChange={(e) => setCpfCnpj(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Inscrição Estadual (IE)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ex: 123456789.00-11"
                        value={ie}
                        onChange={(e) => setIe(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  // Campos específicos de Pessoa Física
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div className="form-group">
                      <label className="form-label">CPF</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ex: 000.000.000-00"
                        value={cpfCnpj}
                        onChange={(e) => setCpfCnpj(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">RG</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ex: MG-12.345.678"
                        value={rg}
                        onChange={(e) => setRg(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {tipo === "PJ" && (
                  <div className="form-group">
                    <label className="form-label">Nome de Contato / Procurador / Representante</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ex: Carlos (Gerente Financeiro)"
                      value={contato}
                      onChange={(e) => setContato(e.target.value)}
                    />
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group">
                    <label className="form-label">Telefone</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ex: (35) 99999-9999"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">E-mail</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Ex: contato@cliente.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Endereço Completo</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Rua das Flores, 100 - Centro - Monte Santo de Minas - MG"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
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

      {/* Modal de Documentos */}
      {isDocModalOpen && activeCliente && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "550px", width: "95%" }}>
            <div className="modal-header">
              <h4 style={{ fontSize: "18px", fontWeight: 600 }}>
                Documentos de {activeCliente.nome}
              </h4>
              <button
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "var(--text-heading)" }}
                onClick={closeDocModal}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              {/* Seção de Upload */}
              <div style={{ padding: "16px", backgroundColor: "var(--bg-app)", borderRadius: "var(--radius-md)", marginBottom: "20px", border: "1px dashed var(--border-color)" }}>
                <h5 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", color: "var(--text-heading)" }}>
                  Adicionar Novo Anexo (Contrato Social, Procuração, RG, CPF, etc.)
                </h5>
                <form onSubmit={handleDocSubmit}>
                  {docError && (
                    <div style={{ color: "var(--error)", fontSize: "13px", marginBottom: "8px", fontWeight: 500 }}>
                      {docError}
                    </div>
                  )}
                  <div className="form-group" style={{ marginBottom: "12px" }}>
                    <label className="form-label" style={{ fontSize: "12px" }}>Descrição do Anexo *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder={tipo === "PJ" ? "Ex: Contrato Social Consolidado" : "Ex: Procuração Registrada"}
                      value={docNome}
                      onChange={(e) => setDocNome(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: "12px" }}>
                    <label className="form-label" style={{ fontSize: "12px" }}>Selecionar Arquivo *</label>
                    <input
                      type="file"
                      className="form-control form-control-sm"
                      onChange={handleFileChange}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={docSubmitting || !docFile} style={{ width: "100%", justifyContent: "center" }}>
                    {docSubmitting ? "Enviando..." : "Fazer Upload do Documento"}
                  </button>
                </form>
              </div>

              {/* Seção de Lista de Documentos */}
              <h5 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", color: "var(--text-heading)" }}>
                Arquivos Anexados
              </h5>
              <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                {!activeCliente.documentos || activeCliente.documentos.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "13px", fontStyle: "italic", textAlign: "center", padding: "16px 0" }}>
                    Nenhum documento anexado para este cliente.
                  </p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {activeCliente.documentos.map((d) => (
                      <li
                        key={d.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 12px",
                          borderBottom: "1px solid var(--border-color)",
                          fontSize: "13px",
                        }}
                      >
                        <div style={{ flex: 1, marginRight: "16px", minWidth: 0 }}>
                          <strong style={{ color: "var(--text-heading)", display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{d.nome}</strong>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                            {d.fileName}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                          <a
                            href={d.base64Data}
                            download={d.fileName}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "4px 8px", fontSize: "11px", display: "inline-flex", alignItems: "center" }}
                          >
                            Baixar
                          </a>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDocDelete(d.id)}
                            style={{ padding: "4px 8px", fontSize: "11px" }}
                          >
                            Excluir
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeDocModal}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
