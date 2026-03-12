# PRD: Refatoração do InvoiceService

## Introdução

Refatoração arquitetural do `invoice-persistence.service.ts` que atualmente mistura 6 responsabilidades (formatação, validação, resolução de destinatário, persistência, rollback e orquestração). O objetivo é separar em módulos especializados seguindo o padrão já adotado no `invoice-calculator/`, criando: formatters, validators, domain handlers e um serviço orquestrador enxuto.

Esta refatoração foca em **qualidade de código e organização**, sem mudanças de comportamento funcional.

---

## Goals

- Separar responsabilidades em módulos especializados
- Seguir padrão de estrutura já adotado em `invoice-calculator/`
- Melhorar testabilidade com unidades isoladas
- Facilitar manutenção e evolução futura
- Manter 100% de compatibilidade funcional

---

## User Stories

### US-001: Extrair CurrencyFormatter
**Description:** Como desenvolvedor, quero extrair a formatação de moeda para um módulo dedicado para reutilização e testes isolados.

**Acceptance Criteria:**
- [ ] Criar `invoice-persistence/formatters/currency.formatter.ts`
- [ ] Mover `formatCurrency` para classe `CurrencyFormatter`
- [ ] Exportar método estático `format(value: number): string`
- [ ] Typecheck passa
- [ ] Teste unitário criado

### US-002: Extrair DateFormatter
**Description:** Como desenvolvedor, quero isolar a lógica de formatação de datas para consistência no código.

**Acceptance Criteria:**
- [ ] Criar `invoice-persistence/formatters/date.formatter.ts`
- [ ] Mover constante `MONTHS_PT_BR`
- [ ] Mover `resolveMonthReference` para classe `DateFormatter`
- [ ] Exportar método estático `resolveMonthReference(date: string): string`
- [ ] Typecheck passa
- [ ] Teste unitário criado

### US-003: Atualizar imports para formatters
**Description:** Como desenvolvedor, quero atualizar o serviço principal para usar os novos formatters.

**Acceptance Criteria:**
- [ ] `invoice-persistence.service.ts` importa de `formatters/`
- [ ] Comportamento inalterado após refatoração
- [ ] Typecheck passa

### US-004: Extrair EntityIdValidator
**Description:** Como desenvolvedor, quero isolar a validação de entity IDs para clareza e reutilização.

**Acceptance Criteria:**
- [ ] Criar `invoice-persistence/validators/entity-id.validator.ts`
- [ ] Mover `ensureEntityId` para classe `EntityIdValidator`
- [ ] Adicionar tipo de retorno assertivo
- [ ] Typecheck passa
- [ ] Teste unitário criado

### US-005: Extrair RecipientResolver
**Description:** Como desenvolvedor, quero separar a lógica de resolução de destinatário para reduzir complexidade do serviço principal.

**Acceptance Criteria:**
- [ ] Criar `invoice-persistence/domain/recipient-resolver.ts`
- [ ] Mover `resolveRecipientData` para classe `RecipientResolver`
- [ ] Criar tipo `ResolvedRecipientData` (retornar objeto tipado)
- [ ] Mover helper `resolveName` para o mesmo arquivo
- [ ] Typecheck passa
- [ ] Teste unitário criado

### US-006: Extrair tipos de persistência
**Description:** Como desenvolvedor, quero centralizar tipos relacionados à persistência para organização.

**Acceptance Criteria:**
- [ ] Criar `invoice-persistence/domain/persistence-entities.ts`
- [ ] Mover tipos: `PersistenceStep`, `PersistedEntities`, `RollbackResult`
- [ ] Exportar todos os tipos
- [ ] Typecheck passa

### US-007: Extrair RollbackHandler
**Description:** Como desenvolvedor, quero isolar a lógica de rollback para clareza e manutenção.

**Acceptance Criteria:**
- [ ] Criar `invoice-persistence/domain/rollback-handler.ts`
- [ ] Mover `rollbackPersistedData` para classe `RollbackHandler`
- [ ] Injetar `AtacadoRepository` no construtor
- [ ] Criar método `execute(entities: PersistedEntities): Promise<RollbackResult>`
- [ ] Comportamento de rollback inalterado (1:1)
- [ ] Typecheck passa
- [ ] Teste unitário criado

### US-008: Criar InvoiceOrchestrator
**Description:** Como desenvolvedor, quero renomear e simplificar o serviço principal para ser apenas um orquestrador.

**Acceptance Criteria:**
- [ ] Renomear classe para `InvoiceOrchestrator`
- [ ] Injetar dependências no construtor: `repository`, `calculator`, `rollbackHandler`
- [ ] Simplificar `calculateAndPersist` usando módulos extraídos
- [ ] Método mais declarativo e legível
- [ ] Typecheck passa

### US-009: Atualizar entry point
**Description:** Como desenvolvedor, quero atualizar o entry point para instanciar corretamente com dependências.

**Acceptance Criteria:**
- [ ] Atualizar `invoice.service.ts` (ou arquivo similar)
- [ ] Instanciar `InvoiceOrchestrator` com todas dependências injetadas
- [ ] Exportar instância corretamente
- [ ] Typecheck passa

### US-010: Criar testes de integração
**Description:** Como desenvolvedor, quero garantir que o fluxo completo de persistência com rollback funciona após refatoração.

**Acceptance Criteria:**
- [ ] Teste de integração para fluxo completo de `calculateAndPersist`
- [ ] Teste de rollback em caso de falha parcial
- [ ] Todos testes existentes continuam passando
- [ ] Cobertura de testes mantida ou aumentada

---

## Functional Requirements

- FR-1: Separar funções de formatação (`formatCurrency`, `resolveMonthReference`) em módulos dedicados
- FR-2: Mover validação `ensureEntityId` para validator especializado
- FR-3: Extrair `resolveRecipientData` (~35 linhas) para resolver dedicado
- FR-4: Criar tipos explícitos para dados resolvidos (`ResolvedRecipientData`)
- FR-5: Mover `rollbackPersistedData` para handler dedicado com injeção de dependência
- FR-6: Manter comportamento de rollback idêntico ao atual
- FR-7: Renomear serviço principal para `InvoiceOrchestrator` ou manter compatibilidade via alias
- FR-8: Injetar `RollbackHandler` como dependência do orquestrador
- FR-9: Seguir estrutura de diretórios: `invoice-persistence/{domain,formatters,validators}/`
- FR-10: Manter imports diretos (sem barrel exports)

---

## Non-Goals (Out of Escopo)

- **NÃO** mudar comportamento funcional de persistência ou rollback
- **NÃO** adicionar novas features ao invoice service
- **NÃO** usar DI container (manter injeção manual simples)
- **NÃO** adicionar métricas ou logging novo
- **NÃO** otimizar performance do loop de persistência
- **NÃO** mudar interface pública do serviço

---

## Technical Considerations

### Estrutura de Diretórios

```
src/modules/invoice-service/
├── invoice-calculator/           # EXISTE - sem mudanças
├── invoice-persistence/          # NOVO
│   ├── domain/
│   │   ├── recipient-resolver.ts
│   │   ├── persistence-entities.ts
│   │   └── rollback-handler.ts
│   ├── formatters/
│   │   ├── currency.formatter.ts
│   │   └── date.formatter.ts
│   └── validators/
│       └── entity-id.validator.ts
├── invoice.service.ts            # ENTRY POINT atualizado
├── invoice.schemas.ts            # SEM MUDANÇAS
└── invoice.constants.ts          # SEM MUDANÇAS
```

### Padrões a Seguir

- Seguir estrutura de `invoice-calculator/` como referência
- Imports diretos do arquivo fonte (sem barrel exports)
- Classes com métodos estáticos para formatters/validators
- Injeção de dependência via construtor para domain handlers

### Ordem de Implementação

1. **Fase 1:** Formatters (baixo risco) - US-001, US-002, US-003
2. **Fase 2:** Validators (baixo risco) - US-004
3. **Fase 3:** Domain - Resolver (médio risco) - US-005, US-006
4. **Fase 4:** Domain - Rollback (médio risco) - US-007
5. **Fase 5:** Orquestrador (alto risco) - US-008, US-009
6. **Fase 6:** Testes de integração - US-010

---

## Success Metrics

- [ ] Arquivo principal reduzido de ~320 linhas para ~100 linhas
- [ ] Cada módulo extraído com responsabilidade única
- [ ] Testes unitários para cada novo módulo
- [ ] `pnpm test` passa após cada fase
- [ ] `pnpm biome check` sem erros
- [ ] `pnpm tsc --noEmit` passa
- [ ] POST `/prepara-fatura` funciona como antes

---

## Open Questions

- [ ] Renomear arquivo para `invoice-orchestrator.service.ts` ou manter nome atual?
  - Renomear
- [ ] Criar index.ts interno para `invoice-persistence/` ou importação direta?
    - Importação direta (sem barrel exports)
- [ ] Mover helper `resolveName` junto com `RecipientResolver` ou criar utils separado?
    - Mover junto (relacionado à resolução de destinatário)

---

## Checklist de Verificação

Após cada fase:

- [ ] `pnpm test` executa sem falhas
- [ ] `pnpm biome check` passa
- [ ] `pnpm tsc --noEmit` passa
- [ ] Smoke test manual: POST `/prepara-fatura` retorna resposta esperada
