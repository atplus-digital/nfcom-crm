![Coverage](./docs/coverage-badges.svg)
![Tests](https://github.com/atplus-digital/nfcom-crm/actions/workflows/test.yml/badge.svg)

# NFCom CRM

Backend para gestão de faturamento e integração com APIs AT+ Atacado.

## Pré-requisitos

- Node.js 24+
- pnpm 10.x

## Setup

```bash
# Instalar dependências
pnpm install

# Copiar variáveis de ambiente
cp .env.example .env

# Editar .env com suas credenciais
```

## Variáveis de Ambiente

| Variável          | Descrição                        | Padrão        |
| ----------------- | -------------------------------- | ------------- |
| `SERVER_URL`      | Host do servidor                 | `0.0.0.0`     |
| `SERVER_PORT`     | Porta do servidor                | `3333`        |
| `ATACADO_API_KEY` | Chave de autenticação da API AT+ | (obrigatório) |
| `ATACADO_API_URL` | URL base da API AT+              | (obrigatório) |

## Scripts

```bash
pnpm dev          # Desenvolvimento com hot reload
pnpm build        # Build para produção
pnpm start        # Iniciar servidor de produção

pnpm test         # Executar testes
pnpm coverage     # Cobertura de testes

pnpm format       # Formatar código
pnpm lint         # Verificar linting
pnpm check        # Verificar código completo
pnpm biome:write  # Corrigir automaticamente

pnpm types:gen    # Gerar tipos da API
```

## Estrutura

```
src/
├── @types/           # Tipos TypeScript gerados
├── modules/
│   ├── atacado-repository/   # Cliente HTTP e repository
│   └── invoice-service/      # Lógica de faturamento
├── routes/           # Handlers HTTP
└── shared/           # Utilitários e erro handling

test/                 # Testes unitários e integração
scripts/              # Scripts de geração de tipos
```

## API

### GET /

Health check - retorna `{ "api": "on" }`

### POST /prepara-fatura

Prepara dados de faturamento para um parceiro.

## Arquitetura

- **Fastify** - Framework HTTP
- **Zod** - Validação de schemas
- **Pino** - Logging estruturado
- **Jest** - Testes

## Testes

```bash
# Executar todos os testes
pnpm test

# Com cobertura
pnpm coverage
```
