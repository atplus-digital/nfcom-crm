# Escrita de Código

- Não utilize de barrel exports / re-exportação. Importe diretamente dos arquivos de origem. Isso melhora a clareza e evita problemas de dependência circular.
- Evite usar `any` ou `unknown` sem uma boa razão. Prefira tipos específicos.
- Evite usar `as` para forçar um tipo. Se precisar usar, adicione um comentário explicando por que é necessário.
- **Não Utilize comentários**, somente quando muito necessário para explicar o "porquê" de uma decisão de código, não o "como" neo o "que". O código deve ser autoexplicativo.
- Evite código morto ou comentários de código que não são mais relevantes. Remova-os para manter o código limpo.
