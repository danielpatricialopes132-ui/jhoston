"use client";

import { useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { cadastrarUsuario } from "./actions";
import Link from "next/link";

export default function SignupPage() {
  const [nome, setNome] = useState("");
  const [usuario, setUsuario] = useState("");
  const [senhaStr, setSenhaStr] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !usuario.trim() || !senhaStr.trim()) {
      setErrorMsg("Por favor, preencha todos os campos.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    startTransition(async () => {
      const res = await cadastrarUsuario({ nome, usuario, senhaStr });
      if (res.success) {
        setSuccessMsg("Cadastro realizado com sucesso! Por padrão seu acesso é de nível CAMPO. Redirecionando para o login...");
        setIsLoading(false);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setErrorMsg(res.error || "Erro ao realizar o cadastro.");
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
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--primary)" }}>
            JHOSTON TEC
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
            Criar Nova Conta de Usuário
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
              fontSize: "13px",
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
              fontSize: "13px",
              fontWeight: 500,
              border: "1px solid var(--success)",
            }}
          >
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="nome">
              Nome Completo
            </label>
            <input
              type="text"
              id="nome"
              className="form-control"
              placeholder="Ex: Daniel Lopes"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={isLoading || successMsg !== ""}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Usuário (Será adicionado @ no início)
            </label>
            <input
              type="text"
              id="username"
              className="form-control"
              placeholder="Ex: @danielsmlopes"
              value={usuario}
              onChange={(e) => {
                let val = e.target.value;
                // Deixa digitar tudo, mas avisa
                setUsuario(val);
              }}
              disabled={isLoading || successMsg !== ""}
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
              disabled={isLoading || successMsg !== ""}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", height: "46px", fontSize: "15px" }}
            disabled={isLoading || successMsg !== ""}
          >
            {isLoading ? "Processando..." : "Solicitar Acesso"}
          </button>
        </form>

        <div style={{ marginTop: "24px", textAlign: "center", fontSize: "14px" }}>
          <span style={{ color: "var(--text-muted)" }}>Já tem uma conta? </span>
          <Link href="/login" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
            Fazer Login
          </Link>
        </div>
      </div>
    </div>
  );
}
