# Photovoltaic Contract System

Sistema de gestão de contratos para instalação de energia solar fotovoltaica da ISOTEC.

## Tecnologias

- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Supabase** - Backend (PostgreSQL + Auth)
- **Tailwind CSS** - Estilização
- **Shadcn UI** - Componentes UI
- **React Hook Form + Zod** - Validação de formulários
- **Framer Motion** - Animações
- **@react-pdf/renderer** - Geração de PDFs
- **Google Maps API** - Captura de localização geográfica
- **Fast-check** - Testes baseados em propriedades
- **Cloudflare Pages** - Deploy e CDN

## Estrutura do Projeto

```
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── dashboard/         # Admin Dashboard
│   ├── contracts/         # Public Contract Views
│   └── layout.tsx         # Root Layout
├── components/            # React Components
├── lib/                   # Utilities and Services
│   ├── supabase/         # Supabase client
│   ├── validation/       # CPF, CEP, etc.
│   ├── services/         # Business logic
│   └── types/            # TypeScript types
├── tests/                 # Tests
│   ├── unit/             # Unit tests
│   ├── property/         # Property-based tests
│   └── integration/      # Integration tests
└── public/               # Static assets
```

## Começando

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta Supabase
- Google Maps API Key
- GOV.BR OAuth credentials (para assinaturas digitais)

### Instalação

1. Clone o repositório
2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

```bash
cp .env.local.example .env.local
# Edite .env.local com suas credenciais
```

4. Execute o servidor de desenvolvimento:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run start` - Inicia servidor de produção
- `npm run lint` - Executa ESLint
- `npm test` - Executa testes
- `npm run test:watch` - Executa testes em modo watch

## Deploy

O projeto está configurado para deploy no Cloudflare Pages usando o adaptador `@cloudflare/next-on-pages`.

### Deploy Manual

```bash
npm run build
npx @cloudflare/next-on-pages
```

### Deploy Automático

O projeto usa GitHub Actions para CI/CD. Commits na branch `main` disparam deploy automático.

## Funcionalidades

### MVP (Implementado)
- ✅ Wizard multi-etapas para criação de contratos (7 etapas)
- ✅ Validação de CPF e CEP com formatação automática
- ✅ Auto-preenchimento de endereço via ViaCEP
- ✅ Captura de localização geográfica com Google Maps (8 casas decimais)
- ✅ Lista dinâmica de equipamentos (JSONB)
- ✅ Checklist de serviços com opções customizadas
- ✅ Formatação de valores em BRL
- ✅ API REST para criação e listagem de contratos
- ✅ Visualização pública de contratos via UUID
- ✅ Assinatura via verificação de email (código de 6 dígitos)
- ✅ Geração de hash SHA-256 para integridade
- ✅ Auditoria completa de assinaturas (IP, timestamp, método)
- ✅ 231 testes unitários passando

### Em Desenvolvimento
- 🚧 Assinatura digital via GOV.BR OAuth
- 🚧 Geração de PDFs profissionais
- 🚧 Dashboard administrativo completo
- 🚧 Testes baseados em propriedades (Property-Based Testing)
- 🚧 Conformidade completa com LGPD

## Rotas Disponíveis

### Públicas
- `/` - Página inicial
- `/wizard` - Wizard de criação de contratos
- `/contracts/[uuid]` - Visualização pública de contrato

### API (Requer autenticação admin)
- `POST /api/contracts` - Criar contrato
- `GET /api/contracts` - Listar contratos (com filtros e paginação)
- `GET /api/contracts/[id]` - Detalhes do contrato

### API (Pública - Assinatura)
- `POST /api/signatures/email/send` - Enviar código de verificação
- `POST /api/signatures/email/verify` - Verificar código e assinar contrato

## Desenvolvimento

### Estrutura de Dados

**Contrato:**
- Informações do contratante (nome, CPF, email, telefone)
- Endereço de instalação (CEP, rua, número, bairro, cidade, estado)
- Coordenadas geográficas (latitude/longitude - opcional)
- Especificações do projeto (potência kWp, data de instalação)
- Lista de equipamentos (nome, quantidade, unidade)
- Escopo de serviços (descrição, incluído)
- Informações financeiras (valor, forma de pagamento)
- Status (pending_signature, signed, cancelled)
- Hash SHA-256 (após assinatura)

**Validações:**
- CPF: Algoritmo de dígitos verificadores + rejeição de padrões inválidos
- CEP: 8 dígitos numéricos
- Coordenadas: Dentro dos limites geográficos do Brasil
- Valores: Positivos com 2 casas decimais
- Potência: Máximo 10.000 kWp

### Banco de Dados (Supabase)

Tabelas principais:
- `contracts` - Contratos mestres
- `contract_items` - Itens de equipamento (relação 1:N)
- `audit_logs` - Logs imutáveis de assinaturas
- `verification_codes` - Códigos temporários para assinatura por email
- `profiles` - Perfis de usuários admin

### Testes

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:watch

# Executar testes com cobertura
npm test -- --coverage
```

Atualmente: **231 testes passando** (10 suítes)

## Licença

Propriedade da ISOTEC - Todos os direitos reservados.
