"use client";

import { useEffect, useState, useRef } from "react";
import { getBoletos, salvarBoleto, deleteBoleto } from "./actions";
import Link from "next/link";

interface Boleto {
  id: number;
  vencimento: string;
  sacado: string;
  cedente: string;
  valor: number;
  codigoBarras: string;
}

export default function BoletosPage() {
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form states
  const [id, setId] = useState<number | undefined>(undefined);
  const [vencimento, setVencimento] = useState("");
  const [sacado, setSacado] = useState("");
  const [cedente, setCedente] = useState("");
  const [valor, setValor] = useState("");
  const [codigoBarras, setCodigoBarras] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const loadData = () => {
    setIsLoading(true);
    getBoletos().then((res) => {
      if (res.success && res.data) {
        const mapped = res.data.map((b: any) => ({
          ...b,
          vencimento: new Date(b.vencimento).toISOString().split("T")[0],
        }));
        setBoletos(mapped);
      }
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadData();

    // Injetar o Tesseract.js via CDN para processamento OCR local no navegador
    if (typeof window !== "undefined" && !(window as any).Tesseract) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/tesseract.js@v5.0.3/dist/tesseract.min.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Inicializar o SpeechRecognition do Navegador
  const startSpeechRecognition = () => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert("Seu navegador não suporta reconhecimento de voz. Tente usar o Google Chrome ou Safari.");
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const rec = new SpeechRecognitionClass();
    rec.lang = "pt-BR";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsRecording(true);
      setErrorMsg("");
    };

    rec.onerror = (e: any) => {
      console.error(e);
      setErrorMsg("Erro no reconhecimento de voz. Tente falar novamente.");
      setIsRecording(false);
    };

    rec.onend = () => {
      setIsRecording(false);
    };

    rec.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setPrompt(text);
      handleParseText(text);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  // Processador de Imagem/Foto OCR
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!(window as any).Tesseract) {
      setErrorMsg("Biblioteca de OCR ainda está carregando. Aguarde alguns segundos.");
      return;
    }

    setIsProcessingOcr(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const tesseract = (window as any).Tesseract;
      const result = await tesseract.recognize(file, "por", {
        logger: (m: any) => console.log(m),
      });

      const extractedText = result.data.text;
      console.log("Texto extraído por OCR:", extractedText);
      handleParseText(extractedText);
      setSuccessMsg("Boleto lido com sucesso a partir da foto!");
    } catch (err: any) {
      console.error("Erro no OCR:", err);
      setErrorMsg("Não foi possível extrair o texto da foto. Tente uma foto com melhor foco e iluminação.");
    } finally {
      setIsProcessingOcr(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Algoritmo de Inteligência de Parsing (Extração Automática de Dados)
  const handleParseText = (text: string) => {
    setErrorMsg("");
    
    let parsedSacado = "";
    let parsedCedente = "";
    let parsedValor = 0;
    let parsedVencimento = "";
    let parsedBarcode = "";

    // 1. Extrair Código de Barras (Linha Digitável)
    // Limpar o texto e buscar sequências numéricas de boletos
    const cleanedDigits = text.replace(/[^0-9]/g, "");
    
    // Procura na string original uma sequência de 32 a 48 caracteres numéricos contendo pontos e espaços
    const barcodeMatch = text.match(/(?:\d[\s\.\-]*){32,48}/);
    if (barcodeMatch) {
      parsedBarcode = barcodeMatch[0].trim().replace(/\s+/g, " ");
    }

    // Se acharmos uma sequência limpa de dígitos longa, decodificamos as regras de boleto
    if (cleanedDigits.length === 47) {
      // Boleto Bancário (Fator de Vencimento e Valor)
      const fatorVencStr = cleanedDigits.substring(33, 37);
      const valorStr = cleanedDigits.substring(37, 47);
      
      const valorCents = parseInt(valorStr, 10);
      if (!isNaN(valorCents)) {
        parsedValor = valorCents / 100;
      }

      const fator = parseInt(fatorVencStr, 10);
      if (fator >= 1000) {
        const baseDate = new Date("1997-10-07T00:00:00Z");
        let vencDate = new Date(baseDate.getTime() + fator * 24 * 60 * 60 * 1000);
        // Ajuste para o segundo ciclo do fator de vencimento (reiniciou em 2025)
        if (vencDate.getUTCFullYear() < 2020) {
          vencDate = new Date(vencDate.getTime() + 9000 * 24 * 60 * 60 * 1000);
        }
        parsedVencimento = vencDate.toISOString().split("T")[0];
      }
    } else if (cleanedDigits.length === 48) {
      // Boleto de concessionárias (ex: água, luz, internet)
      // O valor normalmente está nas posições 4 a 15 (index 4 a 14) do código limpo
      const valorStr = cleanedDigits.substring(4, 15);
      const valorCents = parseInt(valorStr, 10);
      if (!isNaN(valorCents)) {
        parsedValor = valorCents / 100;
      }
    }

    // 2. Extrair Valor via Regex Textual (caso falhe no código de barras)
    if (parsedValor === 0) {
      const valorRegex = /(?:R\$\s*|valor\s*(?:total)?\s*(?:cobrado)?\s*(?:de)?\s*|val:\s*)(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)/i;
      const vMatch = text.match(valorRegex);
      if (vMatch) {
        let valString = vMatch[1].replace(/\./g, "").replace(",", ".");
        parsedValor = parseFloat(valString);
      } else {
        // Tentar capturar qualquer formato de moeda isolado
        const isolateMoney = /(\d{1,3}(?:\.\d{3})*(?:,\d{2}))/g;
        const matches = text.match(isolateMoney);
        if (matches && matches.length > 0) {
          parsedValor = parseFloat(matches[matches.length - 1].replace(/\./g, "").replace(",", "."));
        }
      }
    }

    // 3. Extrair Vencimento via Regex Textual
    if (!parsedVencimento) {
      const dateRegex = /(?:vencimento|vence|venc|pago até|para):\s*(\d{2})[\/\-](\d{2})[\/\-](\d{4})/i;
      const dMatch = text.match(dateRegex);
      if (dMatch) {
        parsedVencimento = `${dMatch[3]}-${dMatch[2]}-${dMatch[1]}`;
      } else {
        // Busca direta de qualquer data DD/MM/YYYY no texto
        const genericDateRegex = /(\d{2})[\/\-](\d{2})[\/\-](\d{4})/;
        const gdMatch = text.match(genericDateRegex);
        if (gdMatch) {
          parsedVencimento = `${gdMatch[3]}-${gdMatch[2]}-${gdMatch[1]}`;
        } else {
          // Palavras-chave
          if (/hoje/i.test(text)) {
            const brOffset = -3;
            parsedVencimento = new Date(Date.now() + brOffset * 60 * 60 * 1000).toISOString().split("T")[0];
          } else if (/amanh[ãa]/i.test(text)) {
            const brOffset = -3;
            parsedVencimento = new Date(Date.now() + brOffset * 60 * 60 * 1000 + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
          }
        }
      }
    }

    // 4. Extrair Sacado e Cedente via Keywords
    // Regex para extrair nomes após "sacado", "pagador", "cedente", "emissor", "beneficiário", "para", "de"
    const sacadoRegex = /(?:sacado|pagador|para|cliente):\s*([a-zA-Z0-9\s\.\,\-]+?)(?=\n|vencimento|valor|cedente|beneficiário|código|codigo|$)/i;
    const sMatch = text.match(sacadoRegex);
    if (sMatch) {
      parsedSacado = sMatch[1].trim();
    }

    const cedenteRegex = /(?:cedente|emissor|fornecedor|benefici[áa]rio|recebedor|de):\s*([a-zA-Z0-9\s\.\,\-]+?)(?=\n|vencimento|valor|sacado|pagador|código|codigo|$)/i;
    const cMatch = text.match(cedenteRegex);
    if (cMatch) {
      parsedCedente = cMatch[1].trim();
    }

    // Fallbacks simples para inteligência de prompt
    if (!parsedSacado) {
      // Se disser "sacado fulano" sem dois pontos
      const sFall = text.match(/sacado\s+([a-zA-Z0-9\s]+?)(?=\s+valor|\s+vencimento|\s+cedente|$)/i);
      if (sFall) parsedSacado = sFall[1].trim();
    }
    if (!parsedCedente) {
      // Se disser "cedente fulano" ou "fornecedor fulano" sem dois pontos
      const cFall = text.match(/(?:cedente|fornecedor)\s+([a-zA-Z0-9\s]+?)(?=\s+valor|\s+vencimento|\s+sacado|$)/i);
      if (cFall) parsedCedente = cFall[1].trim();
    }

    // Atualizar os states do formulário com os dados extraídos
    if (parsedVencimento) setVencimento(parsedVencimento);
    if (parsedSacado) setSacado(parsedSacado);
    if (parsedCedente) setCedente(parsedCedente);
    if (parsedValor > 0) setValor(parsedValor.toString());
    if (parsedBarcode) setCodigoBarras(parsedBarcode);
  };

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    handleParseText(prompt);
    setSuccessMsg("Comando de prompt analisado! Confirme os dados abaixo.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!vencimento || !sacado || !cedente || !valor || !codigoBarras) {
      setErrorMsg("Todos os campos do boleto são obrigatórios.");
      return;
    }

    const res = await salvarBoleto({
      id,
      vencimento,
      sacado,
      cedente,
      valor: parseFloat(valor),
      codigoBarras,
    });

    if (res.success) {
      setSuccessMsg(id ? "Boleto atualizado com sucesso!" : "Boleto cadastrado com sucesso!");
      resetForm();
      loadData();
    } else {
      setErrorMsg(res.error || "Erro ao salvar boleto.");
    }
  };

  const resetForm = () => {
    setId(undefined);
    setVencimento("");
    setSacado("");
    setCedente("");
    setValor("");
    setCodigoBarras("");
    setPrompt("");
  };

  const startEdit = (b: Boleto) => {
    setId(b.id);
    setVencimento(b.vencimento);
    setSacado(b.sacado);
    setCedente(b.cedente);
    setValor(b.valor.toString());
    setCodigoBarras(b.codigoBarras);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (boletoId: number) => {
    if (confirm("Deseja realmente excluir este boleto?")) {
      const res = await deleteBoleto(boletoId);
      if (res.success) {
        setSuccessMsg("Boleto excluído com sucesso.");
        loadData();
      } else {
        setErrorMsg(res.error || "Erro ao excluir boleto.");
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Código de barras copiado para a área de transferência!");
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  const formatDateBR = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex-row-between" style={{ marginBottom: "32px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Link href="/financeiro" style={{ color: "var(--text-muted)", fontSize: "14px" }}>
              Financeiro
            </Link>
            <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>&gt;</span>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>Gestão de Boletos</span>
          </div>
          <h3 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-heading)", marginTop: "4px" }}>
            Gestão de Boletos (Contas a Pagar)
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
            Adicione e consulte boletos utilizando comandos de voz, prompts de texto ou enviando fotos.
          </p>
        </div>
        <Link href="/financeiro" className="btn btn-secondary">
          Voltar para Finanças
        </Link>
      </div>

      <div className="grid-cols-2">
        {/* Painel de Entrada Inteligente (Esquerda) */}
        <div>
          <div className="card" style={{ marginBottom: "24px" }}>
            <h4 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-heading)", marginBottom: "16px" }}>
              Leitura Inteligente por Voz, Prompt ou Imagem
            </h4>

            {/* Comando por Prompt */}
            <form onSubmit={handlePromptSubmit} style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>
                  Digite seu comando ou cole o texto do boleto:
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    className="form-control"
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-md)",
                      fontSize: "14px",
                    }}
                    placeholder="Ex: Cadastrar boleto cedente Coelba sacado Daniel valor 120 reais..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: "10px 20px" }}>
                    Analisar
                  </button>
                </div>
              </div>
            </form>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {/* Botão de Comando de Voz */}
              <button
                type="button"
                onClick={startSpeechRecognition}
                className="btn"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  backgroundColor: isRecording ? "var(--error)" : "var(--primary)",
                  color: "#ffffff",
                  border: "none",
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "var(--transition)",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
                {isRecording ? "Ouvindo... Clique para Parar" : "Falar Comando de Voz"}
              </button>

              {/* Botão de Foto / OCR */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingOcr}
                className="btn btn-secondary"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {isProcessingOcr ? (
                  <>
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        border: "2px solid #ccc",
                        borderTop: "2px solid var(--primary)",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    Processando Imagem...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    Ler de uma Foto (OCR)
                  </>
                )}
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                style={{ display: "none" }}
              />
            </div>

            {/* Spinner CSS */}
            <style jsx>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>

          {/* Formulário de Edição/Confirmação (Esquerda) */}
          <div className="card">
            <h4 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-heading)", marginBottom: "16px" }}>
              {id ? "Editar Boleto" : "Confirmar e Cadastrar Boleto"}
            </h4>

            {errorMsg && (
              <div
                style={{
                  backgroundColor: "var(--error-bg)",
                  color: "var(--error)",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "16px",
                  fontSize: "13px",
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
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "16px",
                  fontSize: "13px",
                }}
              >
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600 }}>Data de Vencimento</label>
                  <input
                    type="date"
                    className="form-control"
                    style={{
                      padding: "8px 12px",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-md)",
                    }}
                    value={vencimento}
                    onChange={(e) => setVencimento(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600 }}>Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    style={{
                      padding: "8px 12px",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-md)",
                    }}
                    placeholder="0,00"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>Cedente (Quem emitiu / Recebedor)</label>
                <input
                  type="text"
                  className="form-control"
                  style={{
                    padding: "8px 12px",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)",
                  }}
                  placeholder="Ex: Coelba"
                  value={cedente}
                  onChange={(e) => setCedente(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>Sacado (Quem deve pagar / Cliente)</label>
                <input
                  type="text"
                  className="form-control"
                  style={{
                    padding: "8px 12px",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)",
                  }}
                  placeholder="Ex: Jhoston Tec"
                  value={sacado}
                  onChange={(e) => setSacado(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>Código de Barras / Linha Digitável</label>
                <input
                  type="text"
                  className="form-control"
                  style={{
                    padding: "8px 12px",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)",
                  }}
                  placeholder="Digite ou leia o código de barras"
                  value={codigoBarras}
                  onChange={(e) => setCodigoBarras(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: "12px" }}>
                  {id ? "Salvar Alterações" : "Salvar Boleto"}
                </button>
                {(id || vencimento || sacado || cedente || valor || codigoBarras) && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn btn-secondary"
                    style={{ padding: "12px" }}
                  >
                    Limpar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Listagem de Boletos (Direita) */}
        <div>
          <div className="card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <h4 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-heading)", marginBottom: "16px" }}>
              Boletos Cadastrados ({boletos.length})
            </h4>

            {isLoading ? (
              <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Carregando boletos...</p>
            ) : boletos.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Nenhum boleto cadastrado até o momento.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto", maxHeight: "680px", flex: 1 }}>
                {boletos.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-md)",
                      padding: "16px",
                      backgroundColor: "#f8fafc",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      transition: "var(--transition)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <strong style={{ fontSize: "15px", color: "var(--text-heading)" }}>{b.cedente}</strong>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          Sacado: <strong>{b.sacado}</strong>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--primary)" }}>
                          {formatCurrency(b.valor)}
                        </span>
                        <div style={{ fontSize: "11px", color: "var(--error)", fontWeight: 600 }}>
                          Vence em: {formatDateBR(b.vencimento)}
                        </div>
                      </div>
                    </div>

                    {/* Código de Barras */}
                    <div
                      style={{
                        backgroundColor: "#f1f5f9",
                        padding: "8px 12px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontFamily: "monospace",
                        color: "var(--text-main)",
                        wordBreak: "break-all",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{ flex: 1 }}>{b.codigoBarras}</span>
                      <button
                        onClick={() => copyToClipboard(b.codigoBarras)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--primary)",
                          padding: "2px",
                        }}
                        title="Copiar código"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                    </div>

                    {/* Ações */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
                      <button
                        onClick={() => startEdit(b)}
                        className="btn btn-sm"
                        style={{
                          fontSize: "11px",
                          padding: "4px 8px",
                          backgroundColor: "#e2e8f0",
                          color: "var(--text-main)",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="btn btn-sm"
                        style={{
                          fontSize: "11px",
                          padding: "4px 8px",
                          backgroundColor: "var(--error-bg)",
                          color: "var(--error)",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
