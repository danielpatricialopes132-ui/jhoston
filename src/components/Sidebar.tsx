"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, startTransition } from "react";
import { getSession, logout } from "@/app/login/actions";

interface Session {
  userId: number;
  userName: string;
  userRole: "MASTER" | "ESCRITORIO" | "CAMPO";
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [logoExists, setLogoExists] = useState(true);

  useEffect(() => {
    getSession().then((sess) => {
      if (sess) {
        setSession(sess as any);
      }
    });
  }, [pathname]);

  const handleLogout = () => {
    if (confirm("Deseja sair do sistema?")) {
      startTransition(async () => {
        await logout();
        router.push("/login");
      });
    }
  };

  // Ícones SVGs
  const icons = {
    dashboard: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
    ),
    obras: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
    ),
    funcionarios: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    ),
    ponto: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    ),
    diario: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
    ),
    viagens: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h11Z"/><path d="M19 18h2a1 1 0 0 0 1-1v-5.5a1.5 1.5 0 0 0-.5-1.1L18 7.5a1 1 0 0 0-.7-.3H14"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
    ),
    vales: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
    ),
    financeiro: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    ),
    fornecedores: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>
    ),
    relatorios: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
    ),
    usuarios: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
    ),
    crm: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="m21 10-6 6 2 2 6-6Z"/></svg>
    ),
    ajuda: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" x2="12" y1="17" y2="17"/></svg>
    ),
    calculadora: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>
    ),
    chat: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    )
  };

  // Todos os itens do menu
  const menuItems = [
    { name: "Painel Principal", path: "/", icon: icons.dashboard, adminOnly: true, masterOnly: false },
    { name: "CRM / Oportunidades", path: "/crm", icon: icons.crm, adminOnly: true, masterOnly: false },
    { name: "Obras (Projetos)", path: "/obras", icon: icons.obras, adminOnly: true, masterOnly: false },
    { name: "Funcionários", path: "/funcionarios", icon: icons.funcionarios, adminOnly: true, masterOnly: false },
    { name: "Controle de Ponto", path: "/ponto", icon: icons.ponto, adminOnly: false, masterOnly: false },
    { name: "Diário de Obra", path: "/diario-obra", icon: icons.diario, adminOnly: false, masterOnly: false },
    { name: "Diárias de Viagem", path: "/viagens", icon: icons.viagens, adminOnly: true, masterOnly: false },
    { name: "Controle de Vales", path: "/vales", icon: icons.vales, adminOnly: true, masterOnly: false },
    { name: "Contas a Pagar/Rec", path: "/financeiro", icon: icons.financeiro, adminOnly: true, masterOnly: false },
    { name: "Cad. Fornecedores", path: "/fornecedores", icon: icons.fornecedores, adminOnly: true, masterOnly: false },
    { name: "Calculadoras", path: "/calculadora", icon: icons.calculadora, adminOnly: false, masterOnly: false },
    { name: "Chat Interno", path: "/chat", icon: icons.chat, adminOnly: false, masterOnly: false },
    { name: "Relatórios", path: "/relatorios", icon: icons.relatorios, adminOnly: true, masterOnly: false },
    { name: "Ajuda (Manual)", path: "/ajuda", icon: icons.ajuda, adminOnly: false, masterOnly: false },
    { name: "Gerenciar Usuários", path: "/usuarios", icon: icons.usuarios, adminOnly: false, masterOnly: true }
  ];

  // Filtra itens de acordo com o cargo do usuário
  const filteredMenuItems = menuItems.filter((item) => {
    if (!session) return !item.adminOnly && !item.masterOnly; // Se ainda não carregou, esconde tudo
    
    // Se for Campo, esconde admin e master
    if (session.userRole === "CAMPO") {
      return !item.adminOnly && !item.masterOnly;
    }
    
    // Se for Escritório, mostra admin mas esconde master
    if (session.userRole === "ESCRITORIO") {
      return !item.masterOnly;
    }
    
    // Se for MASTER, mostra absolutamente tudo
    return true;
  });

  return (
    <aside className="sidebar">
      <div className="sidebar-header" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        {logoExists ? (
          <img
            src="/logo.png"
            alt="Jhoston Tec Logo"
            style={{
              maxHeight: "55px",
              maxWidth: "100%",
              objectFit: "contain",
              marginBottom: "8px",
            }}
            onError={() => setLogoExists(false)}
          />
        ) : null}
        
        {!logoExists && <h1 className="sidebar-title">JHOSTON TEC</h1>}
        <p className="sidebar-subtitle">Gestão de Piscinas</p>
      </div>

      <ul className="sidebar-menu">
        {filteredMenuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <li key={item.path}>
              <Link
                href={item.path}
                className={`sidebar-item-link ${isActive ? "active" : ""}`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
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
          <div style={{ fontSize: "12px", color: "#94a3b8" }}>
            Usuário: <strong>{session.userName}</strong>
            <br />
            Nível: <span style={{ textTransform: "lowercase" }}>{session.userRole}</span>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-danger btn-sm"
            style={{ width: "100%", justifyContent: "center", height: "32px", fontSize: "12px" }}
          >
            Sair (Logout)
          </button>
        </div>
      )}
    </aside>
  );
}
