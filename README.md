# 🚗 Aivacol - Plataforma de Gestão de Frota (Backend)

Este repositório contém a implementação do módulo de **Gestão do Ciclo de Vida de Veículos** para a plataforma Aivacol, uma solução inteligente de gestão para locadoras. A solução foi desenhada para ser altamente segura, eficiente e escalável.

A avaliação técnica segue a modalidade **🟦 BACKEND** e foi construída seguindo rigorosamente a metodologia **TDD (Test-Driven Development)** e regras de desenvolvimento limpo.

---

## 🛠️ Tecnologias Utilizadas

* **Runtime:** Node.js (v18+)
* **Framework:** NestJS (v11)
* **Linguagem:** TypeScript
* **ORM:** TypeORM
* **Banco de Relacional:** Microsoft SQL Server (via Docker)
* **Banco de Caching:** Redis 7 (via Docker)
* **Segurança:** Passport & JWT (JSON Web Tokens)
* **Testes:** Jest & Supertest
* **Gerenciador de Pacotes:** pnpm (v10)

---

## 📐 Decisões de Arquitetura & Boas Práticas

### 1. Arquitetura Modular
A estrutura de pastas segue os padrões modulares recomendados pelo NestJS, dividindo a lógica em módulos independentes (`Auth`, `Users`, `Brands`, `Models` e `Vehicles`). Cada módulo possui responsabilidades separadas por camadas:
* **Entities:** Definição dos esquemas de banco de dados e relacionamentos relacionais.
* **DTOs:** Objetos de transferência de dados com validações robustas em tempo de execução via `class-validator`.
* **Services:** Concentração das regras de negócio e persistência no banco de dados.
* **Controllers:** Exposição de endpoints REST, manipulação de payloads e injeção de segurança.

### 2. Multi-tenant Isolation (Segurança Crítica)
Em conformidade com as regras de isolamento lógico:
* **Tenant Id:** O identificador de tenant (`tenantId`) nunca é hardcoded. Ele é incorporado dinamicamente dentro do payload do token JWT no momento do login.
* **Filtro Estrito:** Todas as consultas no banco de dados (`brands`, `models`, `vehicles`) utilizam cláusulas `WHERE tenant_id = :tenantId` para impedir vazamento de dados entre empresas.
* **Guarda de Sessão:** Criamos o decorador customizado `@CurrentTenant()` para interceptar de forma limpa e extrair com segurança o tenant do usuário logado diretamente da requisição.

### 3. Caching & Invalidação com Redis
Para otimizar o tempo de resposta e poupar o banco SQL Server:
* A listagem geral de veículos e a busca detalhada de veículos são cacheadas no **Redis**.
* **Invalidação Reativa:** Sempre que houver uma alteração (criação, atualização ou exclusão de veículo), as chaves correspondentes ao tenant no cache são invalidadas no ato, garantindo que o cliente final nunca veja dados obsoletos.

### 4. Seed de Mock Obrigatório
Ao inicializar a aplicação, caso a tabela de veículos esteja vazia, o sistema lê automaticamente o arquivo `seed_vehicles.json` e realiza o carregamento inicial de marcas, modelos e veículos de teste sob o tenant `"aivacol"`.

---

## 🚀 Como Executar o Projeto via Docker

O ambiente completo do projeto (Banco SQL Server, Caching Redis e o próprio Servidor Backend compilado) pode ser inicializado com um único comando.

### Pré-requisitos
* Ter o **Docker** e o **Docker Compose** instalados na máquina.

### Executando:
1. Copie o arquivo `.env.example` para `.env` na raiz do projeto:
   ```bash
   cp .env.example .env
   ```
2. Na raiz do repositório, execute o comando para baixar as imagens e construir o ambiente:
   ```bash
   docker compose up --build -d
   ```
3. Após o término da compilação e inicialização dos contêineres, o backend estará ativo e respondendo na porta **`3000`**.

---

## 🧪 Como Executar os Testes (TDD)

Toda a lógica foi desenvolvida escrevendo-se testes antes da implementação. A suíte conta com testes unitários abrangentes e testes de integração de ponta a ponta (E2E).

### 1. Testes Unitários
Para rodar os testes unitários (mockados e seguros para rodar isoladamente sem o Docker ativo):
```bash
cd backend
pnpm run test
```

### 2. Testes de Integração (E2E)
Para rodar os testes de ponta a ponta (requer que o Docker com os contêineres esteja ativo para testar as transações de verdade):
```bash
cd backend
pnpm run test:e2e
```

---

## 📬 Endpoints da API

Todas as rotas operacionais exigem o cabeçalho HTTP `Authorization: Bearer <SEU_TOKEN_JWT>`.

| Método | Rota | Descrição | Requer Token? |
| :--- | :--- | :--- | :--- |
| **POST** | `/auth/login` | Login com credentials padrão (`aivacol` / `aivacol`). Retorna JWT. | Não |
| **POST** | `/brands` | Cadastra uma nova marca. | Sim |
| **GET** | `/brands` | Lista as marcas do tenant logado. | Sim |
| **GET** | `/brands/:id` | Detalha uma marca específica. | Sim |
| **PUT** | `/brands/:id` | Atualiza dados de uma marca. | Sim |
| **DELETE** | `/brands/:id` | Exclui uma marca do tenant. | Sim |
| **POST** | `/models` | Cadastra um novo modelo atrelado a uma Brand. | Sim |
| **GET** | `/models` | Lista modelos do tenant. | Sim |
| **POST** | `/vehicles` | Cadastra um novo veículo atrelado a um Model. | Sim |
| **GET** | `/vehicles` | Lista veículos do tenant (com Cache via Redis). | Sim |
| **GET** | `/vehicles/:id` | Detalha um veículo (com Cache via Redis). | Sim |
| **PUT** | `/vehicles/:id` | Atualiza dados de um veículo (invalida o Cache). | Sim |
| **DELETE** | `/vehicles/:id` | Remove um veículo (invalida o Cache). | Sim |
