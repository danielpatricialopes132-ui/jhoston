"use client";

import { useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { solicitarResetSenha, verificarStatusReset, definirNovaSenha } from "./actions";
import Link from "next/link";

export default function ResetPage() {
  const [usuario, setUsuario] = useState("");
  const [statusChecked, setStatusChecked] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isRequested, setIsRequested] = useState(false);
  const [nome, setNome] = useState("");
  
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmaSenha, setConfirmaSenha] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCheckStatus = () => {
    if (!usuario.trim()) {
      setErrorMsg("Digite o seu nome de usuário.");
      return;
    }
    setErrorMsg("");
    setIsLoading(true);

    startTransition(async () => {
      let cleanUser = usuario.trim();
      if (!cleanUser.startsWith("@")) {
        cleanUser = `@${cleanUser}`;
      }

      const check = await verificarStatusReset(cleanUser);
      setNome(check.userName || "");
      setStatusChecked(true);

      if (check.userName === "") {
        setErrorMsg("Usuário não cadastrado.");
        setStatusChecked(false);
        setIsLoading(false);
        return;
      }

      if (check.authorized) {
        setIsAuthorized(true);
        setIsRequested(false);
      } else {
        setIsAuthorized(false);
        // Verifica se já está solicitado
        setIsRequested(true);
      }
      setIsLoading(false);
    });
  };

  const handleSolicitar = () => {
    setIsLoading(true);
    setErrorMsg("");
    startTransition(async () => {
      const res = await solicitarResetSenha(usuario);
      if (res.success) {
        setSuccessMsg("Solicitação enviada com sucesso! Peça ao usuário MASTER para autorizar o seu reset.");
        setIsRequested(true);
      } else {
        setErrorMsg(res.error || "Erro ao solicitar o reset.");
      }
      setIsLoading(false);
    });
  };

  const handleDefinirSenha = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaSenha.trim() || !confirmaSenha.trim()) {
      setErrorMsg("Preencha todos os campos.");
      return;
    }
    if (novaSenha !== confirmaSenha) {
      setErrorMsg("As senhas não coincidem.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    startTransition(async () => {
      const res = await definirNovaSenha(usuario, novaSenha);
      if (res.success) {
        setSuccessMsg("Senha redefinida com sucesso! Seu usuário foi reconfigurado como CAMPO e precisa ser promovido novamente pelo MASTER. Você já pode fazer login.");
        setIsAuthorized(false);
        setNovaSenha("");
        setConfirmaSenha("");
      } else {
        setErrorMsg(res.error || "Erro ao salvar nova senha.");
      }
      setIsLoading(false);
    });
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--bg-main)",
        padding: "16px",
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: "450px", padding: "40px 32px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--primary)" }}>
            Reset de Senha
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
            Apenas o usuário MASTER pode liberar e autorizar o reset.
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              backgroundColor: "var(--error-bg)",
              color: "var(--error)",
              padding: "12px",
              borderRadius: "var(--radius-md)",
              marginBottom: "20px",
              fontSize: "14px",
              fontWeight: 500,
              border: "1px solid var(--error)",
            }}
          >
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              backgroundColor: "var(--success-bg)",
              color: "var(--success)",
              padding: "12px",
              borderRadius: "var(--radius-md)",
              marginBottom: "20px",
              fontSize: "14px",
              fontWeight: 500,
              border: "1px solid var(--success)",
            }}
          >
            {successMsg}
          </div>
        )}

        {/* Etapa 1: Inserir usuário e checar status */}
        {!statusChecked && (
          <div>
            <div className="form-group">
              <label className="form-label">Seu Usuário</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: @danielsmlopes"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "100%", height: "42px", marginTop: "10px" }}
              onClick={handleCheckStatus}
              disabled={isLoading}
            >
              {isLoading ? "Verificando..." : "Verificar Status"}
            </button>
          </div>
        )}

        {/* Etapa 2: Ações baseadas no status */}
        {statusChecked && !isAuthorized && (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "15px", marginBottom: "16px", color: "var(--text-main)" }}>
              Usuário identificado: <strong>{nome}</strong>
            </p>

            {isRequested ? (
              <div
                style={{
                  backgroundColor: "#fffbeb",
                  border: "1px solid #fef3c7",
                  color: "#b45309",
                  padding: "16px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  marginBottom: "20px",
                }}
              >
                Aguardando autorização do usuário MASTER. Peça para o administrador aprovar a redefinição de sua senha na tela de Controle de Usuários.
              </div>
            ) : (
              <div>
                <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "20px" }}>
                  Você ainda não solicitou o reset para este usuário.
                </p>
                <button
                  className="btn btn-primary"
                  style={{ width: "100%", height: "42px" }}
                  onClick={handleSolicitar}
                  disabled={isLoading}
                >
                  {isLoading ? "Solicitando..." : "Solicitar Reset ao Master"}
                </button>
              </div>
            )}

            <button
              className="btn btn-secondary btn-sm"
              style={{ marginTop: "16px" }}
              onClick={() => {
                setStatusChecked(false);
                setSuccessMsg("");
              }}
            >
              Mudar Usuário
            </button>
          </div>
        )}

        {/* Etapa 3: Reset autorizado, definir nova senha */}
        {statusChecked && isAuthorized && (
          <form onSubmit={handleDefinirSenha}>
            <div
              style={{
                backgroundColor: "var(--success-bg)",
                border: "1px solid var(--success)",
                color: "var(--success)",
                padding: "12px",
                borderRadius: "8px",
                fontSize: "14px",
                marginBottom: "20px",
              }}
            >
              ✓ Reset autorizado pelo MASTER! Defina sua nova senha abaixo.
            </div>

            <div className="form-group">
              <label className="form-label">Nova Senha</label>
              <input
                type="password"
                className="form-control"
                placeholder="Mínimo 6 caracteres"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: "24px" }}>
              <label className="form-label">Confirme a Nova Senha</label>
              <input
                type="password"
                className="form-control"
                placeholder="Repita a nova senha"
                value={confirmaSenha}
                onChange={(e) => setConfirmaSenha(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", height: "44px" }}
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : "Salvar Nova Senha"}
            </button>
          </form>
        )}

        <div style={{ marginTop: "24px", textAlign: "center", borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
          <Link href="/login" style={{ color: "var(--primary)", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>
            Voltar para a tela de Login
          </Link>
        </div>
      </div>
    </div>
  );
}
