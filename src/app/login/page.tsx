"use client";

import { useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { login } from "./actions";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senhaStr, setSenhaStr] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !senhaStr.trim()) {
      setErrorMsg("Por favor, preencha todos os campos.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    startTransition(async () => {
      const res = await login({ email, senhaStr });
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
          <img src="/logo.jpg" alt="Logo" style={{ maxHeight: "80px", marginBottom: "16px", objectFit: "contain" }} />
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--primary)" }}>
            CONTROLE & GESTÃO
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
            <label className="form-label" htmlFor="email">
              E-mail
            </label>
            <input
              type="email"
              id="email"
              className="form-control"
              placeholder="Ex: seuemail@dominio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: "24px", position: "relative" }}>
            <label className="form-label" htmlFor="password">
              Senha
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="form-control"
                placeholder="••••••••"
                value={senhaStr}
                onChange={(e) => setSenhaStr(e.target.value)}
                disabled={isLoading}
                required
                style={{ paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title={showPassword ? "Ocultar senha" : "Ver senha"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
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
