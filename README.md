![Coverage](./docs/coverage-badges.svg)
![Tests](https://github.com/atplus-digital/nfcom-crm/actions/workflows/test.yml/badge.svg)


### Testes Revisados

- [x] **modules**

  - [x] **atacado**
    - [x] atacado-constants.test.ts
    - [x] atacado-repository.test.ts
    - [x] **http-client**
      - [x] atacado-http-client.test.ts
      - [x] atacado-routes.test.ts
      - [x] utils.test.ts

  - [x] **fatura**
    - [x] fatura-constants.test.ts
    - [x] fatura-schemas.test.ts
    - [x] fatura-service.test.ts
    - [x] invoice-calculator-edge-cases.test.ts
    - [x] invoice-calculator.test.ts
    - [x] invoice-pipeline-integration.test.ts
    - [x] **domain**
      - [x] cliente-builder.test.ts
      - [x] constants.test.ts
      - [x] date-calculator-edge-cases.test.ts
      - [x] date-calculator.test.ts
      - [x] linha-processor.test.ts
      - [x] parceiro-builder.test.ts
    - [x] **validators**
      - [x] document-validator.test.ts
      - [x] entity-validator.test.ts
      - [x] validation-utils.test.ts

- [x] **routes**

  - [x] **prepara-fatura**
    - [x] prepara-fatura-integration.test.ts
    - [x] prepara-fatura-schemas.test.ts

- [x] **shared**

  - [x] **logging**
    - [x] logger-config.test.ts

  - [x] base.error.test.ts
  - [x] constants.test.ts
  - [x] error-handler-edge-cases.test.ts
  - [x] error-handler.test.ts
  - [x] result.test.ts
