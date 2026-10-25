# Auditoria Asaas — Bella PDV Pro

Data: 2026-10-25

## Estado observado no Asaas (somente leitura)

- 11 assinaturas existentes e nenhuma identificada como Bella/ATR PDV; nenhuma foi alterada.
- Links existentes do Bella: Básico R$ 79,00, Pro R$ 129,00 e Premium R$ 197,00, todos com texto de teste de 24 horas.
- Catálogo do aplicativo: Básico R$ 29,90 por 3 meses e depois R$ 89,90; Pro R$ 149,90; Premium R$ 249,90; teste de 15 dias.
- Não existe webhook dedicado ao Bella PDV Pro.
- A fila interrompida `ASSINATURAS SITE ATRSAAS` pertence a outra integração e não foi reativada nem modificada.
- A única chave de API visível pertence à integração AdegaPRO; ela não deve ser reutilizada pelo Bella.

## Correções implementadas

- Remoção da chave Asaas do navegador, do Zustand e dos documentos de empresa.
- Remoção do proxy genérico que aceitava caminho, método e chave fornecidos pelo cliente.
- Checkout recorrente criado no servidor com referência externa aleatória e vínculo persistido por empresa.
- Catálogo único e tipado para preços, promoção e período de teste.
- Webhook autenticado por token, allowlist de eventos e idempotência por ID do evento.
- Isolamento multiempresa por intenção criada no servidor ou assinatura previamente vinculada; cliente/e-mail/CPF/CNPJ nunca definem tenancy.
- Ativação de licença somente após evento de pagamento recebido/confirmado e preço compatível.
- Transição idempotente do Básico promocional para R$ 89,90 após três pagamentos promocionais, sem alterar cobranças já geradas.
- Conciliação administrativa somente leitura e vínculo manual com prévia (`apply=false`) antes de gravar.
- Atualização das dependências: zero vulnerabilidades de produção no `npm audit --omit=dev`.

## Publicação bloqueada até homologação

1. Criar conta/chave exclusiva no Sandbox Asaas.
2. Configurar no Preview da Vercel: `ASAAS_API_KEY`, `ASAAS_ENV=sandbox`, `ASAAS_WEBHOOK_TOKEN`, `APP_URL` e credencial Firebase Admin.
3. Criar webhook de Sandbox para `/api/webhooks/asaas`, com eventos de Checkout, assinatura e pagamento e o mesmo token.
4. Validar os três planos: criação, expiração, cancelamento, primeiro pagamento, duplicidade de webhook, inadimplência e isolamento entre duas empresas.
5. Confirmar a atualização do Básico após o terceiro pagamento sem mudar cobranças já emitidas.
6. Somente após evidências do Preview, criar chave/webhook exclusivos de produção e promover a implantação.

## Operações que preservam cobranças existentes

- A atualização de preço do Básico usa `updatePendingPayments: false`.
- O vínculo manual não altera assinatura ou cobrança no Asaas.
- A conciliação é sempre `dryRun`.
- Links e assinaturas atuais permanecem intactos até a migração aprovada.

