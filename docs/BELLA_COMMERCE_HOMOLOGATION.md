# Bella PDV Pro — habilitação do funil comercial real

Projeto Firebase: `bellapdv-15ae0`. Este PR não publica regras automaticamente.

## Variáveis de ambiente obrigatórias (Vercel)

- `FIREBASE_PROJECT_ID=bellapdv-15ae0`
- `FIREBASE_SERVICE_ACCOUNT_EMAIL`: e-mail de conta de serviço com permissão mínima para criar licenças, eventos e consultar vínculos
- `FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY`: chave privada mantida exclusivamente no servidor, NUNCA `VITE_*`
- `ASAAS_WEBHOOK_TOKEN`: token de autenticação do webhook gerado no painel Asaas

Configurar em Preview e Production somente depois de verificar a identidade da conta de serviço. Nunca fazer commit dos segredos.

## Publicação de regras

Usar credenciais administrativas do projeto:
```bash
firebase use bellapdv-15ae0
firebase emulators:exec --only firestore 'npm run lint'
firebase deploy --only firestore:rules --project bellapdv-15ae0
```
O comando com emulator acima não substitui testes próprios das regras: validar usuário A, usuário B, anônimo e Super Admin com regras reais ou emuladas antes do deploy.

## Fluxo do cadastro e trial

1. Usuário cria conta no Firebase Auth e perfil `users/{uid}` com `companyId=uid`, `role=client`.
2. Frontend envia ID token para `POST /api/trials/activate`.
3. Backend valida assinatura do token Firebase e perfil real do Firestore.
4. Transação no Firestore cria `company_licenses/{uid}` somente se não existe, com status trial, 15 dias, plano Bronze.
5. A mesma transação registra `commercial_events/account_{uid}` e `commercial_events/trial_{uid}`; retentativas não reiniciam o prazo.
6. Se credenciais administrativas estiverem ausentes, a API retorna 503; NÃO libera licença fictícia.

## Pagamentos Asaas

- Configurar URL `https://bellapdvpro.vercel.app/api/webhooks/asaas` e o header `asaas-access-token` com o token secreto gerado no Asaas.
- Um Super Admin com custom claim `admin=true` precisa vincular previamente cada pagamento real por `POST /api/payments/link` com Bearer token Firebase e JSON:
  `{"paymentId":"pay_...","companyId":"UID_DA_EMPRESA","plan":"Bronze","expectedCents":8990}`
  (exemplo de estrutura, não valor cobrado).
- Apenas `PAYMENT_CONFIRMED` e `PAYMENT_RECEIVED`, com status correspondente e valor idêntico ao vínculo imutável, alteram a licença.
- Gravação do evento de pagamento e ativação da licença são atômicas, com ID do evento como chave idempotente.
- Sem vínculo ou segredo, o webhook não ativa assinaturas.

## Homologação necessária

- Anônimo visita landing: somente cria `visitor_events` após aceitar consentimento; recusa não grava.
- Usuário A cria conta: licença trial e dois eventos servidor; A não lê eventos/empresas de B.
- Usuário B repete; só admin acessa o painel global.
- Reiniciar login/reenviar trial não prolonga prazo.
- Webhook com token incorreto retorna 401; não grava.
- Evento financeiro válido e vinculado grava somente uma vez; evento duplicado mantém estado.
- Evento sem vínculo, valor divergente ou status pendente não ativa licença.
- Fazer testes efetivos em Firebase Emulator/ambiente separado antes do deploy de regras/merge.
