"use client";

import { useEffect, useState, startTransition } from "react";
import { getDiarioData, salvarRelatoDiario, deleteRelatoDiario } from "./actions";
import { getSession } from "@/app/login/actions";

interface Obra {
  id: number;
  nome: string;
  clienteNome: string;
  progressoEscavacao: number;
  progressoEstrutura: number;
  progressoHidraulica: number;
  progressoRevestimento: number;
  progressoAcabamento: number;
}

interface Foto {
  id: number;
  diarioObraId: number;
  base64Data: string;
  createdAt: string;
}

interface Relato {
  id: number;
  obraId: number;
  data: string;
  conteudo: string;
  usuarioId: number;
  usuario: {
    nome: string;
    role: string;
  };
  fotos: Foto[];
  createdAt: string;
}

interface Session {
  userId: number;
  userName: string;
  userRole: "MASTER" | "ESCRITORIO" | "CAMPO";
}

export default function DiarioObraPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [obras, setObras] = useState<Obra[]>([]);
  const [relatos, setRelatos] = useState<Relato[]>([]);
  const [selectedObraId, setSelectedObraId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [conteudo, setConteudo] = useState("");
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  // Progress states
  const [progressoEscavacao, setProgressoEscavacao] = useState(0);
  const [progressoEstrutura, setProgressoEstrutura] = useState(0);
  const [progressoHidraulica, setProgressoHidraulica] = useState(0);
  const [progressoRevestimento, setProgressoRevestimento] = useState(0);
  const [progressoAcabamento, setProgressoAcabamento] = useState(0);

  useEffect(() => {
    getSession().then((sess) => {
      if (sess) {
        setSession(sess as any);
      }
    });
  }, []);

  const loadRelatos = () => {
    if (!selectedObraId) {
      getDiarioData().then((res) => {
        setObras(res.obras as any);
        setRelatos([]);
      });
      return;
    }

    setIsLoading(true);
    getDiarioData(parseInt(selectedObraId)).then((res) => {
      setObras(res.obras as any);

      // Preenche os sliders com o progresso atual do banco
      if (res.obraAtual) {
        setProgressoEscavacao(res.obraAtual.progressoEscavacao);
        setProgressoEstrutura(res.obraAtual.progressoEstrutura);
        setProgressoHidraulica(res.obraAtual.progressoHidraulica);
        setProgressoRevestimento(res.obraAtual.progressoRevestimento);
        setProgressoAcabamento(res.obraAtual.progressoAcabamento);
      }

      const mapped = res.relatos.map((r) => ({
        ...r,
        data: new Date(r.data).toISOString().split("T")[0],
        createdAt: new Date(r.createdAt).toISOString(),
      }));

      setRelatos(mapped as any);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadRelatos();
    setErrorMsg("");
    setSuccessMsg("");
  }, [selectedObraId]);

  // Função para comprimir imagens usando Canvas no cliente antes de salvar
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setErrorMsg("");

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        setErrorMsg("Apenas arquivos de imagem são aceitos.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1024; // Resolução suficiente e leve
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Comprimir para JPEG leve (qualidade 70%)
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
            setSelectedPhotos((prev) => [...prev, compressedBase64]);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedObraId) {
      setErrorMsg("Selecione uma obra.");
      return;
    }
    if (!conteudo.trim()) {
      setErrorMsg("Escreva o relato do diário.");
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");

    startTransition(async () => {
      const res = await salvarRelatoDiario({
        obraId: parseInt(selectedObraId),
        data,
        conteudo,
        progressoEscavacao,
        progressoEstrutura,
        progressoHidraulica,
        progressoRevestimento,
        progressoAcabamento,
        fotosBase64: selectedPhotos,
      });

      if (res.success) {
        setConteudo("");
        setSelectedPhotos([]);
        setSuccessMsg("Relato de obra e fotos salvos com sucesso!");
        loadRelatos();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(res.error || "Erro ao salvar relato.");
      }
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta nota de diário e todas as suas fotos?")) {
      const res = await deleteRelatoDiario(id);
      if (res.success) {
        loadRelatos();
      } else {
        alert(res.error);
      }
    }
  };

  const formatDateBR = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  // Cálculo da Média Geral de Conclusão da Piscina
  const calcularProgressoGeral = () => {
    return Math.round(
      (progressoEscavacao +
        progressoEstrutura +
        progressoHidraulica +
        progressoRevestimento +
        progressoAcabamento) /
        5
    );
  };

  return (
    <div>
      <div className="flex-row-between">
        <div>
          <h3 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-heading)" }}>
            Diário de Obra e Fases da Piscina
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
            Registre notas técnicas, anexe fotos do andamento e acompanhe as fases de escavação, estrutura e hidráulica.
          </p>
        </div>
      </div>

      {/* Seletor de Obra */}
      <div className="filters-bar" style={{ marginBottom: "32px" }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Selecione a Obra</label>
          <select
            className="form-control"
            value={selectedObraId}
            onChange={(e) => setSelectedObraId(e.target.value)}
          >
            <option value="">-- Escolha uma Obra Ativa --</option>
            {obras.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nome} (Cliente: {o.clienteNome})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedObraId ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "32px", alignItems: "flex-start" }}>
          {/* Formulário de Lançamento (Esquerda) */}
          <div className="card" style={{ padding: "28px" }}>
            <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", color: "var(--text-heading)" }}>
              Lançar Relato e Atualizar Etapas
            </h4>

            {errorMsg && (
              <div style={{ backgroundColor: "var(--error-bg)", color: "var(--error)", padding: "12px", borderRadius: "var(--radius-md)", marginBottom: "16px", fontSize: "14px", fontWeight: 500 }}>
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{ backgroundColor: "var(--success-bg)", color: "var(--success)", padding: "12px", borderRadius: "var(--radius-md)", marginBottom: "16px", fontSize: "14px", fontWeight: 500 }}>
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Data da Nota</label>
                <input
                  type="date"
                  className="form-control"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  required
                />
              </div>

              {/* Sliders das Fases da Obra */}
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  padding: "16px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  marginBottom: "20px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-heading)" }}>Fases de Instalação</span>
                  <span className="badge badge-info" style={{ fontSize: "12px" }}>Geral: {calcularProgressoGeral()}%</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* Escavação */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span>1. Escavação</span>
                      <strong>{progressoEscavacao}%</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="10"
                      style={{ width: "100%", cursor: "pointer" }}
                      value={progressoEscavacao}
                      onChange={(e) => setProgressoEscavacao(parseInt(e.target.value))}
                    />
                  </div>

                  {/* Estrutura */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span>2. Alvenaria/Estrutura</span>
                      <strong>{progressoEstrutura}%</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="10"
                      style={{ width: "100%", cursor: "pointer" }}
                      value={progressoEstrutura}
                      onChange={(e) => setProgressoEstrutura(parseInt(e.target.value))}
                    />
                  </div>

                  {/* Hidráulica */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span>3. Hidráulica/Tubulação</span>
                      <strong>{progressoHidraulica}%</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="10"
                      style={{ width: "100%", cursor: "pointer" }}
                      value={progressoHidraulica}
                      onChange={(e) => setProgressoHidraulica(parseInt(e.target.value))}
                    />
                  </div>

                  {/* Revestimento */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span>4. Revestimento/Azulejo</span>
                      <strong>{progressoRevestimento}%</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="10"
                      style={{ width: "100%", cursor: "pointer" }}
                      value={progressoRevestimento}
                      onChange={(e) => setProgressoRevestimento(parseInt(e.target.value))}
                    />
                  </div>

                  {/* Acabamento */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span>5. Acabamento/Tratamento</span>
                      <strong>{progressoAcabamento}%</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="10"
                      style={{ width: "100%", cursor: "pointer" }}
                      value={progressoAcabamento}
                      onChange={(e) => setProgressoAcabamento(parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* Relato Técnico */}
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label className="form-label">Relato do Dia / Nota Técnica</label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Relate ocorrências, materiais que chegaram ou status físico do serviço..."
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  required
                />
              </div>

              {/* Upload de Fotos */}
              <div className="form-group" style={{ marginBottom: "24px" }}>
                <label className="form-label">Anexar Fotos da Obra (Celular ou Arquivos)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  capture="environment" // Aciona a câmera traseira do celular no celular
                  className="form-control"
                  onChange={handlePhotoSelect}
                  style={{ padding: "8px" }}
                />
                
                {/* Visualização de fotos selecionadas para envio */}
                {selectedPhotos.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "12px", padding: "10px", background: "rgba(255,255,255,0.02)", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                    <div style={{ width: "100%", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
                      Imagens selecionadas ({selectedPhotos.length}):
                    </div>
                    {selectedPhotos.map((photo, idx) => (
                      <div key={idx} style={{ position: "relative", width: "70px", height: "70px" }}>
                        <img 
                          src={photo} 
                          alt={`Selecionada ${idx + 1}`} 
                          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)" }} 
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedPhotos((prev) => prev.filter((_, i) => i !== idx))}
                          style={{
                            position: "absolute",
                            top: "-6px",
                            right: "-6px",
                            background: "var(--error)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "50%",
                            width: "20px",
                            height: "20px",
                            fontSize: "12px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
                          }}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px" }}><polyline points="20 6 9 17 4 12"/></svg>
                Salvar Nota e Atualizar Fases
              </button>
            </form>
          </div>

          {/* Histórico / Feed (Direita) */}
          <div>
            <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", color: "var(--text-heading)" }}>
              Linha do Tempo de Relatos
            </h4>

            {isLoading ? (
              <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Carregando histórico...</p>
            ) : relatos.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", borderStyle: "dashed", borderWidth: "2px" }}>
                Nenhuma nota no diário registrada nesta obra.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {relatos.map((r) => (
                  <div className="card" key={r.id} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", borderLeft: "4px solid var(--primary)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <strong style={{ fontSize: "15px", color: "var(--text-heading)" }}>{formatDateBR(r.data)}</strong>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "10px" }}>
                          Autor: {r.usuario.nome} ({r.usuario.role})
                        </span>
                      </div>
                      {(session?.userRole === "ESCRITORIO" || session?.userRole === "MASTER") && (
                        <button
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--error)",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                          onClick={() => handleDelete(r.id)}
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                    
                    <p style={{ fontSize: "14px", lineHeight: "1.6", color: "var(--text-main)", whiteSpace: "pre-line", margin: 0 }}>
                      {r.conteudo}
                    </p>

                    {/* Galeria de Fotos Associadas */}
                    {r.fotos && r.fotos.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "8px" }}>
                        {r.fotos.map((f) => (
                          <div 
                            key={f.id} 
                            style={{ 
                              width: "90px", 
                              height: "90px", 
                              borderRadius: "6px", 
                              overflow: "hidden", 
                              border: "1px solid rgba(255,255,255,0.08)",
                              cursor: "zoom-in"
                            }}
                            onClick={() => setLightboxPhoto(f.base64Data)}
                          >
                            <img 
                              src={f.base64Data} 
                              alt="Foto da obra registrada" 
                              style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.2s" }}
                              className="hover-zoom"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)", borderStyle: "dashed", borderWidth: "2px" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)", marginBottom: "16px" }}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          <p style={{ fontSize: "16px", fontWeight: 500 }}>Selecione uma obra acima para visualizar, registrar ocorrências e atualizar o progresso físico da piscina.</p>
        </div>
      )}

      {/* Lightbox Modal de Foto Expandida */}
      {lightboxPhoto && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 1200, display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.85)" }} 
          onClick={() => setLightboxPhoto(null)}
        >
          <div style={{ position: "relative", maxWidth: "90%", maxHeight: "90%" }} onClick={(e) => e.stopPropagation()}>
            <img 
              src={lightboxPhoto} 
              alt="Visualização da Obra" 
              style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: "8px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }} 
            />
            <button 
              onClick={() => setLightboxPhoto(null)} 
              style={{ 
                position: "absolute", 
                top: "-40px", 
                right: "0", 
                background: "rgba(0,0,0,0.6)", 
                color: "#fff", 
                border: "none", 
                borderRadius: "50%", 
                width: "36px", 
                height: "36px", 
                fontSize: "24px", 
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1
              }}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
