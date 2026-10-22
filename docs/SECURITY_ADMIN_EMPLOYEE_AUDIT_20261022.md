# Auditoria P0/P1 — Bella PDV Pro (22/10/2026)

## Fontes de código inspecionadas
- `firestore.rules` (deny-all, users, clients, appointments, transactions, feature_flags e voice_settings)
- `src/lib/firebaseTenant.ts`
- `src/pages/Admin.tsx` e `src/components/admin/AdminAnalyticsStatus.tsx`
- `src/pages/Login.tsx`, `src/store/auth.ts`
- `src/services/voiceNarrationService.ts`, `src/pages/Settings.tsx`

## P0: isolamento e autorização por empresa
1. As regras Firestore usam `ownerId == tenantId()` nos recursos principais; isso é um controle positivo **estático**, não equivale a homologação com contas reais.
2. A função `tenantId()` usa `users/{uid}.companyId` quando disponível e fallback para UID. A coleção `users` permite alterações específicas do próprio usuário e cria perfis do próprio UID. Não inserir associação de funcionário pelo frontend diretamente sem fluxo servidor autenticado e autorização do proprietário da empresa.
3. `isAdmin()` depende de custom claim `admin == true` e exclui conta anônima. A interface Super Admin valida `isPlatformAdmin`. Não autorizar por endereço de e-mail isolado.
4. Existe permissão ampla para `isAdmin()` em leitura de `clients`, `appointments`, `transactions`. Auditar necessidade operacional, consentimento, acesso a dados sensíveis e trilha de auditoria. **Sem alteração de regras em produção nesta fase.**
5. Homologação obrigatória com Firebase Emulator e contas A / B / super admin / funcionário / anônimo: list, get, create, update, delete; negar cross-tenant, elevação de função e alteração de ownerId. Requer publicação explícita de regras homologadas.

## P0: funcionários e permissões
- Criar fluxo de convite/aceite, `employeeProfiles` ligados a `companyId` autorizado no servidor, papel e permissões efetivas.
- Matriz de perfis: proprietário, gerente, atendente, profissional, financeiro. Princípio do menor privilégio; profissional lê somente agendamentos e dados mínimos de clientes atribuídos a si, comissões próprias e indicações próprias.
- Nunca expor pagamentos globais, dados pessoais de outros clientes ou métricas administrativas ao funcionário sem permissão específica.
- Regras Firestore, consultas e rotas precisam ser implementadas e testadas em conjunto: ocultar botão no frontend não impede acesso por API.
- O atual modelo de `users.companyId` não deve ser ampliado por atualização client-side sem fluxo confiável de aprovação de vínculo.

## P1: super admin e planos
- Já existem atualizações de licença e flags por empresa no `Admin.tsx` (`handleInlineUpdateLicense`, `handleInlineUpdateFlag`) e regras `feature_flags` graváveis por claim admin.
- Persistem nomenclaturas de licenças `Bronze/Prata/Ouro`, referências a planos `Básico/Pro/Premium` e valores divergentes dentro da UI do admin.
- Definir catálogo único de planos e limites efetivos no servidor. O controle deve ser **aplicado no backend/regras**, não apenas no menu.
- Botões a homologar: ativar/desativar módulos, editar limite, suspender/restabelecer com confirmação, log e checagem de claim.

## P1: analytics e visitantes
- `AdminAnalyticsStatus` confirma: tag GA4 adicionada (`G-PSV5R007DR`), mas API GA4 Data não conectada ao BellaAdmin.
- A plataforma mostra indicadores de integração, não relatório de visitantes reais. Não gerar contadores fictícios.
- Para visitantes/sessões reais integrar GA4 Data API no servidor, Google OAuth de acesso administrativo ou credenciais adequadas, ID numérico da propriedade, filtros e atualização de cache.
- O GA4 Data API não substitui necessariamente o painel de tempo real do Firebase, nem fornece identidade nominativa de visitantes. Respeitar consentimento/LGPD.

## Entrega imediata implementada nesta branch
- Controle para usuário silenciar Bella IA, síntese de voz, efeitos e reconhecimento; persistência local e tentativa de sincronização nas preferências existentes do Firebase.
- Não altera a função de texto da IA nem dados de vendas.

## Critérios de aceite
- Duas empresas A/B e papéis diferentes testados por Emulator + ambiente de homologação; nenhum cross-tenant.
- Plano habilita/desabilita por claim/entitlement validado no servidor, com log.
- GA4 reporta dados de propriedade real, sem simulações; marca indisponibilidade quando API falhar.
- Dashboard do funcionário é limitado a seus próprios registros e não expõe informações de outros colaboradores por troca de IDs.
