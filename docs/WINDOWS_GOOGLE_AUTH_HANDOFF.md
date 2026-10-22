# BellaPDV Pro Windows — entrada e login Google

## Comportamento desta correção
- A splash screen `electron/splash.html` aparece ao iniciar.
- O executável carrega diretamente `https://bellapdvpro.vercel.app/login`, não a landing comercial.
- Quando uma sessão Firebase existente for reconhecida pelo frontend, o fluxo de login poderá encaminhar ao painel.

## Pendência de autenticação Google nativa
O botão Google atual usa Firebase `signInWithPopup` na interface web. A janela Electron foi configurada para enviar URLs externas ao navegador do sistema, portanto **não existe retorno autenticado garantido** ao desktop. Não redirecionar a autorização de Google para um `BrowserWindow` controlado pelo app: OAuth em user agents embutidos viola a política do Google.

Uma integração correta exige:
1. Google OAuth para **aplicativo desktop**, com Authorization Code + PKCE em navegador do sistema;
2. retorno seguro por `localhost` loopback ou protocolo registrado (com validação de `state` e PKCE);
3. troca/verificação do token Google com Firebase, concluindo autenticação na sessão Electron sem expor tokens em query string ou logs;
4. checagem de tenant, claims e papéis de acesso existentes;
5. testes em Windows com usuário novo, existente e super admin autorizado.

Até isso estar concluído, o login Google no executável não deve ser anunciado como integrado. E-mail e senha permanecem disponíveis pelo login web incorporado.

## Compilação de nova versão
O instalador anterior **não recebe essa correção automaticamente**. Gerar novo NSIS pelo workflow Windows, instalar e testar a splash, redirecionamento e login e-mail/senha.
