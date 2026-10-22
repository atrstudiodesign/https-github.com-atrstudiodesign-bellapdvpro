# Bella PDV Pro — Preparação Google Play Store

Situação em 21/10/2026: **não homologado para publicação**. O site React/Vite PWA está em https://bellapdvpro.vercel.app/ e possui manifesto em `public/manifest.json` e relação TWA em `public/.well-known/assetlinks.json`. Não há projeto Bubblewrap/TWA Android versionado neste repositório.

## Estratégia de distribuição

Empacotar o PWA em uma **Trusted Web Activity (TWA)** com Bubblewrap, gerando um **Android App Bundle (.aab)**. Não enviar executável Electron e não tratar um APK como substituto do AAB da Play Store.

## Etapas técnicas

1. Confirmar que HTTPS, `/manifest.json`, ícones PNG, Service Worker e `/login` estão acessíveis no domínio público e que o PWA funciona ao atualizar e em instalações Android.
2. Criar projeto TWA com Bubblewrap a partir do manifesto publicado:
   ```bash
   npm install -g @bubblewrap/cli
   bubblewrap init --manifest https://bellapdvpro.vercel.app/manifest.json
   bubblewrap build
   ```
   Durante a inicialização, configurar nome **Bella PDV Pro**, applicationId **com.bellapdv.app** (confirmar disponibilidade na Play Console), início em `/` e **targetSdkVersion >= 36** (requisito para novas submissões desde 31/08/2026). Não assumir que a versão do Bubblewrap seleciona esse alvo automaticamente.
3. Gerar **chave de upload segura e persistente**. NUNCA comitar keystore, senhas, arquivos `.jks`, tokens ou credenciais em Git. Configurar Play App Signing.
4. Obter o SHA-256 do **certificado de assinatura do aplicativo na Play Console**. O `assetlinks.json` atualmente possui uma impressão digital; **ainda não foi comprovado que ela corresponde ao certificado usado pela Play**. Publicar no site os fingerprints corretos para verificação de Digital Asset Links, manter `com.bellapdv.app` consistente e conferir a abertura em tela cheia sem a barra do navegador.
5. Validar instalação e atualização via faixa de testes internos/fechados, abertura do PWA, navegação, login Firebase e Google, persistência de sessão, isolamento de empresas, internet intermitente, fluxo de trial e retorno do checkout.
6. **Verificar e ajustar a monetização antes da Play**: a loja utiliza checkout Asaas para planos SaaS digitais. Apps distribuídos pela Play que oferecem compra de recursos/assinaturas digitais no próprio app podem exigir Google Play Billing ou enquadramento em exceção/programa aplicável. Não assumir que abrir links externos do Asaas dentro da TWA seja permitido. Definir fluxo conforme política vigente e região antes da submissão.
7. Preparar política de privacidade e LGPD acessíveis, exclusão de conta (dentro do app e por URL externa, conforme aplicabilidade), formulário Segurança dos dados, classificação indicativa, público-alvo, capturas de tela reais, ícone 512x512, imagem de destaque 1024x500, descrição e contato de suporte.
8. Para contas pessoais Play Console criadas após 13/11/2023: cumprir testes fechados com **12 testadores por pelo menos 14 dias contínuos**, depois solicitar acesso à produção.
9. Fornecer **credenciais de teste estáveis** à equipe de revisão se o acesso exigir login. Nunca compartilhar credenciais de produção.

## Bloqueios para publicação

- Ainda não há `.aab` assinado e comprovadamente instalável.
- Fingerprint Digital Asset Links não validado contra Play App Signing.
- Cobrança digital pelo Asaas requer análise/adequação de política.
- Testes funcionais Android e requisitos de segurança/privacidade da listagem não homologados.
- Acesso à conta Play Console e status da verificação cadastral não confirmados.

Fontes oficiais:
- https://developers.google.com/codelabs/pwa-in-play?hl=pt-br
- https://support.google.com/googleplay/android-developer/answer/11926878
- https://support.google.com/googleplay/android-developer/answer/14151465
- https://support.google.com/googleplay/android-developer/answer/9858738
