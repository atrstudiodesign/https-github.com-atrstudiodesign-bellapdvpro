# Preparação Android TWA — Bella PDV Pro

**Situação:** Conta Play Console ainda em verificação. A preparação abaixo não assina nem publica um aplicativo.

## Verificações automatizadas
```bash
node scripts/play-release-preflight.mjs
bash scripts/prepare-play-twa.sh
```
O primeiro comando consulta manifesto, ícones, página de login e Digital Asset Links do domínio de produção. O segundo inicia o Bubblewrap interativamente e cria o projeto Android localmente em `android-twa/` (apenas depois de configurar Android SDK, Java e Bubblewrap). Não confirma a legitimidade do certificado: conferir o SHA-256 da Play Console.

## Pacote de lançamento
- Nome: Bella PDV Pro
- Application ID pretendido: `com.bellapdv.app`
- Domínio TWA: `https://bellapdvpro.vercel.app`
- Target SDK para novas submissões em outubro de 2026: **API 36** ou superior.
- Assinar com uma chave de upload persistente fora do repositório, usar Play App Signing e gerar `.aab`.
- Não versionar `android-twa/`, `.jks`, `.keystore`, bundles e senhas. Incluir padrões no `.gitignore` antes de adicionar projeto gerado.

## Bloqueios
- Verificação da conta Play Console, app ID e permissões.
- SHA-256 real do certificado Play App Signing, comparado com `public/.well-known/assetlinks.json`.
- Validação do SDK 36, bundle assinado, assinatura e instalação Android.
- Compatibilidade das assinaturas Asaas com a política de pagamento do Google Play: o pagamento de recursos digitais pelo app pode exigir Google Play Billing ou exceção aplicável.
- Testes de autenticação Google/Firebase, sessão, isolamento de dados, rede e fluxo de trial.
- Listagem Play Store, privacidade, exclusão de conta e testes fechados, se exigidos.

Guia oficial Bubblewrap: https://github.com/GoogleChromeLabs/bubblewrap/tree/main/packages/cli
Regras de target SDK: https://support.google.com/googleplay/android-developer/answer/11926878
Política de pagamentos: https://support.google.com/googleplay/android-developer/answer/9858738
