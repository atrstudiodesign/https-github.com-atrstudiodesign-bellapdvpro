# Bella PDV Pro — migração Firebase → Supabase

## Isolamento
Este projeto NÃO deve usar os bancos Supabase existentes de ATR SAAS, ATR Studio ou Adega Pro. Criar projeto separado com nome **BELLA PDV PRO** antes de executar a migration.

## Etapas de corte
1. Criar projeto Supabase exclusivo de Bella PDV Pro e aplicar `supabase/migrations/20261018000100_bella_tenant_schema.sql`.
2. Configurar `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` para o frontend. A chave secret/service_role somente no servidor.
3. Habilitar email/senha e Google OAuth; cadastrar URLs autorizadas. Não transferir senhas do Firebase. Convidar usuários ou exigir redefinição de senha.
4. Provisionar empresas e vincular usuários mediante operações privilegiadas auditáveis; jamais autorizar pela `user_metadata`.
5. Exportar coleções de clientes, catálogo, agenda, vendas e fila do Firestore com IDs de origem; importar no PostgreSQL em lotes auditáveis, reconciliando contagens e valores, com idempotência. Manter cópia/backup do Firestore.
6. Substituir todas as leituras/escritas Firebase Firestore pelo PostgreSQL, inclusive aplicativos móveis e páginas públicas; não basta migrar somente a tela de login.
7. Atualizar backend Express para verificar JWT Supabase e consultar `bella_memberships`; não confiar no tenant enviado no corpo/headers.
8. Testar: usuário sem empresa, empresa A acessando B, revogação, vendas/estoque, caixa, agendamentos, módulos públicos, billing/webhooks; só depois trocar produção.
9. Após homologação completa, desativar providers Firebase Authentication. Desligar Firestore somente após checagem de integridade e retenção de backup.

**Estado atual:** schema versionado no GitHub, mas não aplicado porque nenhuma conta Supabase conectada é do Bella PDV Pro. Nenhum dado migrado. Não fazer merge/cutover do login ainda.
