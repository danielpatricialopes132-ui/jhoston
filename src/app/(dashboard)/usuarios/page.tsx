"use client";

import { useEffect, useState, startTransition } from "react";
import { getUsuariosList, updateUsuarioRole, deleteUsuario, autorizarResetUsuario } from "./actions";
import { getSession } from "@/app/login/actions";
import { useRouter } from "next/navigation";

interface Usuario {
  id: number;
  nome: string;
  usuario: string;
  role: "ESCRITORIO" | "CAMPO";
  statusReset: string;
  createdAt: string;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadUsuarios = () => {
    setIsLoading(true);
    getUsuariosList()
      .then((res) => {
        const mapped = res.map((u) => ({
          ...u,
          createdAt: new Date(u.createdAt).toISOString(),
          statusReset: u.statusReset || "NENHUM",
        }));
        setUsuarios(mapped as any);
        setIsLoading(false);
      })
      .catch(() => {
        router.push("/");
      });
  };

  useEffect(() => {
    getSession().then((session) => {
      if (!session || session.userRole !== "MASTER") {
        router.push("/");
      } else {
        loadUsuarios();
      }
    });
  }, []);

  const handleRoleChange = (userId: number, role: "ESCRITORIO" | "CAMPO") => {
    startTransition(async () => {
      const res = await updateUsuarioRole(userId, role);
      if (res.success) {
        loadUsuarios();
      } else {
        alert("Erro ao alterar o nível de acesso.");
      }
    });
  };

  const handleAutorizarReset = (userId: number, autorizar: boolean) => {
    startTransition(async () => {
      const res = await autorizarResetUsuario(userId, autorizar);
      if (res.success) {
        loadUsuarios();
      } else {
        alert("Erro ao autorizar reset.");
      }
    });
  };

  const handleDelete = (userId: number, nome: string) => {
    if (confirm(`Tem certeza que deseja excluir o acesso de ${nome}?`)) {
      startTransition(async () => {
        const res = await deleteUsuario(userId);
        if (res.success) {
          loadUsuarios();
        } else {
          alert("Erro ao excluir usuário.");
        }
      });
    }
  };

  const formatDateBR = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div>
      <div className="flex-row-between">
        <div>
          <h3 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-heading)" }}>
            Controle de Permissões e Acesso
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
            Área exclusiva do usuário MASTER para autorização de acessos e liberação de reset de senhas.
          </p>
        </div>
      </div>

      <div
        className="card"
        style={{
          backgroundColor: "#eff6ff",
          border: "1px solid #bfdbfe",
          color: "#1e3a8a",
          padding: "16px",
          borderRadius: "var(--radius-md)",
          marginBottom: "24px",
          fontSize: "14px",
          lineHeight: "1.6",
        }}
      >
        <strong>ℹ️ Informação sobre Novos Usuários:</strong>
        <br />
        Qualquer colaborador pode se cadastrar na tela de registro. Por padrão de segurança, novos usuários são criados no nível <strong>CAMPO</strong> (acesso restrito apenas para registrar pontos e diário). Utilize a tabela abaixo para promover o nível de acesso para <strong>ESCRITÓRIO</strong> (acesso administrativo total) ou liberar resets de senhas solicitados pelos usuários.
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nome Completo</th>
              <th>Login único</th>
              <th>Data do Cadastro</th>
              <th>Nível de Acesso (Papel)</th>
              <th>Reset de Senha</th>
              <th style={{ width: "120px", textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
                  Carregando lista de usuários...
                </td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
                  Nenhum outro usuário cadastrado no sistema.
                </td>
              </tr>
            ) : (
              usuarios.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600, color: "var(--text-heading)" }}>{u.nome}</td>
                  <td>
                    <code style={{ fontSize: "14px", color: "var(--primary)", fontWeight: "bold" }}>{u.usuario}</code>
                  </td>
                  <td>{formatDateBR(u.createdAt)}</td>
                  <td>
                    <select
                      className="form-control"
                      style={{ width: "180px", display: "inline-block" }}
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                    >
                      <option value="CAMPO">CAMPO (Restrito)</option>
                      <option value="ESCRITORIO">ESCRITÓRIO (Administrador)</option>
                    </select>
                  </td>
                  <td>
                    {u.statusReset === "SOLICITADO" ? (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        <span className="badge badge-warning">Reset Solicitado</span>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ padding: "2px 8px", fontSize: "11px", height: "24px" }}
                          onClick={() => handleAutorizarReset(u.id, true)}
                        >
                          Autorizar
                        </button>
                      </div>
                    ) : u.statusReset === "AUTORIZADO" ? (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        <span className="badge badge-success">Reset Autorizado</span>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "2px 8px", fontSize: "11px", height: "24px" }}
                          onClick={() => handleAutorizarReset(u.id, false)}
                        >
                          Revogar
                        </button>
                      </div>
                    ) : (
                      <span className="badge badge-secondary" style={{ backgroundColor: "#e2e8f0", color: "#475569" }}>
                        Sem pendências
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(u.id, u.nome)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
