"use client";

import { useEffect, useState, startTransition } from "react";
import { getFuncionarios, createFuncionario, updateFuncionario, deleteFuncionario } from "./actions";
import { getSession } from "@/app/login/actions";

interface Funcionario {
  id: number;
  nome: string;
  cargo: string | null;
  funcao?: string;
  salarioFixo?: number;
  diariaPadrao: number;
  adicionalMotorista: number;
  pix: string | null;
  telefone: string | null;
  ativo: boolean;
  empresa: string;
}

export default function FuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [funcaoFilter, setFuncaoFilter] = useState("TODOS");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);

  // Form states
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [funcao, setFuncao] = useState("CAMPO");
  const [salarioFixo, setSalarioFixo] = useState("0");
  const [diariaPadrao, setDiariaPadrao] = useState("0");
  const [adicionalMotorista, setAdicionalMotorista] = useState("0");
  const [pix, setPix] = useState("");
  const [telefone, setTelefone] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeContext, setActiveContext] = useState("TODAS");
  const [empresa, setEmpresa] = useState("JHOSTON");

  const refreshFuncionarios = () => {
    getFuncionarios().then((data) => setFuncionarios(data as any));
  };

  useEffect(() => {
    refreshFuncionarios();

    getSession().then((sess) => {
      if (sess?.userEmpresa && sess.userEmpresa !== "AMBAS") {
        setActiveContext(sess.userEmpresa);
        setEmpresa(sess.userEmpresa);
      } else {
        setActiveContext("TODAS");
      }
    });

    const handleContextChange = (e: CustomEvent<string>) => {
      if (e.detail && e.detail !== "AMBAS") {
        setActiveContext(e.detail);
        setEmpresa(e.detail);
      } else {
        setActiveContext("TODAS");
      }
    };
    window.addEventListener("empresaContextChanged" as any, handleContextChange);
    return () => {
      window.removeEventListener("empresaContextChanged" as any, handleContextChange);
    };
  }, []);

  const openNewModal = () => {
    setEditingFuncionario(null);
    setNome("");
    setCargo("");
    setFuncao("CAMPO");
    setSalarioFixo("0");
    setDiariaPadrao("150"); // Valor padrão sugerido
    setAdicionalMotorista("50"); // Adicional padrão sugerido
    setPix("");
    setTelefone("");
    setAtivo(true);
    setEmpresa(activeContext === "TODAS" ? "JHOSTON" : activeContext);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (f: Funcionario) => {
    setEditingFuncionario(f);
    setNome(f.nome);
    setCargo(f.cargo || "");
    setFuncao(f.funcao || "CAMPO");
    setSalarioFixo(f.salarioFixo ? f.salarioFixo.toString() : "0");
    setDiariaPadrao(f.diariaPadrao.toString());
    setAdicionalMotorista(f.adicionalMotorista.toString());
    setPix(f.pix || "");
    setTelefone(f.telefone || "");
    setAtivo(f.ativo);
    setEmpresa(f.empresa || "JHOSTON");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingFuncionario(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErrorMsg("Nome é obrigatório.");
      return;
    }

    const payload = {
      nome,
      cargo,
      funcao,
      salarioFixo: funcao === "ESCRITORIO" || funcao === "DIRETORIA" ? (parseFloat(salarioFixo) || 0) : 0,
      diariaPadrao: funcao === "CAMPO" ? (parseFloat(diariaPadrao) || 0) : 0,
      adicionalMotorista: funcao === "CAMPO" ? (parseFloat(adicionalMotorista) || 0) : 0,
      pix,
      telefone,
      ativo,
      empresa
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
      (f.cargo && f.cargo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.pix && f.pix.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "TODOS" ||
      (statusFilter === "ATIVO" && f.ativo) ||
      (statusFilter === "INATIVO" && !f.ativo);

    const matchesFuncao =
      funcaoFilter === "TODOS" ||
      (funcaoFilter === "ESCRITORIO" && (f.funcao === "ESCRITORIO" || f.funcao === "DIRETORIA")) ||
      (funcaoFilter === "CAMPO" && (f.funcao === "CAMPO" || !f.funcao));

    const matchesContext = (activeContext === "TODAS" || activeContext === "AMBAS") ? true : activeContext === "ECO_STONE" ? f.empresa === "ECO_STONE" : f.empresa === "JHOSTON";

    return matchesSearch && matchesStatus && matchesFuncao && matchesContext;
  });

  return (
    <div>
      <div className="flex-row-between">
        <div>
          <h3 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-heading)" }}>
            Cadastro de Colaboradores
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
            Gerencie os dados da equipe, setor/função (Escritório ou Campo), remunerações e chaves PIX.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNewModal}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px" }}><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
          Novo Colaborador
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="filters-bar">
        <div className="form-group" style={{ flex: 2 }}>
          <label className="form-label">Buscar Colaborador</label>
          <input
            type="text"
            className="form-control"
            placeholder="Digite o nome, cargo ou chave PIX..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Filtrar por Função</label>
          <select
            className="form-control"
            value={funcaoFilter}
            onChange={(e) => setFuncaoFilter(e.target.value)}
          >
            <option value="TODOS">Todas as Funções</option>
            <option value="ESCRITORIO">Escritório / Diretoria</option>
            <option value="CAMPO">Campo / Obra</option>
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
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
          </select>
        </div>
      </div>

      {/* Lista de Colaboradores */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: "70px" }}>ID</th>
              <th>Nome</th>
              <th>Função / Setor</th>
              <th>Cargo</th>
              <th>Remuneração</th>
              <th>Telefone</th>
              <th>Chave PIX</th>
              <th>Status</th>
              <th style={{ width: "160px", textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredFuncionarios.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
                  Nenhum colaborador cadastrado ou encontrado.
                </td>
              </tr>
            ) : (
              filteredFuncionarios.map((f) => (
                <tr key={f.id}>
                  <td style={{ fontWeight: 600, color: "var(--text-muted)" }}>#{f.id}</td>
                  <td style={{ fontWeight: 600, color: "var(--text-heading)" }}>{f.nome}</td>
                  <td>
                    {f.funcao === "ESCRITORIO" ? (
                      <span className="badge" style={{ backgroundColor: "#e0e7ff", color: "#3730a3", fontWeight: 700 }}>
                        🏢 ESCRITÓRIO
                      </span>
                    ) : f.funcao === "DIRETORIA" ? (
                      <span className="badge" style={{ backgroundColor: "#fef3c7", color: "#92400e", fontWeight: 700 }}>
                        👑 DIRETORIA
                      </span>
                    ) : (
                      <span className="badge" style={{ backgroundColor: "#ecfdf5", color: "#065f46", fontWeight: 700 }}>
                        🔨 CAMPO / OBRA
                      </span>
                    )}
                  </td>
                  <td>{f.cargo || <em style={{ color: "var(--text-muted)", fontSize: "12px" }}>Não informado</em>}</td>
                  <td>
                    {f.funcao === "ESCRITORIO" || f.funcao === "DIRETORIA" ? (
                      <div>
                        <strong style={{ color: "var(--primary)" }}>{formatCurrency(f.salarioFixo || 0)}</strong>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Fixo Mensal</div>
                      </div>
                    ) : (
                      <div>
                        <strong>{formatCurrency(f.diariaPadrao)}</strong>
                        <div style={{ fontSize: "11px", color: "var(--secondary)" }}>
                          {f.adicionalMotorista > 0 ? `+ ${formatCurrency(f.adicionalMotorista)} mot.` : "Diária"}
                        </div>
                      </div>
                    )}
                  </td>
                  <td>
                    {f.telefone ? (
                      <span style={{ fontFamily: "monospace", fontSize: "13px" }}>{f.telefone}</span>
                    ) : (
                      <em style={{ color: "var(--text-muted)" }}>Não informado</em>
                    )}
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

      {/* Modal de Novo/Editar Colaborador */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4 style={{ fontSize: "18px", fontWeight: 600 }}>
                {editingFuncionario ? "Editar Colaborador" : "Novo Colaborador"}
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
                  <label className="form-label">Função / Setor *</label>
                  <select
                    className="form-control"
                    value={funcao}
                    onChange={(e) => setFuncao(e.target.value)}
                    required
                  >
                    <option value="CAMPO">🔨 CAMPO / OBRA (Diarista / Técnico)</option>
                    <option value="ESCRITORIO">🏢 ESCRITÓRIO (Salário Fixo Mensal)</option>
                    <option value="DIRETORIA">👑 PROPRIETÁRIO / DIRETORIA (Pró-Labore Fixo / Isento)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Cargo / Título (Opcional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Gerente Administrativo, Instalador, Proprietário..."
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                  />
                </div>

                {/* Remuneração Dinâmica: Salário Fixo para Escritório/Diretoria, Diária para Campo */}
                {funcao === "ESCRITORIO" || funcao === "DIRETORIA" ? (
                  <div className="form-group" style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                    <label className="form-label" style={{ fontWeight: 600, color: "var(--primary)" }}>
                      Salário Fixo Mensal / Pró-Labore (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      placeholder="0,00"
                      value={salarioFixo}
                      onChange={(e) => setSalarioFixo(e.target.value)}
                      required
                    />
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                      {funcao === "DIRETORIA" ? "Pode ser R$ 0,00 caso não possua retirada/pró-labore no momento." : "Valor pago mensalmente, independente do registro diário de ponto."}
                    </span>
                  </div>
                ) : (
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
                )}
                <div className="form-group">
                  <label className="form-label">Telefone (Opcional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: (11) 99999-9999"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                  />
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
                      Colaborador Ativo
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
