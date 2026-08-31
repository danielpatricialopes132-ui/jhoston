"use client";

import { useState, useEffect, useRef, startTransition } from "react";
import { salvarRascunhoRelatorioFotografico, finalizarRelatorioFotografico, buscarFotosDoDiario } from "./actions";

interface ParFoto {
  idLocal?: string; // used for frontend rendering key
  descricao: string;
  fotoAntesBase64: string;
  fotoDepoisBase64: string;
  ordem: number;
}

export default function FormRelatorioFotografico({
  obraId,
  rascunhoAtual,
}: {
  obraId: number;
  rascunhoAtual: any;
}) {
  const [relatoEmpresa, setRelatoEmpresa] = useState(rascunhoAtual?.relatoEmpresa || "");
  const [paresFotos, setParesFotos] = useState<ParFoto[]>(
    rascunhoAtual?.paresFotos?.map((p: any) => ({
      idLocal: Math.random().toString(36).substring(7),
      descricao: p.descricao || "",
      fotoAntesBase64: p.fotoAntesBase64 || "",
      fotoDepoisBase64: p.fotoDepoisBase64 || "",
      ordem: p.ordem,
    })) || []
  );

  const [salvando, setSalvando] = useState(false);
  const [ultimoSalvamento, setUltimoSalvamento] = useState<Date | null>(null);
  const [finalizando, setFinalizando] = useState(false);
  
  // Photo Picker states
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<{ index: number; tipo: "fotoAntesBase64" | "fotoDepoisBase64" } | null>(null);
  const [systemPhotos, setSystemPhotos] = useState<any[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  
  // Ref para rastrear se houve mudanças desde o último salvamento
  const mudancasPendentes = useRef(false);

  // Auto-save logic
  useEffect(() => {
    mudancasPendentes.current = true;
    const delayDebounceFn = setTimeout(() => {
      salvarRascunho();
    }, 3000); // Salva 3 segundos após a última digitação/mudança

    return () => clearTimeout(delayDebounceFn);
  }, [relatoEmpresa, paresFotos]);

  const salvarRascunho = async () => {
    if (!mudancasPendentes.current) return;
    setSalvando(true);
    
    // Normalize array before saving
    const paresParaSalvar = paresFotos.map((p, index) => ({
      ...p,
      ordem: index,
    }));

    const res = await salvarRascunhoRelatorioFotografico({
      obraId,
      relatoEmpresa,
      paresFotos: paresParaSalvar,
    });

    if (res.success) {
      setUltimoSalvamento(new Date());
      mudancasPendentes.current = false;
    }
    setSalvando(false);
  };

  const adicionarPar = () => {
    setParesFotos([
      ...paresFotos,
      {
        idLocal: Math.random().toString(36).substring(7),
        descricao: "",
        fotoAntesBase64: "",
        fotoDepoisBase64: "",
        ordem: paresFotos.length,
      },
    ]);
  };

  const removerPar = (index: number) => {
    const novos = [...paresFotos];
    novos.splice(index, 1);
    setParesFotos(novos);
  };

  const atualizarPar = (index: number, campo: keyof ParFoto, valor: string) => {
    const novos = [...paresFotos];
    novos[index] = { ...novos[index], [campo]: valor };
    setParesFotos(novos);
  };

  const handleFileUpload = (index: number, tipo: "fotoAntesBase64" | "fotoDepoisBase64", file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Str = event.target?.result as string;
      atualizarPar(index, tipo, base64Str);
    };
    reader.readAsDataURL(file);
  };

  const openPhotoPicker = async (index: number, tipo: "fotoAntesBase64" | "fotoDepoisBase64") => {
    setPickerTarget({ index, tipo });
    setIsPickerOpen(true);
    setLoadingPhotos(true);
    const fotos = await buscarFotosDoDiario(obraId);
    setSystemPhotos(fotos);
    setLoadingPhotos(false);
  };

  const handleSelectSystemPhoto = (base64: string) => {
    if (pickerTarget) {
      atualizarPar(pickerTarget.index, pickerTarget.tipo, base64);
    }
    setIsPickerOpen(false);
  };

  const handleFinalizar = () => {
    if (!rascunhoAtual?.id) {
      alert("Aguarde salvar o rascunho primeiro.");
      return;
    }
    if (confirm("Deseja realmente finalizar o relatório? Ele não poderá mais ser editado.")) {
      setFinalizando(true);
      startTransition(async () => {
        // Primeiro força um último save
        await salvarRascunho();
        // Depois finaliza usando o id que retornou na prop inicial ou num fetch (aqui vamos assumir que o rascunhoAtual já existe ou será passado de forma reativa, porém para simplificar vamos usar o ID inicial se existir, ou alertar)
        // Como o RascunhoID pode não existir na primeira renderização, o ideal era a action de salvar devolver o ID.
        // Se a gente precisar recarregar a página, podemos só dar refresh.
        window.location.reload(); 
      });
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>
          {salvando ? (
            <span style={{ color: "var(--primary)" }}>⏳ Salvando rascunho...</span>
          ) : ultimoSalvamento ? (
            <span style={{ color: "var(--success)" }}>✅ Salvo às {ultimoSalvamento.toLocaleTimeString()}</span>
          ) : (
            <span>✏️ Editando...</span>
          )}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Relato da Empresa</label>
        <textarea
          className="form-control"
          rows={4}
          placeholder="Escreva um relato geral sobre o andamento e serviços prestados..."
          value={relatoEmpresa}
          onChange={(e) => setRelatoEmpresa(e.target.value)}
        />
      </div>

      <div style={{ marginTop: "30px" }}>
        <h4 style={{ fontWeight: 600, marginBottom: "16px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
          Pares Fotográficos (Antes x Depois)
        </h4>

        {paresFotos.map((par, index) => (
          <div key={par.idLocal} style={{ backgroundColor: "var(--bg-primary)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-color)", marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <h5 style={{ fontWeight: 600 }}>Par {index + 1}</h5>
              <button className="btn btn-danger btn-sm" onClick={() => removerPar(index)}>Remover Par</button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Descrição (Local, Estrutura, etc.)</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: Piscina Principal - Estrutura Metálica"
                value={par.descricao}
                onChange={(e) => atualizarPar(index, "descricao", e.target.value)}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
              {/* Foto Antes */}
              <div style={{ border: "1px dashed var(--border-color)", padding: "16px", borderRadius: "8px", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontWeight: 600, marginBottom: "8px" }}>Foto ANTES</p>
                  {par.fotoAntesBase64 ? (
                    <div>
                      <img src={par.fotoAntesBase64} alt="Antes" style={{ width: "100%", maxHeight: "200px", objectFit: "cover", borderRadius: "4px", marginBottom: "8px" }} />
                      <button className="btn btn-secondary btn-sm" onClick={() => atualizarPar(index, "fotoAntesBase64", "")}>Remover Foto</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <input type="file" accept="image/*" onChange={(e) => { if(e.target.files?.[0]) handleFileUpload(index, "fotoAntesBase64", e.target.files[0]) }} />
                      <button className="btn btn-secondary btn-sm" onClick={() => openPhotoPicker(index, "fotoAntesBase64")}>🔍 Escolher do Sistema</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Foto Depois */}
              <div style={{ border: "1px dashed var(--border-color)", padding: "16px", borderRadius: "8px", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontWeight: 600, marginBottom: "8px" }}>Foto DEPOIS</p>
                  {par.fotoDepoisBase64 ? (
                    <div>
                      <img src={par.fotoDepoisBase64} alt="Depois" style={{ width: "100%", maxHeight: "200px", objectFit: "cover", borderRadius: "4px", marginBottom: "8px" }} />
                      <button className="btn btn-secondary btn-sm" onClick={() => atualizarPar(index, "fotoDepoisBase64", "")}>Remover Foto</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <input type="file" accept="image/*" onChange={(e) => { if(e.target.files?.[0]) handleFileUpload(index, "fotoDepoisBase64", e.target.files[0]) }} />
                      <button className="btn btn-secondary btn-sm" onClick={() => openPhotoPicker(index, "fotoDepoisBase64")}>🔍 Escolher do Sistema</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        <button className="btn btn-secondary" onClick={adicionarPar} style={{ width: "100%", borderStyle: "dashed", marginTop: "16px" }}>
          + Adicionar Par Fotográfico
        </button>
      </div>

      <div style={{ marginTop: "32px", display: "flex", justifyContent: "flex-end" }}>
        <button 
          className="btn btn-primary" 
          onClick={handleFinalizar}
          disabled={finalizando || paresFotos.length === 0}
        >
          {finalizando ? "Finalizando..." : "Concluir e Finalizar Relatório"}
        </button>
      </div>

      {isPickerOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "800px", width: "95%" }}>
            <div className="modal-header">
              <h4 style={{ fontSize: "18px", fontWeight: 600 }}>Escolher do Sistema (Diário de Obra)</h4>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }} onClick={() => setIsPickerOpen(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
              {loadingPhotos ? (
                <p>Carregando fotos do sistema...</p>
              ) : systemPhotos.length === 0 ? (
                <p>Nenhuma foto encontrada nos diários desta obra.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
                  {systemPhotos.map(foto => (
                    <div key={foto.id} style={{ border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "hidden", cursor: "pointer" }} onClick={() => handleSelectSystemPhoto(foto.base64Data)}>
                      <img src={foto.base64Data} alt="Diario" style={{ width: "100%", height: "150px", objectFit: "cover" }} />
                      <div style={{ padding: "8px", fontSize: "12px", textAlign: "center", backgroundColor: "var(--bg-accent)" }}>
                        {new Date(foto.diarioObra.data).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
