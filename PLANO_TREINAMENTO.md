# Plano de Treinamento — Sistema de Gestão JHOSTON TEC

Este documento apresenta o cronograma de treinamento e roteiros de simulação prática para capacitar o usuário MASTER, a equipe do escritório (Administrativo) e a equipe externa de campo nas novas funcionalidades de controle de acesso, diário de obra e acompanhamento de fases.

---

## 1. Cronograma de Capacitação Proposto

O treinamento será dividido em 3 sessões de 1 hora, focando na prática guiada:

| Sessão | Tópico Principal | Conteúdo Programático |
| :--- | :--- | :--- |
| **Sessão 1** | Acesso MASTER e Permissões | - Logar como `@master` | senha `@MASTER123`<br>- Fluxo de Auto-cadastro (`/signup`) com padrão de login `@usuario`<br>- Painel de Gerenciamento de Usuários (`/usuarios`) para liberação de acesso |
| **Sessão 2** | Operações de Campo e Fases da Obra | - Lançamento de Ponto pelo Campo (Status *Pendente*)<br>- Lançamento de relatos no Diário de Obra **e anexo de fotos com compressão local**<br>- Acompanhamento e atualização das 5 fases físicas da piscina (Sliders: 0% a 100%) |
| **Sessão 3** | Administrativo e Relatórios | - Validação/Aprovação de pontos em lote pelo escritório<br>- Fechamento da Folha de Pagamentos e Análise de Lucratividade<br>- **Cadastro de Fornecedores e integração com lançamentos do Financeiro**<br>- Relatório de Andamento com galeria de fotos e progresso gráfico impresso para o cliente |

---

## 2. Roteiro Prático de Simulação (Exercício Guiado)

Realize os seguintes passos simulados para testar o fluxo de ponta a ponta:

### Exercício 1: Auto-cadastro e Validação de Login (Colaborador)
1.  Abra o navegador em `http://localhost:3000/signup` (ou clique em **Cadastre-se** na tela de login).
2.  Preencha os campos:
    *   **Nome**: `Daniel Lopes`
    *   **Usuário**: `danielsmlopes` (sem o prefixo `@`).
    *   **Senha**: `senha123`
3.  Clique em **Solicitar Acesso**. Note o alerta informando que o usuário foi registrado e que o login padrão `@danielsmlopes` foi gerado automaticamente.
4.  Após ser redirecionado para a tela de login, insira `danielsmlopes` (ou `@danielsmlopes`) e a senha `senha123`.
5.  Acesse o sistema e verifique que você só tem acesso às abas de **Controle de Ponto** e **Diário de Obra** (seu nível padrão é restrito como **CAMPO**).
6.  Clique em **Sair (Logout)** no rodapé.

### Exercício 2: Liberação de Acesso (MASTER)
1.  Logue com a conta MASTER: usuário `master` (ou `@master`) e senha `@MASTER123`.
2.  Acesse o menu **Gerenciar Usuários** (exclusivo do MASTER).
3.  Localize o usuário `@danielsmlopes` na tabela.
4.  No dropdown, altere a permissão de **CAMPO (Restrito)** para **ESCRITÓRIO (Administrador)**.
5.  Clique em **Sair (Logout)** no rodapé.
6.  Logue novamente com a conta de `@danielsmlopes`. Observe que agora você tem acesso administrativo completo a todas as funções e relatórios do escritório!

### Exercício 3: Lançamento de Diário com Fases e Fotos da Obra
1.  Acesse o menu **Diário de Obra**.
2.  Selecione a obra de teste ativa (ex: "*Piscina Condomínio Alphaville*").
3.  No painel esquerdo:
    *   Mova o slider **1. Escavação** para `100%`.
    *   Mova o slider **2. Alvenaria/Estrutura** para `30%`.
    *   No relato do dia, escreva: "*Escavação de terra totalmente finalizada hoje à tarde. Iniciada a montagem dos blocos da estrutura da piscina.*"
    *   **Anexo de Fotos**: Clique no campo de upload de imagem e escolha 1 ou 2 imagens de teste (ou tire fotos com o celular se estiver testando pelo dispositivo). Observe a miniatura da foto aparecer com o botão de excluir.
    *   Clique em **Salvar Nota e Atualizar Fases**.
4.  No histórico do Diário de Obra (lado direito), verifique que a nota foi adicionada exibindo o texto do relato e as fotos em miniatura:
    *   Clique em uma das miniaturas e confirme a abertura do modal ampliado (Lightbox). Clique no `X` ou fora da imagem para fechar.
5.  Acesse o menu **Painel Principal** (Dashboard) e observe o progresso atualizado.
6.  Acesse o menu **Relatórios**, vá na aba **Andamento de Obra**, selecione o projeto e clique em **Filtrar**. Verifique que os relatos são impressos contendo a galeria das fotos registradas cronologicamente, pronto para ser enviado ao cliente.

### Exercício 4: Ponto de Diarista Simplificado (Dia Chuvoso, Viagem e N/A)
1.  Logado com o perfil `@admin` (ou `@master`), acesse o menu **Controle de Ponto**.
2.  Selecione a obra de teste e a data de *hoje*.
3.  Observe que as opções de Ponto agora refletem a realidade dos Diaristas (removidos falta e atestado):
    *   **Funcionário A**: Mude o status para **V - Viagem**.
    *   **Funcionário B**: Mude o status para **Dia Chuvoso**. No campo percentual que aparecer, digite `50` (pagamento proporcional).
    *   **Funcionário C**: Mude o status para **N/A - Não Aplicável** (isso zerará suas horas e pagamento para esse dia nessa obra).
4.  Clique em **Salvar e Aprovar Ponto**.

### Exercício 5: Controle de Vales & Bônus (Descrição Obrigatória)
1.  Acesse o menu **Controle de Vales & Bônus**.
2.  Clique em **Lançar Vale / Bônus** e tente cadastrar um **Bônus** para o *Funcionário B* sem preencher a descrição:
    *   O sistema exibirá um aviso alertando que a descrição é obrigatória para bônus.
3.  Preencha a descrição: "*Bônus extra por produtividade na laje*" e salve com o valor de `100.00`.
4.  Lance também um **Vale** de `50.00` para o *Funcionário B* (neste caso, a descrição é opcional, mas você pode escrever "*Adiantamento lanche*").

### Exercício 6: Importação em Lote e Emissão de Holerite (PDF WhatsApp)
1.  Acesse **Controle de Ponto** e clique em **Importar Escala WhatsApp**.
2.  Copie e cole a mensagem abaixo:
    ```text
    Obra Quase Tudo
    06/07
    José Roberto
    Iann Gabriel
    
    07/07
    José Roberto
    Wender
    ```
3.  Clique em **Analisar Texto da Mensagem** e depois em **Confirmar e Lançar 2 dias**. Nomes não citados serão marcados como **N/A** automaticamente.
4.  Acesse o menu **Relatórios** e vá na aba **Pagamento de Funcionários**:
    *   Gere a folha de pagamento do período.
    *   Localize o funcionário na tabela. Veja que o bônus de R$ 100 e o vale de R$ 50 estão calculados no valor líquido a pagar.
5.  Clique no botão **Holerite** ao lado do nome do funcionário:
    *   O demonstrativo se abrirá detalhando as diárias de ponto, diárias de viagem, o bônus com a anotação obrigatória e o vale com o desconto.
6.  Clique em **Gerar PDF Holerite (WhatsApp)**, salve em PDF e envie via WhatsApp. O PDF omitirá todas as barras laterais e cabeçalhos administrativos do sistema.

### Exercício 7: Redefinição de Senha (Fluxo Completo)
1.  **Solicitação do Usuário**:
    *   Na tela de login, clique em **Esqueceu a senha? Solicitar reset**.
    *   Digite um usuário de teste (ex: `@admin` ou `@campo`) e clique em **Verificar Status**.
    *   Clique em **Solicitar Reset ao Master**.
2.  **Autorização pelo MASTER**:
    *   Faça login como `@master` | Senha: `@MASTER123`.
    *   No Painel Principal (Dashboard), note que o widget laranja **"Tarefas Pendentes do MASTER"** agora mostra a notificação: *"🔑 Há 1 solicitação(ões) de reset de senha aguardando sua autorização"*.
    *   Clique no botão **Autorizar Resets** para abrir a tela de gerenciamento de acessos.
    *   Na coluna **Reset de Senha** do usuário de teste, clique em **Autorizar**.
    *   Deslogue do sistema.
3.  **Definição da Nova Senha**:
    *   Retorne à tela de login e clique em **Esqueceu a senha? Solicitar reset**.
    *   Digite o usuário de teste e clique em **Verificar Status**.
    *   O sistema exibirá a mensagem de sucesso informando que o reset foi autorizado.
    *   Digite a nova senha e confirme. Salve o registro.
4.  Nova Liberação do Acesso:
    *   Observe que agora o usuário de teste teve seu papel redefinido temporariamente como **CAMPO** por segurança.
    *   Para restaurar o acesso administrativo de Escritório, faça login novamente como `@master` e, na tela de Controle de Acesso, altere o seletor do usuário de teste de volta para **ESCRITÓRIO**.

### Exercício 8: Cadastro de Fornecedores e Integração Financeira
1.  Logado com o perfil `@admin` (ou `@master`), acesse o menu **Cad. Fornecedores**.
2.  Clique em **Novo Fornecedor** e cadastre um parceiro:
    *   **Nome**: `Distribuidora de Canos TuboMax`
    *   **Chave PIX**: `contato@tubomax.com`
    *   **Pessoa de Contato**: `Marcos Vendedor`
    *   Clique em **Cadastrar Fornecedor**.
3.  Acesse o menu **Contas a Pagar/Rec** (`/financeiro`) para simular uma compra:
    *   Clique em **Nova Despesa (Fornecedor)**.
    *   Selecione a categoria **Fornecedores**.
    *   No seletor **Fornecedor Cadastrado**, escolha `Distribuidora de Canos TuboMax`.
    *   Preencha os dados da compra (Ex: Valor `450.00`, Vencimento `Hoje`, Descrição `Tubos PVC de 50mm`).
    *   Clique em **Salvar**.
4.  Retorne ao menu **Cad. Fornecedores** e localize a linha da `TuboMax` na tabela:
    *   Veja que o valor de R$ 450.00 já aparece na coluna de **Pendente** deste fornecedor.
    *   Clique na linha da `TuboMax` para abrir o modal de detalhes do fornecedor.
    *   Verifique os dados cadastrais rápidos (como a chave PIX para envio do pagamento) e confirme que a despesa de R$ 450.00 de tubos PVC consta no **Histórico de Transações** deste fornecedor.
5.  **Simular Cadastro Rápido (Sem Sair do Lançamento)**:
    *   Volte a **Contas a Pagar/Rec** e clique em **Nova Despesa (Fornecedor)**.
    *   No campo de fornecedor cadastrado, clique no botão **`+`** ao lado do dropdown.
    *   No formulário rápido que abrir, digite o nome `Cimento Forte S/A` e clique em **Cadastrar**.
    *   Verifique que o modal rápido se fecha e a opção `Cimento Forte S/A` já aparece selecionada automaticamente no seletor, pronta para o lançamento!
