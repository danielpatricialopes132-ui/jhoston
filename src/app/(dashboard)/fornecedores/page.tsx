"use client";

import { useEffect, useState, startTransition } from "react";
import { getFornecedoresList, salvarFornecedor, deleteFornecedor } from "./actions";

interface Obra {
  id: number;
  nome: string;
}

interface Transacao {
  id: number;
  tipo: "RECEITA" | "DESPESA";
  categoria: string;
  obraId: number | null;
  obra: Obra | null;
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataPagamento: string | null;
  status: string;
}

interface Fornecedor {
  id: number;
  nome: string;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  pix: string | null;
  contato: string | null;
  observacoes: string | null;
  transacoes: Transacao[];
  totalPago: number;
  totalPendente: number;
  totalAtrasado: number;
}

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);
  const [activeFornecedor, setActiveFornecedor] = useState<Fornecedor | null>(null);

  // Form states
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [pix, setPix] = useState("");
  const [contato, setContato] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const refreshData = () => {
    getFornecedoresList().then((data) => {
      setFornecedores(data as any);
      // Atualizar dados do fornecedor ativo se o modal de detalhes estiver aberto
      if (activeFornecedor) {
        const updated = data.find((f) => f.id === activeFornecedor.id);
        if (updated) {
          setActiveFornecedor(updated as any);
        }
      }
    });
  };

  useEffect(() => {
    refreshData();
  }, []);

  const openNewModal = () => {
    setEditingFornecedor(null);
    setNome("");
    setCnpj("");
    setTelefone("");
    setEmail("");
    setPix("");
    setContato("");
    setObservacoes("");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (f: Fornecedor, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita abrir detalhes do fornecedor
    setEditingFornecedor(f);
    setNome(f.nome);
    setCnpj(f.cnpj || "");
    setTelefone(f.telefone || "");
    setEmail(f.email || "");
    setPix(f.pix || "");
    setContato(f.contato || "");
    setObservacoes(f.observacoes || "");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openDetails = (f: Fornecedor) => {
    setActiveFornecedor(f);
    setIsDetailsOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingFornecedor(null);
  };

  const closeDetails = () => {
    setIsDetailsOpen(false);
    setActiveFornecedor(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErrorMsg("O nome ou razão social é obrigatório.");
      return;
    }

    const payload = {
      id: editingFornecedor?.id,
      nome,
      cnpj,
      telefone,
      email,
      pix,
      contato,
      observacoes,
    };

    startTransition(async () => {
      const res = await salvarFornecedor(payload);
      if (res.success) {
        refreshData();
        closeModal();
      } else {
        setErrorMsg(res.error || "Erro ao salvar os dados.");
      }
    });
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita abrir detalhes do fornecedor
    if (confirm("Deseja realmente remover este fornecedor? As despesas vinculadas a ele continuarão registradas mas ficarão sem associação de fornecedor.")) {
      const res = await deleteFornecedor(id);
      if (res.success) {
        refreshData();
      } else {
        alert(res.error);
      }
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  const formatDateBR = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  // Estatísticas Globais
  const totalGeralPago = fornecedores.reduce((acc, f) => acc + f.totalPago, 0);
  const totalGeralPendente = fornecedores.reduce((acc, f) => acc + f.totalPendente, 0);
  const totalGeralAtrasado = fornecedores.reduce((acc, f) => acc + f.totalAtrasado, 0);

  const filteredFornecedores = fornecedores.filter((f) => {
    const term = searchTerm.toLowerCase();
    return (
      f.nome.toLowerCase().includes(term) ||
      (f.cnpj && f.cnpj.includes(term)) ||
      (f.contato && f.contato.toLowerCase().includes(term)) ||
      (f.pix && f.pix.toLowerCase().includes(term))
    );
  });

  return (
    <div>
      <div className="flex-row-between">
        <div>
          <h3 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-heading)" }}>
            Cadastro de Fornecedores
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
            Gerencie o banco de dados de fornecedores de materiais, serviços, chaves PIX e histórico de pagamentos.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNewModal}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px" }}><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
          Novo Fornecedor
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid-cols-4" style={{ marginBottom: "20px" }}>
        <div className="card">
          <div className="card-title">Total de Fornecedores</div>
          <div className="card-value" style={{ color: "var(--info)" }}>
            {fornecedores.length}
          </div>
          <div className="card-desc">Cadastrados no sistema</div>
        </div>
        <div className="card">
          <div className="card-title">Total Pago (Geral)</div>
          <div className="card-value" style={{ color: "var(--success)" }}>
            {formatCurrency(totalGeralPago)}
          </div>
          <div className="card-desc">Acumulado pago a parceiros</div>
        </div>
        <div className="card">
          <div className="card-title">Total Pendente (Geral)</div>
          <div className="card-value" style={{ color: "var(--warning)" }}>
            {formatCurrency(totalGeralPendente)}
          </div>
          <div className="card-desc">Compromissos agendados</div>
        </div>
        <div className="card">
          <div className="card-title">Total Atrasado (Geral)</div>
          <div className="card-value" style={{ color: "var(--error)" }}>
            {formatCurrency(totalGeralAtrasado)}
          </div>
          <div className="card-desc">Contas vencidas</div>
        </div>
      </div>

      {/* Filtro de Busca */}
      <div className="filters-bar">
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Buscar Fornecedor</label>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nome, contato, cnpj ou pix..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela de Fornecedores */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: "80px" }}>ID</th>
              <th>Nome / Razão Social</th>
              <th>Contato / Telefone</th>
              <th>Chave PIX</th>
              <th style={{ textAlign: "right" }}>Total Pago</th>
              <th style={{ textAlign: "right" }}>Pendente</th>
              <th style={{ textAlign: "right" }}>Atrasado</th>
              <th style={{ width: "160px", textAlign: "center" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredFornecedores.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                  Nenhum fornecedor encontrado.
                </td>
              </tr>
            ) : (
              filteredFornecedores.map((f) => (
                <tr key={f.id} onClick={() => openDetails(f)} style={{ cursor: "pointer" }} className="hover-row">
                  <td>#{f.id}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--text-heading)" }}>{f.nome}</div>
                    {f.cnpj && <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>CNPJ: {f.cnpj}</div>}
                  </td>
                  <td>
                    {f.contato ? <div>{f.contato}</div> : <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>Sem contato</div>}
                    {f.telefone && <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{f.telefone}</div>}
                  </td>
                  <td>
                    {f.pix ? (
                      <span style={{ fontSize: "13px", fontFamily: "monospace", padding: "3px 6px", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }}>
                        {f.pix}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>-</span>
                    )}
                  </td>
                  <td style={{ textAlign: "right", color: "var(--success)", fontWeight: 500 }}>
                    {formatCurrency(f.totalPago)}
                  </td>
                  <td style={{ textAlign: "right", color: "var(--warning)", fontWeight: 500 }}>
                    {formatCurrency(f.totalPendente)}
                  </td>
                  <td style={{ textAlign: "right", color: f.totalAtrasado > 0 ? "var(--error)" : "var(--text-muted)", fontWeight: 600 }}>
                    {formatCurrency(f.totalAtrasado)}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div className="flex-gap-12" style={{ justifyContent: "center" }}>
                      <button className="btn btn-secondary btn-sm" onClick={(e) => openEditModal(f, e)}>
                        Editar
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={(e) => handleDelete(f.id, e)}>
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

      {/* MODAL CADASTRAR / EDITAR */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: "550px" }}>
            <div className="modal-header">
              <h4>{editingFornecedor ? "Editar Fornecedor" : "Cadastrar Novo Fornecedor"}</h4>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {errorMsg && (
                  <div className="alert alert-error" style={{ marginBottom: "15px", padding: "10px", borderRadius: "6px" }}>
                    {errorMsg}
                  </div>
                )}
                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <label className="form-label">Razão Social / Nome Fantasia *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nome completo do fornecedor..."
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>
                <div className="grid-cols-2" style={{ gap: "12px", marginBottom: "12px" }}>
                  <div className="form-group">
                    <label className="form-label">CNPJ (Opcional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="00.000.000/0001-00"
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pessoa de Contato</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Nome do vendedor/contato..."
                      value={contato}
                      onChange={(e) => setContato(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid-cols-2" style={{ gap: "12px", marginBottom: "12px" }}>
                  <div className="form-group">
                    <label className="form-label">Telefone</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="(00) 99999-9999"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="contato@fornecedor.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <label className="form-label">Chave PIX para Pagamento</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="CNPJ, Celular, E-mail ou Chave Aleatória..."
                    value={pix}
                    onChange={(e) => setPix(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Observações / Notas Internas</label>
                  <textarea
                    className="form-control"
                    placeholder="Ex: Fornecedor de concreto, prazo de entrega 3 dias, etc..."
                    style={{ minHeight: "80px", resize: "vertical" }}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer flex-gap-12" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingFornecedor ? "Salvar Alterações" : "Cadastrar Fornecedor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE DETALHES E HISTÓRICO DE COMPRAS */}
      {isDetailsOpen && activeFornecedor && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: "850px", width: "95%" }}>
            <div className="modal-header">
              <div>
                <h4 style={{ fontSize: "18px", color: "var(--text-heading)" }}>{activeFornecedor.nome}</h4>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                  ID: #{activeFornecedor.id} {activeFornecedor.cnpj ? `| CNPJ: ${activeFornecedor.cnpj}` : ""}
                </p>
              </div>
              <button className="close-btn" onClick={closeDetails}>&times;</button>
            </div>
            <div className="modal-body" style={{ maxHeight: "75vh", overflowY: "auto" }}>
              {/* Painel de Contatos e PIX */}
              <div className="grid-cols-3" style={{ gap: "15px", marginBottom: "20px", background: "rgba(255,255,255,0.02)", padding: "15px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div>
                  <strong style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Contato</strong>
                  <span style={{ fontSize: "14px", color: "var(--text-heading)" }}>
                    {activeFornecedor.contato || "-"}
                  </span>
                  {activeFornecedor.telefone && <span style={{ display: "block", fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>{activeFornecedor.telefone}</span>}
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Email</strong>
                  <span style={{ fontSize: "14px", color: "var(--text-heading)", wordBreak: "break-all" }}>
                    {activeFornecedor.email || "-"}
                  </span>
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Chave PIX</strong>
                  <span style={{ fontSize: "14px", color: "var(--success)", fontWeight: 500, fontFamily: "monospace", display: "inline-block", marginTop: "2px" }}>
                    {activeFornecedor.pix || "Não cadastrada"}
                  </span>
                </div>
              </div>

              {activeFornecedor.observacoes && (
                <div style={{ marginBottom: "20px", padding: "12px", background: "rgba(255, 230, 200, 0.03)", borderLeft: "3px solid var(--warning)", borderRadius: "0 8px 8px 0" }}>
                  <strong style={{ display: "block", fontSize: "12px", color: "var(--warning)", marginBottom: "4px" }}>Observações</strong>
                  <p style={{ fontSize: "13px", margin: 0, whiteSpace: "pre-line" }}>{activeFornecedor.observacoes}</p>
                </div>
              )}

              {/* Estatísticas financeiras */}
              <h5 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-heading)", marginBottom: "12px" }}>
                Resumo Financeiro
              </h5>
              <div className="grid-cols-3" style={{ gap: "12px", marginBottom: "20px" }}>
                <div style={{ padding: "12px", background: "rgba(34, 197, 94, 0.05)", borderRadius: "8px", border: "1px solid rgba(34, 197, 94, 0.1)", textAlign: "center" }}>
                  <div style={{ fontSize: "12px", color: "var(--success)" }}>Total Pago</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--success)", marginTop: "4px" }}>
                    {formatCurrency(activeFornecedor.totalPago)}
                  </div>
                </div>
                <div style={{ padding: "12px", background: "rgba(234, 179, 8, 0.05)", borderRadius: "8px", border: "1px solid rgba(234, 179, 8, 0.1)", textAlign: "center" }}>
                  <div style={{ fontSize: "12px", color: "var(--warning)" }}>Pendente</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--warning)", marginTop: "4px" }}>
                    {formatCurrency(activeFornecedor.totalPendente)}
                  </div>
                </div>
                <div style={{ padding: "12px", background: "rgba(239, 68, 68, 0.05)", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.1)", textAlign: "center" }}>
                  <div style={{ fontSize: "12px", color: "var(--error)" }}>Atrasado / Vencido</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--error)", marginTop: "4px" }}>
                    {formatCurrency(activeFornecedor.totalAtrasado)}
                  </div>
                </div>
              </div>

              {/* Tabela de Transações */}
              <h5 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-heading)", marginBottom: "12px" }}>
                Histórico de Transações / Compras
              </h5>
              <div className="table-container" style={{ margin: 0 }}>
                <table className="table" style={{ fontSize: "13px" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "100px" }}>Vencimento</th>
                      <th>Descrição</th>
                      <th>Obra Relacionada</th>
                      <th style={{ textAlign: "right" }}>Valor</th>
                      <th style={{ width: "120px", textAlign: "center" }}>Status</th>
                      <th style={{ width: "100px" }}>Pagamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeFornecedor.transacoes.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>
                          Nenhuma transação financeira registrada para este fornecedor.
                        </td>
                      </tr>
                    ) : (
                      activeFornecedor.transacoes.map((t) => {
                        const isOverdue = t.status === "PENDENTE" && new Date(t.dataVencimento) < new Date();
                        return (
                          <tr key={t.id}>
                            <td>{formatDateBR(t.dataVencimento)}</td>
                            <td>{t.descricao}</td>
                            <td>
                              {t.obra ? (
                                <strong style={{ color: "var(--info)" }}>{t.obra.nome}</strong>
                              ) : (
                                <span style={{ color: "var(--text-muted)" }}>Geral / Não vinculada</span>
                              )}
                            </td>
                            <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(t.valor)}</td>
                            <td style={{ textAlign: "center" }}>
                              {t.status === "PAGO" ? (
                                <span className="status-badge approved">PAGO</span>
                              ) : isOverdue ? (
                                <span className="status-badge rejected">VENCIDO</span>
                              ) : (
                                <span className="status-badge pending">PENDENTE</span>
                              )}
                            </td>
                            <td>{t.dataPagamento ? formatDateBR(t.dataPagamento) : "-"}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeDetails}>
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
