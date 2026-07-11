# Manual de Implantação — JHOSTON TEC Piscinas (Versão 1.1)

Este manual descreve as etapas técnicas necessárias para instalar, configurar e colocar em execução a aplicação da **JHOSTON TEC Piscinas** localmente ou em servidor de produção.

---

## 1. Requisitos do Sistema
Para executar a aplicação, certifique-se de que o ambiente possui instalado:
1.  **Node.js**: Versão 18.x ou superior (Recomendado v20+).
2.  **NPM**: Versão 9.x ou superior.
3.  **Git** (Para controle de versão).

---

## 2. Estrutura de Arquivos e Componentes
*   `package.json`: Definição de scripts e dependências do projeto (Next.js, Prisma, React, pizzip, docxtemplater).
*   `prisma/schema.prisma`: Definição estrutural do banco de dados contendo os novos modelos `Oportunidade` (CRM) e `Boleto` (Financeiro).
*   `src/templates/`: Pasta contendo os arquivos de modelo Word.
*   `src/app/api/propostas/[id]/route.ts`: API Route Handler para download de propostas.
*   `src/app/api/watch/adm/route.ts`: API do relógio que retorna dados administrativos em JSON.
*   `src/app/(dashboard)/financeiro/boletos/`: Nova tela para gerenciamento e digitalização de boletos (voz, foto OCR, texto).
*   `src/app/(dashboard)/ajuda/`: Interface interna do manual do usuário atualizada com guias de Smartwatches e Boletos.

---

## 3. Instruções de Instalação e Execução

### Passo 1: Clonar ou Extrair o Projeto
Navegue até a pasta do projeto:
```bash
cd "JHOSTON TEC"
```

### Passo 2: Instalar Dependências
Instale as dependências declaradas no projeto:
```bash
npm install
```
*Nota: As bibliotecas `docxtemplater` e `pizzip` foram adicionadas para dar suporte à geração dinâmica de propostas comerciais em formato Word (.docx).*

### Passo 3: Configurar Banco de Dados, Variáveis de Ambiente e Migrações
1.  Verifique a string de conexão no arquivo `.env` na raiz do projeto:
    *   Para desenvolvimento local, pode ser utilizado o SQLite (`file:./dev.db`).
    *   Para produção, utilize a string de conexão PostgreSQL fornecida.
2.  **Variáveis do Smartwatch (Opcional)**:
    Adicione a seguinte variável no seu `.env` para segurança do Smartwatch:
    ```env
    WATCH_API_TOKEN="JhostonTecWatchKey2026"
    ```
3.  Para sincronizar a estrutura das novas tabelas do banco de dados (como as tabelas `Oportunidade` e `Boleto` da v1.1), execute:
    ```bash
    npx prisma db push
    ```
    *Atenção: Se estiver operando em ambiente de produção com um Transaction Pooler do Supabase (porta 6543), certifique-se de configurar temporariamente a variável DATABASE_URL apontando para a porta direta 5432 ao rodar comandos de alteração estrutural (db push), evitando que a migração trave por falta de trava de sessão.*
4.  Gere as tipagens do cliente Prisma atualizadas:
    ```bash
    npx prisma generate
    ```

### Passo 4: Executar a Aplicação em Modo de Desenvolvimento (Local)
Inicie o servidor local:
```bash
npm run dev
```
A aplicação estará disponível no endereço: **`http://localhost:3000`**

---

## 4. Geração do Pacote de Produção
Para rodar a aplicação em um ambiente de produção (hospedagem ou servidor dedicado):

1.  Compilar o projeto Next.js:
    ```bash
    npm run build
    ```
2.  Iniciar o servidor otimizado de produção:
    ```bash
    npm run start
    ```

---

## 5. Troubleshooting (Resolução de Problemas Comuns)

### Erro: `Could not load Prisma Client`
Ocorre quando o cliente local do banco de dados está dessincronizado.
*   **Solução**: Execute `npx prisma generate` e reinicie a aplicação.

### Resetar Banco de Dados
Caso precise limpar dados de teste do banco de dados e recriar as tabelas do zero:
*   **Aviso**: Este comando apagará todos os dados cadastrados no banco!
*   **Solução**: Execute `npx prisma migrate reset` ou reinstale a estrutura executando `npx prisma db push --force-reset`.
