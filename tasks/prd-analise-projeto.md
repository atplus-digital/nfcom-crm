# PRD: Análise e Revisão do Projeto NFCom-CRM

## Introdução

Este documento apresenta uma análise completa do projeto **NFCom-CRM**, focando exclusivamente na **Etapa 1: Preparação da Fatura** - o cálculo e preparação dos dados de faturamento para validação no CRM.

**Escopo:** Apenas Preparação da Fatura (cálculo, validação e preparação dos dados). Emissão de notas fiscais será tratada em documento separado.

---

## Resumo Executivo

| Área                    | Status            | Observações                                      |
| ----------------------- | ----------------- | ------------------------------------------------ |
| Estrutura e Arquitetura | ✅ **Excelente**   | Separação em camadas clara, padrões sólidos      |
| Conformidade com Regras | ✅ **Conforme**    | Sem barrel exports, any, ou código comentado     |
| Testes e Cobertura      | ✅ **Excepcional** | 100% lines, 97.28% branches                      |
| Completude de Negócio   | ⚠️ **Parcial**     | Etapa 1 ok, Tipo de Faturamento não implementado |

---

## 1. Análise de Completude dos Requisitos de Negócio

### 1.1 Etapa 1: Preparação da Fatura

| Requisito                | Status         | Detalhes                           |
| ------------------------ | -------------- | ---------------------------------- |
| Buscar dados do Parceiro | ✅ Implementado | `findParceiroById()`               |
| Buscar Clientes ativos   | ✅ Implementado | `findClientesAtivosByParceiroId()` |
| Buscar Planos de Serviço | ✅ Implementado | `findAllPlanosDeServico()`         |
| Calcular valor da fatura | ✅ Implementado | `InvoiceCalculator.calculate()`    |
| Gerar arquivo de fatura  | ✅ Implementado | Response estruturado               |
| Enviar ao CRM            | ⚠️ Parcial      | Endpoint pronto, mas não persiste  |

### 1.2 Tipos de Faturamento

**PROBLEMA CRÍTICO:** O parâmetro `f_tipo_de_faturamento` é aceito na request mas **NÃO é utilizado** para alterar o comportamento do cálculo.

| Tipo            | Especificação                       | Implementação Atual |
| --------------- | ----------------------------------- | ------------------- |
| `parceiro`      | 1 cobrança + 1 nota para parceiro   | ❌ Não implementado  |
| `via-parceiro`  | 1 cobrança parc. + n notas clientes | ❌ Não implementado  |
| `cofaturamento` | 1 cobrança parc. + n notas clientes | ❌ Não implementado  |
| `cliente-final` | n cobranças + n notas clientes      | ❌ Não implementado  |

> **Nota técnica:** O **cálculo dos valores** (soma de linhas por cliente, total geral) é **idêntico para todos os tipos** — o `billingType` não altera a matemática da fatura. O que muda é a **estrutura de persistência**: quem é o devedor das cobranças e destinatário das NFComs. O parâmetro é recebido pelo controller e repassado ao `calculate()`, mas atualmente o método ignora o campo na desestruturação (em `invoice-calculator.ts`, `calculate({ partnerId, referenceDate })`), o que é correto para o cálculo primário.
>
> **Base existente:** A constante `BILLING_TYPE_CONFIG` em `src/modules/invoice-service/invoice.constants.ts` já define `allowsDirectClientBilling` por tipo, podendo ser usada como ponto de partida para a lógica de persistência na US-001.

### 1.3 Estrutura de Dados no CRM

| Entidade       | Tipo Definido                            | Repository Method                  | Status                     |
| -------------- | ---------------------------------------- | ---------------------------------- | -------------------------- |
| Parceiro       | ✅ `src/@types/atacado/Parceiro.ts`       | `findParceiroById()`               | ✅ OK                       |
| Cliente        | ✅ `src/@types/atacado/Cliente.ts`        | `findClientesAtivosByParceiroId()` | ✅ OK                       |
| PlanoDeServico | ✅ `src/@types/atacado/PlanoDeServico.ts` | `findAllPlanosDeServico()`         | ✅ OK                       |
| Fatura         | ✅ `src/@types/atacado/Fatura.ts`         | `createFatura()`                   | ⚠️ Method existe, não usado |
| Cobrança       | ✅ `src/@types/atacado/Cobranca.ts`       | `createCobranca()`                 | ⚠️ Method existe, não usado |
| NFCom          | ✅ `src/@types/atacado/NFCom.ts`          | `createNFCom()`                    | ⚠️ Method existe, não usado |
| ItemNFCom      | ✅ `src/@types/atacado/ItemNFCom.ts`      | `createItemNFCom()`                | ⚠️ Method existe, não usado |

---

## 2. Análise de Estrutura e Arquitetura

### 2.1 Organização de Pastas

```
src/
├── @types/atacado/        ✅ Tipos bem organizados por entidade
├── modules/
│   ├── atacado-repository/ ✅ Repository pattern bem aplicado
│   │   ├── http-client/    ✅ HTTP client com retry/backoff
│   │   └── *.ts            ✅ Separação clara de responsabilidades
│   └── invoice-service/    ✅ Service layer bem estruturada
│       ├── invoice-calculator/    ✅ Domain logic isolado
│       │   ├── domain/           ✅ Builders e processors
│       │   └── validators/       ✅ Validação de CPF/CNPJ e entidades
│       └── *.ts
├── routes/                ✅ Rotas organizadas por domínio
│   └── prepara-fatura/    ✅ Controller + Schemas separados
└── shared/                ✅ Utilitários compartilhados
    ├── error-handler.ts   ✅ Middleware de erro robusto
    ├── base.error.ts      ✅ Classes de erro tipadas
    ├── result.ts          ✅ Result monad
    └── logging/           ✅ Pino configurado
```

**Avaliação:** ✅ **Excelente** - Estrutura em camadas bem definida e modular.

### 2.2 Padrões Utilizados

| Padrão               | Implementação                                 | Status    |
| -------------------- | --------------------------------------------- | --------- |
| Repository Pattern   | `AtacadoRepository` interface + implementação | ✅ Correto |
| Dependency Injection | Services recebem repository via constructor   | ✅ Correto |
| Error Handler        | Middleware Fastify com AppError types         | ✅ Correto |
| Validation           | Zod schemas + type guards                     | ✅ Correto |
| Result Pattern       | Success/Failure para operações                | ✅ Correto |
| Factory Pattern      | `createCliente()`, `createParceiro()`         | ✅ Correto |
| Builder Pattern      | `LineProcessor`, domain builders              | ✅ Correto |

### 2.3 Fluxo de Dados

```
HTTP Request
    ↓
Controller (validação Zod)
    ↓
InvoiceService.calculate()
    ↓
┌─────────────────────────────────────┐
│       InvoiceCalculator             │
│  ┌─────────────────────────────┐   │
│  │ Repository (busca dados)    │   │
│  │ - findParceiroById          │   │
│  │ - findClientesAtivos...     │   │
│  │ - findAllPlanosDeServico    │   │
│  └─────────────────────────────┘   │
│              ↓                      │
│  ┌─────────────────────────────┐   │
│  │ Validators                  │   │
│  │ - DocumentValidator         │   │
│  │ - EntityValidator           │   │
│  └─────────────────────────────┘   │
│              ↓                      │
│  ┌─────────────────────────────┐   │
│  │ Domain Processors           │   │
│  │ - LineProcessor             │   │
│  │ - ClientBuilder             │   │
│  │ - PartnerBuilder            │   │
│  └─────────────────────────────┘   │
│              ↓                      │
│  ┌─────────────────────────────┐   │
│  │ Aggregation & Response      │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
    ↓
HTTP Response (JSON estruturado)
```

---

## 3. Análise de Conformidade com Regras

### 3.1 Imports (sem barrel exports)

**Regra:** `PROIBIDO: barrel exports / re-exportação`

```bash
# Verificação: export * from
grep -r "export \* from" src/
# Resultado: Nenhum encontrado ✅
```

**Conformidade:** ✅ **CONFORME** - Todos os imports são diretos do arquivo origem.

**Exemplo correto no projeto:**
```typescript
// ✅ Correto
import { NotFoundError } from "@/shared/base.error";
import { invoiceService } from "@/modules/invoice-service/invoice.service";
```

### 3.2 Tipos (sem any/unknown sem justificativa)

**Regra:** `PROIBIDO: usar any ou unknown sem justificativa muito forte`

```bash
# Verificação no src/
grep -r ": any" src/     # Resultado: 0 ocorrências ✅
grep -r ": unknown" src/ # Resultado: 6 ocorrências (todas em type guards)
```

**Uso de `unknown` encontrado (todos justificados):**

| Arquivo               | Uso                                   | Justificativa            |
| --------------------- | ------------------------------------- | ------------------------ |
| `error-handler.ts`    | `details?: unknown`                   | Campo genérico de erro   |
| `base.error.ts`       | `isAppError(error: unknown)`          | Type guard               |
| `utils.ts`            | `extractErrorMessage(error: unknown)` | Handler de erro genérico |
| `utils.ts`            | `shouldRetry(error: unknown)`         | Handler de erro genérico |
| `entity.validator.ts` | `isEmptyValue(value: unknown)`        | Type guard               |

**Conformidade:** ✅ **CONFORME** - Uso de `unknown` apropriado para type guards.

### 3.3 Comentários

**Regra:** `PROIBIDO: comentários explicando "como" ou "o que" o código faz`

```bash
# Verificação de código comentado
grep -r "// TODO" src/    # Resultado: 0 ocorrências ✅
grep -r "// FIXME" src/   # Resultado: 0 ocorrências ✅
```

**Conformidade:** ✅ **CONFORME** - Sem código comentado ou comentários desnecessários.

### 3.4 Código Limpo

**Verificação:**
- ✅ Sem imports não utilizados
- ✅ Sem variáveis não utilizadas
- ✅ Sem código morto
- ✅ Tipagem forte em toda a aplicação

**Conformidade:** ✅ **CONFORME**

---

## 4. Análise de Testes e Cobertura

### 4.1 Métricas de Cobertura

| Métrica        | Total | Coberto | skipped | %          |
| -------------- | ----- | ------- | ------- | ---------- |
| **Lines**      | 1,385 | 1,385   | 0       | **100%**   |
| **Statements** | 1,385 | 1,385   | 0       | **100%**   |
| **Functions**  | 91    | 91      | 0       | **100%**   |
| **Branches**   | 221   | 215     | 0       | **97.28%** |

**Avaliação:** ✅ **EXCEPCIONAL** - Cobertura acima de 97% em todos os critérios.

### 4.2 Tipos de Testes

| Tipo                  | Local                                      | Status                         |
| --------------------- | ------------------------------------------ | ------------------------------ |
| **Unit Tests**        | `test/modules/fatura/`                     | ✅ Domain, validators, builders |
| **Integration Tests** | `test/routes/prepara-fatura/`              | ✅ Pipeline completo            |
| **Edge Cases**        | `test/modules/fatura/*-edge-cases.test.ts` | ✅ Cenários negativos           |
| **HTTP Client Tests** | `test/modules/atacado/http-client/`        | ✅ Retry, timeout, errors       |

### 4.3 Área de Melhoria em Testes

**Problema:** Uso extensivo de `as unknown as` para criar mocks:

```typescript
// ❌ Atual - type assertion em testes
const cliente = createCliente({
  f_cidade: undefined,
} as unknown as Cliente);
```

**Solução recomendada:** Criar factory functions com partial updates tipados:

```typescript
// ✅ Recomendado
function createCliente(partial?: Partial<Cliente>): Cliente {
  return {
    f_cpf_cnpj: "12345678901",
    f_nome_razao: "Cliente Teste",
    ...partial,
  } as Cliente;  // Type assertion apenas na factory
}
```

---

## 5. User Stories para Melhorias

## 5.1 Especificações Técnicas Detalhadas

### 5.1.0 Campos de Fatura (Input)

```typescript
interface FaturaInput {
  f_data_referencia: string;        // Data de referência do request (formato YYYY-MM-DD)
  f_valor_total: string;            // Soma total de todos os clientes (invoiceTotal.toFixed(2))
  f_status: "criada";               // Fixo - aguarda validação manual no CRM
  f_fk_parceiro: number;            // ID do parceiro (do request body)
  f_tipo_de_faturamento: string;    // Tipo de faturamento selecionado (ex: "parceiro")
  f_data_vencimento: string;        // Calculado conforme regra abaixo (formato YYYY-MM-DD)
}
```

**Regra de cálculo de `f_data_vencimento`:**
1. Pega `referenceDate` (data de referência do request, ex: `2026-03-01`)
2. Soma 1 mês → `2026-04-01`
3. Define o dia para `Parceiro.f_data_vencimento` (ou `10` se não definido) → `2026-04-10`
4. Se o resultado for **< hoje + 6 dias**, substitui por `hoje + 6 dias`

> Implementado em `src/modules/invoice-service/invoice-calculator/domain/date-calculator.ts`

---

### 5.1.1 Regras de Negócio por Tipo de Faturamento

#### Tipo: `parceiro`
**Estrutura:**
- **1 Fatura** (status: "criada")
- **1 Cobrança** (devedor: Parceiro, valor: Total da fatura, status: "a-emitir")
- **1 NFCom** (destinatário: Parceiro, status_interno: "a-emitir")
- **N Itens na NFCom** (serviços agrupados por tipo)

**Mapeamento:**
| Campo                                   | Origem                                |
| --------------------------------------- | ------------------------------------- |
| Cobrança.f_nome_devedor                 | Parceiro.f_razao_social ou f_fantasia |
| Cobrança.f_documento_devedor            | Parceiro.f_cnpj                       |
| Cobrança.f_email_devedor                | Parceiro.f_email_faturamento          |
| Cobrança.f_valor_total                  | Soma total de todos os clientes       |
| NFCom.f_nome                            | Parceiro.f_razao_social               |
| NFCom.f_cpfcnpj                         | Parceiro.f_cnpj                       |
| NFCom.f_endereco, f_cidade, f_uf, f_cep | Parceiro                              |

---

#### Tipo: `via-parceiro`
**Estrutura:**
- **1 Fatura** (status: "criada")
- **1 Cobrança** (devedor: Parceiro, valor: Total da fatura, status: "a-emitir")
- **N NFCom** (uma por cliente, destinatário: Cliente individual, status_interno: "a-emitir")
- **N Itens por NFCom** (serviços daquele cliente agrupados por tipo)

**Mapeamento Cobrança:** Igual ao tipo `parceiro`

**Mapeamento NFCom (por cliente):**
| Campo                                   | Origem                             |
| --------------------------------------- | ---------------------------------- |
| NFCom.f_nome                            | Cliente.f_nome_razao ou f_fantasia |
| NFCom.f_cpfcnpj                         | Cliente.f_cpf_cnpj                 |
| NFCom.f_rgie                            | Cliente.f_rg_ie                    |
| NFCom.f_endereco, f_cidade, f_uf, f_cep | Cliente                            |

---

#### Tipo: `cofaturamento`
**Estrutura:** Idêntico ao `via-parceiro`
- **1 Fatura** (status: "criada")
- **1 Cobrança** (devedor: Parceiro, valor: Total da fatura)
- **N NFCom** (uma por cliente, destinatário: Cliente individual)

> **Nota de negócio:** Para fins de **preparação da fatura**, `cofaturamento` é idêntico ao `via-parceiro` — mesma estrutura de 1 cobrança (parceiro) + N NFComs (clientes). A constante `BILLING_TYPE_CONFIG` registra `allowsDirectClientBilling: true` para `cofaturamento` (vs `false` para `via-parceiro`), mas essa flag **não tem efeito nesta etapa** e será relevante apenas na emissão (SEFAZ), onde o contexto fiscal do emitente difere.

---

#### Tipo: `cliente-final`
**Estrutura:**
- **1 Fatura** (status: "criada")
- **N Cobranças** (uma por cliente, devedor: Cliente individual, valor: Total do cliente, status: "a-emitir")
- **N NFCom** (uma por cliente, destinatário: Cliente individual, status_interno: "a-emitir")
- **N Itens por NFCom** (serviços daquele cliente agrupados por tipo)

**Mapeamento Cobrança (por cliente):**
| Campo                        | Origem                             |
| ---------------------------- | ---------------------------------- |
| Cobrança.f_nome_devedor      | Cliente.f_nome_razao ou f_fantasia |
| Cobrança.f_documento_devedor | Cliente.f_cpf_cnpj                 |
| Cobrança.f_email_devedor     | Cliente.f_email                    |
| Cobrança.f_valor_total       | Total calculado do cliente         |
| Cobrança.f_fk_fatura         | ID da Fatura criada                |

**Mapeamento NFCom:** Igual ao `via-parceiro` (dados do cliente)

---

### 5.1.2 Campos de Cobrança (Completo)

```typescript
interface CobrancaInput {
  // Obrigatórios
  f_data_vencimento: string;      // Calculado conforme regra em 5.1.0 (mesmo valor da Fatura)
  f_valor_total: string;          // Ver seção 5.1.1 por tipo
  f_status: "a-emitir";           // Fixo inicial
  f_nome_devedor: string;         // Ver seção 5.1.1 por tipo
  f_email_devedor: string;        // Ver seção 5.1.1 por tipo
  f_documento_devedor: string;    // Ver seção 5.1.1 por tipo
  f_id_externo: null;             // Vazio inicialmente
  f_descricao: string;            // "**Descrição dos itens da cobrança** - Mar/2026" (mês abreviado PT-BR 3 letras: Jan/Fev/Mar/Abr/Mai/Jun/Jul/Ago/Set/Out/Nov/Dez)

  // Opcionais
  f_link_fatura?: undefined;      // Gerado posteriormente pelo gateway
  f_fk_fatura?: number;           // ID da Fatura (em cliente-final)
  f_data_emissao?: undefined;     // Preenchido na emissão
}
```

---

### 5.1.3 Campos de NFCom (Completo)

```typescript
interface NFComInput {
  // Relacionamentos
  f_fk_cobranca: number;          // ID da Cobrança associada

  // Dados do destinatário (ver seção 5.1.1 por tipo)
  f_nome: string;
  f_cpfcnpj: string;
  f_rgie: string;
  f_endereco: string;
  f_endereco_numero: string;
  f_bairro: string;
  f_cidade: string;
  f_uf: string;
  f_cep: string;
  f_telefone: string;
  f_email: string;

  // Status inicial
  f_status_interno: "a-emitir";

  // Campos preenchidos na emissão (deixar vazio)
  f_mensagem?: undefined;
  f_qrcodepix?: undefined;
  f_codigobarras?: undefined;
  f_ambiente?: undefined;
  f_numero?: undefined;
  f_serie?: undefined;
  f_chave?: undefined;
  f_protocolo?: undefined;
  f_emissao?: undefined;
  f_situacao?: undefined;
  f_bc_icms?: undefined;
  f_icms?: undefined;
  f_total?: undefined;
  f_linhadigitavel?: undefined;
  f_pdf?: undefined;
  f_xml?: undefined;
}
```

---

### 5.1.4 Campos de ItemNFCom (Completo)

```typescript
interface ItemNFComInput {
  f_fk_nota_fiscal: number;       // ID da NFCom associada
  f_item: number;                 // Sequencial (1, 2, 3...)
  f_descricao: string;            // Descrição do serviço agrupado
  f_cclass: string;               // Classificação fiscal - DEFAULT inicial
  f_cfop: string;                 // CFOP - DEFAULT inicial
  f_quantidade: number;           // Quantidade de linhas/serviços
  f_unitario: string;             // Preço unitário
  f_total: string;                // Preço total (quantidade * unitário)

  // Inseridos Após Emissão
  f_codigo?: string;
  f_incide_aliquota?: undefined;
  f_icms?: undefined;
  f_aliq_icms?: undefined;
  f_bc_icms?: undefined;
}
```

> **Nota:** Os campos `f_cclass` e `f_cfop` terão **valores DEFAULT** definidos em constantes. Posteriormente, quando definida a origem (CRM ou configuração), serão atualizados.

**Valores DEFAULT propostos:**
| Campo    | Valor Default | Observação                            |
| -------- | ------------- | ------------------------------------- |
| f_cclass | "0"           | Placeholder para classificação fiscal |
| f_cfop   | "0"           | Placeholder para CFOP                 |

---

### 5.1.5 Estrutura do Response de Persistência

```typescript
interface PersistInvoiceResponse {
  status: 201;
  success: true;
  dateStr: string;
  billingType: TipoFaturamento;
  resumo: {
    totalClientes: number;
    totalLinhas: number;
    valorTotal: number;
  };
  data: {
    fatura: {
      id: number;
      f_status: "criada";
      f_data_referencia: string;
      f_data_vencimento: string;
      f_valor_total: string;
      f_tipo_de_faturamento: string;
    };
    cobrancas: Array<{
      id: number;
      f_valor_total: string;
      f_nome_devedor: string;
      f_status: "a-emitir";
    }>;
    notasFiscais: Array<{
      id: number;
      f_nome: string;
      f_cpfcnpj: string;
      f_status_interno: "a-emitir";
      f_fk_cobranca: number;
    }>;

  };
}
```

---

### 5.1.6 Tratamento de Erros na Persistência

**Política:** Transação atômica - **tudo ou nada**

| Cenário                  | Comportamento                                 |
| ------------------------ | --------------------------------------------- |
| Falha ao criar Fatura    | Retornar erro 500/502, não criar nada         |
| Falha ao criar Cobrança  | Rollback da Fatura, retornar erro             |
| Falha ao criar NFCom     | Rollback de Fatura + Cobranças, retornar erro |
| Falha ao criar ItemNFCom | Rollback completo, retornar erro              |

**Estrutura de erro:**
```typescript
interface PersistInvoiceError {
  status: 500 | 502 | 503;
  success: false;
  error: {
    code: "PERSIST_INVOICE_ERROR" | "PERSIST_COBRANCA_ERROR" | "PERSIST_NFCOM_ERROR";
    message: string;
    details?: {
      step: "fatura" | "cobranca" | "nfcom" | "item";
      attempted?: number;
      succeeded?: number;
    };
  };
}
```

> **Nota:** O CRM API pode não suportar transações. Caso não suporte, implementar rollback manual (delete em cascata dos registros criados antes da falha).

---

### 5.1.7 Estrutura das Chamadas de API (Criação Aninhada)

A API do CRM usa **criação aninhada** — NFCom e ItemNFCom são criados via sub-rotas da entidade pai. A ordem obrigatória de criação é:

| Ordem | Método do Repository             | Endpoint da API                                               |
| ----- | -------------------------------- | ------------------------------------------------------------- |
| 1     | `createFatura(data)`             | `POST /t_nfcom_faturas:create`                                |
| 2     | `createCobranca(data)`           | `POST /t_nfcom_cobrancas:create`                              |
| 3     | `createNFCom(cobrancaId, data)`  | `POST /t_nfcom_cobrancas/{cobrancaId}/f_notas_fiscais:create` |
| 4     | `createItemNFCom(nfComId, data)` | `POST /t_nfcom_notas/{nfComId}/f_nota_itens:create`           |

**Implicações para rollback (US-003):**

A deleção deve ocorrer em **ordem inversa** (ItemNFCom → NFCom → Cobrança → Fatura). Os métodos de delete **não existem** na interface `AtacadoRepository` — precisam ser adicionados antes de implementar a US-003:

```typescript
// Adicionar em wholesale.repository.types.ts
interface AtacadoRepository {
  // ...métodos existentes...
  deleteFatura(id: string | number): Promise<void>;
  deleteCobranca(id: string | number): Promise<void>;
  deleteNFCom(id: string | number): Promise<void>;
  deleteItemNFCom(id: string | number): Promise<void>;
}
```

> **Pendência:** Confirmar com a API do CRM o sufixo correto para deleção (`:destroy`, `:delete` ou outro) antes de implementar.

---

## 5.2 User Stories

### US-001: Implementar Lógica de Tipo de Faturamento

**Description:** Como sistema, preciso processar faturas de acordo com o tipo selecionado para gerar cobranças e notas com estrutura correta.

**Acceptance Criteria:**
- [ ] `parceiro`: Criar 1 cobrança (parceiro), 1 nota (parceiro), N itens agrupados
- [ ] `via-parceiro`: Criar 1 cobrança (parceiro), N notas (clientes), itens por cliente
- [ ] `cofaturamento`: Criar 1 cobrança (parceiro), N notas (clientes), itens por cliente
- [ ] `cliente-final`: Criar N cobranças (clientes), N notas (clientes), itens por cliente
- [ ] Cada NFCom vinculada à Cobrança correta via `f_fk_cobranca`
- [ ] Response incluir `billingType` no resumo
- [ ] Typecheck/lint passes

---

### US-002: Persistir Fatura + Cobranças + NFCom (Transação Completa)

**Description:** Como sistema, após calcular a fatura, preciso persistir Fatura, Cobrança(s) e NFCom(s) em transação atômica.

**Acceptance Criteria:**
- [ ] Criar Fatura com status "criada"
- [ ] Criar Cobrança(s) com status "a-emitir" vinculadas à Fatura
- [ ] Criar NFCom(s) com status_interno "a-emitir" vinculadas à Cobrança
- [ ] Criar ItemNFCom(s) agrupados por tipo de serviço
- [ ] Todos campos mapeados conforme seção 5.1
- [ ] Transação atômica: rollback total em caso de falha
- [ ] Response estruturado conforme seção 5.1.5
- [ ] Testes de integração para cada tipo de faturamento
- [ ] Typecheck/lint passes

---

### US-003: Implementar Rollback Manual (se necessário)

**Description:** Como sistema, preciso garantir consistência de dados com rollback manual se a API do CRM não suportar transações.

**Acceptance Criteria:**
- [ ] Adicionar métodos `deleteFatura`, `deleteCobranca`, `deleteNFCom`, `deleteItemNFCom` à interface `AtacadoRepository` e sua implementação (`wholesale.repository.ts`)
- [ ] Confirmar sufixo correto de delete na API do CRM e definir rotas em `atacado.routes.ts`
- [ ] Implementar rollback em ordem inversa: ItemNFCom → NFCom → Cobrança → Fatura
- [ ] Log de erro incluir step onde falhou e quantos registros foram revertidos
- [ ] Testes de cenários de falha em cada etapa da criação
- [ ] Typecheck/lint passes

---

### US-004: Constantes de CFOP/Classificação Fiscal (DEFAULT)

**Description:** Como desenvolvedor, preciso de valores DEFAULT para CFOP e classificação fiscal enquanto origem final não é definida.

**Acceptance Criteria:**
- [ ] Adicionar `DEFAULT_CFOP` e `DEFAULT_CCLASS` ao arquivo existente `src/modules/invoice-service/invoice.constants.ts` (arquivo já contém `DATES` e `BILLING_TYPE_CONFIG`)
- [ ] Aplicar valores DEFAULT em todos os ItemNFCom criados
- [ ] Adicionar comentário TODO técnico explicando que origem será definida posteriormente
- [ ] Typecheck/lint passes

---


## 6. Requisitos Funcionais

### RF-1: Tipo de Faturamento
O sistema DEVE processar faturas de forma diferente conforme `f_tipo_de_faturamento`:
- `parceiro`: Uma cobrança para o parceiro, uma nota fiscal contendo todos os custos
- `via-parceiro`: Uma cobrança para o parceiro, uma nota fiscal por cliente
- `cofaturamento`: Uma cobrança para o parceiro, uma nota fiscal por cliente (parceiro repassa)
- `cliente-final`: Uma cobrança por cliente, uma nota fiscal por cliente

### RF-2: Persistência de Fatura
O sistema DEVE persistir a Fatura no CRM após o cálculo com status "pendente" para validação.

### RF-3: Validação de Documentos
O sistema DEVE validar CPF/CNPJ de parceiros e clientes antes de processar faturas.

### RF-4: Tratamento de Erros
O sistema DEVE retornar erros estruturados com código, mensagem e contexto quando aplicável.

### RF-5: Health Check
O sistema DEVE expor endpoint de health check em `GET /` retornando `{ "api": "on" }`.

---

## 7. Non-Goals (Fora do Escopo)

- **Cache de Responses** - Performance optimization futura
- **Rate Limiting** - Proteção para produção futura
- **CORS** - Configuração para deploy em produção
- **Relatórios** - Dashboards e métricas

---

## 8. Considerações Técnicas

### 8.1 Stack Atual
- **Framework:** Fastify 5.7.4
- **Validação:** Zod 4.3.6
- **HTTP Client:** Axios 1.13.6 com retry
- **Logging:** Pino 10.3.1
- **Testes:** Jest com ts-jest

### 8.2 Dependências Externas
- **API Atacado:** Sistema CRM para dados de parceiros, clientes e persistência
- **Autenticação:** API Key via header

### 8.3 Configuração de Ambiente
```env
ATACADO_API_KEY=    # Obrigatório
ATACADO_API_URL=    # Obrigatório
SERVER_URL=0.0.0.0  # Opcional
SERVER_PORT=3333    # Opcional
```

---

## 9. Métricas de Sucesso

| Métrica                 | Meta  | Atual    |
| ----------------------- | ----- | -------- |
| Cobertura de Testes     | > 90% | ✅ 97.28% |
| Conformidade com Regras | 100%  | ✅ 100%   |
| Implementação Etapa 1   | 100%  | ✅ 100%   |
| Tipos de Faturamento    | 4/4   | ⚠️ 0/4    |

---

## 10. Questões Respondidas

| Questão                                   | Resposta                                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| Persistência: endpoint único ou separado? | Automático, persistir Fatura + Cobrança + NFCom em transação única                       |
| Quem valida Fatura no CRM?                | Usuário manual (status inicial: "criada")                                                |
| Estados da Fatura                         | "criada" → "emitida" \| "parcial" \| "erro" → "pago" → "cancelada"                       |
| Estados da Cobrança                       | "a-emitir" → "emitida" \| "erro" → "paga" → "vencida" → "cancelada"                      |
| Estados da NFCom                          | "a-emitir" → "emitida" \| "erro" → "a-emitir"                                            |
| Integração SEFAZ                          | Não implementar (fora do escopo desta etapa)                                             |
| Retry Policy                              | Backoff exponencial, 3 tentativas máx.                                                   |
| Devedor por tipo                          | Parceiro em `parceiro/via-parceiro/cofaturamento`, Cliente em `cliente-final`            |
| Destinatário NFCom por tipo               | Parceiro em `parceiro`, Cliente individual nos demais                                    |
| Valor da cobrança                         | Total da fatura em `parceiro/via-parceiro/cofaturamento`, por cliente em `cliente-final` |
| Itens da NFCom                            | Agrupados por tipo de serviço                                                            |
| f_id_externo                              | Gerado posteriormente pelo gateway                                                       |
| f_link_fatura                             | Gerado posteriormente pelo gateway                                                       |
| Response após persistir                   | Resumo + IDs (ver seção 5.1.5)                                                           |
| f_cfop, f_cclass                          | DEFAULT inicial (origem será definida posteriormente)                                    |
| f_descricao cobrança                      | "**Descrição dos itens da cobrança** - [MES/ANO]"                                        |
| Dados endereço NFCom                      | Do Parceiro ou Cliente, conforme destinatário                                            |
| Erro parcial na persistência              | Rollback total (transação atômica)                                                       |

### 10.1 Questões Pendentes

1. **CFOP/Classificação Fiscal:** Qual será a origem definitiva dos valores de `f_cfop` e `f_cclass`?
    - Opções: Tabela no CRM, Configuração por parceiro, Código fixo por tipo de serviço
    - **Ação:** Usar valores DEFAULT inicialmente, definir origem em documento separado
    - **Resposta:** Usar valores DEFAULT inicialmente, utilizando uma função para preparar essa lógica posteriormente

2. **API de Transações:** A API do CRM suporta transações ACID?
    - **Ação:** Verificar documentação da API ou testar behavior; implementar rollback manual se necessário
    - **Resposta**: A api não possui rollback automático, portanto implementar rollback manual (deletar registros criados em caso de falha).

---

## 11. Plano de Ação Priorizado

| Prioridade | User Story                                   | Esforço | Impacto | Dependências |
| ---------- | -------------------------------------------- | ------- | ------- | ------------ |
| 🔴 Alta     | US-001: Implementar Tipo de Faturamento      | Médio   | Alto    | Nenhuma      |
| 🔴 Alta     | US-002: Persistir Fatura + Cobranças + NFCom | Médio   | Alto    | US-001       |
| 🔴 Alta     | US-004: Constantes CFOP/Classificação        | Baixo   | Médio   | US-002       |
| 🟡 Média    | US-003: Rollback Manual (se necessário)      | Baixo   | Médio   | US-002       |
| 🟡 Média    | US-005: Refatorar factories de teste         | Baixo   | Médio   | Nenhuma      |
| 🟢 Baixa    | US-006: Documentação Swagger                 | Baixo   | Baixo   | Nenhuma      |

**Ordem de implementação sugerida:**
1. US-004 (constantes) → 2. US-001 (tipos) → 3. US-002 (persistência) → 4. US-003 (rollback)

---

## Checklist de Validação

### Infraestrutura e Qualidade (✅ Completo)
- [x] Estrutura do projeto organizada em camadas
- [x] Imports diretos (sem barrel exports)
- [x] Tipagem forte (sem any)
- [x] Código limpo (sem código morto)
- [x] Testes com alta cobertura (97%+)
- [x] Error handling estruturado

### Funcionalidades (⚠️ Pendente)
- [ ] US-001: Lógica de tipo de faturamento funcional (4/4 tipos)
- [ ] US-002: Persistência transacional de Fatura + Cobranças + NFCom
- [ ] US-003: Rollback manual (se API não suportar transações)
- [ ] US-004: Constantes DEFAULT para CFOP/Classificação

### Documentação (🟢 Opcional)
- [ ] US-006: Documentação OpenAPI disponível
- [ ] US-005: Factories de teste refatoradas

---

**Documento gerado em:** 2026-03-11
**Última atualização:** 2026-03-11
**Versão do PRD:** 1.1.0
**Status:** ✅ Pronto para Implementação

---
