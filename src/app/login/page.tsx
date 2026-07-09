"use client";

import { useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { login } from "./actions";
import Link from "next/link";

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [senhaStr, setSenhaStr] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario.trim() || !senhaStr.trim()) {
      setErrorMsg("Por favor, preencha todos os campos.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    startTransition(async () => {
      const res = await login({ usuario, senhaStr });
      if (res.success) {
        if (res.role === "CAMPO") {
          router.push("/ponto");
        } else {
          router.push("/");
        }
      } else {
        setErrorMsg(res.error || "Erro ao realizar o login.");
        setIsLoading(false);
      }
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
      <div className="card" style={{ width: "100%", maxWidth: "420px", padding: "40px 32px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--primary)" }}>
            JHOSTON TEC
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
            Painel Financeiro & Operações
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

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Usuário
            </label>
            <input
              type="text"
              id="username"
              className="form-control"
              placeholder="Ex: admin"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: "24px" }}>
            <label className="form-label" htmlFor="password">
              Senha
            </label>
            <input
              type="password"
              id="password"
              className="form-control"
              placeholder="••••••••"
              value={senhaStr}
              onChange={(e) => setSenhaStr(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", height: "46px", fontSize: "15px" }}
            disabled={isLoading}
          >
            {isLoading ? "Entrando..." : "Entrar no Sistema"}
          </button>
        </form>

        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <span style={{ color: "var(--text-muted)" }}>Não tem uma conta? </span>
            <Link href="/signup" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
              Cadastre-se
            </Link>
          </div>
          <div>
            <Link href="/login/reset" style={{ color: "var(--text-muted)", fontSize: "13px", textDecoration: "underline" }}>
              Esqueceu a senha? Solicitar reset
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
