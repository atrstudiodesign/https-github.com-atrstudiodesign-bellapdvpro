# BellaPDV Pro — homologação do instalador Windows

## Onde baixar a versão de teste
GitHub → Actions → **Windows Installer BellaPDV Pro** → última execução concluída com sucesso → **Artifacts** → `BellaPDV-Pro-Windows-Setup-Unsigned`. Extraia o ZIP antes de executar o instalador. Não compartilhe o executável como release pública.

## Integridade do arquivo
O pacote contém `SHA256SUMS.txt`. No PowerShell, dentro da pasta extraída:
```powershell
Get-FileHash '.\BellaPDV-Pro-Setup-2.0.0-x64.exe' -Algorithm SHA256
Get-Content '.\SHA256SUMS.txt'
```
Compare os códigos; se o nome gerado mudar, ajuste o comando para o nome correto.

## Testes obrigatórios — Windows 10/11
- [ ] Instalação com perfil de usuário comum, sem avisos de arquivo corrompido
- [ ] Atalho no menu Iniciar e na área de trabalho
- [ ] Splash abre e encerra quando a janela principal estiver pronta
- [ ] Login com email/senha e Google; persistência após reiniciar
- [ ] Login de empresa A sem acesso à empresa B; superadministrador apenas com permissão real
- [ ] PDV: venda, impressão, abertura/fechamento de caixa; reimpressão
- [ ] Impressora térmica e gaveta, somente em ambiente de homologação
- [ ] Rede indisponível: mensagem adequada; nenhuma alegação de modo offline sem teste
- [ ] Logout, recuperação de erros de rede, fechar/reabrir a janela
- [ ] Desinstalação no Windows e reinstalação
- [ ] Verificar assinatura de código para distribuição pública e alertas do SmartScreen

## Restrições desta versão
O shell Electron carrega `https://bellapdvpro.vercel.app` para preservar autenticação e roteamento existentes. Isso **não** comprova funcionalidade completamente offline. A assinatura de código Windows e o feed de atualização automática ainda não foram configurados; não publicar o `.exe` na landing até completar a homologação.
