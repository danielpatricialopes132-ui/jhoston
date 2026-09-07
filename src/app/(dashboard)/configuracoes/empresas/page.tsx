"use client";

import { useEffect, useState, startTransition } from "react";
import { getEmpresas, createEmpresa, updateEmpresa, deleteEmpresa } from "./actions";
import { getSession } from "@/app/login/actions";
import { useRouter } from "next/navigation";

interface Empresa {
  nome: string;
  cnpj: string | null;
  logoUrl: string | null;
  corPrimaria: string | null;
  corSecundaria: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
}

export default function EmpresasPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);

  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [corPrimaria, setCorPrimaria] = useState("#1e3a8a");
  const [corSecundaria, setCorSecundaria] = useState("#0ea5e9");
  
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = () => {
    getEmpresas()
      .then((data) => setEmpresas(data as any))
      .catch(() => {
        setIsAuthorized(false);
      });
  };

  useEffect(() => {
    getSession().then((session) => {
      if (session?.userRole !== "MASTER") {
        setIsAuthorized(false);
      } else {
        setIsAuthorized(true);
        loadData();
      }
    });
  }, []);

  const openNewModal = () => {
    setEditingEmpresa(null);
    setNome("");
    setCnpj("");
    setLogoUrl("");
    setCorPrimaria("#1e3a8a");
    setCorSecundaria("#0ea5e9");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Empresa) => {
    setEditingEmpresa(emp);
    setNome(emp.nome);
    setCnpj(emp.cnpj || "");
    setLogoUrl(emp.logoUrl || "");
    setCorPrimaria(emp.corPrimaria || "#1e3a8a");
    setCorSecundaria(emp.corSecundaria || "#0ea5e9");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmpresa(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErrorMsg("O nome da empresa é obrigatório.");
      return;
    }

    startTransition(async () => {
      let res;
      if (editingEmpresa) {
        res = await updateEmpresa(nome, {
          cnpj, logoUrl, corPrimaria, corSecundaria
        });
      } else {
        res = await createEmpresa({
          nome, cnpj, logoUrl, corPrimaria, corSecundaria
        });
      }

      if (res.success) {
        loadData();
        closeModal();
      } else {
        setErrorMsg((res as any).error || "Erro ao salvar os dados.");
      }
    });
  };

  const handleDelete = async (nome: string) => {
    if (confirm(`Tem certeza que deseja excluir a empresa ${nome}?`)) {
      const res = await deleteEmpresa(nome);
      if (res.success) {
        loadData();
      } else {
        alert(res.error);
      }
    }
  };

  if (isAuthorized === false) {
    return (
      <div className="card" style={{ padding: "40px", textAlign: "center", maxWidth: "600px", margin: "40px auto" }}>
        <span style={{ fontSize: "48px" }}>🔒</span>
        <h3 style={{ fontSize: "20px", fontWeight: 700, marginTop: "16px", color: "var(--text-heading)" }}>
          Acesso Restrito
        </h3>
        <p style={{ color: "var(--text-muted)", marginTop: "8px", fontSize: "14px" }}>
          A configuração e cadastro de empresas é exclusiva para administradores com perfil <strong>MASTER</strong>.
        </p>
        <button 
          className="btn btn-primary" 
          style={{ marginTop: "20px" }}
          onClick={() => router.push("/")}
        >
          Voltar ao Painel Principal
        </button>
      </div>
    );
  }

  if (isAuthorized === null) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
        Verificando credenciais...
      </div>
    );
  }

  return (
    <div>
      <div className="flex-row-between">
        <div>
          <h3 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-heading)" }}>
            Configurações de Empresas
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
            Gerencie as empresas ativas no sistema, dados fiscais, logos e cores institucionais (Exclusivo Master).
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNewModal}>
          + Nova Empresa
        </button>
      </div>

      <div className="table-container mt-6">
        <table className="table">
          <thead>
            <tr>
              <th>Nome da Empresa</th>
              <th>CNPJ</th>
              <th>Logo (URL)</th>
              <th>Cor Primária</th>
              <th style={{ textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {empresas.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
                  Nenhuma empresa cadastrada.
                </td>
              </tr>
            ) : (
              empresas.map((emp) => (
                <tr key={emp.nome}>
                  <td style={{ fontWeight: 600, color: "var(--text-heading)" }}>{emp.nome}</td>
                  <td>{emp.cnpj || "-"}</td>
                  <td>{emp.logoUrl ? <span className="text-xs truncate max-w-xs">{emp.logoUrl}</span> : "-"}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div style={{ width: 20, height: 20, backgroundColor: emp.corPrimaria || "#ccc", borderRadius: "50%" }}></div>
                      <span className="text-xs text-gray-500">{emp.corPrimaria}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "6px" }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(emp)}>Editar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(emp.nome)}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h4 style={{ fontSize: "18px", fontWeight: 600 }}>
                {editingEmpresa ? "Editar Empresa" : "Nova Empresa"}
              </h4>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }} onClick={closeModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {errorMsg && (
                  <div style={{ backgroundColor: "var(--error-bg)", color: "var(--error)", padding: "12px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
                    {errorMsg}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Nome da Empresa *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    disabled={!!editingEmpresa}
                    placeholder="Ex: JHOSTON TEC"
                  />
                  {editingEmpresa && <small className="text-gray-400 mt-1 block">O nome não pode ser alterado pois é usado como vínculo nas obras.</small>}
                </div>

                <div className="form-group">
                  <label className="form-label">CNPJ</label>
                  <input
                    type="text"
                    className="form-control"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="Ex: 00.000.000/0001-00"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Logo URL</label>
                  <input
                    type="text"
                    className="form-control"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="Ex: /logo.png ou https://..."
                  />
                  <small className="text-gray-400 mt-1 block">Caminho do arquivo ou link completo para o logo da empresa.</small>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Cor Primária</label>
                    <input
                      type="color"
                      className="form-control h-10 p-1 cursor-pointer"
                      value={corPrimaria}
                      onChange={(e) => setCorPrimaria(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cor Secundária</label>
                    <input
                      type="color"
                      className="form-control h-10 p-1 cursor-pointer"
                      value={corSecundaria}
                      onChange={(e) => setCorSecundaria(e.target.value)}
                    />
                  </div>
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
