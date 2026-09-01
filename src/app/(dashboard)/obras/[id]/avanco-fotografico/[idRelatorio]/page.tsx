import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import PrintButton from "./PrintButton";

export default async function DetalhesRelatorioFotograficoPage(props: {
  params: Promise<{ id: string; idRelatorio: string }>;
}) {
  const params = await props.params;
  const obraId = parseInt(params.id, 10);
  const relatorioId = parseInt(params.idRelatorio, 10);
  if (isNaN(obraId) || isNaN(relatorioId)) notFound();

  const relatorio = await prisma.relatorioFotografico.findUnique({
    where: { id: relatorioId },
    include: {
      obra: { select: { nome: true, empresa: true } },
      paresFotos: { orderBy: { ordem: "asc" } },
    },
  });

  if (!relatorio || relatorio.obraId !== obraId) notFound();

  const reportDate = new Date(relatorio.updatedAt);
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  let configEmpresa = null;
  if (relatorio.obra.empresa) {
    configEmpresa = await prisma.configuracaoEmpresa.findUnique({
      where: { nome: relatorio.obra.empresa }
    });
  }

  const logoSrc = configEmpresa?.logoUrl || "/logo.png";
  const nomeEmpresa = configEmpresa?.nome || "JHOSTON POOLS";

  return (
    <>
      <div className="no-print" style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-heading)" }}>
            Visualização Revista
          </h2>
          <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>
            Ative "Gráficos de segundo plano" e remova margens para imprimir esta revista corretamente.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <PrintButton />
          <a href={`/obras/${obraId}/avanco-fotografico`} className="btn btn-secondary">
            &larr; Voltar
          </a>
        </div>
      </div>

      <div className="print-area">
        <div className="magazine-container">
          
          {/* =======================
              CAPA (COVER PAGE)
             ======================= */}
          <div className="magazine-cover">
            <div className="cover-bg-glow"></div>
            <div className="cover-content">
              <div className="cover-logo-wrapper">
                <img src={logoSrc} alt={`${nomeEmpresa} Logo`} className="cover-logo" />
              </div>
              
              <div className="cover-text-group">
                <div className="cover-edition">EDIÇÃO ESPECIAL • {monthNames[reportDate.getMonth()].toUpperCase()} {reportDate.getFullYear()}</div>
                <h1 className="cover-title">TRANSFORMAÇÃO</h1>
                <h2 className="cover-subtitle">O DIÁRIO VISUAL DA OBRA</h2>
                
                <div className="cover-project-card">
                  <span className="label">PROJETO</span>
                  <div className="project-name">{relatorio.obra.nome}</div>
                  <div className="project-id">DOCUMENTO: JHP-{relatorio.id.toString().padStart(4, '0')}</div>
                </div>
              </div>
              
              <div className="cover-footer" style={{ color: configEmpresa?.corSecundaria || "inherit" }}>
                {nomeEmpresa} • EXCELÊNCIA EM RESORTS PARTICULARES
              </div>
            </div>
          </div>

          {/* =======================
              PÁGINA: RESUMO EXECUTIVO
             ======================= */}
          {relatorio.relatoEmpresa && (
            <div className="magazine-page editorial-page">
              <header className="page-header">
                <img src={logoSrc} alt="Logo" className="mini-logo" />
                <span>CARTA AOS PROPRIETÁRIOS</span>
              </header>
              
              <main className="editorial-main">
                <div className="editorial-title-box">
                  <h2>Resumo<br/>Executivo</h2>
                  <div className="accent-square"></div>
                </div>
                
                <div className="editorial-content">
                  <span className="drop-cap">{relatorio.relatoEmpresa.charAt(0)}</span>
                  <p>{relatorio.relatoEmpresa.slice(1)}</p>
                </div>
              </main>

              <footer className="page-header mt-auto" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", borderBottom: "none", fontSize: "10px", color: "var(--text-muted)" }}>
                <span>02 &nbsp;&nbsp;&nbsp; {nomeEmpresa.toUpperCase()}</span>
                <span>{relatorio.obra.nome}</span>
              </footer>
            </div>
          )}

          {/* =======================
              PÁGINA: ÍNDICE (SUMÁRIO)
             ======================= */}
          {relatorio.paresFotos.length > 0 && (
            <div className="magazine-page index-page">
              <header className="page-header dark-header">
                <span>ÍNDICE FOTOGRÁFICO</span>
                <span>{relatorio.obra.nome}</span>
              </header>
              
              <main className="index-main">
                <h2 className="index-title">Sumário</h2>
                <div className="index-list">
                  {relatorio.paresFotos.map((par, index) => (
                    <div key={`index-${par.id}`} className="index-item">
                      <span className="index-item-number">{String(index + 1).padStart(2, '0')}</span>
                      <span className="index-item-desc">{par.descricao || (par.isAvulsa ? "Foto Avulsa" : "Avanço Estrutural")}</span>
                      <span className="index-item-dots"></span>
                      <span className="index-item-page">Pág {String(index + (relatorio.relatoEmpresa ? 4 : 3)).padStart(2, '0')}</span>
                    </div>
                  ))}
                </div>
              </main>

              <footer className="page-footer dark-footer">
                <span>{String(relatorio.relatoEmpresa ? 3 : 2).padStart(2, '0')} &nbsp;&nbsp;&nbsp; JHOSTON POOLS MAGAZINE</span>
                <span>ÍNDICE</span>
              </footer>
            </div>
          )}

          {/* =======================
              PÁGINAS: GALERIA ANTES/DEPOIS E AVULSAS
             ======================= */}
          {relatorio.paresFotos.map((par, index) => (
            <div key={par.id} className="magazine-page gallery-page">
              <header className="page-header dark-header">
                <span>{par.descricao || (par.isAvulsa ? "FOTO DE ACOMPANHAMENTO" : "AVANÇO ESTRUTURAL")}</span>
                <span>ETAPA {String(index + 1).padStart(2, '0')}</span>
              </header>
              
              {par.isAvulsa ? (
                <div className="single-photo-spread">
                  <div className="watermark">JHOSTON</div>
                  {par.fotoAntesBase64 ? (
                     <div className="img-container single-img-container" style={{backgroundImage: `url(${par.fotoAntesBase64})`}}></div>
                  ) : (
                     <div className="img-placeholder">Sem registro</div>
                  )}
                </div>
              ) : (
                <div className="gallery-spread">
                  <div className="gallery-side before-side">
                    <div className="watermark">ANTES</div>
                    {par.fotoAntesBase64 ? (
                       <div className="img-container" style={{backgroundImage: `url(${par.fotoAntesBase64})`}}></div>
                    ) : (
                       <div className="img-placeholder">Sem registro anterior</div>
                    )}
                    <div className="side-label">ESTADO INICIAL</div>
                  </div>

                  <div className="gallery-side after-side">
                    <div className="watermark">DEPOIS</div>
                    {par.fotoDepoisBase64 ? (
                       <div className="img-container" style={{backgroundImage: `url(${par.fotoDepoisBase64})`}}></div>
                    ) : (
                       <div className="img-placeholder">Sem registro atual</div>
                    )}
                    <div className="side-label">RESULTADO JHOSTON</div>
                  </div>
                  
                  {/* Center Badge Overlap */}
                  <div className="vs-badge">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </div>
                </div>
              )}

              <footer className="page-footer dark-footer">
                <span>{String(index + (relatorio.relatoEmpresa ? 4 : 3)).padStart(2, '0')} &nbsp;&nbsp;&nbsp; JHOSTON POOLS MAGAZINE</span>
                <span>{relatorio.obra.nome}</span>
              </footer>
            </div>
          ))}

          {/* =======================
              CONTRA-CAPA
             ======================= */}
          <div className="magazine-backcover">
            <div className="backcover-content">
              <img src="/logo.png" alt="Jhoston Pools Logo" className="backcover-logo" />
              <h3>A ARTE DE CONSTRUIR BEM ESTAR.</h3>
              <p>JHOSTONPOOLS.COM.BR</p>
            </div>
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@300;400;600;800;900&display=swap');

        /* ---------------------------------------------------- */
        /* RESET & BASE                                         */
        /* ---------------------------------------------------- */
        .magazine-container {
          background: #e2e8f0;
          color: #0f172a;
          font-family: 'Montserrat', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 40px;
          padding: 40px 0;
        }

        .magazine-cover, .magazine-page, .magazine-backcover {
          width: 210mm;
          height: 297mm; /* Exatamente A4 */
          background: white;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
        }

        /* ---------------------------------------------------- */
        /* CAPA (COVER)                                         */
        /* ---------------------------------------------------- */
        .magazine-cover {
          background: #020617; /* Very Dark Slate */
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 60px 40px;
          text-align: center;
        }

        .cover-bg-glow {
          position: absolute;
          top: -20%;
          left: -20%;
          width: 140%;
          height: 140%;
          background: radial-gradient(circle at 50% 30%, rgba(15, 118, 110, 0.4) 0%, rgba(3, 105, 161, 0.1) 40%, transparent 70%);
          z-index: 1;
        }

        .cover-content {
          position: relative;
          z-index: 2;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .cover-logo-wrapper {
          margin-top: 40px;
        }
        
        .cover-logo {
          height: 140px;
          object-fit: contain;
          filter: drop-shadow(0 0 20px rgba(255,255,255,0.1));
        }

        .cover-text-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .cover-edition {
          font-size: 13px;
          letter-spacing: 6px;
          color: #0ea5e9;
          font-weight: 600;
        }

        .cover-title {
          font-family: 'Playfair Display', serif;
          font-size: 52px;
          font-weight: 700;
          line-height: 1;
          margin: 0;
          letter-spacing: 2px;
          background: linear-gradient(to bottom right, #ffffff, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .cover-subtitle {
          font-size: 16px;
          font-weight: 300;
          letter-spacing: 10px;
          margin: 0 0 40px 0;
          color: #cbd5e1;
        }

        .cover-project-card {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 30px 50px;
          border-radius: 4px;
          width: 80%;
        }

        .cover-project-card .label {
          font-size: 11px;
          color: #94a3b8;
          letter-spacing: 4px;
          display: block;
          margin-bottom: 10px;
        }

        .cover-project-card .project-name {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          color: #38bdf8;
          font-weight: 700;
          margin-bottom: 10px;
        }
        
        .cover-project-card .project-id {
          font-size: 12px;
          color: #64748b;
          letter-spacing: 2px;
        }

        .cover-footer {
          font-size: 10px;
          letter-spacing: 5px;
          color: #475569;
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-top: 20px;
        }

        /* ---------------------------------------------------- */
        /* PÁGINAS INTERNAS (CABEÇALHOS E RODAPÉS)              */
        /* ---------------------------------------------------- */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 30px 40px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 3px;
          color: #94a3b8;
        }

        .page-header .mini-logo {
          height: 30px;
        }

        .page-footer {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          display: flex;
          justify-content: space-between;
          padding: 30px 40px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 2px;
          color: #94a3b8;
          border-top: 1px solid #f1f5f9;
        }

        .dark-header, .dark-footer {
          color: #475569;
          border-color: rgba(0,0,0,0.05);
        }

        /* ---------------------------------------------------- */
        /* PÁGINA: EDITORIAL (RESUMO EXECUTIVO)                 */
        /* ---------------------------------------------------- */
        .editorial-page {
          background: #fafaf9; /* Warm white */
        }

        .editorial-main {
          padding: 40px 60px;
          display: flex;
          flex-direction: column;
          gap: 50px;
          height: calc(100% - 140px);
        }

        .editorial-title-box {
          position: relative;
        }

        .editorial-title-box h2 {
          font-family: 'Playfair Display', serif;
          font-size: 64px;
          line-height: 1.1;
          color: #0f172a;
          margin: 0;
          position: relative;
          z-index: 2;
        }

        .accent-square {
          position: absolute;
          top: -20px;
          left: -20px;
          width: 100px;
          height: 100px;
          background: #ccfbf1; /* Light teal */
          z-index: 1;
        }

        .editorial-content {
          columns: 2;
          column-gap: 40px;
          font-size: 13px;
          line-height: 2;
          color: #334155;
          text-align: justify;
        }

        .drop-cap {
          float: left;
          font-family: 'Playfair Display', serif;
          font-size: 84px;
          line-height: 0.8;
          padding-top: 4px;
          padding-right: 8px;
          padding-left: 3px;
          color: #0f766e;
        }

        /* ---------------------------------------------------- */
        /* PÁGINA: ÍNDICE (SUMÁRIO)                             */
        /* ---------------------------------------------------- */
        .index-page {
          background: #ffffff;
        }

        .index-main {
          padding: 60px 80px;
          height: calc(100% - 140px);
        }

        .index-title {
          font-family: 'Playfair Display', serif;
          font-size: 48px;
          color: #0f172a;
          border-bottom: 2px solid #0f766e;
          padding-bottom: 20px;
          margin-bottom: 40px;
        }

        .index-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .index-item {
          display: flex;
          align-items: flex-end;
          font-size: 13px;
          color: #334155;
        }

        .index-item-number {
          font-weight: 800;
          color: #0ea5e9;
          margin-right: 15px;
          font-size: 16px;
        }

        .index-item-desc {
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          white-space: normal;
          max-width: 70%;
          line-height: 1.4;
        }

        .index-item-dots {
          flex: 1;
          border-bottom: 1px dotted #cbd5e1;
          margin: 0 15px;
          position: relative;
          top: -4px;
        }

        .index-item-page {
          font-weight: 600;
          color: #0f766e;
        }

        /* ---------------------------------------------------- */
        /* PÁGINA: GALERIA SPREAD E SINGLE FOTOS                */
        /* ---------------------------------------------------- */
        .gallery-page {
          background: #ffffff;
        }

        .gallery-spread {
          display: flex;
          width: 100%;
          height: calc(100% - 150px);
          position: relative;
        }

        .gallery-side {
          flex: 1;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 20px;
        }

        .before-side {
          background: #f8fafc;
          border-right: 1px solid #e2e8f0;
        }
        
        .after-side {
          background: #f0fdfa; /* Super light teal */
        }

        .watermark {
          position: absolute;
          top: 10%;
          left: 50%;
          transform: translateX(-50%);
          font-family: 'Playfair Display', serif;
          font-size: 120px;
          color: rgba(0,0,0,0.03);
          font-weight: 700;
          z-index: 1;
          pointer-events: none;
        }

        .img-container {
          width: 100%;
          height: 60%;
          background-size: cover;
          background-position: center;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          position: relative;
          z-index: 2;
        }

        .single-photo-spread {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: calc(100% - 150px);
          position: relative;
          padding: 40px;
          box-sizing: border-box;
          background: #f8fafc;
        }

        .single-img-container {
          width: 90%;
          height: 80%;
          border-radius: 4px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.2);
        }

        .img-placeholder {
          width: 100%;
          height: 60%;
          border: 2px dashed #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          z-index: 2;
          background: rgba(255,255,255,0.5);
        }

        .side-label {
          text-align: center;
          margin-top: 30px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 4px;
          color: #475569;
          z-index: 2;
        }
        
        .after-side .side-label {
          color: #0f766e;
        }

        .vs-badge {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 50px;
          height: 50px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
          color: #0ea5e9;
          z-index: 10;
        }

        /* ---------------------------------------------------- */
        /* CONTRA-CAPA (BACKCOVER)                              */
        /* ---------------------------------------------------- */
        .magazine-backcover {
          background: #0f172a;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .backcover-content {
          text-align: center;
          opacity: 0.6;
        }
        
        .backcover-logo {
          height: 60px;
          margin-bottom: 30px;
          filter: grayscale(100%);
        }

        .backcover-content h3 {
          font-size: 14px;
          letter-spacing: 6px;
          font-weight: 300;
          margin-bottom: 10px;
        }
        
        .backcover-content p {
          font-size: 10px;
          letter-spacing: 4px;
          color: #94a3b8;
        }


        /* ---------------------------------------------------- */
        /* MEDIA QUERY PARA IMPRESSÃO                           */
        /* ---------------------------------------------------- */
        @media print {
          @page {
            size: A4;
            margin: 0; 
          }

          body {
            background: #020617 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * {
            visibility: hidden;
          }

          .no-print {
            display: none !important;
          }

          .print-area, .print-area * {
            visibility: visible;
          }

          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }

          .magazine-container {
            background: none;
            padding: 0;
            gap: 0;
          }

          .magazine-cover, .magazine-page, .magazine-backcover {
            box-shadow: none;
            page-break-after: always;
            break-after: page;
          }
        }
      `}} />
    </>
  );
}
