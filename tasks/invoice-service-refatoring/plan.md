# Plano: Refatoração do InvoiceService

## TL;DR

Refatorar `invoice-persistence.service.ts` que atualmente mistura 6 responsabilidades (formatação, validação, resolução de destinatário, persistência, rollback e orquestração). Separar em módulos especializados seguindo o padrão já adotado no `invoice-calculator/`, criando: formatters, validators, domain handlers e um serviço orquestrador enxuto.

---

## Análise Atual

### Arquivo: `src/modules/invoice-service/invoice-persistence.service.ts`

**Responsabilidades misturadas:**
1. **Formatação** - `formatCurrency`, `resolveMonthReference`, `resolveName`, `MONTHS_PT_BR`
2. **Validação** - `ensureEntityId`
3. **Resolução de destinatário** - `resolveRecipientData` (35+ linhas)
4. **Persistência** - loop de criação de Fatura → Cobrança → NFCom → ItemNFCom
5. **Rollback** - `rollbackPersistedData` com lógica de delete em ordem reversa
6. **Orquestração** - `calculateAndPersist` coordena tudo

**Problemas:**
- Arquivo com ~320 linhas fazendo muitas coisas
- Dificulta testes unitários isolados
- Lógica de rollback complexa misturada com persistência
- Funções utilitárias deveriam ser reutilizáveis

---

## Estrutura Proposta

```
src/modules/invoice-service/
├── invoice-calculator/           # JÁ EXISTE - cálculo puramente de domínio
│   ├── domain/
│   │   ├── billing-plan-builder.ts
│   │   ├── client-builder.ts
│   │   ├── date-calculator.ts
│   │   ├── line-processor.ts
│   │   └── partner-builder.ts
│   └── validators/
│       ├── document.validator.ts
│       └── entity.validator.ts
│
├── invoice-persistence/          # NOVO - módulo de persistência
│   ├── domain/                   # Lógica de domínio para persistência
│   │   ├── recipient-resolver.ts      # resolveRecipientData extraído
│   │   ├── persistence-entities.ts    # tipos: PersistenceStep, PersistedEntities, RollbackResult
│   │   └── rollback-handler.ts        # rollbackPersistedData extraído
│   ├── formatters/               # Formatação de dados
│   │   ├── currency.formatter.ts      # formatCurrency
│   │   └── date.formatter.ts          # resolveMonthReference, MONTHS_PT_BR
│   └── validators/               # Validações específicas de persistência
│       └── entity-id.validator.ts     # ensureEntityId
│
├── invoice.service.ts            # ORQUESTRADOR - apenas coordena
├── invoice-persistence.service.ts # RENOMEADO/MOVED para invoice.service.ts
├── invoice.schemas.ts
└── invoice.constants.ts
```

---

## Passos de Implementação

### Fase 1: Extrair Formatters (baixo risco)

**1.1.** Criar `invoice-persistence/formatters/currency.formatter.ts`
- Mover `formatCurrency` para classe `CurrencyFormatter`
- Exportar função estática `format(value: number): string`

**1.2.** Criar `invoice-persistence/formatters/date.formatter.ts`
- Mover `MONTHS_PT_BR` constante
- Mover `resolveMonthReference` para classe `DateFormatter`
- Exportar função estática `resolveMonthReference(date: string): string`

**1.3.** Atualizar imports em `invoice-persistence.service.ts`
- Importar de formatters

---

### Fase 2: Extrair Validators (baixo risco)

**2.1.** Criar `invoice-persistence/validators/entity-id.validator.ts`
- Mover `ensureEntityId` para classe `EntityIdValidator`
- Adicionar tipo de retorno assertivo

**2.2.** Atualizar imports

---

### Fase 3: Extrair Domain - Resolver (médio risco)

**3.1.** Criar `invoice-persistence/domain/recipient-resolver.ts`
- Mover `resolveRecipientData` para nova classe `RecipientResolver`
- Criar tipo `ResolvedRecipientData` (retornar objeto tipado ao invés de inline)

**3.2.** Mover `resolveName` helper para `recipient-resolver.ts`

**3.3.** Atualizar `invoice-persistence.service.ts` para usar `RecipientResolver`

---

### Fase 4: Extrair Domain - Rollback (médio risco)

**4.1.** Criar `invoice-persistence/domain/persistence-entities.ts`
- Mover tipos: `PersistenceStep`, `PersistedEntities`, `RollbackResult`
- Exportar todos

**4.2.** Criar `invoice-persistence/domain/rollback-handler.ts`
- Mover `rollbackPersistedData` para classe `RollbackHandler`
- Injetar `AtacadoRepository` no construtor
- Criar método `execute(entities: PersistedEntities): Promise<RollbackResult>`

**4.3.** Atualizar `invoice-persistence.service.ts` para usar `RollbackHandler`

---

### Fase 5: Refatorar Serviço Principal (alto risco)

**5.1.** Renomear classe `InvoiceService` para `InvoiceOrchestrator` (ou manter nome)
- Serviço passa a ser apenas orquestrador

**5.2.** Injetar dependências no construtor
- Manter: `repository: AtacadoRepository`
- Manter: `calculator: InvoiceCalculator`
- Adicionar: `rollbackHandler: RollbackHandler`

**5.3.** Simplificar `calculateAndPersist`
- Usar todos os módulos extraídos
- Deixar método mais declarativo

**5.4.** (Opcional) Renomear arquivo para `invoice-orchestrator.service.ts`

---

### Fase 6: Atualizar Exports e Testes

**6.1.** Atualizar `invoice.service.ts` (entry point)
- Instanciar corretamente com dependências injetadas

**6.2.** Mover/atualizar testes existentes
- Criar testes unitários para cada novo módulo
- Manter teste de integração para orquestrador

---

## Arquivos Relevantes

- `src/modules/invoice-service/invoice-persistence.service.ts` — arquivo principal a refatorar
- `src/modules/invoice-service/invoice-calculator/` — referência de estrutura já adotada
- `src/modules/invoice-service/invoice.schemas.ts` — tipos existentes
- `src/modules/invoice-service/invoice.service.ts` — entry point atual
- `src/modules/atacado-repository/wholesale.repository.types.ts` — interface do repository

---

## Verificação

1. **Testes unitários** — rodar `pnpm test` após cada fase
2. **Lint/Type check** — `pnpm biome check` e `pnpm tsc --noEmit`
3. **Teste de integração** — validar fluxo completo de persistência com rollback
4. **Smoke test manual** — POST `/prepara-fatura` validar resposta

---

## Decisões

- **Padrão de estrutura** — seguir `invoice-calculator/` (domain/ + validators/)
- **Providers** — não usar DI container, manter injeção manual simples
- **Nome do serviço** — manter `InvoiceService` por enquanto (evitar breaking changes)
- **Escopo** — refatoração focada em organização, sem mudar comportamento

---

## Considerações Finais

1. **Ordem de implementação** — seguir fases sequencialmente (1→6)
2. **Paralelismo** — Fases 1 e 2 podem ser feitas em paralelo
3. **Rollback seguro** — cada fase deve ser testada antes de avançar
