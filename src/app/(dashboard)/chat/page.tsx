"use client";

import { useEffect, useState, useRef } from "react";
import { getSession } from "@/app/login/actions";
import { getChatChannels, getChatMessages, enviarMensagem } from "./actions";
import Link from "next/link";

interface ObraChannel {
  id: number;
  nome: string;
}

interface UserContact {
  id: number;
  usuario: string;
  nome: string;
  role: string;
}

interface Message {
  id: number;
  conteudo: string;
  remetenteId: number;
  remetenteNome: string;
  remetenteRole: string;
  createdAt: string;
}

export default function ChatPage() {
  const [session, setSession] = useState<any>(null);
  const [obras, setObras] = useState<ObraChannel[]>([]);
  const [usuarios, setUsuarios] = useState<UserContact[]>([]);
  const [activeTarget, setActiveTarget] = useState<{ id: number; nome: string; isGroup: boolean } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<number | null>(null);

  // Play audio beep when new message is received
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5 note
      gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime); // low volume

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12);
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Carregar sessão do usuário logado
  useEffect(() => {
    getSession().then((sess) => {
      if (sess) {
        setSession(sess);
      }
    });
  }, []);

  // 2. Carregar canais (Obras e Contatos)
  useEffect(() => {
    if (!session) return;

    getChatChannels(session.userId).then((res) => {
      if (res.success) {
        setObras(res.obras || []);
        setUsuarios(res.usuarios || []);
        
        // Selecionar o primeiro canal por padrão
        if (res.obras && res.obras.length > 0) {
          setActiveTarget({ id: res.obras[0].id, nome: res.obras[0].nome, isGroup: true });
        } else if (res.usuarios && res.usuarios.length > 0) {
          setActiveTarget({ id: res.usuarios[0].id, nome: res.usuarios[0].nome, isGroup: false });
        }
      }
    });
  }, [session]);

  // 3. Buscar mensagens
  const fetchMessages = (silently = true) => {
    if (!session || !activeTarget) return;
    if (!silently) setIsLoading(true);

    getChatMessages(session.userId, activeTarget.id, activeTarget.isGroup).then((res) => {
      if (res.success && res.data) {
        const fetched = res.data;
        setMessages(fetched);

        // Detectar novas mensagens para tocar o som
        if (fetched.length > 0) {
          const lastMsg = fetched[fetched.length - 1];
          if (
            lastMessageIdRef.current !== null && 
            lastMessageIdRef.current !== lastMsg.id &&
            lastMsg.remetenteId !== session.userId
          ) {
            playBeep();
          }
          lastMessageIdRef.current = lastMsg.id;
        } else {
          lastMessageIdRef.current = null;
        }
      }
      if (!silently) setIsLoading(false);
    });
  };

  // Polling a cada 3 segundos
  useEffect(() => {
    if (!session || !activeTarget) return;

    fetchMessages(false);

    const interval = setInterval(() => {
      fetchMessages(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [session, activeTarget]);

  // Auto-scroll para baixo ao receber novas mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Enviar Mensagem
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !session || !activeTarget) return;

    const content = inputMessage;
    setInputMessage(""); // limpa antes para dar sensação de velocidade

    const res = await enviarMensagem(content, session.userId, activeTarget.id, activeTarget.isGroup);
    if (res.success) {
      fetchMessages(true);
    } else {
      alert(res.error || "Erro ao enviar mensagem.");
    }
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  return (
    <div style={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}>
      {/* Cabeçalho */}
      <div className="flex-row-between" style={{ marginBottom: "16px", flexShrink: 0 }}>
        <div>
          <h3 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-heading)" }}>
            Comunicação Interna
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "2px" }}>
            Converse em grupo com os envolvidos em cada obra ou envie mensagens diretas.
          </p>
        </div>
        <Link href="/" className="btn btn-secondary">
          Voltar para Home
        </Link>
      </div>

      {/* Split Pane do Chat */}
      <div
        className="card"
        style={{
          flex: 1,
          display: "flex",
          padding: 0,
          overflow: "hidden",
          borderRadius: "var(--radius-lg)",
          height: "100%",
        }}
      >
        {/* Painel Esquerdo (Canais e Contatos) */}
        <div
          style={{
            width: "300px",
            borderRight: "1px solid var(--border-color)",
            backgroundColor: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
          }}
        >
          {/* Obras (Canais) */}
          <div style={{ padding: "16px 12px 10px 12px", borderBottom: "1px solid var(--border-color)" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
              📢 Grupos de Obras
            </span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "2px" }}>
              {obras.length === 0 ? (
                <li style={{ fontSize: "13px", color: "var(--text-muted)", padding: "8px 12px" }}>Nenhuma obra ativa.</li>
              ) : (
                obras.map((o) => {
                  const isSelected = activeTarget?.isGroup && activeTarget.id === o.id;
                  return (
                    <li key={`obra-${o.id}`}>
                      <button
                        onClick={() => setActiveTarget({ id: o.id, nome: o.nome, isGroup: true })}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "10px 12px",
                          borderRadius: "var(--radius-md)",
                          border: "none",
                          background: isSelected ? "var(--primary)" : "transparent",
                          color: isSelected ? "#ffffff" : "var(--text-main)",
                          fontWeight: isSelected ? 600 : 500,
                          fontSize: "14px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span style={{ opacity: isSelected ? 1 : 0.6 }}>#</span>
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{o.nome}</span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>

          {/* Usuários (DMs) */}
          <div style={{ padding: "16px 12px 10px 12px", borderBottom: "1px solid var(--border-color)", borderTop: "1px solid var(--border-color)" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
              👥 Conversas Diretas
            </span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "2px" }}>
              {usuarios.length === 0 ? (
                <li style={{ fontSize: "13px", color: "var(--text-muted)", padding: "8px 12px" }}>Nenhum usuário cadastrado.</li>
              ) : (
                usuarios.map((u) => {
                  const isSelected = !activeTarget?.isGroup && activeTarget?.id === u.id;
                  return (
                    <li key={`user-${u.id}`}>
                      <button
                        onClick={() => setActiveTarget({ id: u.id, nome: u.nome, isGroup: false })}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "10px 12px",
                          borderRadius: "var(--radius-md)",
                          border: "none",
                          background: isSelected ? "var(--primary)" : "transparent",
                          color: isSelected ? "#ffffff" : "var(--text-main)",
                          fontWeight: isSelected ? 600 : 500,
                          fontSize: "14px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: u.role === "MASTER" ? "var(--error)" : u.role === "ESCRITORIO" ? "var(--success)" : "var(--warning)",
                          }}
                        />
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{u.nome}</span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </div>

        {/* Janela de Mensagens (Direita) */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", backgroundColor: "#ffffff" }}>
          {activeTarget ? (
            <>
              {/* Topo do Chat */}
              <div
                style={{
                  padding: "14px 24px",
                  borderBottom: "1px solid var(--border-color)",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexShrink: 0,
                }}
              >
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-heading)" }}>
                    {activeTarget.isGroup ? "📢 " : "👤 "}
                    {activeTarget.nome}
                  </h4>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {activeTarget.isGroup ? "Canal de Obra Ativa" : "Conversa Direta Privada"}
                  </span>
                </div>
              </div>

              {/* Corpo do Chat - Mensagens */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "24px",
                  backgroundColor: "#f1f5f9",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {isLoading ? (
                  <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "14px", marginTop: "20px" }}>
                    Carregando histórico...
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ display: "flex", flex: 1, justifyContent: "center", alignItems: "center", flexDirection: "column", color: "var(--text-muted)", gap: "10px" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <span style={{ fontSize: "13px" }}>Nenhuma mensagem por aqui. Comece a conversa!</span>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isSelf = session && m.remetenteId === session.userId;
                    return (
                      <div
                        key={m.id}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isSelf ? "flex-end" : "flex-start",
                          maxWidth: "75%",
                          alignSelf: isSelf ? "flex-end" : "flex-start",
                        }}
                      >
                        {/* Nome do Remetente */}
                        {!isSelf && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", marginLeft: "4px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-heading)" }}>{m.remetenteNome}</span>
                            <span
                              style={{
                                fontSize: "9px",
                                fontWeight: 700,
                                padding: "1px 4px",
                                borderRadius: "3px",
                                backgroundColor: m.remetenteRole === "MASTER" ? "var(--error-bg)" : m.remetenteRole === "ESCRITORIO" ? "var(--success-bg)" : "var(--warning-bg)",
                                color: m.remetenteRole === "MASTER" ? "var(--error)" : m.remetenteRole === "ESCRITORIO" ? "var(--success)" : "var(--warning)",
                              }}
                            >
                              {m.remetenteRole}
                            </span>
                          </div>
                        )}

                        {/* Balão da Mensagem */}
                        <div
                          style={{
                            padding: "10px 14px",
                            borderRadius: isSelf ? "12px 12px 0 12px" : "12px 12px 12px 0",
                            backgroundColor: isSelf ? "var(--primary)" : "#ffffff",
                            color: isSelf ? "#ffffff" : "var(--text-main)",
                            boxShadow: "var(--shadow-sm)",
                            fontSize: "14px",
                            wordBreak: "break-word",
                            lineHeight: "1.4",
                          }}
                        >
                          {m.conteudo}
                        </div>

                        {/* Horário */}
                        <span style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px", marginRight: isSelf ? "4px" : "0", marginLeft: isSelf ? "0" : "4px" }}>
                          {formatTime(m.createdAt)}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Rodapé do Chat - Envio */}
              <form
                onSubmit={handleSend}
                style={{
                  padding: "16px 24px",
                  borderTop: "1px solid var(--border-color)",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <input
                  type="text"
                  className="form-control"
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "14px",
                  }}
                  placeholder="Escreva sua mensagem..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  maxLength={500}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: "12px 24px",
                    borderRadius: "var(--radius-md)",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>Enviar</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </form>
            </>
          ) : (
            <div style={{ display: "flex", flex: 1, justifyContent: "center", alignItems: "center", flexDirection: "column", color: "var(--text-muted)", gap: "12px" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary)" }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <h5 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-heading)" }}>Nenhum canal ativo</h5>
              <span style={{ fontSize: "13px" }}>Selecione um grupo de obra ou contato ao lado para iniciar.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
