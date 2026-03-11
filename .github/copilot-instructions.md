# Instruções de Código

## Regras Obrigatórias

### 1. Imports

- **PROIBIDO**: barrel exports / re-exportação (arquivos `index.ts` que apenas exportam de outros arquivos)
- **OBRIGATÓRIO**: importar diretamente do arquivo de origem

```ts
// ❌ Errado
import { algo } from "@/modules/atacado";
import { OrderService } from "./services";

// ✅ Correto
import { algo } from "@/modules/atacado/wholesale.repository";
import { OrderService } from "./services/order.service";
```

### 2. Tipos

- **PROIBIDO**: usar `any` ou `unknown` sem justificativa muito forte
- **PROIBIDO**: usar `as` para forçar tipos (type assertion)
- **OBRIGATÓRIO**: criar tipos específicos ou usar type guards

```ts
// ❌ Errado
const data = response as Invoice
function process(item: any) { ... }

// ✅ Correto
const data = validateInvoice(response)
function process(item: InvoiceItem) { ... }
```

### 3. Comentários

- **PROIBIDO**: comentários explicando "como" ou "o que" o código faz
- **PROIBIDO**: código comentado
- **RARAMENTE**: comentários explicando "por que" uma decisão técnica foi tomada

```ts
// ❌ Errado
// Loop para processar items
for (const item of items) { ... }

// Calcula o total
const total = items.reduce(...)

// TODO: remover depois
// const oldCode = ...

// ✅ Correto (apenas quando necessário)
// Usamos Map ao invés de Record para preservar ordem de inserção (perf crítico)
const items = new Map<string, Item>()
```

### 4. Código Limpo

- Remova imports não utilizados
- Remova variáveis/funções não utilizadas
- Remova código morto
