# Manual do Usuário — Sistema de Gestão JHOSTON TEC (Versão 1.2)

Este manual orienta a equipe do escritório e de campo na operação do CRM, controle de ponto, diárias, diários de obra, vales, financeiro, gestão de boletos, calculadora de obra, comunicação interna (chat) e integração com relógios inteligentes da **JHOSTON TEC Piscinas**.

---

## 1. Níveis de Acesso e Autenticação (Login & Cadastro)
O sistema possui dois níveis de acesso práticos diferenciados para garantir a segurança dos dados e o fluxo correto de permissões:

### A. Escritório (Administrativo)
*   **Acesso:** Completo. Opera o CRM (Oportunidades e Propostas), painel financeiro, fluxo de caixa, cadastros de funcionários, obras, diárias de viagens, adiantamentos (vales) e todos os relatórios operacionais.
*   **Padrão de Login:** Segue o padrão `@nomeusuario` (ex: `@admin`, `@danielsmlopes`).

### B. Campo (Operacional)
*   **Acesso:** Restrito. Visualiza e opera **apenas** as telas de *Controle de Ponto* (envio de escalas) e *Diário de Obra* (lançamento de notas e fotos).
*   **Padrão de Login:** Segue o padrão `@nomeusuario` (ex: `@campo`, `@roberto`).

### C. Fluxo de Auto-Cadastro (Sign Up)
1.  Na tela de login, clique no link **Cadastre-se**.
2.  Insira seu nome completo, usuário desejado e senha.
3.  **Validação de Usuário:** O sistema exige o prefixo `@` (ex: `@danielsmlopes`). Se você esquecer de digitar o `@`, o sistema o adicionará automaticamente.
4.  **Acesso Inicial:** Por segurança, todo novo usuário cadastrado inicia automaticamente no nível **CAMPO** (acesso restrito). A liberação para acesso administrativo de **ESCRITÓRIO** deve ser efetuada no painel de controle por um administrador autorizado.

### D. Redefinição de Senha (Reset)
Caso um usuário esqueça a senha:
1.  Na tela de login, clique em **Esqueceu a senha? Solicitar reset**.
2.  Digite seu usuário (ex: `@danielsmlopes`) e clique em **Verificar Status**.
3.  Se for o primeiro acesso ao reset, clique em **Solicitar Reset ao Administrador**. A solicitação será encaminhada para moderação.
4.  Após a autorização, ao acessar a mesma tela de reset, o sistema liberará os campos de nova senha.
5.  Digite a nova senha e confirme. **Atenção:** Ao redefinir a senha, o seu perfil volta temporariamente ao papel **CAMPO** por segurança, necessitando que o administrador o promova novamente para retornar ao acesso administrativo.

---

## 2. CRM & Propostas Comerciais (Apenas Escritório)
Esta tela permite gerenciar o funil de prospecção e vendas de revestimentos para piscinas.

### A. Cadastro de Oportunidades
1. Acesse o menu **CRM / Oportunidades** e clique em **Nova Oportunidade**.
2. Preencha o nome do cliente/prospect, telefone, e-mail, endereço da piscina, breve descrição física, **Área da Piscina (m²)** e o produto selecionado.
3. **Opções de Produtos:**
   *   **Linha Premium (Resina PU):** Solução de alto padrão em poliuretano para projetos coloridos.
   *   **Linha Super Premium (Poliaspártica):** Solução definitiva com resina poliaspártica para projetos brancos (estabilidade UV absoluta que não amarela).

### B. Cálculo Comercial Automático
O sistema calcula o valor total da proposta em tempo real baseando-se na área em metros quadrados (m²):
*   **Premium:** R$ 270,00/m² + R$ 25,00/m² (aditivo de salinidade) = **R$ 295,00/m²**.
*   **Super Premium:** R$ 350,00/m² + R$ 25,00/m² (aditivo de salinidade) = **R$ 375,00/m²**.

### C. Geração de Proposta Comercial (.docx)
Na tabela de oportunidades, clique em **Proposta**. O sistema gerará o download de um arquivo do Microsoft Word (.docx) contendo o contrato totalmente preenchido com os dados do cliente, data por extenso e detalhamento comercial, mantendo o leiaute original.

### D. Conversão de Prospect em Cliente Ativo
Quando a proposta for aceita, clique no botão **Aceitar Obra**. O sistema atualizará o status da oportunidade comercial e inserirá de forma automática o projeto no menu de **Obras** como uma obra **ATIVA** pronta para execução.

---

## 3. Cadastro de Obras e Funcionários (Apenas Escritório)
*   **Obras:** Acesse **Obras (Projetos)** para registrar novos projetos. Defina o status (*Ativa*, *Finalizada* ou *Suspensa*). Apenas obras *Ativas* aparecem nos lançamentos operacionais de ponto, diários e viagens.
*   **Funcionários:** Acesse **Funcionários** para gerenciar os colaboradores diaristas, cadastrando sua diária padrão, adicional motorista e chave PIX.

---

## 4. Lançamento e Aprovação de Ponto
*   **Lançamento Manual pelo Campo (ou Escritório):** No menu **Controle de Ponto**, escolha a obra e a data. Marque a equipe:
    *   *Dia Trabalhado:* Presença normal de 8 horas e diária integral.
    *   *V - Viagem:* Registra o dia em deslocamento/trabalho em viagem.
    *   *Dia Chuvoso (CH):* Abre campo para digitar o percentual proporcional de pagamento da diária (ex: `50` para meia diária).
    *   *N/A - Não Aplicável:* O funcionário não estava escalado para este projeto e dia.
    *   *Nota:* Apontamentos feitos por usuários de nível `CAMPO` salvam como **PENDENTES** e necessitam de validação.
*   **Importar Escala do WhatsApp (Apenas Escritório):** Cole a mensagem de escalas do grupo do WhatsApp e clique em **Analisar Texto**. O sistema gerará automaticamente os apontamentos presenciais, solicitando correção apenas se houver grafias incorretas de funcionários.
*   **Aprovação (Apenas Escritório):** Na aba **Aprovações Pendentes**, o administrador visualiza e valida os lançamentos individualmente ou em lote.

---

## 5. Controle de Vales & Bônus (Apenas Escritório)
*   **Vales (Débito):** Adiantamentos fornecidos que serão deduzidos no cálculo de fechamento mensal.
*   **Bônus (Crédito):** Premiações por produtividade. **Para lançar bônus, é obrigatório preencher a descrição/motivo** (ex: *Bônus produtividade piscina Alphaville*).

---

## 6. Diário de Obra e Galeria de Fotos
Permite registrar relatos operacionais diários, atualizar as etapas físicas e arquivar fotos da obra.
1. Acesse o menu **Diário de Obra** e escolha o projeto ativo.
2. Atualize o progresso das 5 etapas através dos seletores de barra (0% a 100%):
   *   *1. Escavação* | *2. Estrutura* | *3. Hidráulica* | *4. Revestimento* | *5. Entrega*
3. Escreva o relato diário e selecione fotos para anexar. O sistema comprime as imagens localmente no navegador antes de enviar para economizar o plano de dados móveis do celular no canteiro de obras.
4. Clique em qualquer foto no histórico para visualizá-la expandida (Lightbox).

---

## 7. Módulo Financeiro e Fornecedores (Apenas Escritório)
*   **Financeiro:** Controle de Contas a Pagar/Receber. Despesas da categoria "Fornecedores" exigem a seleção de um fornecedor cadastrado.
*   **Cadastro de Fornecedores:** Salve os contatos, CNPJ e a chave PIX dos parceiros. Ao lançar uma despesa financeira, clique no botão `+` para cadastrar um novo fornecedor de forma rápida sem fechar o formulário atual.
*   **Histórico de Compras:** Clique sobre qualquer linha de fornecedor na tabela para abrir o modal de detalhes com o extrato financeiro acumulado e todas as transações correspondentes.

---

## 8. Relatórios e Holerites (Apenas Escritório)
O sistema conta com fechamentos consolidados de:
*   **Ponto por Obra:** Grade de presenças mensais.
*   **Pagamento de Funcionários:** Cálculo líquido automático (Diárias + Viagens + Bônus - Vales). Permite a abertura do **Holerite** individual para impressão limpa (escondendo os menus do sistema) para salvar em PDF e enviar via WhatsApp.
*   **Lucratividade por Obra:** Balanço de faturamento contra custos.
*   **Andamento de Obra:** Relatório visual completo contendo os relatos cronológicos e fotos organizadas para enviar ao cliente.

---

## 9. Como Imprimir ou Exportar Manuais em PDF
1. Para exportar este manual ou relatórios em formato PDF a partir do sistema, clique no botão **Salvar como PDF / Imprimir** disponível no cabeçalho das páginas.
2. O sistema é otimizado para ocultar automaticamente os cabeçalhos administrativos e menus laterais durante a impressão, gerando uma folha limpa e bem diagramada.
3. Nas opções de impressão do seu navegador, escolha o destino como **Salvar como PDF**.

---

## 10. Gestão de Boletos Inteligente (Voz, Prompt e Foto - Apenas Escritório)
Esta tela permite que você armazene e gerencie boletos bancários ou de concessionárias vinculados a contas a pagar:
1. Acesse o menu **Financeiro** e clique em **Gerenciar Boletos**.
2. **Métodos de Cadastro Inteligentes**:
   *   **Por Prompt de Texto**: Cole o texto do boleto ou digite uma instrução como *"Boleto de Coelba sacado Jhoston valor 350 vencimento 15/07/2026 código 34191..."* e clique em **Analisar**.
   *   **Por Voz**: Clique em **Falar Comando de Voz** e narre o boleto. O sistema transcreverá e interpretará as informações automaticamente.
   *   **Por Foto (OCR)**: Clique em **Ler de uma Foto (OCR)** e carregue uma foto do boleto. O sistema fará a leitura local da imagem no próprio navegador, buscando o código de barras, o valor e a data de vencimento.
3. **Confirmação**: Revise os dados preenchidos no formulário (Data de Vencimento, Valor, Cedente, Sacado, Código de Barras) e clique em **Salvar Boleto**.
4. **Cópia Rápida**: Na listagem de boletos cadastrados, você pode clicar no ícone de cópia para copiar a linha digitável do código de barras instantaneamente.

---

## 11. Integração com Relógios Inteligentes (Apple Watch & Galaxy Watch)
A equipe de administração pode acompanhar os indicadores mais críticos do painel do escritório diretamente em seu relógio inteligente:
*   **Dados Disponíveis**: Saldo de caixa consolidado, obras e funcionários ativos, total de tarefas do MASTER pendentes e resumo de contas a pagar (expirando hoje, 1, 3 e 5 dias).
*   **API de Sincronização**: O relógio conecta-se à rota de API do sistema: `/api/watch/adm?token=JhostonTecWatchKey2026`.
*   **Apple Watch (Atalhos/Shortcuts)**: Crie um atalho no iPhone utilizando a ação "Obter conteúdo da URL" apontando para a API do seu sistema, e configure um widget para mostrar as informações lidas na tela do Apple Watch.
*   **Galaxy Watch**: Utilize aplicativos integrados de Wear OS compatíveis com a leitura de payloads JSON de APIs externas.

---

## 12. Calculadora de Obra & Conversor de Medidas (Disponível para Todos)
A calculadora de obra ajuda a estimar e converter medidas na execução do projeto:
1. Acesse o menu lateral **Calculadora de Obra** ou clique no atalho da Home.
2. Escolha o módulo desejado nas abas superiores:
   *   **Volume de Piscina**: Calcule o volume em metros cúbicos ($m^3$) e litros ($L$) para formatos retangulares, ovais ou redondos.
   *   **Área de Revestimento**: Descubra a metragem quadrada necessária de revestimento (pastilhas, cerâmicas ou tintas) para recobrir fundo e paredes, com cálculo de recortes de perda automática (+10% padrão).
   *   **Dosagem de Concreto**: Insira o volume desejado e obtenha a quantidade de sacos de cimento (50kg), metros cúbicos de areia e metros cúbicos de brita necessários no traço estrutural 1:2:3.
   *   **Conversor de Medidas**: Realize conversões instantâneas bidirecionais (ex: metros cúbicos para litros, metros para polegadas, $m^2$ para pés quadrados, etc).

### Calculadora Rápida (POP-UP Global)
Além das calculadoras de obra dedicadas, o sistema conta com uma calculadora flutuante disponível em qualquer página para agilizar os lançamentos nos formulários:
*   **Ativação Rápida**: Clique no botão flutuante de calculadora no canto inferior direito ou pressione a tecla **F8** em seu teclado.
*   **Vínculo Inteligente de Campo**: A calculadora rastreia automaticamente o último campo de entrada de dados numéricos que você focou antes de abri-la. O nome do campo aparecerá em destaque no cabeçalho da calculadora (ex: *🎯 Enviar para: Diária Padrão*).
*   **Transferência Automática (Ctrl + Enter)**: Ao finalizar um cálculo, clique em **📥 Inserir no Campo** ou simplesmente pressione **Ctrl + Enter** no seu teclado. O valor calculado será preenchido diretamente no campo de texto focado, atualizando o estado do formulário e dando um sinal visual verde de sucesso no campo.
*   **Arrastável**: Se a janela da calculadora estiver cobrindo alguma informação importante, clique no topo dela e arraste-a para qualquer canto da tela.
*   **Memória e Histórico**: Suporta operações clássicas de memória (`MC`, `MR`, `M+`, `M-`) e mantém um histórico dos últimos 10 cálculos realizados na sessão (basta clicar em uma linha do histórico para carregar aquele valor de volta para a tela).


---

## 13. Comunicação Interna (Chat - Disponível para Todos)
Permite a troca de informações rápidas e diretas entre a equipe técnica externa e administrativa:
1. Acesse o menu lateral **Chat Interno** ou utilize o atalho rápido no topo da Home.
2. **Canais de Obras (📢)**: Canais compartilhados de grupo de cada uma das Obras Ativas. Toda a equipe que opera no projeto e o escritório podem ler e enviar mensagens.
3. **Conversas Diretas (👤)**: Mensagens um-a-um privadas. Escolha qualquer usuário listado para enviar uma mensagem exclusiva.
4. **Alerta Sonoro**: Ao receber novas mensagens na janela de chat ativa que não tenham sido enviadas por você, o sistema emitirá um som discreto (beep).
5. **Atualização**: O chat é atualizado automaticamente a cada 3 segundos, dispensando a necessidade de atualizar a página manualmente.

---

## 14. Uso de Modelos do Canva como Proposta Comercial
Para criar propostas comerciais personalizadas no Canva e integrá-las ao sistema:

1. **Criação do Design**: Crie e diagrame a Proposta Comercial no Canva com a identidade visual da empresa.
2. **Inclusão de Marcadores de Texto (Placeholders)**: Nos locais onde os dados dinâmicos do cliente e valores calculados devem ser inseridos, adicione tags simples entre chaves `{}`:
   *   `{propostaNumero}`: Número sequencial formatado da proposta (ex: `0042/2026`).
   *   `{clienteNome}`: Nome completo ou Razão Social do cliente.
   *   `{clienteEndereco}`: Endereço completo informado no cadastro.
   *   `{areaPiscina}`: Área total em metros quadrados (m²).
   *   `{precoUnitario}`: Preço do m² do produto contratado (ex: `270,00`).
   *   `{precoAditivo}`: Preço do m² do aditivo de salinidade (ex: `25,00`).
   *   `{valorProduto}`: Subtotal correspondente ao produto (Área x Preço Unitário).
   *   `{valorAditivo}`: Subtotal correspondente ao aditivo (Área x Preço Aditivo).
   *   `{valorTotal}`: Soma total dos valores da proposta comercial.
   *   `{valorEntrada}`: Valor de entrada (50% do valor unitário do produto).
   *   `{valorIntermediaria}`: Valor da parcela intermediária (30% do valor unitário do produto).
   *   `{valorFinal}`: Valor da parcela final (20% do valor unitário do produto).
   *   `{dataProposta}`: Data atual por extenso (ex: `16 de Julho de 2026`).
3. **Exportação**: Concluído o design com os marcadores exatos, clique em **Compartilhar** no Canva, selecione **Baixar** e escolha o formato **PDF padrão** ou **PDF para impressão**.
4. **Conversão para Word (.docx)**: Utilize um conversor online de alta fidelidade (como *Adobe Acrobat Online*, *Smallpdf* ou *Ilovepdf*) para transformar o arquivo PDF baixado em um documento do Microsoft Word (`.docx`).
5. **Instalação do Modelo no Servidor**: Renomeie o arquivo gerado de acordo com a linha de produto e coloque-o na pasta de templates do sistema (`src/templates`):
   *   `Proposta_Premium_Template.docx` para a linha **Premium**.
   *   `Proposta_Super_Premium_Template.docx` para a linha **Super Premium**.
   *   `Proposta_Cascata_Template.docx` para a linha **Cascata**.
6. **Homologação**: Faça um lançamento de teste na tela de CRM e clique em **Proposta** para certificar-se de que a diagramação foi convertida perfeitamente e os dados dinâmicos foram aplicados nos campos marcados.

