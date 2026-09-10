"use client";

import { useEffect, useState, startTransition } from "react";
import { getContatos, salvarContato, deletarContato, getCompromissos, salvarCompromisso, deletarCompromisso, criarGrupoAgendaWhatsApp, notificarCompromisso } from "./actions";
import { getSession } from "@/app/login/actions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Contato {
  id: number;
  nome: string;
  telefone: string;
  email?: string | null;
  tipoFornecedor?: string | null;
  categoria: string;
  empresa: string;
}

interface Compromisso {
  id: number;
  titulo: string;
  descricao: string | null;
  dataHora: Date;
  contatoId: number | null;
  contato?: Contato | null;
  status: string;
  empresa: string;
}

export default function AgendaPage() {
  const [activeTab, setActiveTab] = useState<"CONTATOS" | "COMPROMISSOS">("CONTATOS");
  const [activeContext, setActiveContext] = useState("TODAS");
  const [filterCategoria, setFilterCategoria] = useState<string>("TODAS");
  const [searchTerm, setSearchTerm] = useState("");
  const [isMaster, setIsMaster] = useState(false);

  const [contatos, setContatos] = useState<Contato[]>([]);
  const [compromissos, setCompromissos] = useState<Compromisso[]>([]);
  const [empresa, setEmpresa] = useState("JHOSTON");

  // Seleção múltipla para WhatsApp Group
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupSubject, setGroupSubject] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Modal Contato
  const [isContatoModalOpen, setIsContatoModalOpen] = useState(false);
  const [editingContato, setEditingContato] = useState<Contato | null>(null);
  const [cNome, setCNome] = useState("");
  const [cTelefone, setCTelefone] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cCategoria, setCCategoria] = useState("CLIENTE");
  const [cTipoFornecedor, setCTipoFornecedor] = useState("");
  const [cEmpresa, setCEmpresa] = useState("JHOSTON");

  // Modal Compromisso
  const [isCompromissoModalOpen, setIsCompromissoModalOpen] = useState(false);
  const [editingCompromisso, setEditingCompromisso] = useState<Compromisso | null>(null);
  const [coTitulo, setCoTitulo] = useState("");
  const [coDescricao, setCoDescricao] = useState("");
  const [coDataHora, setCoDataHora] = useState("");
  const [coContatoId, setCoContatoId] = useState("");

  const refreshData = async () => {
    const [ctos, comps] = await Promise.all([getContatos(), getCompromissos()]);
    setContatos(ctos as any);
    setCompromissos(comps as any);
  };

  useEffect(() => {
    refreshData();
    getSession().then((sess) => {
      if (sess?.userRole === "MASTER") {
        setIsMaster(true);
      }
      if (sess?.userEmpresa && sess.userEmpresa !== "AMBAS") {
        setActiveContext(sess.userEmpresa);
        setEmpresa(sess.userEmpresa);
        setCEmpresa(sess.userEmpresa);
      } else {
        setActiveContext("TODAS");
        setEmpresa("JHOSTON");
        setCEmpresa("JHOSTON");
      }
    });

    const handleContextChange = (e: CustomEvent<string>) => {
      if (e.detail && e.detail !== "AMBAS") {
        setActiveContext(e.detail);
        setEmpresa(e.detail);
        setCEmpresa(e.detail);
      } else {
        setActiveContext("TODAS");
      }
    };
    window.addEventListener("empresaContextChanged" as any, handleContextChange);
    return () => {
      window.removeEventListener("empresaContextChanged" as any, handleContextChange);
    };
  }, []);

  // --- WhatsApp Group Handler ---
  const handleCreateWhatsAppGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupSubject.trim()) {
      alert("Por favor, informe o nome do grupo.");
      return;
    }

    const selectedContatos = contatos.filter((c) => selectedContactIds.includes(c.id));
    const phones = selectedContatos.map((c) => c.telefone).filter(Boolean);

    if (phones.length === 0) {
      alert("Nenhum telefone válido encontrado nos contatos selecionados.");
      return;
    }

    setIsCreatingGroup(true);
    try {
      await criarGrupoAgendaWhatsApp(groupSubject, phones);
      alert(`Grupo "${groupSubject}" criado com sucesso no WhatsApp!`);
      setIsGroupModalOpen(false);
      setGroupSubject("");
      setSelectedContactIds([]);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Erro ao criar grupo no WhatsApp.");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const toggleSelectContact = (id: number) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (filteredList: Contato[]) => {
    if (selectedContactIds.length === filteredList.length && filteredList.length > 0) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(filteredList.map((c) => c.id));
    }
  };

  // --- Contatos Handlers ---
  const handleSaveContato = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await salvarContato({
        id: editingContato?.id,
        nome: cNome,
        telefone: cTelefone,
        categoria: cCategoria,
        email: cEmail,
        tipoFornecedor: cCategoria === "FORNECEDOR" ? cTipoFornecedor : undefined,
        empresa: cEmpresa,
      });
      setIsContatoModalOpen(false);
      refreshData();
    });
  };

  const openContatoModal = (c?: Contato) => {
    if (c) {
      setEditingContato(c);
      setCNome(c.nome);
      setCTelefone(c.telefone);
      setCEmail(c.email || "");
      setCCategoria(c.categoria);
      setCTipoFornecedor(c.tipoFornecedor || "");
      setCEmpresa(c.empresa || empresa);
    } else {
      setEditingContato(null);
      setCNome("");
      setCTelefone("");
      setCEmail("");
      setCCategoria("CLIENTE");
      setCTipoFornecedor("");
      setCEmpresa(activeContext === "TODAS" ? "JHOSTON" : activeContext);
    }
    setIsContatoModalOpen(true);
  };

  const handleDeleteContato = async (id: number) => {
    if (confirm("Excluir este contato?")) {
      await deletarContato(id);
      refreshData();
    }
  };

  // --- Compromissos Handlers ---
  const handleSaveCompromisso = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await salvarCompromisso({
        id: editingCompromisso?.id,
        titulo: coTitulo,
        descricao: coDescricao,
        dataHora: new Date(coDataHora),
        contatoId: coContatoId ? parseInt(coContatoId) : undefined,
        status: editingCompromisso?.status || "PENDENTE"
      });
      setIsCompromissoModalOpen(false);
      refreshData();
    });
  };

  const openCompromissoModal = (c?: Compromisso) => {
    if (c) {
      setEditingCompromisso(c);
      setCoTitulo(c.titulo);
      setCoDescricao(c.descricao || "");
      const d = new Date(c.dataHora);
      const iso = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      setCoDataHora(iso);
      setCoContatoId(c.contatoId ? c.contatoId.toString() : "");
    } else {
      setEditingCompromisso(null);
      setCoTitulo("");
      setCoDescricao("");
      setCoDataHora("");
      setCoContatoId("");
    }
    setIsCompromissoModalOpen(true);
  };

  const handleDeleteCompromisso = async (id: number) => {
    if (confirm("Excluir este compromisso?")) {
      await deletarCompromisso(id);
      refreshData();
    }
  };

  let filteredContatos = activeContext === "TODAS" ? contatos : contatos.filter(c => c.empresa === activeContext);
  
  if (filterCategoria !== "TODAS") {
    filteredContatos = filteredContatos.filter(c => c.categoria === filterCategoria);
  }

  if (searchTerm) {
    const lower = searchTerm.toLowerCase();
    filteredContatos = filteredContatos.filter(c => 
      c.nome.toLowerCase().includes(lower) || 
      c.telefone.includes(lower) ||
      (c.email && c.email.toLowerCase().includes(lower)) ||
      (c.tipoFornecedor && c.tipoFornecedor.toLowerCase().includes(lower))
    );
  }

  const filteredCompromissos = activeContext === "TODAS" ? compromissos : compromissos.filter(c => c.empresa === activeContext);

  const getBadgeClass = (cat: string) => {
    switch (cat) {
      case "CLIENTE": return "badge badge-primary";
      case "FORNECEDOR": return "badge badge-warning";
      case "EQUIPE": return "badge badge-success";
      default: return "badge badge-secondary";
    }
  };

  return (
    <div>
      <div className="flex-row-between" style={{ marginBottom: "20px" }}>
        <div>
          <h3 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-heading)" }}>
            Agenda Inteligente
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
            Gestão centralizada de contatos, clientes, fornecedores e compromissos.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            className={`btn ${activeTab === "CONTATOS" ? "btn-primary" : "btn-secondary"}`} 
            onClick={() => setActiveTab("CONTATOS")}
          >
            Contatos
          </button>
          <button 
            className={`btn ${activeTab === "COMPROMISSOS" ? "btn-primary" : "btn-secondary"}`} 
            onClick={() => setActiveTab("COMPROMISSOS")}
          >
            Compromissos
          </button>
        </div>
      </div>

      {activeTab === "CONTATOS" && (
        <>
          <div className="filters-bar">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Buscar Contato</label>
              <input 
                type="text" 
                placeholder="Pesquisar por nome, telefone..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Filtrar por Categoria</label>
              <select 
                value={filterCategoria} 
                onChange={e => setFilterCategoria(e.target.value)} 
                className="form-control"
              >
                <option value="TODAS">Todos</option>
                <option value="CLIENTE">Clientes</option>
                <option value="FORNECEDOR">Fornecedores</option>
                <option value="EQUIPE">Equipe</option>
              </select>
            </div>
            {selectedContactIds.length > 0 && (
              <button
                className="btn btn-primary"
                onClick={() => setIsGroupModalOpen(true)}
                style={{
                  alignSelf: "flex-end",
                  height: "42px",
                  backgroundColor: "#25D366",
                  borderColor: "#25D366",
                  color: "white",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                💬 Criar Grupo WhatsApp ({selectedContactIds.length})
              </button>
            )}
            <button className="btn btn-primary" onClick={() => openContatoModal()} style={{ alignSelf: "flex-end", height: "42px" }}>
              Novo Contato
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: "40px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={selectedContactIds.length === filteredContatos.length && filteredContatos.length > 0}
                      onChange={() => toggleSelectAll(filteredContatos)}
                      title="Selecionar todos"
                    />
                  </th>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>E-mail</th>
                  <th>Categoria</th>
                  <th>Tipo Fornecedor</th>
                  {isMaster && <th>Empresa</th>}
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredContatos.length === 0 ? (
                  <tr>
                    <td colSpan={isMaster ? 8 : 7} style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
                      Nenhum contato encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredContatos.map(c => (
                    <tr key={c.id}>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={selectedContactIds.includes(c.id)}
                          onChange={() => toggleSelectContact(c.id)}
                        />
                      </td>
                      <td style={{ fontWeight: 600, color: "var(--text-heading)" }}>{c.nome}</td>
                      <td>
                        <a href={`https://wa.me/${c.telefone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 500 }}>
                          {c.telefone}
                        </a>
                      </td>
                      <td>{c.email || "-"}</td>
                      <td>
                        <span className={getBadgeClass(c.categoria)}>
                          {c.categoria}
                        </span>
                      </td>
                      <td>{c.categoria === 'FORNECEDOR' ? (c.tipoFornecedor || "-") : "-"}</td>
                      {isMaster && (
                        <td>
                          <span style={{ fontSize: "11px", fontWeight: 600, color: c.empresa === "ECO_STONE" ? "#16a34a" : "#0f766e" }}>
                            {c.empresa === "ECO_STONE" ? "🌿 ECO STONE" : "🏢 JHOSTON"}
                          </span>
                        </td>
                      )}
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "8px" }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openContatoModal(c)}>Editar</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteContato(c.id)}>Excluir</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "COMPROMISSOS" && (
        <>
          <div className="filters-bar" style={{ justifyContent: "flex-end" }}>
             <button className="btn btn-primary" onClick={() => openCompromissoModal()} style={{ height: "42px" }}>
              Novo Compromisso
            </button>
          </div>
          
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Título</th>
                  <th>Descrição</th>
                  <th>Contato Relacionado</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompromissos.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
                      Nenhum compromisso agendado.
                    </td>
                  </tr>
                ) : (
                  filteredCompromissos.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600, color: "var(--text-heading)", whiteSpace: "nowrap" }}>
                        {format(new Date(c.dataHora), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </td>
                      <td style={{ fontWeight: 600 }}>{c.titulo}</td>
                      <td>{c.descricao || "-"}</td>
                      <td>
                        {c.contato ? (
                          <div>
                            <strong>{c.contato.nome}</strong><br/>
                            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{c.contato.telefone}</span>
                          </div>
                        ) : "-"}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "8px" }}>
                          {c.contato && (
                            <button className="btn btn-primary btn-sm" onClick={() => {
                              if (confirm('Enviar lembrete via WhatsApp para ' + c.contato!.nome + '?')) {
                                import('./actions').then(m => {
                                  m.notificarCompromisso(c.id).then(() => {
                                    alert('Notificação enviada!');
                                  }).catch(e => {
                                    alert('Erro ao enviar notificação.');
                                    console.error(e);
                                  });
                                });
                              }
                            }}>Notificar</button>
                          )}
                          <button className="btn btn-secondary btn-sm" onClick={() => openCompromissoModal(c)}>Editar</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCompromisso(c.id)}>Excluir</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal Contato */}
      {isContatoModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h4 style={{ fontSize: "18px", fontWeight: 600 }}>
                {editingContato ? 'Editar Contato' : 'Novo Contato'}
              </h4>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }} onClick={() => setIsContatoModalOpen(false)}>
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSaveContato}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome Completo *</label>
                  <input required value={cNome} onChange={e => setCNome(e.target.value)} type="text" placeholder="Ex: João da Silva" className="form-control" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">WhatsApp *</label>
                  <input required value={cTelefone} onChange={e => setCTelefone(e.target.value)} type="text" placeholder="5511999999999" className="form-control" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">E-mail (Opcional)</label>
                  <input value={cEmail} onChange={e => setCEmail(e.target.value)} type="email" placeholder="joao@exemplo.com" className="form-control" />
                </div>

                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <select value={cCategoria} onChange={e => setCCategoria(e.target.value)} className="form-control">
                    <option value="CLIENTE">Cliente</option>
                    <option value="FORNECEDOR">Fornecedor</option>
                    <option value="EQUIPE">Equipe</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>

                {cCategoria === 'FORNECEDOR' && (
                  <div className="form-group">
                    <label className="form-label">Tipo de Fornecedor</label>
                    <input value={cTipoFornecedor} onChange={e => setCTipoFornecedor(e.target.value)} type="text" placeholder="Ex: Material, Serviço, Concreto, Locação..." className="form-control" />
                  </div>
                )}

                {isMaster && (
                  <div className="form-group">
                    <label className="form-label">Empresa Responsável</label>
                    <select value={cEmpresa} onChange={e => setCEmpresa(e.target.value)} className="form-control">
                      <option value="JHOSTON">🏢 JHOSTON TEC</option>
                      <option value="ECO_STONE">🌿 ECO STONE</option>
                    </select>
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                <button type="button" onClick={() => setIsContatoModalOpen(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Criar Grupo WhatsApp */}
      {isGroupModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h4 style={{ fontSize: "18px", fontWeight: 600, color: "#16a34a", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>💬</span> Criar Grupo de WhatsApp
              </h4>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }} onClick={() => setIsGroupModalOpen(false)}>
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreateWhatsAppGroup}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome do Grupo no WhatsApp *</label>
                  <input
                    required
                    maxLength={25}
                    value={groupSubject}
                    onChange={(e) => setGroupSubject(e.target.value)}
                    type="text"
                    placeholder="Ex: Obra Alpha / Suporte"
                    className="form-control"
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                    Máximo de 25 caracteres (limite do WhatsApp).
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Participantes Selecionados ({selectedContactIds.length})</label>
                  <div style={{ maxHeight: "150px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "8px" }}>
                    {contatos
                      .filter((c) => selectedContactIds.includes(c.id))
                      .map((c) => (
                        <div key={c.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "4px 0", borderBottom: "1px solid #f1f5f9" }}>
                          <span style={{ fontWeight: 600 }}>{c.nome}</span>
                          <span style={{ color: "var(--text-muted)" }}>{c.telefone}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" onClick={() => setIsGroupModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingGroup}
                  className="btn btn-primary"
                  style={{ backgroundColor: "#25D366", borderColor: "#25D366", color: "white" }}
                >
                  {isCreatingGroup ? "Criando Grupo..." : "Criar Grupo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Compromisso */}
      {isCompromissoModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h4 style={{ fontSize: "18px", fontWeight: 600 }}>
                {editingCompromisso ? 'Editar Compromisso' : 'Novo Compromisso'}
              </h4>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }} onClick={() => setIsCompromissoModalOpen(false)}>
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSaveCompromisso}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Título do Compromisso *</label>
                  <input required value={coTitulo} onChange={e => setCoTitulo(e.target.value)} type="text" placeholder="Ex: Reunião de Alinhamento" className="form-control" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Data e Hora *</label>
                  <input required value={coDataHora} onChange={e => setCoDataHora(e.target.value)} type="datetime-local" className="form-control" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Contato Relacionado (Opcional)</label>
                  <select value={coContatoId} onChange={e => setCoContatoId(e.target.value)} className="form-control">
                    <option value="">Nenhum contato selecionado</option>
                    {filteredContatos.map(c => (
                      <option key={c.id} value={c.id}>{c.nome} ({c.categoria})</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Descrição (Opcional)</label>
                  <textarea value={coDescricao} onChange={e => setCoDescricao(e.target.value)} rows={3} placeholder="Detalhes adicionais sobre o compromisso..." className="form-control" style={{ resize: "none" }} />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" onClick={() => setIsCompromissoModalOpen(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
