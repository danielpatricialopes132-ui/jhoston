"use client";

import { useState } from "react";

export default function AjudaPage() {
  const [activeTab, setActiveTab] = useState("INTRO");

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Estilos específicos para impressão */}
      <style jsx global>{`
        @media print {
          /* Esconder elementos desnecessários na impressão */
          .sidebar, .main-header, .no-print, button, .help-tabs {
            display: none !important;
          }
          /* Expandir conteúdo principal */
          .main-content, .main-body, body, html {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 12pt !important;
          }
          .card {
            border: none !important;
            background: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin-bottom: 20px !important;
          }
          h1, h2, h3, h4, h5, h6 {
            color: #000000 !important;
            page-break-after: avoid !important;
          }
          p, ul, ol, table {
            color: #333333 !important;
          }
          .print-only-title {
            display: block !important;
            text-align: center;
            margin-bottom: 30px;
          }
          .help-section {
            display: block !important;
            page-break-after: always;
          }
        }
        
        .help-tabs-container {
          display: flex;
          gap: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .help-tab-btn {
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.03);
          color: var(--text-muted);
          transition: all 0.2s;
        }

        .help-tab-btn.active {
          background: var(--primary-color);
          color: #ffffff;
        }
        
        .help-content {
          line-height: 1.6;
          font-size: 14px;
        }

        .help-content h4 {
          font-size: 18px;
          color: var(--text-heading);
          margin-top: 20px;
          margin-bottom: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding-bottom: 6px;
        }

        .help-content h5 {
          font-size: 15px;
          color: var(--text-heading);
          margin-top: 15px;
          margin-bottom: 6px;
        }

        .help-content p {
          color: var(--text-muted);
          margin-bottom: 12px;
        }

        .help-content ul, .help-content ol {
          margin-left: 20px;
          margin-bottom: 12px;
          color: var(--text-muted);
        }

        .help-content li {
          margin-bottom: 6px;
        }

        .help-content strong {
          color: var(--text-heading);
        }
      `}</style>

      {/* Título invisível na tela, mas visível na impressão */}
      <div className="print-only-title" style={{ display: "none" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, margin: "0 0 5px 0" }}>JHOSTON TEC PISCINAS</h1>
        <p style={{ fontSize: "14px", color: "#666" }}>Manual Completo do Usuário — Versão 1.0</p>
        <hr style={{ border: "1px solid #ccc", margin: "20px 0" }} />
      </div>

      <div className="flex-row-between no-print" style={{ marginBottom: "20px" }}>
        <div>
          <h3 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-heading)" }}>
            Ajuda & Manual do Usuário
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
            Consulte o guia técnico do sistema ou exporte o manual em PDF para treinamento da equipe.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handlePrint}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Salvar como PDF / Imprimir
        </button>
      </div>

      {/* Abas no navegador */}
      <div className="help-tabs-container no-print">
        <button className={`help-tab-btn ${activeTab === "INTRO" ? "active" : ""}`} onClick={() => setActiveTab("INTRO")}>Visão Geral & Perfis</button>
        <button className={`help-tab-btn ${activeTab === "CRM" ? "active" : ""}`} onClick={() => setActiveTab("CRM")}>CRM & Propostas</button>
        <button className={`help-tab-btn ${activeTab === "PONTO" ? "active" : ""}`} onClick={() => setActiveTab("PONTO")}>Controle de Ponto</button>
        <button className={`help-tab-btn ${activeTab === "DIARIO" ? "active" : ""}`} onClick={() => setActiveTab("DIARIO")}>Diário de Obra</button>
        <button className={`help-tab-btn ${activeTab === "FINANCEIRO" ? "active" : ""}`} onClick={() => setActiveTab("FINANCEIRO")}>Financeiro & Fornecedores</button>
        <button className={`help-tab-btn ${activeTab === "BOLETOS_WATCH" ? "active" : ""}`} onClick={() => setActiveTab("BOLETOS_WATCH")}>Boletos & Smartwatches (v1.1)</button>
        <button className={`help-tab-btn ${activeTab === "CALC_CHAT" ? "active" : ""}`} onClick={() => setActiveTab("CALC_CHAT")}>Calculadora & Chat (v1.2)</button>
      </div>

      {/* Conteúdo do Manual */}
      <div className="card help-content">
        
        {/* SEÇÃO 1: VISÃO GERAL E PERFIS */}
        {(activeTab === "INTRO" || typeof window === "undefined" || window.matchMedia("print").matches) && (
          <div className="help-section">
            <h4>1. Visão Geral e Perfis de Acesso</h4>
            <p>
              O sistema <strong>JHOSTON TEC Piscinas</strong> é uma plataforma integrada de gestão que centraliza controles financeiros, orçamentos, monitoramento do progresso físico de obras, folhas de pagamento de colaboradores diaristas e histórico de fornecedores.
            </p>
            <p>
              A fim de garantir a segurança dos dados, o sistema divide as funcionalidades e acessos entre dois perfis operacionais principais:
            </p>
            
            <h5>A. Escritório (Administração Geral)</h5>
            <ul>
              <li><strong>Finalidade:</strong> Destinado ao controle comercial, financeiro e planejamento operacional.</li>
              <li><strong>Nível de Acesso:</strong> Possui acesso integral a todos os módulos do sistema: Dashboard Financeiro, Gestão de Projetos (Obras), Cadastro de Colaboradores, Controle e Aprovação de Ponto, Controle de Vales e Ajustes, Fluxo de Caixa (Financeiro), Cadastro e Extratos de Fornecedores, Relatórios de Fechamento e o painel de <strong>CRM / Oportunidades</strong>.</li>
              <li><strong>Padrão de Usuário:</strong> Identificação iniciando com o caractere "@" (ex: <code>@admin</code>, <code>@danielsmlopes</code>).</li>
            </ul>

            <h5>B. Campo (Equipe Operacional Externa)</h5>
            <ul>
              <li><strong>Finalidade:</strong> Destinado aos encarregados e mestres de obras para registro diário de atividades.</li>
              <li><strong>Nível de Acesso:</strong> Restrito exclusivamente às funções de apontamento diário: <strong>Controle de Ponto</strong> (envio de presença da equipe) e <strong>Diário de Obra</strong> (registro de relatos técnicos, atualização gráfica do progresso da piscina e galeria de fotos).</li>
              <li><strong>Padrão de Usuário:</strong> Identificação iniciando com o caractere "@" (ex: <code>@campo</code>, <code>@roberto</code>).</li>
            </ul>

            <h5>C. Registro (Sign Up) e Permissões</h5>
            <ol>
              <li>Qualquer novo colaborador pode se cadastrar na tela <code>/signup</code>.</li>
              <li>O sistema exige o prefixo "@" no nome do usuário. Se omitido, o sistema o inserirá automaticamente.</li>
              <li>Por questões de segurança, todo novo usuário cadastrado inicia no nível <strong>CAMPO</strong>. Para obter acesso de <strong>ESCRITÓRIO</strong>, o administrador do sistema deverá efetuar a promoção de cargo no painel de controle correspondente.</li>
            </ol>
          </div>
        )}

        {/* SEÇÃO 2: CRM & PROPOSTAS */}
        {(activeTab === "CRM" || typeof window === "undefined" || window.matchMedia("print").matches) && (
          <div className="help-section">
            <h4>2. CRM (Oportunidades) & Propostas Comerciais</h4>
            <p>
              O CRM é o funil comercial de prospecção do sistema. Permite acompanhar possíveis clientes desde o contato inicial até a assinatura do contrato.
            </p>
            
            <h5>A. Cadastro de Oportunidades</h5>
            <ul>
              <li>Cadastre novos prospects preenchendo o Nome do Cliente, Endereço de instalação, telefone, e-mail e a <strong>Área total da Piscina (m²)</strong>.</li>
              <li>Selecione o produto de preferência para a proposta: <strong>Premium</strong> ou <strong>Super Premium</strong>.</li>
            </ul>

            <h5>B. Precificação Automatizada</h5>
            <p>
              O sistema calcula automaticamente o valor estimado da proposta comercial baseando-se na área da piscina inserida:
            </p>
            <ul>
              <li><strong>Linha Premium (Resina PU):</strong> R$ 270,00/m² + R$ 25,00/m² de aditivo de salinidade = <strong>R$ 295,00 por m²</strong>.</li>
              <li><strong>Linha Super Premium (Poliaspártica):</strong> R$ 350,00/m² + R$ 25,00/m² de aditivo de salinidade = <strong>R$ 375,00 por m²</strong>.</li>
            </ul>

            <h5>C. Geração de Propostas (.docx)</h5>
            <p>
              Ao clicar no botão <strong>Proposta</strong> de qualquer oportunidade, o sistema carrega o layout oficial do Word (.docx), preenche instantaneamente todos os dados do cliente, endereço, área, data por extenso e detalhamento de valores comerciais, gerando um download direto.
            </p>

            <h5>D. Conversão em Obra Ativa</h5>
            <p>
              Em caso de fechamento do negócio (status Aceito), clique no botão <strong>Aceitar Obra</strong>. O sistema alterará o status da oportunidade comercial e criará de forma automática o projeto na tela de <strong>Obras</strong> com status <strong>ATIVA</strong>, transferindo as informações cadastrais e iniciando o progresso físico de instalação com 0%.
            </p>
          </div>
        )}

        {/* SEÇÃO 3: CONTROLE DE PONTO */}
        {(activeTab === "PONTO" || typeof window === "undefined" || window.matchMedia("print").matches) && (
          <div className="help-section">
            <h4>3. Controle de Ponto de Diaristas</h4>
            <p>
              Como a equipe de campo é remunerada sob o regime de diárias, o controle de ponto é otimizado para lançamentos práticos de presença, ausência e horas operadas:
            </p>
            
            <h5>A. Tipos de Apontamento</h5>
            <ul>
              <li><strong>Dia Trabalhado:</strong> Registra diária padrão cheia (8 horas trabalhadas).</li>
              <li><strong>Viagem (V):</strong> Marca o dia como diária de viagem de campo para cálculo de deslocamento.</li>
              <li><strong>Dia Chuvoso (CH):</strong> Permite o pagamento proporcional da diária devido à interrupção por chuvas (o usuário define o percentual a pagar, ex: 50% para meia diária).</li>
              <li><strong>Não Aplicável (N/A):</strong> Indica que o funcionário não estava escalado para aquele projeto naquele dia (zera o pagamento para esta entrada).</li>
            </ul>

            <h5>B. Importador de Escala de WhatsApp</h5>
            <ol>
              <li>Copie a mensagem de escala do grupo de WhatsApp e cole no importador de escalas.</li>
              <li>Clique em <strong>Analisar Texto da Mensagem</strong>. O importador mapeará os nomes dos diaristas com o banco de dados. Se houver divergências de grafia ou novos diaristas, a ferramenta solicitará a correção imediata.</li>
              <li>Confirme para realizar o lançamento de ponto coletivo em poucos segundos.</li>
            </ol>

            <h5>C. Validação e Folha de Pagamentos</h5>
            <p>
              Pontos lançados pelo nível <strong>CAMPO</strong> entram como <em>Pendentes</em> e exigem a aprovação dos usuários de nível <strong>ESCRITÓRIO</strong>. Os pontos aprovados alimentam os relatórios mensais e o extrato consolidado de fechamento de cada colaborador.
            </p>
          </div>
        )}

        {/* SEÇÃO 4: DIÁRIO DE OBRA */}
        {(activeTab === "DIARIO" || typeof window === "undefined" || window.matchMedia("print").matches) && (
          <div className="help-section">
            <h4>4. Diário de Obra e Acompanhamento de Fases</h4>
            <p>
              O Diário de Obra serve para documentar a evolução diária dos projetos, informando o cliente e gerando relatórios de andamento físico.
            </p>

            <h5>A. Acompanhamento de Etapas</h5>
            <p>
              Cada piscina cadastrada no sistema possui 5 fases principais de execução. Os encarregados atualizam o progresso de cada fase através de sliders que variam de 0% a 100%:
            </p>
            <ol>
              <li><strong>Escavação</strong></li>
              <li><strong>Alvenaria / Estrutura</strong></li>
              <li><strong>Hidráulica / Tubulações</strong></li>
              <li><strong>Revestimento / Azulejos</strong></li>
              <li><strong>Acabamento / Entrega</strong></li>
            </ol>

            <h5>B. Registro de Relatos e Galeria de Fotos</h5>
            <ul>
              <li>Escreva a ocorrência ou progresso técnico do dia no editor de texto.</li>
              <li><strong>Anexo de Imagens:</strong> Permite carregar ou tirar fotos diretamente do celular.</li>
              <li><strong>Compressão Automática:</strong> Para economizar os dados móveis da equipe no canteiro de obras e agilizar o upload, o sistema comprime as imagens localmente no aparelho antes do envio ao servidor.</li>
              <li><strong>Lightbox:</strong> No histórico, clique sobre qualquer miniatura de imagem para visualizá-la em tamanho real.</li>
            </ul>
          </div>
        )}

        {/* SEÇÃO 5: FINANCEIRO & FORNECEDORES */}
        {(activeTab === "FINANCEIRO" || typeof window === "undefined" || window.matchMedia("print").matches) && (
          <div className="help-section">
            <h4>5. Gestão Financeira e Fornecedores</h4>
            <p>
              Disponível apenas para o nível de acesso <strong>ESCRITÓRIO</strong>, o módulo financeiro monitora as movimentações de contas a pagar, contas a receber e consolidação de fornecedores.
            </p>

            <h5>A. Contas a Pagar & Receber</h5>
            <ul>
              <li>Lance <strong>Receitas</strong> (faturamento de contratos) e <strong>Despesas</strong> (mão de obra, materiais, despesas gerais) informando data de vencimento, descrição, valor e obra associada.</li>
              <li>Despesas vinculadas à categoria "Fornecedores" exigem a seleção de um fornecedor cadastrado para rastreio do histórico de compras.</li>
            </ul>

            <h5>B. Cadastro de Fornecedores</h5>
            <ul>
              <li>Mantenha as informações cadastrais organizadas: Nome, CNPJ, telefone, e-mail, contato do vendedor e a <strong>Chave PIX</strong> para transferências de pagamentos.</li>
              <li><strong>Cadastro Rápido:</strong> Ao preencher uma nova despesa financeira, se o fornecedor não constar no dropdown, clique no botão <code>+</code> para cadastrá-lo instantaneamente, sem perder os dados que já foram digitados.</li>
              <li><strong>Extrato de Compras:</strong> Clique sobre qualquer fornecedor na lista para visualizar o extrato financeiro (Total Pago, Pendente e Atrasado) e todas as compras vinculadas a ele.</li>
            </ul>

            <h5>C. Controle de Vales & Bônus</h5>
            <ul>
              <li><strong>Vales (Débito):</strong> Adiantamentos financeiros concedidos aos diaristas. Serão deduzidos automaticamente na folha de fechamento.</li>
              <li><strong>Bônus (Crédito):</strong> Premiações ou diárias extras. Exige obrigatoriamente o preenchimento do campo de descrição com a justificativa técnica.</li>
            </ul>
          </div>
        )}

        {/* SEÇÃO 6: GESTÃO DE BOLETOS & SMARTWATCHES (VERSÃO 1.1) */}
        {(activeTab === "BOLETOS_WATCH" || typeof window === "undefined" || window.matchMedia("print").matches) && (
          <div className="help-section">
            <h4>6. Gestão de Boletos e Integração com Smartwatches (v1.1)</h4>
            
            <h5>A. Leitura por Prompt, Voz ou Foto</h5>
            <p>
              O sistema agora possui um módulo dedicado de <strong>Boletos de Contas a Pagar</strong>. Você pode acessá-lo através do botão "Gerenciar Boletos" na tela do Financeiro. Este módulo possui três canais inteligentes de entrada:
            </p>
            <ul>
              <li><strong>Prompt de Texto:</strong> Digite frases descrevendo o boleto (ex: <code>"Cadastrar boleto do cedente Coelba sacado Jhoston valor 350 reais vencimento 15/07/2026 código..."</code>) e clique em Analisar. O sistema preencherá os campos automaticamente.</li>
              <li><strong>Comando de Voz:</strong> Clique em "Falar Comando de Voz", autorize o microfone no navegador e descreva o boleto falando naturalmente. O sistema transcreverá a fala e fará o parse.</li>
              <li><strong>Leitura por Foto (OCR):</strong> Clique em "Ler de uma Foto (OCR)" e envie a imagem ou tire uma foto do boleto. O navegador processará a imagem localmente (via Tesseract.js), extrairá a linha digitável e autocompletará as informações de sacado, cedente, valor e vencimento.</li>
            </ul>

            <h5>B. Integração com Smartwatches (Apple Watch & Galaxy Watch)</h5>
            <p>
              A aplicação expõe um canal de comunicação de dados em tempo real para visualização rápida em relógios inteligentes.
            </p>
            <ul>
              <li><strong>Endpoint da API:</strong> <code>/api/watch/adm?token=SUA_CHAVE</code></li>
              <li><strong>Chave Padrão:</strong> <code>JhostonTecWatchKey2026</code> (ou a chave configurada no parâmetro <code>WATCH_API_TOKEN</code> do servidor).</li>
              <li><strong>Como configurar no Apple Watch (Atalhos/Shortcuts):</strong>
                <ol>
                  <li>No seu iPhone, abra o app <strong>Atalhos (Shortcuts)</strong> e clique em criar novo atalho.</li>
                  <li>Adicione a ação <strong>"Obter conteúdo da URL"</strong>, inserindo o link completo do sistema (ex: <code>https://[sua-url-do-sistema]/api/watch/adm?token=JhostonTecWatchKey2026</code>).</li>
                  <li>Adicione a ação <strong>"Obter valor do dicionário"</strong> para ler as chaves do JSON retornado (ex: <code>saldoCaixa</code>, <code>obrasAtivas</code>, <code>tarefasPendentes.total</code>).</li>
                  <li>Adicione a ação <strong>"Mostrar resultado"</strong> para formatar a mensagem.</li>
                  <li>Marque para exibir o atalho no Apple Watch. Pronto! Agora você pode ver o resumo do financeiro direto no pulso.</li>
                </ol>
              </li>
              <li><strong>Como configurar no Galaxy Watch:</strong>
                <ol>
                  <li>Utilize aplicativos de visualização HTTP ou Tiles de Web Browser para Wear OS.</li>
                  <li>Configure o link do seu endpoint com o token correspondente para obter a resposta JSON.</li>
                </ol>
              </li>
            </ul>

            <h5>C. Formato de Resposta do Relógio (JSON)</h5>
            <p>
              A API retorna os seguintes campos estruturados:
            </p>
            <pre style={{ backgroundColor: "#1e293b", color: "#f8fafc", padding: "12px", borderRadius: "6px", fontSize: "12px", overflowX: "auto" }}>
{`{
  "saldoCaixa": 25450.00,
  "obrasAtivas": 5,
  "funcionariosAtivos": 12,
  "tarefasPendentes": { "pontos": 3, "resets": 1, "usuarios": 2, "total": 6 },
  "contasAPagar": {
    "hoje": { "count": 1, "valor": 550.00 },
    "amanha": { "count": 2, "valor": 1200.00 },
    "em3Dias": { "count": 0, "valor": 0.00 },
    "em5Dias": { "count": 1, "valor": 450.00 }
  }
}`}
            </pre>
          </div>
        )}

        {/* SEÇÃO 7: CALCULADORA & CHAT INTERNO (VERSÃO 1.2) */}
        {(activeTab === "CALC_CHAT" || typeof window === "undefined" || window.matchMedia("print").matches) && (
          <div className="help-section">
            <h4>7. Calculadora de Obra e Comunicação Interna (v1.2)</h4>
            
            <h5>A. Calculadora de Obra</h5>
            <p>
              Disponível para todos os usuários através do menu lateral ou da Home, esta ferramenta ajuda no planejamento de insumos no canteiro de obras:
            </p>
            <ul>
              <li><strong>Volume de Piscina:</strong> Escolha a forma geométrica (Retangular, Redonda, Oval), digite as dimensões e obtenha o volume em metros cúbicos ($m^3$) e litros ($L$).</li>
              <li><strong>Área de Revestimento:</strong> Calcula a superfície total do fundo e das paredes de uma piscina retangular. Permite selecionar a margem de perda (ex: 10% padrão) para compra de pastilhas ou aplicação de revestimentos.</li>
              <li><strong>Dosagem de Concreto:</strong> Calcula a quantidade estimada de sacos de cimento de 50kg, areia ($m^3$) e brita ($m^3$) para o preenchimento de um determinado volume usando o traço estrutural padrão (1:2:3).</li>
              <li><strong>Conversor de Unidades:</strong> Conversão rápida bidirecional de metros cúbicos para litros, metros para polegadas, metros quadrados para pés quadrados, e litros para galões.</li>
            </ul>

            <h5>B. Chat Interno (Comunicação da Equipe)</h5>
            <p>
              Centraliza a conversa da equipe operacional de campo com a equipe administrativa do escritório.
            </p>
            <ul>
              <li><strong>Grupos de Obras (Canais):</strong> Cada obra ativa possui um canal público automático (indicado com <code>#</code>). Todos os encarregados vinculados à obra e administradores podem visualizar o histórico e enviar novas mensagens.</li>
              <li><strong>Mensagens Diretas (DMs):</strong> Conversas um-a-um privadas com qualquer usuário ativo da plataforma (indicadas com <code>👤</code> e uma bolinha colorida indicando a categoria de permissão).</li>
              <li><strong>Poller em Tempo Real:</strong> A tela verifica novas mensagens de forma automática a cada 3 segundos, mantendo a conversa atualizada.</li>
              <li><strong>Aviso Sonoro:</strong> O sistema toca um alerta sonoro discreto (beep) quando uma nova mensagem é recebida no canal ou chat direto ativo, desde que a mensagem não tenha sido enviada por você.</li>
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}
