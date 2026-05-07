# 🏨 Hotel System — Sistema de Gestão Hoteleira

**SENAI — Atividade Prática Integradora**

Sistema web para gerenciamento de reservas de hotel, com controle de disponibilidade de quartos, alertas de overbooking e rastreabilidade completa das movimentações.

---

## 📋 Requisitos de Infraestrutura

| Item | Tecnologia | Versão |
|------|-----------|--------|
| SGBD | MySQL | 8.0+ |
| Backend | Node.js + Express + Prisma | Node 18+, Express 4.x |
| Frontend | React + Vite | React 18, Vite 5 |
| Sistema Operacional | Windows 10/11, Ubuntu 20.04+ ou macOS 12+ | — |

---

## 📁 Estrutura do Projeto

```
hotel-system/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma     # Modelo do banco de dados (DER)
│   │   └── seed.js           # Dados iniciais
│   ├── src/
│   │   ├── index.js          # Entry point
│   │   ├── middleware/
│   │   │   └── auth.js       # JWT middleware
│   │   └── routes/
│   │       ├── auth.js       # Autenticação
│   │       ├── quartos.js    # CRUD de quartos
│   │       ├── reservas.js   # Gestão de reservas
│   │       └── dashboard.js  # Dados do dashboard
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── QuartosPage.jsx
│   │   │   └── ReservasPage.jsx
│   │   ├── components/
│   │   │   ├── Layout.jsx    # Sidebar + header
│   │   │   └── Modal.jsx     # Modal reutilizável
│   │   ├── services/
│   │   │   └── api.js        # Axios + interceptors
│   │   └── context/
│   │       ├── AuthContext.jsx
│   │       └── ToastContext.jsx
│   └── package.json
└── database/
    └── schema.sql            # Script SQL completo
```

---

## 🚀 Como Instalar e Executar

### 1. Pré-requisitos
- Node.js 18+: https://nodejs.org
- MySQL 8.0+: https://dev.mysql.com/downloads/

### 2. Banco de dados

```bash
# Opção A: via script SQL direto
mysql -u root -p < database/schema.sql

# Opção B: criar manualmente
mysql -u root -p
CREATE DATABASE hotel_db;
exit
```

### 3. Backend

```bash
cd backend

# Copiar e configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais MySQL:
# DATABASE_URL="mysql://root:SUA_SENHA@localhost:3306/hotel_db"

# Instalar dependências
npm install

# Gerar cliente Prisma e executar migrações
npx prisma generate
npx prisma migrate dev --name init

# Popular banco com dados iniciais
npm run prisma:seed

# Iniciar servidor (desenvolvimento)
npm run dev

# O backend rodará em: http://localhost:3001
```

### 4. Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# O frontend rodará em: http://localhost:5173
```

### 5. Acessar o sistema

Abra: **http://localhost:5173**

**Credenciais padrão:**
- Email: `admin@hotel.com`
- Senha: `admin123`

---

## 🔧 Variáveis de Ambiente (backend/.env)

```env
DATABASE_URL="mysql://root:password@localhost:3306/hotel_db"
JWT_SECRET="hotel_system_secret_key_2024"
PORT=3001
OVERBOOKING_THRESHOLD=2   # Nº de quartos livres que dispara alerta
```

---

## 📌 Requisitos Funcionais Implementados

### RF-01: Autenticação
- Login com email e senha (JWT)
- Proteção de todas as rotas autenticadas
- Logout com redirecionamento para login

### RF-02: Dashboard Principal (Interface 5)
- Exibe nome do usuário logado
- Acesso a Cadastro de Quartos e Gestão de Reservas
- Indicadores: total, ocupados, disponíveis, taxa de ocupação
- Movimentações recentes

### RF-03: Cadastro de Quartos (Interface 6)
- Listagem com carregamento automático ao acessar a tela
- Campo de busca por número, tipo ou descrição
- Criar novo quarto (validações completas)
- Editar quarto existente
- Excluir quarto (com verificação de histórico)
- Alertas de validação em campos obrigatórios

### RF-04: Gestão de Reservas (Interface 7)
- Quartos listados em ordem alfabética (algoritmo de ordenação)
- Seleção de quarto para movimentação de entrada ou saída
- Inserção de data da movimentação
- Verificação automática de disponibilidade a cada movimentação
- Alerta quando disponibilidade abaixo do mínimo configurado
- Alerta de overbooking (capacidade 0)
- Histórico completo com responsável e data

---

## 🏗️ Diagrama Entidade-Relacionamento (DER)

```
usuarios (1) ──── (N) movimentacoes (N) ──── (1) quartos

usuarios:
  id PK, nome, email UNIQUE, senha, createdAt, updatedAt

quartos:
  id PK, numero UNIQUE, tipo ENUM(SIMPLES|DUPLO|SUITE),
  capacidade, precoPorNoite, descricao, ativo, createdAt, updatedAt

movimentacoes:
  id PK, quartoId FK, usuarioId FK,
  tipo ENUM(ENTRADA|SAIDA), dataMovimentacao,
  observacao, createdAt
```

---

## 🧪 API Endpoints

### Auth
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Dados do usuário logado |

### Quartos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/quartos | Listar quartos (com ?busca=) |
| GET | /api/quartos/:id | Buscar por ID |
| POST | /api/quartos | Criar quarto |
| PUT | /api/quartos/:id | Editar quarto |
| DELETE | /api/quartos/:id | Excluir quarto |

### Reservas
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/reservas | Quartos + status de disponibilidade |
| GET | /api/reservas/historico | Histórico de movimentações |
| GET | /api/reservas/disponibilidade | Status atual de overbooking |
| POST | /api/reservas/movimentar | Registrar entrada ou saída |

### Dashboard
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/dashboard | Resumo geral |
