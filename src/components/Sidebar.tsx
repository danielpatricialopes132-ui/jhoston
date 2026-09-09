"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, startTransition } from "react";
import { getSession, logout, setContextoEmpresa, getEmpresasDisponiveis } from "@/app/login/actions";

interface Session {
  userId: number;
  userName: string;
  userRole: "MASTER" | "ESCRITORIO" | "CAMPO";
  userEmpresa: string;
}

interface EmpresaItem {
  nome: string;
  logoUrl: string | null;
  corPrimaria: string | null;
}

interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  masterOnly?: boolean;
}

interface MenuSection {
  title: string;
  icon?: string;
  items: MenuItem[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [logoExists, setLogoExists] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isChangingContext, setIsChangingContext] = useState(false);
  const [empresasLista, setEmpresasLista] = useState<EmpresaItem[]>([]);

  useEffect(() => {
    // Carrega tema salvo
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.setAttribute("data-theme", "dark");
    }

    getSession().then((sess) => {
      if (sess) {
        setSession(sess as any);
      }
    });

    getEmpresasDisponiveis().then((lista) => {
      setEmpresasLista(lista);
    });
  }, [pathname]);

  const toggleTheme = () => {
    const newTheme = !isDarkMode ? "dark" : "light";
    setIsDarkMode(!isDarkMode);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  };

  const handleLogout = () => {
    if (confirm("Deseja sair do sistema?")) {
      startTransition(async () => {
        await logout();
        router.push("/login");
      });
    }
  };

  const handleContextChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const novaEmpresa = e.target.value;
    setIsChangingContext(true);
    startTransition(async () => {
      await setContextoEmpresa(novaEmpresa);
      if (session) {
        setSession({ ...session, userEmpresa: novaEmpresa });
      }
      setIsChangingContext(false);
      window.dispatchEvent(new CustomEvent("empresaContextChanged", { detail: novaEmpresa }));
      router.refresh();
    });
  };

  // Ícones SVGs
  const icons = {
    dashboard: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
    ),
    obras: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
    ),
    funcionarios: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    ),
    ponto: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    ),
    diario: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
    ),
    viagens: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h11Z"/><path d="M19 18h2a1 1 0 0 0 1-1v-5.5a1.5 1.5 0 0 0-.5-1.1L18 7.5a1 1 0 0 0-.7-.3H14"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
    ),
    vales: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
    ),
    financeiro: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    ),
    fornecedores: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>
    ),
    relatorios: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
    ),
    usuarios: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
    ),
    crm: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="m21 10-6 6 2 2 6-6Z"/></svg>
    ),
    marketing: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
    ),
    clientes: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    ),
    ajuda: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" x2="12" y1="17" y2="17"/></svg>
    ),
    calculadora: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>
    ),
    chat: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    ),
    contasBancarias: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/><path d="M6 15h2v.01"/></svg>
    ),
    produtosServicos: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
    ),
    balancete: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
    )
  };

  // Seções organizadas do menu
  const menuSections: MenuSection[] = [
    {
      title: "Visão Geral",
      items: [
        { name: "Painel Principal", path: "/", icon: icons.dashboard, adminOnly: true },
      ],
    },
    {
      title: "Comercial & Clientes",
      items: [
        { name: "CRM / Oportunidades", path: "/crm", icon: icons.crm, adminOnly: true },
        { name: "Agenda Inteligente", path: "/agenda", icon: icons.clientes, adminOnly: true },
        { name: "Marketing & Tour 360", path: "/marketing", icon: icons.marketing, adminOnly: true },
        { name: "Clientes (Proprietários)", path: "/clientes", icon: icons.clientes, adminOnly: true },
      ],
    },
    {
      title: "Operação & Obras",
      items: [
        { name: "Obras (Projetos)", path: "/obras", icon: icons.obras, adminOnly: true },
        { name: "Diário de Obra", path: "/diario-obra", icon: icons.diario, adminOnly: false },
        { name: "Avanço Fotográfico", path: "/avanco-fotografico", icon: icons.relatorios, adminOnly: true },
        { name: "Calculadoras", path: "/calculadora", icon: icons.calculadora, adminOnly: false },
      ],
    },
    {
      title: "Equipe & Campo",
      items: [
        { name: "Colaboradores", path: "/funcionarios", icon: icons.funcionarios, adminOnly: true },
        { name: "Controle de Ponto", path: "/ponto", icon: icons.ponto, adminOnly: false },
        { name: "Diárias de Viagem", path: "/viagens", icon: icons.viagens, adminOnly: true },
        { name: "Controle de Vales", path: "/vales", icon: icons.vales, adminOnly: true },
        { name: "Chat Interno", path: "/chat", icon: icons.chat, adminOnly: false },
      ],
    },
    {
      title: "Finanças & Gestão",
      items: [
        { name: "Contas a Pagar/Rec", path: "/financeiro", icon: icons.financeiro, adminOnly: true },
        { name: "Mini Balancete", path: "/financeiro?tab=balancete", icon: icons.balancete, adminOnly: true },
        { name: "Contas Bancárias", path: "/contas-bancarias", icon: icons.contasBancarias, adminOnly: true },
        { name: "Cad. Fornecedores", path: "/fornecedores", icon: icons.fornecedores, adminOnly: true },
        { name: "Cad. Prod/Serviços", path: "/produtos-servicos", icon: icons.produtosServicos, adminOnly: true },
        { name: "Relatórios Gerenciais", path: "/relatorios", icon: icons.relatorios, adminOnly: true },
      ],
    },
    {
      title: "Administração",
      items: [
        { name: "Config. Empresas", path: "/configuracoes/empresas", icon: icons.usuarios, masterOnly: true },
        { name: "Gerenciar Usuários", path: "/usuarios", icon: icons.usuarios, masterOnly: true },
        { name: "Ajuda (Manual)", path: "/ajuda", icon: icons.ajuda, adminOnly: false },
      ],
    },
  ];

  const filterItem = (item: MenuItem) => {
    if (!session) return !item.adminOnly && !item.masterOnly;
    if (session.userRole === "CAMPO") return !item.adminOnly && !item.masterOnly;
    if (session.userRole === "ESCRITORIO") return !item.masterOnly;
    return true; // MASTER
  };

  const getCompanyLabel = (empresaNome: string) => {
    const norm = empresaNome.toUpperCase();
    if (norm.includes("ECO")) return { icon: "🌿", label: "ECO STONE" };
    if (norm.includes("REVEST")) return { icon: "✨", label: "JHOSTON REVEST" };
    return { icon: "🏢", label: empresaNome };
  };

  return (
    <aside className="sidebar">
      <div 
        className="sidebar-header" 
        style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", cursor: "pointer" }}
        onDoubleClick={() => document.body.classList.toggle('matrix-mode')}
        title="Double click me for a surprise"
      >
        {logoExists ? (
          <img
            src="/logo.jpg"
            alt="Jhoston Tec Logo"
            style={{
              maxHeight: "50px",
              maxWidth: "100%",
              objectFit: "contain",
              marginBottom: "6px",
            }}
            onError={() => setLogoExists(false)}
          />
        ) : null}
        
        {!logoExists && <h1 className="sidebar-title">CONTROLE & GESTÃO</h1>}
        <p className="sidebar-subtitle">SISTEMA INTEGRADO</p>

        {session && session.userRole === "MASTER" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              marginTop: "12px",
              width: "100%",
              textAlign: "left",
              backgroundColor: "rgba(15, 118, 110, 0.12)",
              border: "1px solid rgba(15, 118, 110, 0.3)",
              borderRadius: "10px",
              padding: "8px 10px",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label
                style={{
                  fontSize: "10.5px",
                  fontWeight: 700,
                  color: "#2dd4bf",
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <span>🏢</span> Empresa Ativa
              </label>
              {isChangingContext && (
                <span style={{ fontSize: "10px", color: "#2dd4bf", fontWeight: 600 }}>Trocando...</span>
              )}
            </div>

            <div style={{ position: "relative", width: "100%" }}>
              <select
                style={{
                  width: "100%",
                  height: "34px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  padding: "0 28px 0 10px",
                  backgroundColor: "#0f172a",
                  color: "#f8fafc",
                  border: "1px solid #0d9488",
                  borderRadius: "6px",
                  outline: "none",
                  cursor: "pointer",
                  appearance: "none",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
                }}
                value={session.userEmpresa || "JHOSTON"}
                onChange={handleContextChange}
                disabled={isChangingContext}
              >
                {empresasLista.map((emp) => {
                  const display = getCompanyLabel(emp.nome);
                  return (
                    <option key={emp.nome} value={emp.nome} style={{ backgroundColor: "#0f172a", color: "#f8fafc" }}>
                      {display.icon} {display.label}
                    </option>
                  );
                })}
              </select>
              <div
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  color: "#2dd4bf",
                  fontSize: "10px",
                  fontWeight: "bold",
                }}
              >
                ▼
              </div>
            </div>
          </div>
        )}
      </div>

      <ul className="sidebar-menu">
        {menuSections.map((section) => {
          const visibleItems = section.items.filter(filterItem);
          if (visibleItems.length === 0) return null;

          return (
            <li key={section.title} className="sidebar-section">
              <span className="sidebar-section-title">{section.title}</span>
              {visibleItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`sidebar-item-link ${isActive ? "active" : ""}`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </li>
          );
        })}
      </ul>

      {session && (
        <div
          style={{
            padding: "16px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {/* Seletor de empresa movido para o topo */}

          <div style={{ fontSize: "12px", color: "#94a3b8" }}>
            Usuário: <strong>{session.userName}</strong>
            <br />
            Nível: <span style={{ textTransform: "lowercase" }}>{session.userRole}</span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={toggleTheme}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, justifyContent: "center", height: "32px", fontSize: "12px", padding: 0 }}
              title="Alternar Modo Escuro"
            >
              {isDarkMode ? "☀️ Claro" : "🌙 Escuro"}
            </button>
            <button
              onClick={handleLogout}
              className="btn btn-danger btn-sm"
              style={{ flex: 1, justifyContent: "center", height: "32px", fontSize: "12px", padding: 0 }}
            >
              Sair
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
