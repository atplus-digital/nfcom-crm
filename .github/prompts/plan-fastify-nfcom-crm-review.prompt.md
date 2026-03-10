# Plano: Revisão e Melhorias - Fastify NFCom CRM

**TL;DR**: Revisão identificou **violações críticas** das regras de código (barrel exports, type assertions), **vazamento de credenciais** (.env commitado), dependência desnecessária (React em projeto backend) e gaps de cobertura de testes. O projeto está estruturalmente sólido (~97% branch coverage), mas precisa correções de conformidade e segurança.

---

## FASE 1: Correções Críticas 🔴

| #    | Tarefa                                                              | Arquivo                                                   | Dependências |
| ---- | ------------------------------------------------------------------- | --------------------------------------------------------- | ------------ |
| 1.1  | Remover `.env` do git, adicionar `.gitignore`, criar `.env.example` | `.env`, `.gitignore`                                      | -            |
| 1.2  | Rotacionar API key (manual)                                         | -                                                         | _após 1.1_   |
| 1.3  | Deletar barrel export                                               | `src/modules/invoice-service/invoice-calculator/index.ts` | -            |
| 1.4  | Deletar barrel export                                               | `src/modules/atacado-repository/http-client/index.ts`     | -            |
| 1.5  | Atualizar imports (linhas 2-3)                                      | `src/modules/invoice-service/invoice.service.ts`          | _após 1.3_   |
| 1.6  | Remover type assertions → refinar tipos                             | `entity.validator.ts` (L61, L68)                          | -            |
| 1.7  | Remover type assertions → refinar tipos                             | `validation-utils.ts` (L24, L31)                          | -            |
| 1.8  | Remover type assertions → refinar tipos                             | `line-processor.ts` (L24-26, L90)                         | -            |
| 1.9  | Validar environment em vez de assertion                             | `logger.config.ts` (L37)                                  | -            |
| 1.10 | Remover dependência React                                           | `package.json`                                            | -            |

### 1.1 Segurança - Vazamento de Credenciais

**Arquivo**: `.env` (commitado no repositório)

- **Problema**: `ATACADO_API_KEY` em plaintext no git
- **Ação**:
  1. Executar `git rm --cached .env`
  2. Adicionar `.env` e `.env.local` ao `.gitignore`
  3. Criar `.env.example` com template
  4. Rotacionar a API key atual

### 1.3-1.4 Remoção de Barrel Exports (PROIBIDO por `copilot-instructions.md`)

**Arquivo 1**: `src/modules/invoice-service/invoice-calculator/index.ts`

```typescript
// DELETAR ARQUIVO COMPLETO - re-exportação pura
export type { InvoiceCalculatorService } from "./interface";
export { InvoiceCalculator } from "./invoice-calculator";
```

**Arquivo 2**: `src/modules/atacado-repository/http-client/index.ts`

```typescript
// DELETAR ARQUIVO COMPLETO - re-exportação pura
export type { ApiResponse, HttpClientConfig } from "./types";
```

### 1.5 Atualizar Imports

**Arquivo 3**: `src/modules/invoice-service/invoice.service.ts` (update imports)

- Linha 2: `import type { InvoiceCalculatorService } from "./invoice-calculator"`
  → `import type { InvoiceCalculatorService } from "./invoice-calculator/interface"`
- Linha 3: `import { InvoiceCalculator } from "./invoice-calculator"`
  → `import { InvoiceCalculator } from "./invoice-calculator/invoice-calculator"`

### 1.6-1.9 Remoção de Type Assertions `as` (PROIBIDO)

**Arquivos afetados**:

1. `src/modules/invoice-service/invoice-calculator/validators/entity.validator.ts` (linhas 61, 68)
2. `src/modules/invoice-service/invoice-calculator/validators/validation-utils.ts` (linhas 24, 31)
3. `src/modules/invoice-service/invoice-calculator/domain/line-processor.ts` (linhas 24-26, 90)
4. `src/shared/logging/logger.config.ts` (linha 37)

**Correção**: Refinar tipos existentes (genéricos e interfaces) para eliminar necessidade de assertion

---

## FASE 2: Melhorias de Qualidade 🟡

| #   | Tarefa                                       | Arquivo                  |
| --- | -------------------------------------------- | ------------------------ |
| 2.1 | Substituir `z.unknown()` por schemas tipados | `invoice.schemas.ts`     |
| 2.2 | Tipar `data?: unknown`                       | `atacado-http-client.ts` |
| 2.3 | Tipar `details?: unknown`                    | `error-handler.ts`       |

### 2.1 Tipagem de Schemas Zod

**Arquivo**: `src/modules/invoice-service/invoice.schemas.ts`

- Substituir `z.unknown()` nos campos `client` e `partner` por schemas tipados
- Eliminar necessidade de `Omit` + retipagem manual nas interfaces

### 2.2 HTTP Client

**Arquivo**: `src/modules/atacado-repository/http-client/atacado-http-client.ts`

- Trocar `data?: unknown` por tipo mais específico no método `post()`

### 2.3 Error Handler Details

**Arquivo**: `src/shared/error-handler.ts`

- Tipar `details?: unknown` com tipo mais específico ou union type

---

## FASE 3: Gaps de Testes 🟡

| #   | Tarefa                                      | Arquivo                                 |
| --- | ------------------------------------------- | --------------------------------------- |
| 3.1 | Criar testes de validação de env            | `test/env.test.ts`                      |
| 3.2 | Criar testes de bootstrap                   | `test/server.test.ts`                   |
| 3.3 | Criar teste da rota GET /                   | `test/routes/routes.test.ts`            |
| 3.4 | Fechar gap (múltiplos clientes com falhas)  | `invoice-calculator.test.ts`            |
| 3.5 | Fechar gap (planId null/0, linhas inativas) | `invoice-calculator-edge-cases.test.ts` |
| 3.6 | Fechar gap (production details)             | `error-handler.test.ts`                 |

### 3.1 Testes Críticos Faltando

| Arquivo                | Cenários Necessários                               |
| ---------------------- | -------------------------------------------------- |
| `src/env.ts`           | Validação de URL inválida, API key vazia, defaults |
| `src/server.ts`        | Bootstrap, logger, error handler, routes           |
| `src/routes/routes.ts` | Rota GET / retornando { api: 'on' }                |

### 3.2-3.6 Fechar Gaps de Coverage (97% → 100%)

| Arquivo                 | Branches Faltantes                                  |
| ----------------------- | --------------------------------------------------- |
| `invoice-calculator.ts` | 2 branches (múltiplos clientes com falhas parciais) |
| `line-processor.ts`     | 3 branches (planId null/0, todas linhas inativas)   |
| `error-handler.ts`      | 1 branch (production com details != 500)            |

#### Testes Sugeridos

```typescript
// 3.1 env.ts - Nenhum teste de validação
describe("env validation", () => {
	it("deve falhar se ATACADO_API_URL é inválida", () => {
		process.env.ATACADO_API_URL = "not-a-url";
		expect(() => require("@/env")).toThrow();
	});

	it("deve falhar se ATACADO_API_KEY é vazio", () => {
		process.env.ATACADO_API_KEY = "";
		expect(() => require("@/env")).toThrow();
	});

	it("deve usar defaults para SERVER_URL e SERVER_PORT", () => {
		delete process.env.SERVER_URL;
		delete process.env.SERVER_PORT;
		const { env } = require("@/env");
		expect(env.SERVER_URL).toBe("0.0.0.0");
		expect(env.SERVER_PORT).toBe(3333);
	});
});

// 3.2 server.ts Bootstrap
describe("buildServer", () => {
	it("deve inicializar com logger customizado", async () => {
		const server = await buildServer();
		expect(server).toBeDefined();
		expect(server.logger).toBeDefined();
		await server.close();
	});

	it("deve registrar error handler", async () => {
		const server = await buildServer();
		expect(server.errorHandler).toBe(errorHandler);
		await server.close();
	});
});

// 3.5 line-processor.ts gaps
it("deve processar cliente com TODAS as linhas inativas", () => {
	const processor = LineProcessor.create(defaultPlanos);
	const cliente = createCliente({
		f_linhas_fixas: [
			createServico({ f_status: "0" }),
			createServico({ f_status: "0" }),
		],
	});
	expect(() => processor.processClientLines(cliente)).toThrow();
});

it("deve lançar erro quando planId é null explicitamente", () => {
	const processor = LineProcessor.create(defaultPlanos);
	const cliente = createCliente({
		f_linhas_fixas: [createServico({ f_coghzwfvcnx: null } as unknown)],
	});
	expect(() => processor.processClientLines(cliente)).toThrow();
});
```

---

## FASE 4: Configuração & Docs 🟢

| #   | Tarefa                                  | Arquivo          |
| --- | --------------------------------------- | ---------------- |
| 4.1 | `collectCoverage: false`                | `jest.config.ts` |
| 4.2 | Habilitar VCS, remover padrões frontend | `biome.json`     |
| 4.3 | Atualizar versão do Zod para `^4.3.6`   | `package.json`   |
| 4.4 | Adicionar setup, estrutura, env vars    | `README.md`      |
| 4.5 | Priorizar tarefas existentes            | `docs/To-do.md`  |

### 4.1 Jest Configuration

**Arquivo**: `jest.config.ts`

- Mudar `collectCoverage: false` (usar flag `--coverage` quando necessário)

### 4.2 Biome Configuration

**Arquivo**: `biome.json`

- Habilitar `"vcs": { "enabled": true }`
- Remover padrões frontend inúteis (`routeTree.gen.ts`, `styles.css`)

### 4.3 Pacote Zod Version

**Arquivo**: `package.json`

- Atualizar versão do Zod de `^4.1.11` para `^4.3.6`

### 4.4 README.md Template

Adicionar seções:

- Descrição do projeto
- Pré-requisitos (Node 24+, pnpm)
- Setup local
- Variáveis de ambiente
- Scripts disponíveis
- Estrutura de diretórios

---

## ARQUIVOS CRÍTICOS POR FASE

### Fase 1

- `.env` → Remover do git
- `.gitignore` → Adicionar `.env`, `.env.local`
- `.env.example` → Criar template
- `src/modules/invoice-service/invoice-calculator/index.ts` → **DELETAR**
- `src/modules/atacado-repository/http-client/index.ts` → **DELETAR**
- `src/modules/invoice-service/invoice.service.ts` → Atualizar imports
- `src/modules/invoice-service/invoice-calculator/validators/entity.validator.ts` → Refinar tipos
- `src/modules/invoice-service/invoice-calculator/validators/validation-utils.ts` → Refinar tipos
- `src/modules/invoice-service/invoice-calculator/domain/line-processor.ts` → Refinar tipos
- `src/shared/logging/logger.config.ts` → Validar environment
- `package.json` → Remover React

### Fase 2

- `src/modules/invoice-service/invoice.schemas.ts`
- `src/shared/error-handler.ts`
- `src/modules/atacado-repository/http-client/atacado-http-client.ts`

### Fase 3

- `test/env.test.ts` → Criar
- `test/server.test.ts` → Criar
- `test/routes/routes.test.ts` → Criar
- `test/modules/fatura/invoice-calculator.test.ts` → Adicionar cenários
- `test/modules/fatura/invoice-calculator-edge-cases.test.ts` → Adicionar cenários

### Fase 4

- `jest.config.ts`
- `biome.json`
- `package.json`
- `README.md`
- `docs/To-do.md`

---

## VERIFICAÇÃO

### Após cada fase:

```bash
pnpm tsc --noEmit     # Sem erros de tipo
pnpm biome check      # Lint OK
pnpm test             # Testes passando
```

### Fase 1

1. `git grep -n "from.*invoice-calculator\\"" src/` → deve retornar imports diretos
2. `pnpm test` → todos passando
3. `pnpm biome check` → sem erros
4. `git log -- .env` → não deve mostrar arquivo

### Fase 2

1. `pnpm tsc --noEmit` → sem erros de tipo
2. `grep -rn " as " src/` → deve retornar apenas usos justificados
3. `pnpm test` → coverage branches aumentado

### Fase 3

1. `pnpm test -- --coverage` → branches ≥ 99%
2. Testes env/server/routes passando

### Fase 4

1. `pnpm test --coverage` → executar em < 10s sem overhead
2. README.md revisado

---

## DECISÕES

1. **Barrel Exports**: Remover completamente, conforme regra explícita do `copilot-instructions.md`
2. **Type Assertions**: Refinar tipos existentes (genéricos e interfaces) para eliminar necessidade de assertion
3. **Testes de Inicialização**: Prioridade alta - falhas aqui são silenciosas
4. **Jest Coverage**: Desabilitar default para performance
5. **Escopo**: Plano completo (Fases 1-4) aprovado pelo usuário

---

## SCOPE

**Incluído**:

- Correções de conformidade com coding standards
- Correções de segurança
- Gaps críticos de teste
- Melhorias de configuração

**Excluído**:

- Refatoração arquitetural maior
- Novas features (Cache, Rate Limiting, Auth do To-do.md)
- CI/CD changes (já está bom)
