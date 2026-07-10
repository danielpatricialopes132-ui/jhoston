"use client";

import { useEffect, useState, startTransition } from "react";
import { getFinanceiroData, salvarTransacao, deleteTransacao, alterarStatusTransacao } from "./actions";
import { salvarFornecedor } from "../fornecedores/actions";

interface Obra {
  id: number;
  nome: string;
}

interface Fornecedor {
  id: number;
  nome: string;
  cnpj: string | null;
  pix: string | null;
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
  clienteFornecedor: string | null;
  fornecedorId: number | null;
  fornecedor: Fornecedor | null;
}

export default function FinanceiroPage() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("TODOS");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [obraFilter, setObraFilter] = useState("TODOS");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransacao, setEditingTransacao] = useState<Transacao | null>(null);

  // Form states
  const [tipo, setTipo] = useState<"RECEITA" | "DESPESA">("DESPESA");
  const [categoria, setCategoria] = useState("Fornecedores");
  const [selectedObraId, setSelectedObraId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [dataVencimento, setDataVencimento] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState("PENDENTE");
  const [dataPagamento, setDataPagamento] = useState("");
  const [clienteFornecedor, setClienteFornecedor] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Quick Fornecedor Modal states
  const [isQuickFornecedorOpen, setIsQuickFornecedorOpen] = useState(false);
  const [quickNome, setQuickNome] = useState("");
  const [quickPix, setQuickPix] = useState("");

  const loadData = () => {
    getFinanceiroData().then((res) => {
      setObras(res.obras);
      setFornecedores(res.fornecedores || []);
      const mapped = res.transacoes.map((t) => ({
        ...t,
        dataVencimento: new Date(t.dataVencimento).toISOString().split("T")[0],
        dataPagamento: t.dataPagamento ? new Date(t.dataPagamento).toISOString().split("T")[0] : null,
      }));
      setTransacoes(mapped as any);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewModal = (initialTipo: "RECEITA" | "DESPESA" = "DESPESA") => {
    setEditingTransacao(null);
    setTipo(initialTipo);
    setCategoria(initialTipo === "RECEITA" ? "Cliente" : "Fornecedores");
    setSelectedObraId("");
    setDescricao("");
    setValor("");
    setDataVencimento(new Date().toISOString().split("T")[0]);
    setStatus("PENDENTE");
    setDataPagamento("");
    setClienteFornecedor("");
    setFornecedorId("");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (t: Transacao) => {
    setEditingTransacao(t);
    setTipo(t.tipo);
    setCategoria(t.categoria);
    setSelectedObraId(t.obraId ? t.obraId.toString() : "");
    setDescricao(t.descricao);
    setValor(t.valor.toString());
    setDataVencimento(t.dataVencimento);
    setStatus(t.status);
    setDataPagamento(t.dataPagamento || "");
    setClienteFornecedor(t.clienteFornecedor || "");
    setFornecedorId(t.fornecedorId ? t.fornecedorId.toString() : "");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTransacao(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) {
      setErrorMsg("A descrição é obrigatória.");
      return;
    }
    if (!valor || parseFloat(valor) <= 0) {
      setErrorMsg("Insira um valor financeiro válido.");
      return;
    }

    // Se for despesa com fornecedores, valida se um fornecedor cadastrado foi selecionado
    if (tipo === "DESPESA" && categoria === "Fornecedores" && !fornecedorId) {
      setErrorMsg("Selecione um fornecedor para o lançamento.");
      return;
    }

    const payload = {
      id: editingTransacao?.id,
      tipo,
      categoria,
      obraId: selectedObraId ? parseInt(selectedObraId) : null,
      descricao,
      valor: parseFloat(valor),
      dataVencimento,
      dataPagamento: status === "PAGO" ? (dataPagamento || new Date().toISOString().split("T")[0]) : null,
      status,
      clienteFornecedor: tipo === "DESPESA" && categoria === "Fornecedores" ? "" : clienteFornecedor,
      fornecedorId: tipo === "DESPESA" && categoria === "Fornecedores" && fornecedorId ? parseInt(fornecedorId) : null,
    };

    startTransition(async () => {
      const res = await salvarTransacao(payload);
      if (res.success) {
        loadData();
        closeModal();
      } else {
        setErrorMsg("Erro ao salvar a transação.");
      }
    });
  };

  const handleQuickFornecedorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNome.trim()) return;

    const res = await salvarFornecedor({ nome: quickNome, pix: quickPix });
    if (res.success && res.data) {
      // Recarregar fornecedores e selecionar o novo
      getFinanceiroData().then((resData) => {
        setFornecedores(resData.fornecedores || []);
        const found = resData.fornecedores.find((f: any) => f.nome === quickNome.trim());
        setFornecedorId(found ? found.id.toString() : res.data!.id.toString());
      });
      setIsQuickFornecedorOpen(false);
      setQuickNome("");
      setQuickPix("");
    } else {
      alert(res.error || "Erro ao salvar fornecedor rápido.");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Deseja realmente excluir esta transação financeira?")) {
      const res = await deleteTransacao(id);
      if (res.success) {
        loadData();
      } else {
        alert(res.error);
      }
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "PENDENTE" ? "PAGO" : "PENDENTE";
    const res = await alterarStatusTransacao(id, newStatus);
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

  // Cálculos Financeiros Globais
  const receitasRecebidas = transacoes.filter((t) => t.tipo === "RECEITA" && t.status === "PAGO").reduce((acc, t) => acc + t.valor, 0);
  const despesasPagas = transacoes.filter((t) => t.tipo === "DESPESA" && t.status === "PAGO").reduce((acc, t) => acc + t.valor, 0);
  const caixaAtual = receitasRecebidas - despesasPagas;

  const contasAReceberPendente = transacoes.filter((t) => t.tipo === "RECEITA" && t.status !== "PAGO").reduce((acc, t) => acc + t.valor, 0);
  const contasAPagarPendente = transacoes.filter((t) => t.tipo === "DESPESA" && t.status !== "PAGO").reduce((acc, t) => acc + t.valor, 0);

  // Filtragem da lista
  const filteredTransacoes = transacoes.filter((t) => {
    const matchesSearch =
      t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.clienteFornecedor && t.clienteFornecedor.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTipo = tipoFilter === "TODOS" || t.tipo === tipoFilter;
    const matchesStatus = statusFilter === "TODOS" || t.status === statusFilter;
    const matchesObra = obraFilter === "TODOS" || t.obraId?.toString() === obraFilter;

    return matchesSearch && matchesTipo && matchesStatus && matchesObra;
  });

  return (
    <div>
      <div className="flex-row-between">
        <div>
          <h3 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-heading)" }}>
            Controle Financeiro
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
            Gerencie o caixa, contas a pagar a fornecedores e recebimentos de clientes de forma unificada.
          </p>
        </div>
        <div style={{ display: "inline-flex", gap: "10px" }}>
          <button className="btn btn-secondary" onClick={() => openNewModal("RECEITA")}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px", color: "var(--success)" }}><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
            Nova Receita (Cliente)
          </button>
          <button className="btn btn-primary" onClick={() => openNewModal("DESPESA")}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px" }}><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
            Nova Despesa (Fornecedor)
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid-cols-4">
        <div className="card">
          <div className="card-title">Saldo em Caixa</div>
          <div className="card-value" style={{ color: caixaAtual >= 0 ? "var(--success)" : "var(--error)" }}>
            {formatCurrency(caixaAtual)}
          </div>
          <div className="card-desc">Total Recebido - Pago</div>
        </div>
        <div className="card">
          <div className="card-title">Contas a Receber</div>
          <div className="card-value" style={{ color: "var(--info)" }}>
            {formatCurrency(contasAReceberPendente)}
          </div>
          <div className="card-desc">Faturamento Pendente</div>
        </div>
        <div className="card">
          <div className="card-title">Contas a Pagar</div>
          <div className="card-value" style={{ color: "var(--warning)" }}>
            {formatCurrency(contasAPagarPendente)}
          </div>
          <div className="card-desc">Compromissos Pendentes</div>
        </div>
        <div className="card">
          <div className="card-title">Fluxo Realizado</div>
          <div className="card-desc" style={{ fontSize: "13px", marginTop: "8px" }}>
            Receitas Pagas: <strong style={{ color: "var(--success)" }}>{formatCurrency(receitasRecebidas)}</strong><br />
            Despesas Pagas: <strong style={{ color: "var(--error)" }}>{formatCurrency(despesasPagas)}</strong>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="filters-bar">
        <div className="form-group" style={{ flex: 2 }}>
          <label className="form-label">Buscar Transação</label>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por descrição ou fornecedor/cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Tipo</label>
          <select className="form-control" value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)}>
            <option value="TODOS">Todos os Tipos</option>
            <option value="RECEITA">Apenas Receitas (Entradas)</option>
            <option value="DESPESA">Apenas Despesas (Saídas)</option>
          </select>
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Status</label>
          <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="TODOS">Todos os Status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="PAGO">Pago</option>
          </select>
        </div>
        <div className="form-group" style={{ flex: 1.5 }}>
          <label className="form-label">Obra</label>
          <select className="form-control" value={obraFilter} onChange={(e) => setObraFilter(e.target.value)}>
            <option value="TODOS">Todas as Obras</option>
            {obras.map((o) => (
              <option key={o.id} value={o.id}>{o.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de Transações */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Cliente / Fornecedor</th>
              <th>Descrição</th>
              <th>Obra Vinculada</th>
              <th>Vencimento</th>
              <th>Valor</th>
              <th>Status</th>
              <th style={{ width: "240px", textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransacoes.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
                  Nenhuma transação financeira encontrada.
                </td>
              </tr>
            ) : (
              filteredTransacoes.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span className={`badge ${t.tipo === "RECEITA" ? "badge-success" : "badge-danger"}`}>
                      {t.tipo === "RECEITA" ? "Receita" : "Despesa"}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {t.clienteFornecedor || <em style={{ color: "var(--text-muted)" }}>Não informado</em>}
                  </td>
                  <td>{t.descricao}</td>
                  <td>
                    {t.obra ? (
                      <span style={{ fontWeight: 500, color: "var(--primary)" }}>{t.obra.nome}</span>
                    ) : (
                      <em style={{ color: "var(--text-muted)", fontSize: "13px" }}>Caixa Geral</em>
                    )}
                  </td>
                  <td>{formatDateBR(t.dataVencimento)}</td>
                  <td style={{ fontWeight: 700, color: t.tipo === "RECEITA" ? "var(--success)" : "var(--text-heading)" }}>
                    {t.tipo === "RECEITA" ? "+" : "-"} {formatCurrency(t.valor)}
                  </td>
                  <td>
                    <span className={`badge ${t.status === "PAGO" ? "badge-success" : "badge-warning"}`}>
                      {t.status === "PAGO" ? "Pago" : "Pendente"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "8px" }}>
                      <button
                        className={`btn btn-sm ${t.status === "PAGO" ? "btn-secondary" : "btn-primary"}`}
                        onClick={() => handleToggleStatus(t.id, t.status)}
                      >
                        {t.status === "PAGO" ? "Marcar Pendente" : "Marcar Pago"}
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(t)}>
                        Editar
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>
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

      {/* Modal de Criação / Edição */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4 style={{ fontSize: "18px", fontWeight: 600 }}>
                {editingTransacao ? "Editar Transação" : `Lançar Nova ${tipo === "RECEITA" ? "Receita" : "Despesa"}`}
              </h4>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }} onClick={closeModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {errorMsg && (
                  <div style={{ backgroundColor: "var(--error-bg)", color: "var(--error)", padding: "12px", borderRadius: "var(--radius-md)", marginBottom: "16px", fontSize: "14px", fontWeight: 500 }}>
                    {errorMsg}
                  </div>
                )}
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Tipo *</label>
                    <select className="form-control" value={tipo} onChange={(e) => {
                      const val = e.target.value as "RECEITA" | "DESPESA";
                      setTipo(val);
                      setCategoria(val === "RECEITA" ? "Cliente" : "Fornecedores");
                    }} disabled={!!editingTransacao}>
                      <option value="RECEITA">Receita (Entrada / Cliente)</option>
                      <option value="DESPESA">Despesa (Saída / Fornecedor / Outros)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Categoria *</label>
                    <select className="form-control" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                      {tipo === "RECEITA" ? (
                        <>
                          <option value="Cliente">Pagamento de Cliente</option>
                          <option value="Outros">Outras Receitas</option>
                        </>
                      ) : (
                        <>
                          <option value="Fornecedores">Fornecedores</option>
                          <option value="Folha">Folha de Pagamento</option>
                          <option value="Viagem">Custo de Viagem / Diárias</option>
                          <option value="Outros">Outras Despesas</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* Condicional para Fornecedores Cadastrados */}
                {tipo === "DESPESA" && categoria === "Fornecedores" ? (
                  <div className="form-group">
                    <label className="form-label">Fornecedor Cadastrado *</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <select 
                        className="form-control" 
                        value={fornecedorId} 
                        onChange={(e) => setFornecedorId(e.target.value)}
                        required
                        style={{ flex: 1 }}
                      >
                        <option value="">-- Selecione um Fornecedor --</option>
                        {fornecedores.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.nome} {f.cnpj ? `(CNPJ: ${f.cnpj})` : ""}
                          </option>
                        ))}
                      </select>
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        style={{ padding: "0 12px", height: "40px", fontSize: "18px", fontWeight: "bold" }}
                        onClick={() => setIsQuickFornecedorOpen(true)}
                        title="Cadastrar fornecedor rápido"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">{tipo === "RECEITA" ? "Cliente" : "Fornecedor / Favorecido"}</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={`Nome do ${tipo === "RECEITA" ? "cliente" : "fornecedor"}...`}
                      value={clienteFornecedor}
                      onChange={(e) => setClienteFornecedor(e.target.value)}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Obra Vinculada (Centro de Custo)</label>
                  <select className="form-control" value={selectedObraId} onChange={(e) => setSelectedObraId(e.target.value)}>
                    <option value="">-- Caixa Geral (Nenhuma obra vinculada) --</option>
                    {obras.map((o) => (
                      <option key={o.id} value={o.id}>{o.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição da Transação *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Compra de azulejos, Recebimento parcela 2"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Valor (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-control"
                      value={valor}
                      onChange={(e) => setValor(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Data de Vencimento *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={dataVencimento}
                      onChange={(e) => setDataVencimento(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Status da Transação</label>
                    <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
                      <option value="PENDENTE">Pendente</option>
                      <option value="PAGO">Pago / Liquidado</option>
                    </select>
                  </div>
                  {status === "PAGO" && (
                    <div className="form-group">
                      <label className="form-label">Data do Pagamento</label>
                      <input
                        type="date"
                        className="form-control"
                        value={dataPagamento}
                        onChange={(e) => setDataPagamento(e.target.value)}
                      />
                    </div>
                  )}
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

      {/* Modal de Cadastro Rápido de Fornecedor */}
      {isQuickFornecedorOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: "400px", marginTop: "10%" }}>
            <div className="modal-header">
              <h4 style={{ fontSize: "16px", fontWeight: 600 }}>Cadastrar Fornecedor Rápido</h4>
              <button 
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }} 
                onClick={() => setIsQuickFornecedorOpen(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleQuickFornecedorSubmit}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <label className="form-label">Razão Social / Nome Fantasia *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nome do fornecedor..."
                    value={quickNome}
                    onChange={(e) => setQuickNome(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Chave PIX (Opcional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Chave PIX para pagamento..."
                    value={quickPix}
                    onChange={(e) => setQuickPix(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsQuickFornecedorOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
