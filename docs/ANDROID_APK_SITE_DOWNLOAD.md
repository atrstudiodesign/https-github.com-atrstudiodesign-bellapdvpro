# Download público do APK BellaPDV Pro

A landing mostra um bloco "Baixar APK para Android" somente depois que existir um APK real em `public/downloads/bellapdv-pro-android.apk`. Enquanto o arquivo não existir, a seção informa que o download está em preparação (não oferece ZIP-fonte nem link quebrado).

## Preparação no computador Windows que compilou a TWA

Execute no **PowerShell**, dentro de `C:\BellaPDV-Android`, após gerar a versão Android com o package ID final `com.bellapdv.app`.

1. Verifique o APK de release não assinado com `Get-ChildItem '.\app\build\outputs\apk\release\*.apk'`.
2. Use `zipalign` sobre o APK **antes** de assinar, caso ainda não esteja alinhado.
3. Assine o APK alinhado com `apksigner`, usando a chave privada de distribuição que pretende manter nas próximas versões, e valide com `apksigner verify --verbose --print-certs`. Nunca compartilhe nem versione senhas ou keystores.
4. Copie o APK assinado para `public/downloads/bellapdv-pro-android.apk` no **clone Git local do site**, faça commit e push, e publique pelo fluxo habitual da Vercel. **Não** copie o AAB: APK é o formato de instalação direta.
5. Depois do deploy, acesse `https://bellapdvpro.vercel.app/downloads/bellapdv-pro-android.apk`, confirme resposta 200 com bytes de APK (não HTML), faça o download e instale em aparelho de teste.

**Atenção:** o APK anterior foi gerado como `app.vercel.bellapdvpro.twa`, e **não** é o binário adequado para publicação direta desta versão. Gere e assine o APK do package `com.bellapdv.app`.

O certificado de assinatura de APK distribuído pelo site pode ser diferente do certificado de assinatura da Google Play. Atualize o `public/.well-known/assetlinks.json` para conter o(s) fingerprint(s) SHA-256 da(s) distribuição(ões) confiáveis do `com.bellapdv.app`, após validá-los. Não use a impressão da chave de upload como se fosse automaticamente a chave de assinatura da Play.

Distribuição fora da Play Store pode exigir permissão do usuário para instalar aplicativos desta fonte. Não instrua o usuário a desativar o Play Protect.
