![Coverage](./docs/coverage-badges.svg)
![Tests](https://github.com/atplus-digital/nfcom-crm/actions/workflows/test.yml/badge.svg)


### Testes Revisados

- [ ] **modules**

  - [x] **atacado**
    - [x] atacado-constants.test.ts
    - [x] atacado-repository.test.ts
    - [x] **http-client**
      - [x] atacado-http-client.test.ts
      - [x] atacado-routes.test.ts
      - [x] utils.test.ts

  - [ ] **fatura**
    - [ ] fatura-constants.test.ts
    - [ ] fatura-schemas.test.ts
    - [ ] fatura-service.test.ts
    - [ ] invoice-calculator-edge-cases.test.ts
    - [ ] invoice-calculator.test.ts
    - [ ] invoice-pipeline-integration.test.ts
    - [ ] **domain**
      - [ ] cliente-builder.test.ts
      - [ ] constants.test.ts
      - [ ] date-calculator-edge-cases.test.ts
      - [ ] date-calculator.test.ts
      - [ ] linha-processor.test.ts
      - [ ] parceiro-builder.test.ts
    - [ ] **validators**
      - [ ] document-validator.test.ts
      - [ ] entity-validator.test.ts
      - [ ] validation-utils.test.ts

- [ ] **routes**

  - [ ] **prepara-fatura**
    - [ ] prepara-fatura-integration.test.ts
    - [x] prepara-fatura-schemas.test.ts

- [x] **shared**

  - [x] **logging**
    - [x] logger-config.test.ts

  - [x] base.error.test.ts
  - [x] constants.test.ts
  - [x] error-handler-edge-cases.test.ts
  - [x] error-handler.test.ts
  - [x] result.test.ts
