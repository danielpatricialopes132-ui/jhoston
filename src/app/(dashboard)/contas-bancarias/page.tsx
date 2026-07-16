"use client";

import { useEffect, useState, startTransition } from "react";
import { getContasBancariasList, salvarContaBancaria, deleteContaBancaria } from "./actions";

interface ContaBancaria {
  id: number;
  banco: string;
  agencia: string | null;
  conta: string | null;
  tipoPix: string | null;
  chavePix: string | null;
  titular: string;
  documento: string | null;
  empresa: string; // "JHOSTON" | "ECO_STONE" | "AMBAS"
  ativa: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ContasBancariasPage() {
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [empresaFilter, setEmpresaFilter] = useState("TODAS");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaBancaria | null>(null);

  // Form states
  const [banco, setBanco] = useState("");
  const [agencia, setAgencia] = useState("");
  const [conta, setConta] = useState("");
  const [tipoPix, setTipoPix] = useState("");
  const [chavePix, setChavePix] = useState("");
  const [titular, setTitular] = useState("");
  const [documento, setDocumento] = useState("");
  const [empresa, setEmpresa] = useState("JHOSTON");
  const [ativa, setAtiva] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const refreshData = () => {
    getContasBancariasList().then((data) => {
      setContas(data as any);
    });
  };

  useEffect(() => {
    refreshData();
  }, []);

  const openNewModal = () => {
    setEditingConta(null);
    setBanco("");
    setAgencia("");
    setConta("");
    setTipoPix("");
    setChavePix("");
    setTitular("");
    setDocumento("");
    setEmpresa("JHOSTON");
    setAtiva(true);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (item: ContaBancaria) => {
    setEditingConta(item);
    setBanco(item.banco);
    setAgencia(item.agencia || "");
    setConta(item.conta || "");
    setTipoPix(item.tipoPix || "");
    setChavePix(item.chavePix || "");
    setTitular(item.titular);
    setDocumento(item.documento || "");
    setEmpresa(item.empresa);
    setAtiva(item.ativa);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingConta(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banco.trim()) {
      setErrorMsg("O nome do banco é obrigatório.");
      return;
    }
    if (!titular.trim()) {
      setErrorMsg("O nome do titular é obrigatório.");
      return;
    }

    const payload = {
      id: editingConta?.id,
      banco,
      agencia,
      conta,
      tipoPix,
      chavePix,
      titular,
      documento,
      empresa,
      ativa,
    };

    startTransition(async () => {
      const res = await salvarContaBancaria(payload);
      if (res.success) {
        refreshData();
        closeModal();
      } else {
        setErrorMsg(res.error || "Erro ao salvar os dados.");
      }
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Deseja realmente remover esta conta bancária? Esta ação não pode ser desfeita.")) {
      const res = await deleteContaBancaria(id);
      if (res.success) {
        refreshData();
      } else {
        alert(res.error || "Erro ao excluir a conta bancária.");
      }
    }
  };

  // Filter logic
  const filteredContas = contas.filter((item) => {
    const matchesSearch = item.banco.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.titular.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.chavePix && item.chavePix.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesEmpresa = empresaFilter === "TODAS" || item.empresa === empresaFilter || item.empresa === "AMBAS";

    return matchesSearch && matchesEmpresa;
  });

  return (
    <div>
      <div className="flex-row-between" style={{ marginBottom: "20px" }}>
        <div>
          <h3 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-heading)" }}>
            Cadastro de Contas Bancárias
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
            Gerencie as contas bancárias e chaves PIX das empresas para inclusão em propostas ou repasse a clientes.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNewModal}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Nova Conta
        </button>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: "20px", padding: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
          <div>
            <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>
              Buscar por Banco, Titular ou Chave PIX
            </label>
            <input
              type="text"
              placeholder="Digite banco, titular, pix..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>
              Filtrar por Empresa
            </label>
            <select
              value={empresaFilter}
              onChange={(e) => setEmpresaFilter(e.target.value)}
              className="form-control"
              style={{ width: "100%" }}
            >
              <option value="TODAS">Todas as Empresas</option>
              <option value="JHOSTON">Jhoston</option>
              <option value="ECO_STONE">Eco Stone</option>
              <option value="AMBAS">Ambas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Contas */}
      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        <div className="table-responsive">
          <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ padding: "12px 16px" }}>Banco</th>
                <th style={{ padding: "12px 16px" }}>Agência/Conta</th>
                <th style={{ padding: "12px 16px" }}>Titular</th>
                <th style={{ padding: "12px 16px" }}>Empresa</th>
                <th style={{ padding: "12px 16px" }}>Chave PIX</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredContas.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                    Nenhuma conta bancária cadastrada com os filtros informados.
                  </td>
                </tr>
              ) : (
                filteredContas.map((item) => (
                  <tr key={item.id}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--text-heading)" }}>
                      {item.banco}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      Ag: {item.agencia || "-"} | Cc: {item.conta || "-"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontWeight: 500, color: "var(--text-heading)" }}>{item.titular}</span>
                      {item.documento && <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)" }}>{item.documento}</span>}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontWeight: 500 }}>
                        {item.empresa === "JHOSTON" ? "Jhoston" : item.empresa === "ECO_STONE" ? "Eco Stone" : "Ambas"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {item.chavePix ? (
                        <div>
                          <strong style={{ fontSize: "12px" }}>{item.tipoPix}:</strong> {item.chavePix}
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Sem PIX</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "13px",
                        color: item.ativa ? "var(--success)" : "var(--text-muted)"
                      }}>
                        <span style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: item.ativa ? "var(--success)" : "#94a3b8"
                        }}></span>
                        {item.ativa ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "8px" }}>
                        <button
                          onClick={() => openEditModal(item)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "4px 8px", fontSize: "12px" }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="btn btn-danger btn-sm"
                          style={{ padding: "4px 8px", fontSize: "12px" }}
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
      </div>

      {/* Modal de Formulário */}
      {isModalOpen && (
        <div className="modal-backdrop" style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999
        }}>
          <div className="modal-content card" style={{
            width: "100%",
            maxWidth: "550px",
            padding: "24px",
            boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.3)"
          }}>
            <div className="flex-row-between" style={{ marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "12px" }}>
              <h4 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-heading)", margin: 0 }}>
                {editingConta ? "Editar Conta Bancária" : "Nova Conta Bancária"}
              </h4>
              <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "var(--text-muted)" }}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {errorMsg && (
                <div className="alert alert-danger" style={{ marginBottom: "16px", padding: "10px", borderRadius: "6px", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: "13px" }}>
                  {errorMsg}
                </div>
              )}

              <div style={{ display: "grid", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600 }}>
                      Banco *
                    </label>
                    <input
                      type="text"
                      value={banco}
                      onChange={(e) => setBanco(e.target.value)}
                      placeholder="Ex: Itaú, Bradesco, PJBank"
                      className="form-control"
                      style={{ width: "100%" }}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600 }}>
                      Empresa Proprietária *
                    </label>
                    <select
                      value={empresa}
                      onChange={(e) => setEmpresa(e.target.value)}
                      className="form-control"
                      style={{ width: "100%" }}
                    >
                      <option value="JHOSTON">Jhoston</option>
                      <option value="ECO_STONE">Eco Stone</option>
                      <option value="AMBAS">Ambas</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600 }}>
                      Agência
                    </label>
                    <input
                      type="text"
                      value={agencia}
                      onChange={(e) => setAgencia(e.target.value)}
                      placeholder="Ex: 0001"
                      className="form-control"
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600 }}>
                      Número da Conta
                    </label>
                    <input
                      type="text"
                      value={conta}
                      onChange={(e) => setConta(e.target.value)}
                      placeholder="Ex: 12345-6"
                      className="form-control"
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600 }}>
                      Titular da Conta *
                    </label>
                    <input
                      type="text"
                      value={titular}
                      onChange={(e) => setTitular(e.target.value)}
                      placeholder="Nome do favorecido"
                      className="form-control"
                      style={{ width: "100%" }}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600 }}>
                      CPF ou CNPJ do Titular
                    </label>
                    <input
                      type="text"
                      value={documento}
                      onChange={(e) => setDocumento(e.target.value)}
                      placeholder="CPF/CNPJ"
                      className="form-control"
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600 }}>
                      Tipo de Chave PIX
                    </label>
                    <select
                      value={tipoPix}
                      onChange={(e) => setTipoPix(e.target.value)}
                      className="form-control"
                      style={{ width: "100%" }}
                    >
                      <option value="">Sem Chave PIX</option>
                      <option value="CNPJ">CNPJ</option>
                      <option value="CPF">CPF</option>
                      <option value="CELULAR">Celular</option>
                      <option value="EMAIL">E-mail</option>
                      <option value="ALEATORIA">Chave Aleatória</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600 }}>
                      Chave PIX
                    </label>
                    <input
                      type="text"
                      value={chavePix}
                      onChange={(e) => setChavePix(e.target.value)}
                      placeholder="Chave PIX correspondente"
                      className="form-control"
                      style={{ width: "100%" }}
                      disabled={!tipoPix}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600, marginTop: "8px" }}>
                    <input
                      type="checkbox"
                      checked={ativa}
                      onChange={(e) => setAtiva(e.target.checked)}
                      style={{ width: "16px", height: "16px" }}
                    />
                    Conta Bancária Ativa
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "16px" }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingConta ? "Salvar Alterações" : "Adicionar Conta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
