# Plano de Treinamento — Sistema de Gestão JHOSTON TEC (Versão 1.2)

Este documento apresenta o cronograma de treinamento e roteiros de simulação prática para capacitar a equipe do escritório (Administrativo) e a equipe externa de campo nas funcionalidades de gestão comercial, controle de ponto diarista, diários de obra, fechamentos, boletos inteligentes, calculadora de obra, chat e relógios.

---

## 1. Cronograma de Capacitação Proposto

O treinamento será dividido em 3 sessões práticas focadas na rotina de uso:

| Sessão | Tópico Principal | Conteúdo Programático |
| :--- | :--- | :--- |
| **Sessão 1** | Comercial & CRM | - Fluxo de Auto-cadastro (`/signup`) e controle de acesso Escritório vs Campo<br>- Cadastro de Oportunidades comerciais e cálculo automático de propostas<br>- Geração de Propostas em Word (.docx) automatizadas sob demanda<br>- Conversão de oportunidades em Obras Ativas |
| **Sessão 2** | Operações de Campo | - Apontamento de Ponto Diarista pelo Campo (Presente, Chuvoso, Viagem, N/A)<br>- Lançamento de notas no Diário de Obra e atualização gráfica de fases (Sliders)<br>- Upload e compressão automática de fotos no navegador |
| **Sessão 3** | Administrativo & Relatórios | - Validação e aprovação de pontos em lote<br>- Lançamento de Vales (Débito) e Bônus com descrição obrigatória (Crédito)<br>- Cadastro de Fornecedores integrado aos lançamentos do financeiro<br>- Emissão de Holerites e Relatórios de evolução física em PDF para o cliente |
| **Sessão 4** | Boletos & Relógios Inteligentes (v1.1) | - Leitura e cadastro de boletos por prompt, voz e foto (OCR)<br>- Consulta ao widget de vencimentos críticos (Hoje, 1, 3 e 5 dias) no painel<br>- Configuração de atalhos e widgets no Apple/Galaxy Watch via API |
| **Sessão 5** | Calculadora & Chat de Equipe (v1.2) | - Execução de cálculos de volumes, revestimentos e concretagem<br>- Uso do conversor de unidades de obras<br>- Comunicação direta por DMs e canais de Obras Ativas com alertas sonoros |

---

## 2. Roteiro Prático de Simulação (Exercício Guiado)

Realize os seguintes passos simulados para testar o fluxo de ponta a ponta:

### Exercício 1: Auto-cadastro e Permissão de Usuário
1.  Abra o navegador em `http://localhost:3000/signup`.
2.  Preencha o formulário para criar um novo usuário (ex: Nome: `Daniel Lopes`, Usuário: `danielsmlopes`, Senha: `senha123`). Note que o sistema gerará o login padrão `@danielsmlopes`.
3.  Após ser redirecionado para a tela de login, entre com a conta criada.
4.  Observe que, por padrão, o nível inicial de acesso é restrito como **CAMPO** (apenas Controle de Ponto e Diário de Obra aparecem no menu).
5.  Efetue logout. Entre com um usuário administrativo de **ESCRITÓRIO** e realize a alteração de perfil de `@danielsmlopes` de *Campo* para *Escritório* no menu de gerenciamento.
6.  Acesse novamente o login com a conta `@danielsmlopes` e confirme que agora você possui acesso total de Escritório!

### Exercício 2: Gestão Comercial no CRM e Propostas
1.  Com acesso administrativo, clique no menu **CRM / Oportunidades**.
2.  Clique em **Nova Oportunidade** e preencha:
    *   **Cliente:** `Vivant Eco Beach`
    *   **Endereço:** `Fazenda Mona Lisa – Praia de Taipú`
    *   **Área da Piscina (m²):** `150`
    *   **Produto:** `Premium (Resina PU)`
    *   **Status:** `Pendente`
3.  Observe o valor da proposta comercial calculado na caixa de pré-visualização ao vivo: **R$ 44.250,00** (150 m² &times; R$ 295,00/m²). Salve a oportunidade.
4.  Na linha do cliente na tabela, clique em **Proposta**.
5.  O sistema gerará um arquivo Word (.docx). Abra o arquivo e verifique que os dados de cliente, endereço, área, preços, data local por extenso e valor total comercial foram preenchidos corretamente, preservando a formatação original do contrato.

### Exercício 3: Conversão de Oportunidade em Obra Ativa
1.  Na tela de **CRM / Oportunidades**, localize a oportunidade de `Vivant Eco Beach` criada no exercício anterior.
2.  Clique em **Aceitar Obra**.
3.  Na janela de confirmação, defina o nome oficial do projeto (ex: `Obra Vivant Eco Beach - Piscina PU`) e clique em **Confirmar e Iniciar Obra**.
4.  Verifique que o status comercial mudou para **Aceito (Ativo)**.
5.  Clique no menu **Obras (Projetos)** e certifique-se de que a obra `Obra Vivant Eco Beach - Piscina PU` consta como **ATIVA** e com o endereço correto na listagem de execução de campo.

### Exercício 4: Lançamento de Diário de Obra e Fotos
1.  Acesse o menu **Diário de Obra**.
2.  Selecione o projeto recém-criado.
3.  Mova o controle de **1. Escavação** para `50%`.
4.  No relato, escreva: "*Iniciada escavação do terreno. Terraplanagem concluída.*"
5.  Selecione uma imagem de teste e clique em **Salvar Nota**.
6.  Na galeria cronológica ao lado direito, clique na foto adicionada e verifique se a ampliação (Lightbox) funciona.
7.  Acesse **Relatórios -> Andamento de Obra**, filtre o projeto e veja a nota técnica e a foto organizadas para envio ao cliente.

### Exercício 5: Ponto Diarista, Vales e Holerite
1.  Acesse o menu **Controle de Ponto**.
2.  Selecione a obra de teste e a data atual. Registre a escala da equipe marcando presenças, dias de viagem e dias chuvosos (com preenchimento de percentual proporcional, ex: 50%).
3.  Acesse **Controle de Vales** e simule lançamentos:
    *   Lance um **Vale** de R$ 50,00 (adiantamento).
    *   Lance um **Bônus** de R$ 100,00 (é obrigatório justificar no campo de anotação).
4.  Acesse **Relatórios -> Pagamento de Funcionários** e confira o fechamento consolidado.
5.  Clique em **Holerite**, verifique a folha detalhada e clique em **Gerar PDF Holerite (WhatsApp)** para salvar a imagem limpa e assinada para compartilhamento em formato PDF.

### Exercício 6: Cadastro de Boletos por Comando de Voz, Prompt ou OCR de Imagem
1.  Acesse o menu **Financeiro** e clique em **Gerenciar Boletos**.
2.  **Teste de Voz**: Clique no botão **Falar Comando de Voz**. Diga: *"Cadastrar boleto do cedente Coelba sacado Jhoston valor duzentos e cinquenta reais vencimento trinta de julho de dois mil e vinte e seis"*. Observe se o texto é transcrito e os campos correspondentes são devidamente extraídos.
3.  **Teste de Imagem**: Clique em **Ler de uma Foto (OCR)**, faça o upload de uma imagem simulada de um boleto de teste. Verifique se o código de barras, o valor e a data de vencimento são lidos localmente na tela.
4.  Com os campos preenchidos, preencha o código de barras caso não tenha sido lido, revise os dados e clique em **Salvar Boleto**.
5.  Valide que o boleto cadastrado aparece na listagem do lado direito. Clique no ícone de copiar e certifique-se de que a linha digitável foi salva na sua área de transferência.

### Exercício 7: Integração com Apple Watch (Atalhos/Shortcuts)
1.  Acesse a aba **Boletos & Smartwatches** na tela de **Ajuda** do sistema.
2.  Copie a URL do endpoint de relógio informada (ex: `http://localhost:3000/api/watch/adm?token=JhostonTecWatchKey2026`).
3.  No seu iPhone, abra o app **Atalhos (Shortcuts)**, crie um atalho com a ação "Obter conteúdo da URL" colando o endereço.
4.  Extraia e exiba campos como `saldoCaixa` e `tarefasPendentes.total`.
5.  Execute o atalho e verifique a exibição correta no relógio.

### Exercício 8: Uso da Calculadora de Obra e Conversões
1.  Na barra lateral ou no cabeçalho do Painel Principal, clique em **Calculadora de Obra**.
2.  Na aba **Volume de Piscina**, digite: Comprimento `10`, Largura `5`, Profundidade Média `1.5`. Verifique se o sistema calcula corretamente o volume de **75m³ (75.000 Litros)**.
3.  Mude a aba para **Área de Revestimento** e digite as mesmas dimensões com margem de **10%**. Verifique se a área líquida é de **95.00m²** e a área com margem é de **104.50m²**.
4.  Na aba **Dosagem de Concreto**, insira o volume de `5m³`. Verifique se a dosagem indica **35 sacos de cimento**, **3m³ de areia** e **4m³ de brita**.
5.  Na aba **Conversor de Medidas**, insira `5` em metros cúbicos. Confirme que o campo correspondente em Litros atualiza automaticamente para `5000`.

### Exercício 9: Teste de Comunicação Interna (Chat)
1.  Clique em **Chat Interno** no cabeçalho ou menu lateral.
2.  Verifique se os canais de grupo correspondentes às suas obras ativas aparecem listados na barra esquerda (ex: `# Obra Vivant Eco Beach`), bem como a lista de outros usuários abaixo.
3.  Abra uma janela de navegador privada (ou em outro dispositivo), faça o login com outro usuário e acesse a tela do Chat.
4.  No primeiro navegador, clique no nome do outro usuário para abrir uma conversa privada (DM) e envie uma mensagem (ex: *"Olá, precisamos verificar o cimento de amanhã"*).
5.  Verifique se o outro navegador recebe a mensagem automaticamente em até 3 segundos e emite um alerta sonoro discreto (beep), e se a mensagem enviada por ele aparece na sua tela com o mesmo comportamento.
