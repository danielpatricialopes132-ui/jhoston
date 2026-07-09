# Manual de Implantação — JHOSTON TEC Piscinas

Este manual descreve as etapas técnicas necessárias para instalar, configurar e colocar em execução a aplicação financeira da **JHOSTON TEC Piscinas** localmente ou em servidor de homologação/produção.

---

## 1. Requisitos do Sistema
Para executar a aplicação, certifique-se de que a máquina possui instalado:
1.  **Node.js**: Versão 18.x ou superior (Recomendado v20+ ou v24+).
2.  **NPM**: Versão 9.x ou superior (Incluso com o Node.js).
3.  **Git** (Opcional, para versionamento do código).

---

## 2. Estrutura de Arquivos Principais do Projeto
*   `package.json`: Definição de scripts de execução e dependências do projeto (Next.js, Prisma, SQLite, React).
*   `prisma.config.ts`: Configurações de inicialização do Prisma 7 ORM.
*   `prisma/schema.prisma`: Definição estrutural das tabelas do banco de dados (SQLite), incluindo novos modelos `Usuario` e `DiarioObra` com campos de progresso físico de piscinas (`progressoEscavacao`, `progressoEstrutura`, etc.).
*   `src/lib/db.ts`: Gerenciador da conexão singleton do banco utilizando o driver do SQLite.
*   `src/middleware.ts`: Validador de rotas para restringir caminhos específicos às permissões `MASTER`, `ESCRITORIO` e `CAMPO`.
*   `src/app/(dashboard)`: Grupo de rotas protegidas que compartilham do menu lateral de navegação (Sidebar).
*   `src/app/login`: Tela pública de login.
*   `src/app/signup`: Tela pública de registro (auto-cadastro) de novos usuários.
*   `.env`: Arquivo de variáveis de ambiente.

---

## 3. Instruções de Instalação e Execução (Passo a Passo)

### Passo 1: Clonar ou Extrair o Projeto
Caso o projeto esteja em um repositório git:
```bash
git clone <url-do-repositorio>
cd "JHOSTON TEC"
```

### Passo 2: Instalar Dependências
Instale as dependências declaradas no projeto:
```bash
npm install
```

### Passo 3: Configurar Banco de Dados SQLite e Migrações
1.  Verifique se o arquivo `.env` na raiz do projeto contém a variável:
    ```env
    DATABASE_URL="file:./dev.db"
    ```
2.  Execute as migrações para criar e sincronizar o banco de dados (`dev.db`):
    ```bash
    npx prisma migrate dev --name add_vale_tipo_for_bonus
    ```
3.  Gere as tipagens atualizadas do cliente do banco de dados:
    ```bash
    npx prisma generate
    ```
    *Nota: No primeiro acesso à tela de login, o sistema executará automaticamente o auto-seeding das credenciais mestras:*
    *   **Usuário MASTER**: `@master` | **Senha**: `@MASTER123`
    *   **Usuário Escritório**: `@admin` | **Senha**: `admin123`
    *   **Usuário Campo**: `@campo` | **Senha**: `campo123`
    *   *Todos os novos usuários que usarem a tela de cadastro `/signup` entrarão por padrão com o papel `CAMPO`, necessitando de promoção pelo usuário `@master` para obter acesso administrativo.*

### Passo 4: Executar a Aplicação em Modo de Desenvolvimento (Local)
Inicie o servidor local do Next.js:
```bash
npm run dev
```
A aplicação estará disponível para acesso no navegador pelo endereço:
**`http://localhost:3000`**

### Passo 5: Personalizar o Logotipo
Para exibir o logotipo da sua empresa no menu lateral do sistema:
1.  Salve a imagem do seu logotipo em formato PNG com o nome **`logo.png`**.
2.  Cole o arquivo dentro do diretório **`public`** na raiz do projeto (caminho: `JHOSTON TEC/public/logo.png`).
3.  O sistema substituirá automaticamente a logo de texto padrão pela imagem enviada.

---

## 4. Geração do Pacote de Produção
Para rodar a aplicação em um ambiente de produção (mais veloz e otimizado):

1.  Compile o projeto Next.js:
    ```bash
    npm run build
    ```
2.  Inicie o servidor de produção compilado:
    ```bash
    npm run start
    ```
    *(Opcional: Você pode rodar a aplicação em segundo plano em servidores usando gerenciadores de processos como o `pm2`: `pm2 start "npm run start" --name "jhoston-tec"`)*.

---

## 5. Troubleshooting (Resolução de Problemas Comuns)

### Erro: `Could not load Prisma Client`
Isso ocorre se o cliente do banco de dados não foi gerado após a instalação de pacotes ou alterações no banco.
*   **Solução**: Execute `npx prisma generate` e reinicie o servidor.

### Resetar o Banco de Dados e Usuários
Caso precise apagar todos os dados de testes e reiniciar o banco do zero:
*   **Aviso**: Este comando deleta todos os registros cadastrados!
*   **Solução**: Execute `npx prisma migrate reset` e confirme a operação. No primeiro login, os usuários `@master`, `@admin` e `@campo` serão recriados.
