"use client";

import { useEffect, useState, startTransition } from "react";
import { getValesData, salvarVale, deleteVale, alterarStatusDescontoVale } from "./actions";

interface Funcionario {
  id: number;
  nome: string;
  cargo: string;
}

interface Vale {
  id: number;
  funcionarioId: number;
  funcionario: Funcionario;
  data: string;
  valor: number;
  descricao: string | null;
  statusDesconto: string;
  tipo: string;
}

export default function ValesPage() {
  const [vales, setVales] = useState<Vale[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [tipoFilter, setTipoFilter] = useState("TODOS");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVale, setEditingVale] = useState<Vale | null>(null);

  // Form states
  const [selectedFuncionarioId, setSelectedFuncionarioId] = useState("");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState("VALE");
  const [statusDesconto, setStatusDesconto] = useState("PENDENTE");
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = () => {
    getValesData().then((res) => {
      setFuncionarios(res.funcionarios);
      const mapped = res.vales.map((v) => ({
        ...v,
        data: new Date(v.data).toISOString().split("T")[0],
        tipo: v.tipo || "VALE",
      }));
      setVales(mapped as any);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewModal = () => {
    setEditingVale(null);
    setSelectedFuncionarioId("");
    setData(new Date().toISOString().split("T")[0]);
    setValor("");
    setDescricao("");
    setTipo("VALE");
    setStatusDesconto("PENDENTE");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (v: Vale) => {
    setEditingVale(v);
    setSelectedFuncionarioId(v.funcionarioId.toString());
    setData(v.data);
    setValor(v.valor.toString());
    setDescricao(v.descricao || "");
    setTipo(v.tipo || "VALE");
    setStatusDesconto(v.statusDesconto);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingVale(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFuncionarioId) {
      setErrorMsg("Selecione o funcionário.");
      return;
    }
    if (!valor || parseFloat(valor) <= 0) {
      setErrorMsg("Insira um valor válido.");
      return;
    }
    if (tipo === "BONUS" && !descricao.trim()) {
      setErrorMsg("A descrição/motivo é obrigatória para lançamentos de bônus.");
      return;
    }

    const payload = {
      id: editingVale?.id,
      funcionarioId: parseInt(selectedFuncionarioId),
      data,
      valor: parseFloat(valor),
      descricao,
      statusDesconto,
      tipo,
    };

    startTransition(async () => {
      const res = await salvarVale(payload);
      if (res.success) {
        loadData();
        closeModal();
      } else {
        setErrorMsg("Erro ao salvar o registro.");
      }
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Deseja realmente excluir este registro?")) {
      const res = await deleteVale(id);
      if (res.success) {
        loadData();
      } else {
        alert(res.error);
      }
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "PENDENTE" ? "DESCONTADO" : "PENDENTE";
    const res = await alterarStatusDescontoVale(id, newStatus);
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

  const filteredVales = vales.filter((v) => {
    const matchesSearch =
      v.funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.descricao && v.descricao.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "TODOS" || v.statusDesconto === statusFilter;

    const matchesTipo =
      tipoFilter === "TODOS" || v.tipo === tipoFilter;

    return matchesSearch && matchesStatus && matchesTipo;
  });

  return (
    <div>
      <div className="flex-row-between">
        <div>
          <h3 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-heading)" }}>
            Controle de Vales & Bônus (Ajustes de Lançamento)
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
            Gerencie adiantamentos (vales descontáveis) e prêmios/extras (bônus creditados) dos diaristas para o fechamento.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNewModal}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px" }}><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
          Lançar Vale / Bônus
        </button>
      </div>

      {/* Filtros */}
      <div className="filters-bar">
        <div className="form-group" style={{ flex: 2 }}>
          <label className="form-label">Buscar Registro</label>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por funcionário ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Filtrar por Tipo</label>
          <select
            className="form-control"
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
          >
            <option value="TODOS">Todos os Tipos</option>
            <option value="VALE">Apenas Vales (Débitos)</option>
            <option value="BONUS">Apenas Bônus (Créditos)</option>
          </select>
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Filtrar por Status</label>
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="TODOS">Todos os Status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="DESCONTADO">Conciliado (Lançado em Folha)</option>
          </select>
        </div>
      </div>

      {/* Lista de Ajustes */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: "80px" }}>ID</th>
              <th>Funcionário</th>
              <th>Data</th>
              <th style={{ width: "120px" }}>Tipo</th>
              <th>Valor</th>
              <th>Descrição / Motivo</th>
              <th>Status</th>
              <th style={{ width: "240px", textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredVales.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
                  Nenhum lançamento de vale ou bônus cadastrado.
                </td>
              </tr>
            ) : (
              filteredVales.map((vale) => (
                <tr key={vale.id}>
                  <td style={{ fontWeight: 600, color: "var(--text-muted)" }}>#{vale.id}</td>
                  <td style={{ fontWeight: 600, color: "var(--text-heading)" }}>{vale.funcionario.nome}</td>
                  <td>{formatDateBR(vale.data)}</td>
                  <td>
                    <span className={`badge ${vale.tipo === "BONUS" ? "badge-success" : "badge-danger"}`}>
                      {vale.tipo === "BONUS" ? "Bônus" : "Vale"}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: vale.tipo === "BONUS" ? "var(--success)" : "var(--error)" }}>
                    {vale.tipo === "BONUS" ? "+" : "-"}{formatCurrency(vale.valor)}
                  </td>
                  <td>{vale.descricao || <em style={{ color: "var(--text-muted)" }}>Não detalhado</em>}</td>
                  <td>
                    <span
                      className={`badge ${
                        vale.statusDesconto === "DESCONTADO" ? "badge-success" : "badge-warning"
                      }`}
                    >
                      {vale.statusDesconto === "DESCONTADO" ? "Descontado/Pago" : "Pendente"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "8px" }}>
                      <button
                        className={`btn btn-sm ${
                          vale.statusDesconto === "DESCONTADO" ? "btn-secondary" : "btn-primary"
                        }`}
                        onClick={() => handleToggleStatus(vale.id, vale.statusDesconto)}
                      >
                        {vale.statusDesconto === "DESCONTADO" ? "Reabrir" : "Conciliar"}
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditModal(vale)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(vale.id)}
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

      {/* Modal de Lançamento/Edição */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4 style={{ fontSize: "18px", fontWeight: 600 }}>
                {editingVale ? "Editar Ajuste de Lançamento" : "Lançar Novo Vale / Bônus"}
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
                  <label className="form-label">Funcionário *</label>
                  <select
                    className="form-control"
                    value={selectedFuncionarioId}
                    onChange={(e) => setSelectedFuncionarioId(e.target.value)}
                    required
                  >
                    <option value="">-- Selecione o Funcionário --</option>
                    {funcionarios.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nome} ({f.cargo})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo de Ajuste *</label>
                  <select
                    className="form-control"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    required
                  >
                    <option value="VALE">Vale / Adiantamento (Desconto/Débito)</option>
                    <option value="BONUS">Bônus / Extra (Crédito/Acréscimo)</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Data *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      required
                    />
                  </div>
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
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-control"
                    value={statusDesconto}
                    onChange={(e) => setStatusDesconto(e.target.value)}
                  >
                    <option value="PENDENTE">Pendente</option>
                    <option value="DESCONTADO">Conciliado (Lançado em Folha)</option>
                  </select>
                </div>

                 <div className="form-group">
                   <label className="form-label">Descrição / Motivo {tipo === "BONUS" ? "*" : ""}</label>
                   <input
                     type="text"
                     className="form-control"
                     placeholder={tipo === "BONUS" ? "Ex: Bônus por produtividade (Obrigatório)" : "Ex: Adiantamento no final de semana"}
                     value={descricao}
                     onChange={(e) => setDescricao(e.target.value)}
                     required={tipo === "BONUS"}
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
