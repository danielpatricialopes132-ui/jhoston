"use client";

import { useEffect, useState, startTransition } from "react";
import { getProdutosServicosList, salvarProdutoServico, deleteProdutoServico } from "./actions";

interface ProdutoServico {
  id: number;
  nome: string;
  descricao: string | null;
  precoPadrao: number;
  tipo: string; // "PRODUTO" | "SERVICO"
  empresa: string; // "JHOSTON" | "ECO_STONE" | "AMBAS"
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProdutosServicosPage() {
  const [items, setItems] = useState<ProdutoServico[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("TODOS");
  const [empresaFilter, setEmpresaFilter] = useState("TODAS");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProdutoServico | null>(null);

  // Form states
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [precoPadrao, setPrecoPadrao] = useState<number>(0);
  const [tipo, setTipo] = useState("PRODUTO");
  const [empresa, setEmpresa] = useState("JHOSTON");
  const [ativo, setAtivo] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const refreshData = () => {
    getProdutosServicosList().then((data) => {
      setItems(data as any);
    });
  };

  useEffect(() => {
    refreshData();
  }, []);

  const openNewModal = () => {
    setEditingItem(null);
    setNome("");
    setDescricao("");
    setPrecoPadrao(0);
    setTipo("PRODUTO");
    setEmpresa("JHOSTON");
    setAtivo(true);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (item: ProdutoServico) => {
    setEditingItem(item);
    setNome(item.nome);
    setDescricao(item.descricao || "");
    setPrecoPadrao(item.precoPadrao);
    setTipo(item.tipo);
    setEmpresa(item.empresa);
    setAtivo(item.ativo);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErrorMsg("O nome do produto/serviço é obrigatório.");
      return;
    }
    if (precoPadrao < 0) {
      setErrorMsg("O preço padrão não pode ser negativo.");
      return;
    }

    const payload = {
      id: editingItem?.id,
      nome,
      descricao,
      precoPadrao,
      tipo,
      empresa,
      ativo,
    };

    startTransition(async () => {
      const res = await salvarProdutoServico(payload);
      if (res.success) {
        refreshData();
        closeModal();
      } else {
        setErrorMsg(res.error || "Erro ao salvar os dados.");
      }
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Deseja realmente remover este produto/serviço? Esta ação não pode ser desfeita.")) {
      const res = await deleteProdutoServico(id);
      if (res.success) {
        refreshData();
      } else {
        alert(res.error || "Erro ao excluir o item.");
      }
    }
  };

  // Filter logic
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.descricao && item.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTipo = tipoFilter === "TODOS" || item.tipo === tipoFilter;
    const matchesEmpresa = empresaFilter === "TODAS" || item.empresa === empresaFilter || item.empresa === "AMBAS";

    return matchesSearch && matchesTipo && matchesEmpresa;
  });

  return (
    <div>
      <div className="flex-row-between" style={{ marginBottom: "20px" }}>
        <div>
          <h3 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-heading)" }}>
            Cadastro de Produtos & Serviços
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
            Gerencie os materiais e serviços prestados e precificados pelas empresas do grupo.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNewModal}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Novo Item
        </button>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: "20px", padding: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          <div>
            <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>
              Buscar por Nome ou Descrição
            </label>
            <input
              type="text"
              placeholder="Digite para buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>
              Filtrar por Tipo
            </label>
            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="form-control"
              style={{ width: "100%" }}
            >
              <option value="TODOS">Todos os Tipos</option>
              <option value="PRODUTO">Produtos</option>
              <option value="SERVICO">Serviços</option>
            </select>
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

      {/* Tabela de Resultados */}
      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        <div className="table-responsive">
          <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ padding: "12px 16px" }}>Nome</th>
                <th style={{ padding: "12px 16px" }}>Tipo</th>
                <th style={{ padding: "12px 16px" }}>Empresa</th>
                <th style={{ padding: "12px 16px" }}>Preço Padrão</th>
                <th style={{ padding: "12px 16px" }}>Descrição</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                    Nenhum produto ou serviço encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--text-heading)" }}>
                      {item.nome}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span className={`badge ${item.tipo === "PRODUTO" ? "badge-primary" : "badge-success"}`} style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 600,
                        backgroundColor: item.tipo === "PRODUTO" ? "rgba(2, 132, 199, 0.1)" : "rgba(16, 185, 129, 0.1)",
                        color: item.tipo === "PRODUTO" ? "var(--primary)" : "var(--success)"
                      }}>
                        {item.tipo === "PRODUTO" ? "Produto" : "Serviço"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontWeight: 500 }}>
                        {item.empresa === "JHOSTON" ? "Jhoston" : item.empresa === "ECO_STONE" ? "Eco Stone" : "Ambas"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: "bold" }}>
                      {item.precoPadrao.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--text-muted)", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.descricao || "-"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "13px",
                        color: item.ativo ? "var(--success)" : "var(--text-muted)"
                      }}>
                        <span style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: item.ativo ? "var(--success)" : "#94a3b8"
                        }}></span>
                        {item.ativo ? "Ativo" : "Inativo"}
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
            maxWidth: "500px",
            padding: "24px",
            boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.3)"
          }}>
            <div className="flex-row-between" style={{ marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "12px" }}>
              <h4 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-heading)", margin: 0 }}>
                {editingItem ? "Editar Item" : "Novo Produto / Serviço"}
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
                <div>
                  <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600 }}>
                    Nome do Item *
                  </label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Resina PU Azul, Impermeabilização"
                    className="form-control"
                    style={{ width: "100%" }}
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600 }}>
                      Tipo *
                    </label>
                    <select
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value)}
                      className="form-control"
                      style={{ width: "100%" }}
                    >
                      <option value="PRODUTO">Produto</option>
                      <option value="SERVICO">Serviço</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600 }}>
                      Empresa Executora *
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

                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px", alignItems: "end" }}>
                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600 }}>
                      Preço Padrão (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={precoPadrao}
                      onChange={(e) => setPrecoPadrao(parseFloat(e.target.value) || 0)}
                      placeholder="0,00"
                      className="form-control"
                      style={{ width: "100%" }}
                      required
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", height: "38px" }}>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={ativo}
                        onChange={(e) => setAtivo(e.target.checked)}
                        style={{ width: "16px", height: "16px" }}
                      />
                      Item Ativo
                    </label>
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600 }}>
                    Descrição
                  </label>
                  <textarea
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Informações adicionais do item..."
                    className="form-control"
                    style={{ width: "100%", height: "80px", resize: "none" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "16px" }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? "Salvar Alterações" : "Adicionar Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
