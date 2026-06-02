# 🚗 Aivacol - Gestão de Frota

Este repositório contém o módulo de **Gestão de Frota** da plataforma Aivacol (com Frontend Angular e Backend NestJS). Toda a aplicação e sua infraestrutura estão prontas para rodar de forma integrada através do Docker.

---

## 🚀 Como Executar o Projeto (Docker)

Toda a infraestrutura do projeto (SQL Server, Redis, MongoDB, RabbitMQ, API Backend e App Frontend) é inicializada com apenas um comando.

### Pré-requisitos
* Ter o **Docker** e o **Docker Compose** instalados.

### Passo a Passo:

1. **Configurar as Variáveis de Ambiente**:
   Copie ou renomeie o arquivo `.env.example` para `.env` na raiz do projeto:
   ```bash
   cp .env.example .env
   ```

2. **Subir os Containers**:
   Na raiz do repositório, execute o comando de build e inicialização em background:
   ```bash
   docker compose up --build -d
   ```

3. **Acessar a Aplicação**:
   * **App Frontend:** [http://localhost:4200](http://localhost:4200) (Usuário padrão: `aivacol` / Senha: `aivacol`)
   * **API Backend:** [http://localhost:3000](http://localhost:3000)
   * **RabbitMQ Dashboard:** [http://localhost:15672](http://localhost:15672) (Usuário: `guest` / Senha: `guest`)

---

## 🧪 Suíte de Testes Automatizados

O projeto foi desenvolvido seguindo boas práticas de cobertura de testes no frontend e no backend.

### O que está sendo testado?
* **Backend (`backend`)**:
  * **Autenticação**: Fluxo de login, validações e guarda de rotas JWT.
  * **Frota (CRUD)**: Validação e persistência isolada por `tenant_id` para Veículos, Marcas e Modelos.
  * **Configurações**: Ativação dinâmica de Cache, TTL customizado por inquilino e invalidação do Redis.
  * **Auditoria**: Emissão assíncrona de eventos via RabbitMQ e consumo para gravação no MongoDB.
* **Frontend (`frontend`)**:
  * **Acesso**: Fluxo de Login, interceptação do token JWT e proteção de rotas (`AuthGuard`).
  * **Frota & Formulários**: Listagem, busca reativa, e formulário principal com validações Zod.
  * **Modal Inline**: Criação, edição e exclusão de marcas/modelos no modal integrado com atualização automática dos campos.
  * **Painel de Configuração**: Modificação de cache e listagem/paginação dos logs de auditoria carregados do MongoDB.

---

## 💻 Como Rodar os Testes

### 1. Testes Unitários (Isolados / Mockados)
Esses testes rodam em memória de forma isolada, sem depender dos serviços externos (Docker) estarem ativos.

* **Rodar testes do Backend (NestJS / Jest)**:
  ```bash
  cd backend
  pnpm install
  pnpm run test
  ```

* **Rodar testes do Frontend (Angular / Vitest)**:
  ```bash
  cd frontend
  pnpm install
  pnpm run test
  ```

### 2. Testes de Integração e Ponta a Ponta (E2E)
*Estes testes necessitam que os serviços do Docker estejam online para validar a comunicação real com os bancos de dados.*

* **Rodar testes E2E do Backend**:
  ```bash
  cd backend
  pnpm run test:e2e
  ```
