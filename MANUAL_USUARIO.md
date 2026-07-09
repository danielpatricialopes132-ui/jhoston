# Manual do Usuário — Sistema de Gestão Financeira JHOSTON TEC

Este manual orienta a equipe do escritório e de campo na operação do sistema financeiro, controle de ponto, diárias, diários de obra e vales da **JHOSTON TEC Piscinas**.

---

## 1. Níveis de Acesso e Autenticação (Login & Cadastro)
O sistema possui três níveis de acesso diferenciados para garantir a segurança dos dados e o controle centralizado de permissões:

### A. Usuário MASTER (Administrador Geral)
*   **Usuário Padrão**: `@master` | **Senha**: `@MASTER123`
*   **Acesso**: Total. Visualiza todas as telas do sistema e possui acesso exclusivo ao menu **Gerenciar Usuários** (`/usuarios`) para liberar contas e definir papéis.
*   **Padrão de Login**: Segue obrigatoriamente o padrão `@master`.

### B. Escritório (Administrativo)
*   **Acesso**: Administrativo. Opera o painel financeiro, fluxo de caixa, cadastros de funcionários, obras, diárias de viagens, adiantamentos (vales) e todos os relatórios operacionais. Não possui acesso à tela de gerenciamento de usuários.
*   **Padrão de Login**: Segue o padrão `@nomeusuario` (ex: `@admin`, `@danielsmlopes`).

### C. Campo (Operacional)
*   **Acesso**: Restrito. Visualiza e opera **apenas** as telas de *Controle de Ponto* e *Diário de Obra*.
*   **Padrão de Login**: Segue o padrão `@nomeusuario` (ex: `@campo`, `@roberto`).

### D. Fluxo de Auto-Cadastro (Sign Up)
1.  Na tela de login, clique no link **Cadastre-se**.
2.  Insira seu nome completo, usuário desejado e senha.
3.  **Validação de Usuário**: O sistema exige o prefixo `@` (ex: `@danielsmlopes`). Se você esquecer de digitar o `@`, o sistema o adicionará automaticamente.
4.  **Acesso Inicial**: Por segurança, todo novo usuário cadastrado inicia automaticamente no nível **CAMPO** (acesso restrito). Para obter acesso de **ESCRITÓRIO**, solicite ao usuário `@master` que altere seu papel no painel de controle.

### E. Redefinição de Senha (Reset)
Caso um usuário esqueça a senha:
1.  Na tela de login, clique em **Esqueceu a senha? Solicitar reset**.
2.  Digite seu usuário (ex: `@danielsmlopes`) e clique em **Verificar Status**.
3.  Se for o primeiro acesso ao reset, clique em **Solicitar Reset ao Master**. A solicitação será encaminhada ao painel do usuário MASTER.
4.  Após a autorização do MASTER, ao acessar a mesma tela de reset, o sistema liberará os campos de nova senha.
5.  Digite a nova senha e confirme. **Atenção**: Ao redefinir a senha, o seu perfil volta temporariamente ao papel **CAMPO** por segurança. O usuário MASTER precisará liberá-lo/promovê-lo novamente para que você volte a ter acesso administrativo de **ESCRITÓRIO**.

---

## 2. Gerenciamento de Permissões & Tarefas (Exclusivo do MASTER)
O usuário MASTER possui ferramentas de controle total e moderação de acesso aos recursos administrativos:

### A. Painel de Tarefas do MASTER (Dashboard)
Ao fazer login como `@master`, o sistema exibe um bloco laranja de **Tarefas Pendentes** no topo do Painel Principal sempre que houver ações administrativas necessárias:
*   **🔑 Resets de Senha**: Indica que há usuários aguardando autorização para trocar de senha.
*   **👥 Novos Usuários**: Indica novos cadastros pendentes de promoção/liberação de acesso administrativo.
*   **📝 Pontos Pendentes**: Indica folhas de ponto enviadas pelo Campo que precisam ser validadas e aprovadas.
O painel contém links diretos para facilitar o acesso rápido às ações.

### B. Controle de Permissões e Resets
1.  Logado com o usuário `@master`, acesse o menu **Controle de Acessos** no menu lateral.
2.  A tabela exibirá todos os usuários cadastrados.
3.  **Nível de Acesso (Papel)**: Altere no dropdown entre *CAMPO (Restrito)* e *ESCRITÓRIO (Administrador)*.
4.  **Reset de Senha (Coluna)**:
    *   Se um usuário solicitou a troca de senha, aparecerá o status amarelo **"Reset Solicitado"** com o botão **Autorizar**. Clique em **Autorizar** para permitir que ele digite uma nova senha.
    *   Se desejar cancelar ou reverter a autorização, clique em **Revogar**.
5.  Para remover o acesso de qualquer usuário do sistema permanentemente, clique no botão **Excluir**.

---

## 3. Visão Geral e Fases da Obra (Dashboard)
O **Painel Principal** apresenta um resumo visual das finanças e do progresso físico dos projetos:
*   **Saldo em Caixa**: Total de receitas líquidas recebidas menos as despesas pagas.
*   **Acompanhamento de Fases de Obra (Piscinas)**: Painel gráfico que exibe o percentual de progresso de cada uma das 5 etapas da piscina:
    1.  *Escavação*
    2.  *Alvenaria/Estrutura*
    3.  *Hidráulica/Tubulação*
    4.  *Revestimento/Azulejo*
    5.  *Acabamento/Entrega*
    *   O gráfico exibe um progresso geral médio com base nessas 5 etapas.

---

## 4. Cadastro de Obras (Apenas Escritório e MASTER)
1.  Acesse o menu **Obras (Projetos)** e clique em **Nova Obra**.
2.  Preencha o **Nome da Obra**, **Cliente** e **Endereço**.
3.  Defina o **Status** (*Ativa*, *Finalizada* ou *Suspensa*). Apenas obras com status *Ativa* aparecem para o lançamento de ponto, diário de obra e viagens.

---

## 5. Cadastro de Funcionários (Apenas Escritório e MASTER)
1.  Acesse o menu **Funcionários** e clique em **Novo Funcionário**.
2.  Defina a **Diária Padrão (R$)** e o **Adicional Motorista (R$)** (extra pago nos dias de viagem dirigindo).
3.  Insira a **Chave PIX** para agilizar transferências de fechamento.

---

## 6. Lançamento e Aprovação de Ponto
Como todos os funcionários são **Diaristas**, o controle de ponto foi simplificado, removendo opções como Falta e Atestado Médico.
*   **Lançamento Manual pelo Campo (ou Escritório)**: No menu **Controle de Ponto**, escolha a obra e a data. O sistema listará a equipe. Você pode selecionar:
    *   **Dia Trabalhado**: Registra presença normal (padrão de 8 horas e diária cheia).
    *   **V - Viagem**: Marca o dia do funcionário como viagem na folha de ponto (registro visual).
    *   **Dia Chuvoso**: Abre um campo perguntando **"Pagar (%)"** para inserir qual percentual da diária padrão será creditado (ex: `50` para meia diária).
    *   **N/A - Não Aplicável**: Indica que o colaborador não foi alocado naquela obra e dia. Não gera horas e nem pagamento.
    *   *Nota*: Pontos lançados por usuários de nível `CAMPO` são salvos como **PENDENTES** e necessitam de aprovação.
*   **Importar Escala do WhatsApp (Escritório/MASTER)**:
    1. No canto superior direito da tela de **Controle de Ponto**, clique em **Importar Escala WhatsApp**.
    2. Cole a mensagem do WhatsApp.
    3. Clique em **Analisar Texto da Mensagem**. Se houver grafias incorretas ou novos funcionários no texto, o importador abrirá a tela de resolução para você corrigir ou criar o cadastro instantaneamente.
    4. O sistema gerará as escalas com os citados marcados como "Presente" e os não citados como **N/A - Não Aplicável**.
    5. Clique em **Confirmar e Lançar [N] dias**.
*   **Aprovação pelo Escritório/MASTER**: Na aba **Aprovações Pendentes**, o administrador visualiza os lançamentos e aprova em lote ou individualmente.

---

## 7. Controle de Vales & Bônus (Escritório e MASTER)
Esta tela permite gerenciar adiantamentos e premiações concedidas aos colaboradores diaristas.
1. Acesse o menu **Controle de Vales & Bônus** e clique em **Lançar Vale / Bônus**.
2. Preencha o funcionário, data e valor.
3. Escolha o **Tipo de Ajuste**:
   *   **Vale / Adiantamento (Débito/Desconto)**: Valor que será descontado no fechamento. A descrição é opcional.
   *   **Bônus / Extra (Crédito/Acréscimo)**: Valor que será creditado. **Para o tipo Bônus, a Descrição/Anotação é obrigatória** (ex: *Bônus produtividade piscina A*).
4. Clique em **Salvar**. Ajustes salvos como "Pendentes" são calculados no fechamento. Ao consolidar, o status pode ser alterado para "Conciliado".

---

## 7. Diário de Obra e Atualização de Progresso
A tela de **Diário de Obra** permite registrar relatos técnicos e atualizar o progresso físico da piscina. Tanto o **Escritório** quanto o **Campo** têm acesso.
1.  Acesse o menu **Diário de Obra** e escolha a **Obra Ativa**.
2.  No painel da esquerda (Lançar Ocorrência):
    *   Defina a data.
    *   **Sliders de Fases**: Arraste os sliders (de 0% a 100%) para atualizar o progresso real de cada fase da piscina (*Escavação*, *Estrutura*, *Hidráulica*, *Revestimento* e *Entrega*).
    *   Escreva o relato do dia (ex: *Escavação concluída, iniciando a montagem da armadura de ferro*).
    *   Clique em **Salvar Nota e Atualizar Fases**.
3.  O histórico de relatos é exibido em ordem cronológica à direita. MASTER e Escritório possuem o botão **Excluir** para moderação das notas.

---

## 9. Módulo de Relatórios (Apenas Escritório e MASTER)
O módulo possui quatro abas de fechamento:
*   **Ponto por Obra**: Grade de presença mensal consolidando pontos aprovados. Dias de viagem aparecem como **V**, chuvosos como **CH** e não aplicáveis como **-**.
*   **Pagamento de Funcionários**: Extrato de fechamento líquido:
    *   Soma de diárias normais + diárias proporcionais de chuva + viagens + **Bônus lançados**.
    *   Desconto de **Vales lançados**.
    *   Ao lado de cada colaborador, há o botão **Holerite**. Ao clicar, abre o demonstrativo de pagamento detalhado.
*   **Lucratividade por Obra**: Faturamento (receitas) contra custos diretos e mão de obra, apontando a margem de lucro (%).
*   **Andamento de Obra**: Exporta a data de início (data de cadastro da obra), todas as anotações do **Diário de Obra** e as barras de progresso físico de instalação da piscina.

### 📄 Como Gerar PDF de Relatórios ou Holerites (WhatsApp):
*   **Relatório Geral**: Clique no botão **Gerar PDF (WhatsApp)** no cabeçalho do relatório, escolha "Salvar como PDF" e compartilhe.
*   **Holerite Individual**: Na aba de Pagamentos, clique no botão **Holerite** do funcionário. No modal que abrir, clique em **Gerar PDF Holerite (WhatsApp)**. O sistema esconde todos os menus administrativos automaticamente, deixando apenas a guia de pagamento limpa com campos de assinatura, pronta para salvar como PDF e enviar no WhatsApp do colaborador.

---

## 9. Como Alterar o Logotipo do Sistema
1.  Salve a imagem do seu logotipo em formato PNG com o nome **`logo.png`**.
2.  Copie o arquivo para dentro da pasta **`public`** na raiz do projeto (`JHOSTON TEC/public/logo.png`).
3.  O menu lateral detectará o arquivo e exibirá a sua imagem automaticamente.
