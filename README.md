# ISOTEC - Sistema de Contratos Fotovoltaicos

Sistema completo de gestão de contratos para instalação de energia solar fotovoltaica.

## 🚀 Status do Projeto

✅ **MVP Completo e em Produção**

- Wizard de criação de contratos (7 etapas)
- Visualização pública de contratos
- Assinatura digital por email com código de verificação
- Integração com Supabase (PostgreSQL)
- Integração SMTP para envio de emails
- 231 testes unitários passando
- Deploy automatizado no Cloudflare Pages

## 📋 Funcionalidades

### Criação de Contratos
- Wizard intuitivo com 7 etapas
- Validação em tempo real (CPF, CEP, coordenadas)
- Integração com Google Maps para localização
- Integração com ViaCEP para endereços
- Cálculo automático de valores

### Assinatura Digital
- Envio de código de verificação por email
- Validação de código com expiração (15 minutos)
- Rate limiting (5 tentativas por 15 minutos)
- Registro de IP e user agent
- Placeholder para integração GOV.BR (futuro)

### Auditoria
- Log completo de todas as ações
- Rastreamento de mudanças de status
- Histórico de assinaturas
- Registro de tentativas de verificação

## 🛠️ Tecnologias

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **Email**: Nodemailer + SMTP
- **Deploy**: Cloudflare Pages
- **Testes**: Jest + Fast-check (Property-Based Testing)

## 📚 Documentação

### Desenvolvimento
- [Guia de Desenvolvimento](docs/DEVELOPMENT.md) - Setup local e desenvolvimento
- [Status do MVP](docs/MVP_STATUS.md) - Funcionalidades implementadas
- [API Documentation](docs/API.md) - Endpoints e schemas

### Configuração
- [Setup do Supabase](docs/SUPABASE_SETUP.md) - Configuração do banco de dados
- [Setup de Email](docs/EMAIL_SETUP.md) - Configuração SMTP
- [Integração SMTP](docs/SMTP_INTEGRATION.md) - Detalhes da integração de email

### Deploy
- [Próximos Passos](docs/deployment/NEXT_STEPS.md) - Guia rápido de deploy
- [Deploy Completo](docs/deployment/DEPLOY_GITHUB_CLOUDFLARE.md) - Guia detalhado
- [Checklist de Deploy](docs/deployment/DEPLOYMENT_CHECKLIST.md) - Checklist interativo
- [Deploy Rápido](docs/deployment/QUICK_DEPLOY.md) - Deploy em 5-15 minutos
- [Produção](docs/deployment/PRODUCTION_READY.md) - Status de produção
- [Comandos Git](docs/deployment/GIT_COMMANDS.md) - Referência de comandos

## 🚀 Quick Start

### Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.local.example .env.local
# Edite .env.local com suas credenciais

# Rodar em desenvolvimento
npm run dev

# Rodar testes
npm test
```

### Deploy para Produção

Veja o [guia de deploy rápido](docs/deployment/QUICK_DEPLOY.md) para instruções completas.

## 📁 Estrutura do Projeto

```
contrato-isotec/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   ├── contracts/            # Páginas de contratos
│   └── wizard/               # Wizard de criação
├── components/               # Componentes React
│   ├── contract/             # Componentes de contrato
│   ├── ui/                   # Componentes UI (shadcn)
│   └── wizard/               # Componentes do wizard
├── lib/                      # Bibliotecas e utilitários
│   ├── services/             # Serviços (email, APIs)
│   ├── supabase/             # Cliente Supabase
│   ├── types/                # Tipos TypeScript
│   └── validation/           # Validações
├── supabase/                 # Configuração Supabase
│   ├── functions/            # Edge Functions
│   └── migrations/           # Migrações SQL
├── tests/                    # Testes
│   ├── unit/                 # Testes unitários
│   └── property/             # Property-based tests
└── docs/                     # Documentação
    ├── deployment/           # Guias de deploy
    ├── API.md
    ├── DEVELOPMENT.md
    └── MVP_STATUS.md
```

## 🔐 Variáveis de Ambiente

Veja `.env.local.example` para a lista completa de variáveis necessárias.

Principais variáveis:
- `NEXT_PUBLIC_SUPABASE_URL` - URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Chave pública Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Chave de serviço Supabase
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Configuração SMTP
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - API Key do Google Maps

## 🧪 Testes

```bash
# Rodar todos os testes
npm test

# Rodar testes em modo watch
npm run test:watch

# Rodar testes com coverage
npm test -- --coverage
```

## 📝 Licença

Propriedade da ISOTEC - Todos os direitos reservados.

## 🤝 Suporte

Para suporte, entre em contato através de nao-responda@clubemkt.digital
